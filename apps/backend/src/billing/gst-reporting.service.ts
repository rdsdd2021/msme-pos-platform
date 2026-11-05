import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoiceLineEntity } from './entities/invoice-line.entity';
import { BranchEntity } from '../tenants/entities/branch.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { CustomerEntity } from '../operations/entities/customer.entity';
import { SupplierEntity } from '../catalog/entities/supplier.entity';
import { SupplierInvoiceEntity } from '../catalog/entities/supplier-invoice.entity';
import { SupplierInvoiceLineEntity } from '../catalog/entities/supplier-invoice-line.entity';
import { InvoiceStatus } from '@pos/shared-types';
import { GstReportQueryDto, CreateSupplierInvoiceDto } from './dto/gst-reports.dto';

export const STATUTORY_GST_DISCLAIMER =
  'This report is generated from immutable transaction snapshots for GST preparation. ' +
  'Final return filing requires formal verification and reconciliation on the GST Common Portal. ' +
  'Statutory set-off and ITC classification should be reviewed by an authorized Chartered Accountant / GST Practitioner.';

/**
 * Under Notification No. 12/2024-Central Tax (dated 10 July 2024, effective 1 August 2024),
 * the invoice value threshold for reporting inter-state B2C supplies in Table 5 (B2C Large)
 * was reduced from ₹2,50,000 to ₹1,00,000.
 */
export const B2CL_NOTIFICATION_12_2024_DATE = new Date('2024-08-01T00:00:00.000+05:30');
export const B2CL_THRESHOLD_PRE_AUG_2024 = 250000;
export const B2CL_THRESHOLD_POST_AUG_2024 = 100000;

export function getB2clInvoiceThreshold(invoiceDate: Date): number {
  return invoiceDate < B2CL_NOTIFICATION_12_2024_DATE
    ? B2CL_THRESHOLD_PRE_AUG_2024
    : B2CL_THRESHOLD_POST_AUG_2024;
}

@Injectable()
export class GstReportingService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(InvoiceLineEntity)
    private readonly invoiceLineRepo: Repository<InvoiceLineEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchRepo: Repository<BranchEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(SupplierEntity)
    private readonly supplierRepo: Repository<SupplierEntity>,
    @InjectRepository(SupplierInvoiceEntity)
    private readonly supplierInvoiceRepo: Repository<SupplierInvoiceEntity>,
    @InjectRepository(SupplierInvoiceLineEntity)
    private readonly supplierInvoiceLineRepo: Repository<SupplierInvoiceLineEntity>,
  ) {}

  private resolveDateRange(query: GstReportQueryDto): { start: Date; end: Date; label: string } {
    let start: Date;
    let end: Date;
    let label = '';

    if (query.month && query.year) {
      const m = query.month;
      const lastDay = new Date(query.year, m, 0).getDate();
      start = new Date(`${query.year}-${String(m).padStart(2, '0')}-01T00:00:00.000+05:30`);
      end = new Date(
        `${query.year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999+05:30`,
      );
      label = `${String(query.month).padStart(2, '0')}/${query.year}`;
    } else if (query.from && query.to) {
      start = new Date(`${query.from}T00:00:00.000+05:30`);
      end = new Date(`${query.to}T23:59:59.999+05:30`);
      label = `${query.from} to ${query.to}`;
    } else {
      const now = new Date();
      // IST is UTC + 5:30
      const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const yr = istTime.getUTCFullYear();
      const mo = istTime.getUTCMonth() + 1;
      const lastDay = new Date(yr, mo, 0).getDate();

      start = new Date(`${yr}-${String(mo).padStart(2, '0')}-01T00:00:00.000+05:30`);
      end = new Date(
        `${yr}-${String(mo).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999+05:30`,
      );
      label = `${String(mo).padStart(2, '0')}/${yr}`;
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      throw new BadRequestException('Invalid date range parameters provided');
    }

    return { start, end, label };
  }

  /**
   * Part B: GSTR-1 Return Preparation
   */
  async getGstr1Report(tenantId: string, query: GstReportQueryDto) {
    const { start, end, label } = this.resolveDateRange(query);

    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    let branchGstin: string | null = null;
    let branchName = 'Consolidated (All Branches)';
    if (query.branchId) {
      const branch = await this.branchRepo.findOne({ where: { id: query.branchId, tenantId } });
      if (!branch) throw new NotFoundException('Branch not found');
      branchGstin = branch.gstin ?? null;
      branchName = branch.name;
    }

    // Query posted invoices in period
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.lines', 'lines')
      .where('inv.tenantId = :tenantId', { tenantId })
      .andWhere('inv.status = :status', { status: InvoiceStatus.POSTED })
      .andWhere('inv.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('inv.createdAt', 'ASC');

    if (query.branchId) {
      qb.andWhere('inv.branchId = :branchId', { branchId: query.branchId });
    }

    const invoices = await qb.getMany();

    // Fetch customers map for quick lookup
    const customerIds = Array.from(
      new Set(invoices.map((i) => i.customerId).filter(Boolean)),
    ) as string[];
    const customers =
      customerIds.length > 0
        ? await this.customerRepo.findBy({ id: In(customerIds), tenantId })
        : [];
    const customerMap = new Map(customers.map((c) => [c.id, c]));

    // GSTR-1 Partitions
    const b2bList: any[] = [];
    const b2clList: any[] = [];
    const b2csMap = new Map<
      string,
      {
        placeOfSupply: string;
        supplyType: 'Intra-State' | 'Inter-State';
        rate: number;
        taxableValue: number;
        cgstAmount: number;
        sgstAmount: number;
        igstAmount: number;
        totalTax: number;
      }
    >();
    const hsnMap = new Map<
      string,
      {
        hsnCode: string;
        description: string;
        uqc: string;
        totalQuantity: number;
        taxableValue: number;
        cgstAmount: number;
        sgstAmount: number;
        igstAmount: number;
        totalValue: number;
      }
    >();

    let totalTaxableCents = 0;
    let totalCgstCents = 0;
    let totalSgstCents = 0;
    let totalIgstCents = 0;
    let totalGrandCents = 0;

    for (const inv of invoices) {
      const grandTotalNum = parseFloat(inv.grandTotal);
      totalGrandCents += Math.round(grandTotalNum * 100);

      const cust = inv.customerId ? customerMap.get(inv.customerId) : null;
      const gstinSnapshot = inv.customerGstinSnapshot || cust?.gstin || null;
      const isB2B = Boolean(gstinSnapshot && gstinSnapshot.trim().length >= 15);
      const pos = inv.placeOfSupply || '27';

      // Lines processing
      for (const line of inv.lines) {
        const taxableCents = Math.round(parseFloat(line.taxableValue) * 100);
        const cgstCents = Math.round(parseFloat(line.cgstAmount) * 100);
        const sgstCents = Math.round(parseFloat(line.sgstAmount) * 100);
        const igstCents = Math.round(parseFloat(line.igstAmount) * 100);
        const lineTotalCents = Math.round(parseFloat(line.lineTotal) * 100);
        const rateNum = parseFloat(line.gstRatePercent);
        const qtyNum = parseFloat(line.quantity);

        totalTaxableCents += taxableCents;
        totalCgstCents += cgstCents;
        totalSgstCents += sgstCents;
        totalIgstCents += igstCents;

        // 1. Table 12 HSN Summary
        const hsnCode = line.hsnSnapshot || 'OTHER';
        const hsnKey = `${hsnCode}_${rateNum}`;
        const existingHsn = hsnMap.get(hsnKey);
        if (existingHsn) {
          existingHsn.totalQuantity += qtyNum;
          existingHsn.taxableValue += taxableCents;
          existingHsn.cgstAmount += cgstCents;
          existingHsn.sgstAmount += sgstCents;
          existingHsn.igstAmount += igstCents;
          existingHsn.totalValue += lineTotalCents;
        } else {
          hsnMap.set(hsnKey, {
            hsnCode,
            description: line.productNameSnapshot || 'Goods',
            uqc: 'NOS',
            totalQuantity: qtyNum,
            taxableValue: taxableCents,
            cgstAmount: cgstCents,
            sgstAmount: sgstCents,
            igstAmount: igstCents,
            totalValue: lineTotalCents,
          });
        }

        // 2. Classify into B2B vs B2CL vs B2CS
        const b2clThreshold = getB2clInvoiceThreshold(inv.createdAt);
        if (isB2B) {
          // Table 4: B2B Invoices
          b2bList.push({
            customerGstin: gstinSnapshot,
            customerName: cust?.name || 'Registered Customer',
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: inv.createdAt.toISOString().slice(0, 10),
            invoiceValue: grandTotalNum.toFixed(2),
            placeOfSupply: pos,
            reverseCharge: 'N',
            invoiceType: 'Regular B2B',
            rate: rateNum.toFixed(2),
            taxableValue: (taxableCents / 100).toFixed(2),
            cgstAmount: (cgstCents / 100).toFixed(2),
            sgstAmount: (sgstCents / 100).toFixed(2),
            igstAmount: (igstCents / 100).toFixed(2),
          });
        } else if (inv.isInterstate && grandTotalNum > b2clThreshold) {
          // Table 5: B2C Large (Inter-state unregistered exceeding statutory threshold)
          // Prior to 1 Aug 2024: > ₹2.5L. From 1 Aug 2024: > ₹1.0L (Notification No. 12/2024-Central Tax)
          b2clList.push({
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: inv.createdAt.toISOString().slice(0, 10),
            invoiceValue: grandTotalNum.toFixed(2),
            placeOfSupply: pos,
            rate: rateNum.toFixed(2),
            taxableValue: (taxableCents / 100).toFixed(2),
            igstAmount: (igstCents / 100).toFixed(2),
            statutoryThreshold: b2clThreshold.toFixed(2),
            notification:
              grandTotalNum <= 250000 ? 'Notification No. 12/2024-Central Tax' : 'Standard',
          });
        } else {
          // Table 7: B2C Small (All other unregistered)
          const supplyType = inv.isInterstate ? 'Inter-State' : 'Intra-State';
          const b2csKey = `${pos}_${rateNum}_${supplyType}`;
          const existingB2cs = b2csMap.get(b2csKey);
          if (existingB2cs) {
            existingB2cs.taxableValue += taxableCents;
            existingB2cs.cgstAmount += cgstCents;
            existingB2cs.sgstAmount += sgstCents;
            existingB2cs.igstAmount += igstCents;
            existingB2cs.totalTax += cgstCents + sgstCents + igstCents;
          } else {
            b2csMap.set(b2csKey, {
              placeOfSupply: pos,
              supplyType,
              rate: rateNum,
              taxableValue: taxableCents,
              cgstAmount: cgstCents,
              sgstAmount: sgstCents,
              igstAmount: igstCents,
              totalTax: cgstCents + sgstCents + igstCents,
            });
          }
        }
      }
    }

    // Format B2CS array
    const b2csList = Array.from(b2csMap.values()).map((row) => ({
      placeOfSupply: row.placeOfSupply,
      supplyType: row.supplyType,
      rate: row.rate.toFixed(2),
      taxableValue: (row.taxableValue / 100).toFixed(2),
      cgstAmount: (row.cgstAmount / 100).toFixed(2),
      sgstAmount: (row.sgstAmount / 100).toFixed(2),
      igstAmount: (row.igstAmount / 100).toFixed(2),
      totalTax: (row.totalTax / 100).toFixed(2),
    }));

    // Format HSN array
    const hsnList = Array.from(hsnMap.values()).map((row) => ({
      hsnCode: row.hsnCode,
      description: row.description,
      uqc: row.uqc,
      totalQuantity: row.totalQuantity.toFixed(3),
      totalValue: (row.totalValue / 100).toFixed(2),
      taxableValue: (row.taxableValue / 100).toFixed(2),
      igstAmount: (row.igstAmount / 100).toFixed(2),
      cgstAmount: (row.cgstAmount / 100).toFixed(2),
      sgstAmount: (row.sgstAmount / 100).toFixed(2),
    }));

    // Table 13 Document Summary
    const docSummary = {
      documentType: 'Invoices for outward supply',
      fromSerial: invoices.length > 0 ? invoices[0].invoiceNumber : 'N/A',
      toSerial: invoices.length > 0 ? invoices[invoices.length - 1].invoiceNumber : 'N/A',
      totalIssued: invoices.length,
      cancelled: 0,
      netIssued: invoices.length,
    };

    const summary = {
      totalInvoices: invoices.length,
      totalTaxableValue: (totalTaxableCents / 100).toFixed(2),
      totalCgst: (totalCgstCents / 100).toFixed(2),
      totalSgst: (totalSgstCents / 100).toFixed(2),
      totalIgst: (totalIgstCents / 100).toFixed(2),
      totalTax: ((totalCgstCents + totalSgstCents + totalIgstCents) / 100).toFixed(2),
      totalInvoiceValue: (totalGrandCents / 100).toFixed(2),
    };

    return {
      gstin: branchGstin || 'UNREGISTERED',
      isGstinConfigured: Boolean(branchGstin),
      gstinWarning: branchGstin
        ? undefined
        : 'Branch GSTIN is not configured. Tax reports cannot be filed without a registered GSTIN.',
      legalName: tenant.legalName || tenant.displayName,
      branchName,
      taxPeriod: label,
      statutoryDisclaimer: STATUTORY_GST_DISCLAIMER,
      summary,
      b2b: b2bList,
      b2cl: b2clList,
      b2cs: b2csList,
      hsnSummary: hsnList,
      docSummary,
    };
  }

  /**
   * Part C: GSTR-3B Summary Return Preparation
   */
  async getGstr3bReport(tenantId: string, query: GstReportQueryDto) {
    const { start, end, label } = this.resolveDateRange(query);

    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    let branchGstin: string | null = null;
    let branchName = 'Consolidated (All Branches)';
    if (query.branchId) {
      const branch = await this.branchRepo.findOne({ where: { id: query.branchId, tenantId } });
      if (!branch) throw new NotFoundException('Branch not found');
      branchGstin = branch.gstin ?? null;
      branchName = branch.name;
    }

    // 1. Fetch Outward Invoices
    const invQb = this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.lines', 'lines')
      .where('inv.tenantId = :tenantId', { tenantId })
      .andWhere('inv.status = :status', { status: InvoiceStatus.POSTED })
      .andWhere('inv.createdAt BETWEEN :start AND :end', { start, end });

    if (query.branchId) {
      invQb.andWhere('inv.branchId = :branchId', { branchId: query.branchId });
    }

    const invoices = await invQb.getMany();

    // 2. Fetch Inward Supplier Invoices for ITC (Input Tax Credit)
    const supQb = this.supplierInvoiceRepo
      .createQueryBuilder('si')
      .leftJoinAndSelect('si.supplier', 'supplier')
      .where('si.tenantId = :tenantId', { tenantId })
      .andWhere('si.supplierInvoiceDate BETWEEN :start AND :end', { start, end });

    if (query.branchId) {
      supQb.andWhere('si.branchId = :branchId', { branchId: query.branchId });
    }

    const supplierInvoices = await supQb.getMany();

    // Outward Computations
    let outwardTaxableCents = 0;
    const outwardZeroRatedTaxableCents = 0;
    let outwardNilExemptCents = 0;
    let outwardCgstCents = 0;
    let outwardSgstCents = 0;
    let outwardIgstCents = 0;

    const interstateUnregMap = new Map<
      string,
      { pos: string; taxableCents: number; igstCents: number }
    >();
    const auditWarnings: string[] = [];

    for (const inv of invoices) {
      const isUnregistered =
        !inv.customerGstinSnapshot || inv.customerGstinSnapshot.trim().length < 15;
      const pos = inv.placeOfSupply || '27';

      for (const line of inv.lines) {
        const taxable = Math.round(parseFloat(line.taxableValue) * 100);
        const cgst = Math.round(parseFloat(line.cgstAmount) * 100);
        const sgst = Math.round(parseFloat(line.sgstAmount) * 100);
        const igst = Math.round(parseFloat(line.igstAmount) * 100);
        const rate = parseFloat(line.gstRatePercent);

        if (!line.hsnSnapshot) {
          auditWarnings.push(
            `Invoice ${inv.invoiceNumber}: Line item '${line.productNameSnapshot}' missing HSN snapshot.`,
          );
        }

        if (rate === 0) {
          outwardNilExemptCents += taxable;
        } else {
          outwardTaxableCents += taxable;
          outwardCgstCents += cgst;
          outwardSgstCents += sgst;
          outwardIgstCents += igst;
        }

        if (inv.isInterstate && isUnregistered) {
          const existing = interstateUnregMap.get(pos);
          if (existing) {
            existing.taxableCents += taxable;
            existing.igstCents += igst;
          } else {
            interstateUnregMap.set(pos, { pos, taxableCents: taxable, igstCents: igst });
          }
        }
      }
    }

    // Input Tax Credit (ITC) Computations from verified supplier invoices
    let allOtherItcIgstCents = 0;
    let allOtherItcCgstCents = 0;
    let allOtherItcSgstCents = 0;

    let reverseChargeTaxableCents = 0;
    let reverseChargeIgstCents = 0;
    let reverseChargeCgstCents = 0;
    let reverseChargeSgstCents = 0;

    let ineligibleSection17_5_IgstCents = 0;
    let ineligibleSection17_5_CgstCents = 0;
    let ineligibleSection17_5_SgstCents = 0;

    let unregisteredSupplierItcCents = 0;

    for (const si of supplierInvoices) {
      const cgst = Math.round(parseFloat(si.cgstAmount) * 100);
      const sgst = Math.round(parseFloat(si.sgstAmount) * 100);
      const igst = Math.round(parseFloat(si.igstAmount) * 100);
      const taxable = Math.round(parseFloat(si.subtotal) * 100);

      const hasSupplierGstin = Boolean(si.supplier?.gstin && si.supplier.gstin.trim().length >= 15);
      if (!hasSupplierGstin) {
        auditWarnings.push(
          `Supplier Invoice ${si.supplierInvoiceNumber}: Vendor '${si.supplier?.name}' lacks valid GSTIN. ITC is ineligible under Section 16(2)(a).`,
        );
        unregisteredSupplierItcCents += cgst + sgst + igst;
        continue;
      }

      if (si.isReverseCharge) {
        reverseChargeTaxableCents += taxable;
        reverseChargeIgstCents += igst;
        reverseChargeCgstCents += cgst;
        reverseChargeSgstCents += sgst;
      } else if (!si.isItcEligible) {
        ineligibleSection17_5_IgstCents += igst;
        ineligibleSection17_5_CgstCents += cgst;
        ineligibleSection17_5_SgstCents += sgst;
      } else {
        allOtherItcIgstCents += igst;
        allOtherItcCgstCents += cgst;
        allOtherItcSgstCents += sgst;
      }
    }

    // Net ITC Available Table 4(C) = 4(A) - 4(B)
    const netItcIgstCents = allOtherItcIgstCents;
    const netItcCgstCents = allOtherItcCgstCents;
    const netItcSgstCents = allOtherItcSgstCents;

    // Statutory Set-Off Rules (Section 49 CGST Act):
    // 1. IGST liability set off against IGST ITC first
    const igstLiability = outwardIgstCents + reverseChargeIgstCents;
    const igstItcUsedForIgst = Math.min(igstLiability, netItcIgstCents);
    const remIgstLiability = igstLiability - igstItcUsedForIgst;
    let remIgstItc = netItcIgstCents - igstItcUsedForIgst;

    // 2. CGST liability set off against remaining IGST ITC, then CGST ITC
    const cgstLiability = outwardCgstCents + reverseChargeCgstCents;
    const igstItcUsedForCgst = Math.min(cgstLiability, remIgstItc);
    remIgstItc -= igstItcUsedForCgst;
    const remCgstLiabilityAfterIgst = cgstLiability - igstItcUsedForCgst;
    const cgstItcUsedForCgst = Math.min(remCgstLiabilityAfterIgst, netItcCgstCents);
    const remCgstLiability = remCgstLiabilityAfterIgst - cgstItcUsedForCgst;

    // 3. SGST liability set off against remaining IGST ITC, then SGST ITC
    const sgstLiability = outwardSgstCents + reverseChargeSgstCents;
    const igstItcUsedForSgst = Math.min(sgstLiability, remIgstItc);
    remIgstItc -= igstItcUsedForSgst;
    const remSgstLiabilityAfterIgst = sgstLiability - igstItcUsedForSgst;
    const sgstItcUsedForSgst = Math.min(remSgstLiabilityAfterIgst, netItcSgstCents);
    const remSgstLiability = remSgstLiabilityAfterIgst - sgstItcUsedForSgst;

    const totalOutputTaxCents = igstLiability + cgstLiability + sgstLiability;
    const totalItcSetOffCents =
      igstItcUsedForIgst +
      igstItcUsedForCgst +
      cgstItcUsedForCgst +
      igstItcUsedForSgst +
      sgstItcUsedForSgst;
    const totalCashPayableCents = remIgstLiability + remCgstLiability + remSgstLiability;

    return {
      gstin: branchGstin || 'UNREGISTERED',
      isGstinConfigured: Boolean(branchGstin),
      gstinWarning: branchGstin
        ? undefined
        : 'Branch GSTIN is not configured. Tax reports cannot be filed without a registered GSTIN.',
      legalName: tenant.legalName || tenant.displayName,
      branchName,
      taxPeriod: label,
      statutoryDisclaimer: STATUTORY_GST_DISCLAIMER,

      // Table 3.1: Details of Outward Supplies and Inward Supplies Liable to Reverse Charge
      table31: {
        outwardTaxableSupplies: {
          taxableValue: (outwardTaxableCents / 100).toFixed(2),
          igst: (outwardIgstCents / 100).toFixed(2),
          cgst: (outwardCgstCents / 100).toFixed(2),
          sgst: (outwardSgstCents / 100).toFixed(2),
          cess: '0.00',
        },
        outwardZeroRated: {
          taxableValue: (outwardZeroRatedTaxableCents / 100).toFixed(2),
          igst: '0.00',
          cgst: '0.00',
          sgst: '0.00',
          cess: '0.00',
        },
        otherOutwardNilExempt: {
          taxableValue: (outwardNilExemptCents / 100).toFixed(2),
          igst: '0.00',
          cgst: '0.00',
          sgst: '0.00',
          cess: '0.00',
        },
        inwardLiableToReverseCharge: {
          taxableValue: (reverseChargeTaxableCents / 100).toFixed(2),
          igst: (reverseChargeIgstCents / 100).toFixed(2),
          cgst: (reverseChargeCgstCents / 100).toFixed(2),
          sgst: (reverseChargeSgstCents / 100).toFixed(2),
          cess: '0.00',
        },
        nonGstOutwardSupplies: {
          taxableValue: '0.00',
          igst: '0.00',
          cgst: '0.00',
          sgst: '0.00',
          cess: '0.00',
        },
      },

      // Table 3.2: Inter-state supplies to unregistered persons
      table32: Array.from(interstateUnregMap.values()).map((row) => ({
        placeOfSupply: row.pos,
        taxableValue: (row.taxableCents / 100).toFixed(2),
        igstAmount: (row.igstCents / 100).toFixed(2),
      })),

      // Table 4: Eligible & Ineligible Input Tax Credit (ITC)
      table4: {
        itcAvailable: {
          importOfGoods: { igst: '0.00', cgst: '0.00', sgst: '0.00' },
          importOfServices: { igst: '0.00', cgst: '0.00', sgst: '0.00' },
          inwardReverseCharge: {
            igst: (reverseChargeIgstCents / 100).toFixed(2),
            cgst: (reverseChargeCgstCents / 100).toFixed(2),
            sgst: (reverseChargeSgstCents / 100).toFixed(2),
          },
          inwardFromISD: { igst: '0.00', cgst: '0.00', sgst: '0.00' },
          allOtherItc: {
            igst: (allOtherItcIgstCents / 100).toFixed(2),
            cgst: (allOtherItcCgstCents / 100).toFixed(2),
            sgst: (allOtherItcSgstCents / 100).toFixed(2),
          },
        },
        itcReversed: {
          rule42_43: { igst: '0.00', cgst: '0.00', sgst: '0.00' },
          others: { igst: '0.00', cgst: '0.00', sgst: '0.00' },
        },
        netItcAvailable: {
          igst: (netItcIgstCents / 100).toFixed(2),
          cgst: (netItcCgstCents / 100).toFixed(2),
          sgst: (netItcSgstCents / 100).toFixed(2),
        },
        ineligibleItc: {
          section17_5: {
            igst: (ineligibleSection17_5_IgstCents / 100).toFixed(2),
            cgst: (ineligibleSection17_5_CgstCents / 100).toFixed(2),
            sgst: (ineligibleSection17_5_SgstCents / 100).toFixed(2),
          },
          unregisteredSuppliers: {
            totalTax: (unregisteredSupplierItcCents / 100).toFixed(2),
          },
        },
      },

      // Tax Liability Settlement & Net Cash Payable
      taxSettlement: {
        outputTaxLiability: {
          igst: (igstLiability / 100).toFixed(2),
          cgst: (cgstLiability / 100).toFixed(2),
          sgst: (sgstLiability / 100).toFixed(2),
          total: (totalOutputTaxCents / 100).toFixed(2),
        },
        netEligibleItc: {
          igst: (netItcIgstCents / 100).toFixed(2),
          cgst: (netItcCgstCents / 100).toFixed(2),
          sgst: (netItcSgstCents / 100).toFixed(2),
          total: ((netItcIgstCents + netItcCgstCents + netItcSgstCents) / 100).toFixed(2),
        },
        itcSetOff: {
          igst: (igstItcUsedForIgst / 100).toFixed(2),
          cgst: ((igstItcUsedForCgst + cgstItcUsedForCgst) / 100).toFixed(2),
          sgst: ((igstItcUsedForSgst + sgstItcUsedForSgst) / 100).toFixed(2),
          total: (totalItcSetOffCents / 100).toFixed(2),
        },
        netCashPayable: {
          igst: (remIgstLiability / 100).toFixed(2),
          cgst: (remCgstLiability / 100).toFixed(2),
          sgst: (remSgstLiability / 100).toFixed(2),
          total: (totalCashPayableCents / 100).toFixed(2),
        },
      },

      auditWarnings,
    };
  }

  /**
   * Sales Register: Detailed Invoice-by-Invoice tax report
   */
  async getSalesRegister(tenantId: string, query: GstReportQueryDto) {
    const { start, end, label } = this.resolveDateRange(query);

    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.lines', 'lines')
      .where('inv.tenantId = :tenantId', { tenantId })
      .andWhere('inv.status = :status', { status: InvoiceStatus.POSTED })
      .andWhere('inv.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('inv.createdAt', 'DESC');

    if (query.branchId) {
      qb.andWhere('inv.branchId = :branchId', { branchId: query.branchId });
    }

    const invoices = await qb.getMany();

    // Map branch names
    const branches = await this.branchRepo.findBy({ tenantId });
    const branchMap = new Map(branches.map((b) => [b.id, b.name]));

    // Map customer names
    const custIds = Array.from(
      new Set(invoices.map((i) => i.customerId).filter(Boolean)),
    ) as string[];
    const customers =
      custIds.length > 0 ? await this.customerRepo.findBy({ id: In(custIds), tenantId }) : [];
    const custMap = new Map(customers.map((c) => [c.id, c.name]));

    const records = invoices.map((inv) => {
      const custName = inv.customerId
        ? custMap.get(inv.customerId) || 'Counter Sale'
        : 'Counter Sale';
      const branchName = branchMap.get(inv.branchId) || 'Main Branch';
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.createdAt.toISOString().slice(0, 10),
        branchName,
        customerName: custName,
        customerGstin: inv.customerGstinSnapshot || 'URP',
        placeOfSupply: inv.placeOfSupply || '27',
        isInterstate: inv.isInterstate,
        subtotal: inv.subtotal,
        discountTotal: inv.discountTotal,
        taxableTotal: inv.taxableTotal,
        cgstTotal: inv.cgstTotal,
        sgstTotal: inv.sgstTotal,
        igstTotal: inv.igstTotal,
        grandTotal: inv.grandTotal,
        paymentStatus: inv.paymentStatus,
        itemCount: inv.lines?.length || 0,
      };
    });

    return {
      period: label,
      totalCount: records.length,
      records,
    };
  }

  /**
   * Part D: Record Supplier Tax Invoice (Vendor Bill for ITC)
   */
  async recordSupplierInvoice(tenantId: string, userId: string, dto: CreateSupplierInvoiceDto) {
    const branch = await this.branchRepo.findOne({ where: { id: dto.branchId, tenantId } });
    if (!branch) throw new NotFoundException('Branch not found');

    const supplier = await this.supplierRepo.findOne({ where: { id: dto.supplierId, tenantId } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    // Check duplicate vendor invoice number
    const existing = await this.supplierInvoiceRepo.findOne({
      where: {
        tenantId,
        supplierId: dto.supplierId,
        supplierInvoiceNumber: dto.supplierInvoiceNumber.trim(),
      },
    });
    if (existing) {
      throw new ConflictException(
        `Supplier invoice number '${dto.supplierInvoiceNumber}' already exists for supplier '${supplier.name}'`,
      );
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one line item is required for supplier invoice');
    }

    // Determine interstate: Compare supplier GSTIN state with branch state
    const branchState = branch.stateCode || (branch.gstin ? branch.gstin.slice(0, 2) : '27');
    const supplierState = supplier.gstin ? supplier.gstin.slice(0, 2) : branchState;
    const isInterstate = branchState !== supplierState;

    let subtotalCents = 0;
    let cgstCents = 0;
    let sgstCents = 0;
    let igstCents = 0;

    const linesToInsert: Array<Partial<SupplierInvoiceLineEntity>> = [];

    for (const item of dto.items) {
      const qty = parseFloat(item.quantity);
      const unitCost = parseFloat(item.unitCost);
      const taxableCents = Math.round(qty * unitCost * 100);
      const rate = parseFloat(item.gstRatePercent);

      let lineCgstCents = 0;
      let lineSgstCents = 0;
      let lineIgstCents = 0;

      if (isInterstate) {
        lineIgstCents = Math.round((taxableCents * rate) / 100);
      } else {
        lineCgstCents = Math.round((taxableCents * (rate / 2)) / 100);
        lineSgstCents = Math.round((taxableCents * (rate / 2)) / 100);
      }

      const lineTotalCents = taxableCents + lineCgstCents + lineSgstCents + lineIgstCents;

      subtotalCents += taxableCents;
      cgstCents += lineCgstCents;
      sgstCents += lineSgstCents;
      igstCents += lineIgstCents;

      linesToInsert.push({
        tenantId,
        productId: item.productId ?? null,
        description: item.description,
        hsnCode: item.hsnCode ?? null,
        quantity: item.quantity,
        unitCost: item.unitCost,
        taxableValue: (taxableCents / 100).toFixed(2),
        gstRatePercent: item.gstRatePercent,
        cgstAmount: (lineCgstCents / 100).toFixed(2),
        sgstAmount: (lineSgstCents / 100).toFixed(2),
        igstAmount: (lineIgstCents / 100).toFixed(2),
        lineTotal: (lineTotalCents / 100).toFixed(2),
      });
    }

    const totalCents = subtotalCents + cgstCents + sgstCents + igstCents;

    const invoice = this.supplierInvoiceRepo.create({
      tenantId,
      branchId: dto.branchId,
      supplierId: dto.supplierId,
      purchaseOrderId: dto.purchaseOrderId ?? null,
      supplierInvoiceNumber: dto.supplierInvoiceNumber.trim(),
      supplierInvoiceDate: new Date(dto.supplierInvoiceDate),
      subtotal: (subtotalCents / 100).toFixed(2),
      cgstAmount: (cgstCents / 100).toFixed(2),
      sgstAmount: (sgstCents / 100).toFixed(2),
      igstAmount: (igstCents / 100).toFixed(2),
      totalAmount: (totalCents / 100).toFixed(2),
      isItcEligible: dto.isItcEligible ?? true,
      ineligibilityReason: dto.ineligibilityReason ?? null,
      isReverseCharge: dto.isReverseCharge ?? false,
      placeOfSupply: dto.placeOfSupply ?? supplierState,
      notes: dto.notes ?? null,
      createdBy: userId,
    });

    const savedInvoice = await this.supplierInvoiceRepo.save(invoice);

    for (const line of linesToInsert) {
      line.supplierInvoiceId = savedInvoice.id;
    }
    await this.supplierInvoiceLineRepo.save(
      linesToInsert.map((l) => this.supplierInvoiceLineRepo.create(l)),
    );

    return this.supplierInvoiceRepo.findOne({
      where: { id: savedInvoice.id, tenantId },
      relations: ['supplier', 'lines'],
    });
  }

  /**
   * List Supplier Invoices
   */
  async getSupplierInvoices(tenantId: string, branchId?: string) {
    const qb = this.supplierInvoiceRepo
      .createQueryBuilder('si')
      .leftJoinAndSelect('si.supplier', 'supplier')
      .leftJoinAndSelect('si.lines', 'lines')
      .where('si.tenantId = :tenantId', { tenantId })
      .orderBy('si.supplierInvoiceDate', 'DESC');

    if (branchId) {
      qb.andWhere('si.branchId = :branchId', { branchId });
    }

    return qb.getMany();
  }
}
