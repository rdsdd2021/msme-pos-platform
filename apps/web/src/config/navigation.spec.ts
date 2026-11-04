import { filterNavForUser, navigationConfig } from './navigation';
import { Role, BusinessType, AppModule } from '@pos/shared-types';

describe('Navigation Filtering by Role and Enabled Module', () => {
  it('hides Restaurant & Dining for Grocery / Kirana stores by default', () => {
    const nav = filterNavForUser([Role.OWNER], undefined, BusinessType.GROCERY);

    const sectionTitles = nav.map((s) => s.title);
    expect(sectionTitles).not.toContain('Restaurant & Dining');

    const allItemIds = nav.flatMap((s) => s.items.map((i) => i.id));
    expect(allItemIds).not.toContain('restaurant-floorplan');
    expect(allItemIds).not.toContain('kitchen-display');

    // Should contain standard kirana operations
    expect(allItemIds).toContain('pos-terminal');
    expect(allItemIds).toContain('inventory-hub');
    expect(allItemIds).toContain('customer-khata');
    expect(allItemIds).toContain('gst-reports');
  });

  it('shows Restaurant & Dining for Restaurant stores', () => {
    const nav = filterNavForUser([Role.OWNER], undefined, BusinessType.RESTAURANT);

    const sectionTitles = nav.map((s) => s.title);
    expect(sectionTitles).toContain('Restaurant & Dining');

    const allItemIds = nav.flatMap((s) => s.items.map((i) => i.id));
    expect(allItemIds).toContain('restaurant-floorplan');
    expect(allItemIds).toContain('kitchen-display');
    expect(allItemIds).toContain('pos-terminal');
  });

  it('respects custom enabledModules list when provided', () => {
    // A grocery store that manually enabled restaurant KOT
    const customModules = ['pos', 'inventory', 'restaurant'];
    const nav = filterNavForUser([Role.OWNER], customModules);

    const allItemIds = nav.flatMap((s) => s.items.map((i) => i.id));
    expect(allItemIds).toContain('pos-terminal');
    expect(allItemIds).toContain('inventory-hub');
    expect(allItemIds).toContain('restaurant-floorplan');

    // Khata and GST were not in custom list
    expect(allItemIds).not.toContain('customer-khata');
    expect(allItemIds).not.toContain('gst-reports');
  });

  it('enforces cashier role restrictions within enabled modules', () => {
    const nav = filterNavForUser([Role.CASHIER], undefined, BusinessType.GROCERY);

    const allItemIds = nav.flatMap((s) => s.items.map((i) => i.id));
    expect(allItemIds).toContain('pos-terminal');

    // Cashier cannot access branches administration or executive analytics
    expect(allItemIds).not.toContain('branches');
    expect(allItemIds).not.toContain('analytics');
    expect(allItemIds).not.toContain('subscription');
  });
});

