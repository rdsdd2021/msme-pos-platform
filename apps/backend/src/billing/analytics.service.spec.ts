import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockDataSource: { query: jest.Mock };

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('aggregates day analytics across summary, trend, products, categories, tables, payments and peak hours', async () => {
    mockDataSource.query
      // 1. summaryRows
      .mockResolvedValueOnce([{ total_sales: '1500.00', invoice_count: 5, total_tax: '0.00', total_discount: '50.00' }])
      // 2. prevSummaryRows
      .mockResolvedValueOnce([{ total_sales: '1000.00' }])
      // 3. hourRows
      .mockResolvedValueOnce([{ hr: 13, revenue: '900.00', orders: 3 }, { hr: 20, revenue: '600.00', orders: 2 }])
      // 4. productRows
      .mockResolvedValueOnce([
        { product_id: 'p1', name: 'Paneer Tikka', category_name: 'Starters', qty_sold: '4.000', revenue: '800.00' },
        { product_id: 'p2', name: 'Masala Chai', category_name: 'Beverages', qty_sold: '10.000', revenue: '700.00' },
      ])
      // 5. categoryRows
      .mockResolvedValueOnce([
        { category_id: 'c1', category_name: 'Starters', item_count: 1, qty_sold: '4.000', revenue: '800.00' },
        { category_id: 'c2', category_name: 'Beverages', item_count: 1, qty_sold: '10.000', revenue: '700.00' },
      ])
      // 6. totalQtyRow
      .mockResolvedValueOnce([{ total_qty: '14.000' }])
      // 7. tableRows
      .mockResolvedValueOnce([
        { table_number: 'AC-01', section: 'AC Hall', order_count: 3, guest_count: 8, revenue: '900.00' },
      ])
      // 8. paymentRows
      .mockResolvedValueOnce([
        { method: 'upi', amount: '1000.00', cnt: 3 },
        { method: 'cash', amount: '500.00', cnt: 2 },
      ])
      // 9. peakRows
      .mockResolvedValueOnce([{ hr: 13, orders: 3, revenue: '900.00' }]);

    const res = await service.getBusinessAnalytics('tenant-1', 'day', 'branch-1');

    expect(res.period).toBe('day');
    expect(res.summary.totalSales).toBe('1500.00');
    expect(res.summary.previousPeriodSales).toBe('1000.00');
    expect(res.summary.growthPercent).toBe(50);
    expect(res.summary.invoiceCount).toBe(5);
    expect(res.summary.averageOrderValue).toBe('300.00');
    expect(res.summary.totalItemsSold).toBe(14);
    expect(res.byProduct).toHaveLength(2);
    expect(res.byProduct[0].name).toBe('Paneer Tikka');
    expect(res.byCategory).toHaveLength(2);
    expect(res.byTable[0].tableNumber).toBe('AC-01');
    expect(res.byTable[0].avgBill).toBe(300);
    expect(res.byPaymentMethod[0].method).toBe('upi');
    expect(res.peakHours.find((h) => h.hour === 13)?.orders).toBe(3);

    // Ensure tenant_id & branch_id were passed to parameterized queries
    expect(mockDataSource.query.mock.calls[0][1][0]).toBe('tenant-1');
    expect(mockDataSource.query.mock.calls[0][1][3]).toBe('branch-1');
  });

  it('builds 7-day trend for week period and 30-day trend for month period', async () => {
    mockDataSource.query.mockResolvedValue([]);

    const weekRes = await service.getBusinessAnalytics('tenant-1', 'week');
    expect(weekRes.period).toBe('week');
    expect(weekRes.salesTrend).toHaveLength(7);

    mockDataSource.query.mockResolvedValue([]);
    const monthRes = await service.getBusinessAnalytics('tenant-1', 'month');
    expect(monthRes.period).toBe('month');
    expect(monthRes.salesTrend).toHaveLength(30);
  });
});
