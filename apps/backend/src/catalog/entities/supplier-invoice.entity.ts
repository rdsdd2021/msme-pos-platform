import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { SupplierEntity } from './supplier.entity';
import { PurchaseOrderEntity } from './purchase-order.entity';
import { SupplierInvoiceLineEntity } from './supplier-invoice-line.entity';

@Entity('supplier_invoices')
@Unique('UQ_supplier_invoices_vendor_num', ['tenantId', 'supplierId', 'supplierInvoiceNumber'])
@Index(['tenantId', 'supplierInvoiceDate'])
@Index(['tenantId', 'branchId'])
@Index(['tenantId', 'supplierId'])
export class SupplierInvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId!: string;

  @Column({ name: 'purchase_order_id', type: 'uuid', nullable: true })
  purchaseOrderId!: string | null;

  @Column({ name: 'supplier_invoice_number', type: 'varchar', length: 64 })
  supplierInvoiceNumber!: string;

  @Column({ name: 'supplier_invoice_date', type: 'timestamptz' })
  supplierInvoiceDate!: Date;

  @Column({ name: 'subtotal', type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotal!: string;

  @Column({ name: 'cgst_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  cgstAmount!: string;

  @Column({ name: 'sgst_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  sgstAmount!: string;

  @Column({ name: 'igst_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  igstAmount!: string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalAmount!: string;

  @Column({ name: 'is_itc_eligible', type: 'boolean', default: true })
  isItcEligible!: boolean;

  @Column({ name: 'ineligibility_reason', type: 'varchar', length: 255, nullable: true })
  ineligibilityReason!: string | null;

  @Column({ name: 'is_reverse_charge', type: 'boolean', default: false })
  isReverseCharge!: boolean;

  @Column({ name: 'place_of_supply', type: 'varchar', length: 10, nullable: true })
  placeOfSupply!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => SupplierEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: SupplierEntity;

  @ManyToOne(() => PurchaseOrderEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder!: PurchaseOrderEntity | null;

  @OneToMany(() => SupplierInvoiceLineEntity, (line) => line.supplierInvoice, { cascade: true })
  lines!: SupplierInvoiceLineEntity[];
}

