import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export type AnalyticsPeriod = 'day' | 'week' | 'month';

export interface SalesTrendPoint {
  label: string;
  dateKey: string;
  revenue: number;
  orders: number;
}

export interface ProductAnalyticsItem {
  productId: string;
  name: string;
  categoryName: string;
  quantitySold: number;
  revenue: number;
  sharePercent: number;
}

export interface CategoryAnalyticsItem {
  categoryId: string | null;
  categoryName: string;
  itemCount: number;
  quantitySold: number;
  revenue: number;
  sharePercent: number;
}

export interface TableAnalyticsItem {
  tableNumber: string;
  section: string;
  orderCount: number;
  guestCount: number;
  revenue: number;
  avgBill: number;
}

export interface PaymentAnalyticsItem {
  method: string;
  amount: number;
  count: number;
  sharePercent: number;
}

export interface PeakHourItem {
  hour: number;
  label: string;
  orders: number;
  revenue: number;
}

export interface BusinessAnalyticsResponse {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  summary: {
    totalSales: string;
    previousPeriodSales: string;
    growthPercent: number;
    invoiceCount: number;
    averageOrderValue: string;
    totalTax: string;
    totalDiscount: string;
    totalItemsSold: number;
  };
  salesTrend: SalesTrendPoint[];
  byProduct: ProductAnalyticsItem[];
  byCategory: CategoryAnalyticsItem[];
  byTable: TableAnalyticsItem[];
  byPaymentMethod: PaymentAnalyticsItem[];
  peakHours: PeakHourItem[];
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly dataSource: DataSource) {}

  private computeDateRanges(period: AnalyticsPeriod): {
    start: Date;
    end: Date;
    prevStart: Date;
    prevEnd: Date;
  } {
    // Use IST (+05:30) business day boundaries
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffsetMs);

    const istTodayStart = new Date(
      Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0),
    );
    const startUtcToday = new Date(istTodayStart.getTime() - istOffsetMs);
    const end = now;

    if (period === 'week') {
      const start = new Date(startUtcToday.getTime() - 6 * 24 * 60 * 60 * 1000);
      const prevEnd = start;
      const prevStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start, end, prevStart, prevEnd };
    }

    if (period === 'month') {
      const start = new Date(startUtcToday.getTime() - 29 * 24 * 60 * 60 * 1000);
      const prevEnd = start;
      const prevStart = new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start, end, prevStart, prevEnd };
    }

    // Default: 'day' (Today)
    const start = startUtcToday;
    const prevEnd = start;
    const prevStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    return { start, end, prevStart, prevEnd };
  }

  async getBusinessAnalytics(
    tenantId: string,
    period: AnalyticsPeriod = 'day',
    branchId?: string,
  ): Promise<BusinessAnalyticsResponse> {
    const validPeriod: AnalyticsPeriod =
      period === 'week' || period === 'month' ? period : 'day';
    const { start, end, prevStart, prevEnd } = this.computeDateRanges(validPeriod);

    const branchFilterInv = branchId ? 'AND i.branch_id = $4' : '';
    const baseParams: any[] = branchId
      ? [tenantId, start.toISOString(), end.toISOString(), branchId]
      : [tenantId, start.toISOString(), end.toISOString()];

    const prevParams: any[] = branchId
      ? [tenantId, prevStart.toISOString(), prevEnd.toISOString(), branchId]
      : [tenantId, prevStart.toISOString(), prevEnd.toISOString()];

    // 1. Summary & Previous Period Summary
    const [summaryRows, prevSummaryRows] = await Promise.all([
      this.dataSource.query(
        `
        SELECT
          COALESCE(SUM(i.grand_total), 0)::numeric(14,2) AS total_sales,
          COUNT(i.id)::int AS invoice_count,
          COALESCE(SUM(i.cgst_total + i.sgst_total + i.igst_total), 0)::numeric(14,2) AS total_tax,
          COALESCE(SUM(i.discount_total), 0)::numeric(14,2) AS total_discount
        FROM invoices i
        WHERE i.tenant_id = $1
          AND i.status = 'posted'
          AND i.created_at >= $2
          AND i.created_at <= $3
          ${branchFilterInv}
        `,
        baseParams,
      ),
      this.dataSource.query(
        `
        SELECT COALESCE(SUM(i.grand_total), 0)::numeric(14,2) AS total_sales
        FROM invoices i
        WHERE i.tenant_id = $1
          AND i.status = 'posted'
          AND i.created_at >= $2
          AND i.created_at < $3
          ${branchFilterInv}
        `,
        prevParams,
      ),
    ]);

    const sRow = summaryRows?.[0] || {};
    const pRow = prevSummaryRows?.[0] || {};
    const totalSalesNum = parseFloat(sRow.total_sales || '0') || 0;
    const prevSalesNum = parseFloat(pRow.total_sales || '0') || 0;
    const invoiceCount = Number(sRow.invoice_count || 0);
    const totalTaxNum = parseFloat(sRow.total_tax || '0') || 0;
    const totalDiscountNum = parseFloat(sRow.total_discount || '0') || 0;
    const avgOrderValue = invoiceCount > 0 ? totalSalesNum / invoiceCount : 0;

    let growthPercent = 0;
    if (prevSalesNum > 0) {
      growthPercent = Math.round(((totalSalesNum - prevSalesNum) / prevSalesNum) * 1000) / 10;
    } else if (totalSalesNum > 0) {
      growthPercent = 100;
    }

    // 2. Sales Trend (Hourly for day, Daily for week/month in IST)
    let salesTrend: SalesTrendPoint[] = [];
    if (validPeriod === 'day') {
      const hourRows = await this.dataSource.query(
        `
        SELECT
          EXTRACT(HOUR FROM (i.created_at AT TIME ZONE 'Asia/Kolkata'))::int AS hr,
          COALESCE(SUM(i.grand_total), 0)::numeric(14,2) AS revenue,
          COUNT(i.id)::int AS orders
        FROM invoices i
        WHERE i.tenant_id = $1
          AND i.status = 'posted'
          AND i.created_at >= $2
          AND i.created_at <= $3
          ${branchFilterInv}
        GROUP BY hr
        ORDER BY hr ASC
        `,
        baseParams,
      );
      const hrMap = new Map<number, { revenue: number; orders: number }>();
      for (const r of hourRows || []) {
        hrMap.set(Number(r.hr), {
          revenue: parseFloat(r.revenue || '0') || 0,
          orders: Number(r.orders || 0),
        });
      }
      // Show 08:00 to 23:00 (or include earlier hours if they have sales)
      for (let h = 0; h < 24; h++) {
        const entry = hrMap.get(h) || { revenue: 0, orders: 0 };
        if (h >= 8 || entry.orders > 0) {
          const suffix = h >= 12 ? 'PM' : 'AM';
          const h12 = h % 12 === 0 ? 12 : h % 12;
          salesTrend.push({
            label: `${h12}${suffix}`,
            dateKey: `${h.toString().padStart(2, '0')}:00`,
            revenue: Math.round(entry.revenue * 100) / 100,
            orders: entry.orders,
          });
        }
      }
    } else {
      const dayRows = await this.dataSource.query(
        `
        SELECT
          TO_CHAR((i.created_at AT TIME ZONE 'Asia/Kolkata')::date, 'YYYY-MM-DD') AS day_key,
          TO_CHAR((i.created_at AT TIME ZONE 'Asia/Kolkata')::date, 'DD Mon') AS day_label,
          COALESCE(SUM(i.grand_total), 0)::numeric(14,2) AS revenue,
          COUNT(i.id)::int AS orders
        FROM invoices i
        WHERE i.tenant_id = $1
          AND i.status = 'posted'
          AND i.created_at >= $2
          AND i.created_at <= $3
          ${branchFilterInv}
        GROUP BY day_key, day_label
        ORDER BY day_key ASC
        `,
        baseParams,
      );
      const dayMap = new Map<string, { revenue: number; orders: number }>();
      for (const r of dayRows || []) {
        dayMap.set(String(r.day_key), {
          revenue: parseFloat(r.revenue || '0') || 0,
          orders: Number(r.orders || 0),
        });
      }

      const numDays = validPeriod === 'week' ? 7 : 30;
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(Date.now() + istOffsetMs - i * 24 * 60 * 60 * 1000);
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;
        const label = `${dd} ${months[d.getUTCMonth()]}`;
        const entry = dayMap.get(key) || { revenue: 0, orders: 0 };
        salesTrend.push({
          label,
          dateKey: key,
          revenue: Math.round(entry.revenue * 100) / 100,
          orders: entry.orders,
        });
      }
    }

    // 3. Product-wise Sales & Category-wise Sales
    const [productRows, categoryRows, totalQtyRow] = await Promise.all([
      this.dataSource.query(
        `
        SELECT
          COALESCE(il.product_id::text, il.product_name_snapshot) AS product_id,
          MAX(il.product_name_snapshot) AS name,
          COALESCE(MAX(c.name), 'Uncategorized') AS category_name,
          COALESCE(SUM(il.quantity), 0)::numeric(14,3) AS qty_sold,
          COALESCE(SUM(il.line_total), 0)::numeric(14,2) AS revenue
        FROM invoice_lines il
        INNER JOIN invoices i ON i.id = il.invoice_id
        LEFT JOIN products p ON p.id = il.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE i.tenant_id = $1
          AND i.status = 'posted'
          AND i.created_at >= $2
          AND i.created_at <= $3
          ${branchFilterInv}
        GROUP BY COALESCE(il.product_id::text, il.product_name_snapshot)
        ORDER BY revenue DESC
        LIMIT 20
        `,
        baseParams,
      ),
      this.dataSource.query(
        `
        SELECT
          p.category_id AS category_id,
          COALESCE(c.name, 'Uncategorized') AS category_name,
          COUNT(DISTINCT COALESCE(il.product_id::text, il.product_name_snapshot))::int AS item_count,
          COALESCE(SUM(il.quantity), 0)::numeric(14,3) AS qty_sold,
          COALESCE(SUM(il.line_total), 0)::numeric(14,2) AS revenue
        FROM invoice_lines il
        INNER JOIN invoices i ON i.id = il.invoice_id
        LEFT JOIN products p ON p.id = il.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE i.tenant_id = $1
          AND i.status = 'posted'
          AND i.created_at >= $2
          AND i.created_at <= $3
          ${branchFilterInv}
        GROUP BY p.category_id, COALESCE(c.name, 'Uncategorized')
        ORDER BY revenue DESC
        `,
        baseParams,
      ),
      this.dataSource.query(
        `
        SELECT COALESCE(SUM(il.quantity), 0)::numeric(14,3) AS total_qty
        FROM invoice_lines il
        INNER JOIN invoices i ON i.id = il.invoice_id
        WHERE i.tenant_id = $1
          AND i.status = 'posted'
          AND i.created_at >= $2
          AND i.created_at <= $3
          ${branchFilterInv}
        `,
        baseParams,
      ),
    ]);

    const totalItemsSold = Math.round(parseFloat(totalQtyRow?.[0]?.total_qty || '0') || 0);
    const totalLineRevenue = (categoryRows || []).reduce(
      (sum: number, r: any) => sum + (parseFloat(r.revenue || '0') || 0),
      0,
    );
    const shareDenom = totalLineRevenue > 0 ? totalLineRevenue : totalSalesNum;

    const byProduct: ProductAnalyticsItem[] = (productRows || []).map((r: any) => {
      const rev = parseFloat(r.revenue || '0') || 0;
      return {
        productId: String(r.product_id || ''),
        name: String(r.name || 'Item'),
        categoryName: String(r.category_name || 'Uncategorized'),
        quantitySold: Math.round((parseFloat(r.qty_sold || '0') || 0) * 100) / 100,
        revenue: Math.round(rev * 100) / 100,
        sharePercent: shareDenom > 0 ? Math.round((rev / shareDenom) * 1000) / 10 : 0,
      };
    });

    const byCategory: CategoryAnalyticsItem[] = (categoryRows || []).map((r: any) => {
      const rev = parseFloat(r.revenue || '0') || 0;
      return {
        categoryId: r.category_id ? String(r.category_id) : null,
        categoryName: String(r.category_name || 'Uncategorized'),
        itemCount: Number(r.item_count || 0),
        quantitySold: Math.round((parseFloat(r.qty_sold || '0') || 0) * 100) / 100,
        revenue: Math.round(rev * 100) / 100,
        sharePercent: shareDenom > 0 ? Math.round((rev / shareDenom) * 1000) / 10 : 0,
      };
    });

    // 4. Table-wise Sales (Restaurant Dine-In Orders)
    const branchFilterOrd = branchId ? 'AND o.branch_id = $4' : '';
    const tableRows = await this.dataSource.query(
      `
      SELECT
        COALESCE(o.table_number_snapshot, 'Takeaway / Counter') AS table_number,
        COALESCE(o.section_snapshot, 'General') AS section,
        COUNT(o.id)::int AS order_count,
        COALESCE(SUM(o.guest_count), 0)::int AS guest_count,
        COALESCE(SUM(o.grand_total), 0)::numeric(14,2) AS revenue
      FROM restaurant_orders o
      WHERE o.tenant_id = $1
        AND o.status = 'completed'
        AND COALESCE(o.closed_at, o.updated_at, o.created_at) >= $2
        AND COALESCE(o.closed_at, o.updated_at, o.created_at) <= $3
        ${branchFilterOrd}
      GROUP BY COALESCE(o.table_number_snapshot, 'Takeaway / Counter'), COALESCE(o.section_snapshot, 'General')
      ORDER BY revenue DESC
      `,
      baseParams,
    );

    const byTable: TableAnalyticsItem[] = (tableRows || []).map((r: any) => {
      const rev = parseFloat(r.revenue || '0') || 0;
      const cnt = Number(r.order_count || 0);
      return {
        tableNumber: String(r.table_number || 'Table'),
        section: String(r.section || 'General'),
        orderCount: cnt,
        guestCount: Number(r.guest_count || 0),
        revenue: Math.round(rev * 100) / 100,
        avgBill: cnt > 0 ? Math.round((rev / cnt) * 100) / 100 : 0,
      };
    });

    // 5. Payment Method Breakdown
    const paymentRows = await this.dataSource.query(
      `
      SELECT
        p.payment_method::text AS method,
        COALESCE(SUM(p.amount), 0)::numeric(14,2) AS amount,
        COUNT(p.id)::int AS cnt
      FROM payments p
      INNER JOIN invoices i ON i.id = p.invoice_id
      WHERE i.tenant_id = $1
        AND i.status = 'posted'
        AND i.created_at >= $2
        AND i.created_at <= $3
        ${branchFilterInv}
      GROUP BY p.payment_method
      ORDER BY amount DESC
      `,
      baseParams,
    );

    const totalPaid = (paymentRows || []).reduce(
      (sum: number, r: any) => sum + (parseFloat(r.amount || '0') || 0),
      0,
    );
    const byPaymentMethod: PaymentAnalyticsItem[] = (paymentRows || []).map((r: any) => {
      const amt = parseFloat(r.amount || '0') || 0;
      return {
        method: String(r.method || 'cash').toLowerCase(),
        amount: Math.round(amt * 100) / 100,
        count: Number(r.cnt || 0),
        sharePercent: totalPaid > 0 ? Math.round((amt / totalPaid) * 1000) / 10 : 0,
      };
    });

    // 6. Peak Hours Distribution (across the selected period in IST)
    const peakRows = await this.dataSource.query(
      `
      SELECT
        EXTRACT(HOUR FROM (i.created_at AT TIME ZONE 'Asia/Kolkata'))::int AS hr,
        COUNT(i.id)::int AS orders,
        COALESCE(SUM(i.grand_total), 0)::numeric(14,2) AS revenue
      FROM invoices i
      WHERE i.tenant_id = $1
        AND i.status = 'posted'
        AND i.created_at >= $2
        AND i.created_at <= $3
        ${branchFilterInv}
      GROUP BY hr
      ORDER BY hr ASC
      `,
      baseParams,
    );
    const peakMap = new Map<number, { orders: number; revenue: number }>();
    for (const r of peakRows || []) {
      peakMap.set(Number(r.hr), {
        orders: Number(r.orders || 0),
        revenue: parseFloat(r.revenue || '0') || 0,
      });
    }
    const peakHours: PeakHourItem[] = [];
    for (let h = 9; h <= 23; h++) {
      const entry = peakMap.get(h) || { orders: 0, revenue: 0 };
      const suffix = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      peakHours.push({
        hour: h,
        label: `${h12}${suffix}`,
        orders: entry.orders,
        revenue: Math.round(entry.revenue * 100) / 100,
      });
    }

    return {
      period: validPeriod,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      summary: {
        totalSales: totalSalesNum.toFixed(2),
        previousPeriodSales: prevSalesNum.toFixed(2),
        growthPercent,
        invoiceCount,
        averageOrderValue: avgOrderValue.toFixed(2),
        totalTax: totalTaxNum.toFixed(2),
        totalDiscount: totalDiscountNum.toFixed(2),
        totalItemsSold,
      },
      salesTrend,
      byProduct,
      byCategory,
      byTable,
      byPaymentMethod,
      peakHours,
    };
  }
}
