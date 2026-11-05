import { AppDataSource } from '../data-source';
import { UserEntity } from '../../tenants/entities/user.entity';
import { TenantEntity } from '../../tenants/entities/tenant.entity';
import { BranchEntity } from '../../tenants/entities/branch.entity';
import { TenantMembershipEntity } from '../../tenants/entities/tenant-membership.entity';
import { CategoryEntity } from '../../catalog/entities/category.entity';
import { UnitEntity } from '../../catalog/entities/unit.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { StockBalanceEntity } from '../../catalog/entities/stock-balance.entity';
import { StockLedgerEntity } from '../../catalog/entities/stock-ledger.entity';
import { CustomerEntity } from '../../operations/entities/customer.entity';
import { TenantSubscriptionEntity } from '../../commercial/entities/tenant-subscription.entity';
import {
  BusinessType,
  TenantStatus,
  UserStatus,
  MembershipStatus,
  ProductType,
  StockMovementType,
  SubscriptionPlanCode,
  SubscriptionStatus,
} from '@pos/shared-types';
import * as bcrypt from 'bcrypt';

export async function runSeeds() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    throw new Error(
      'Security Violation: Database seeds cannot be executed in production environment without ALLOW_PROD_SEED=true',
    );
  }

  console.log('--- Initializing DataSource for Database Seeding ---');
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const userRepo = queryRunner.manager.getRepository(UserEntity);
    const tenantRepo = queryRunner.manager.getRepository(TenantEntity);
    const branchRepo = queryRunner.manager.getRepository(BranchEntity);
    const membershipRepo = queryRunner.manager.getRepository(TenantMembershipEntity);
    const unitRepo = queryRunner.manager.getRepository(UnitEntity);
    const categoryRepo = queryRunner.manager.getRepository(CategoryEntity);
    const productRepo = queryRunner.manager.getRepository(ProductEntity);
    const stockBalanceRepo = queryRunner.manager.getRepository(StockBalanceEntity);
    const stockLedgerRepo = queryRunner.manager.getRepository(StockLedgerEntity);
    const customerRepo = queryRunner.manager.getRepository(CustomerEntity);
    const subscriptionRepo = queryRunner.manager.getRepository(TenantSubscriptionEntity);

    console.log('1. Seeding Default Tenant & Branch...');
    let tenant = await tenantRepo.findOne({ where: { displayName: 'Kirana Supermart' } });
    if (!tenant) {
      tenant = tenantRepo.create({
        legalName: 'Kirana Supermart Pvt Ltd',
        displayName: 'Kirana Supermart',
        businessType: BusinessType.GROCERY,
        status: TenantStatus.ACTIVE,
        defaultCurrency: 'INR',
        defaultTimezone: 'Asia/Kolkata',
      });
      await tenantRepo.save(tenant);
      console.log(`Created Tenant: ${tenant.id}`);
    }

    let branch = await branchRepo.findOne({ where: { tenantId: tenant.id, code: 'BR-001' } });
    if (!branch) {
      branch = branchRepo.create({
        tenantId: tenant.id,
        name: 'Main Store - Andheri West',
        code: 'BR-001',
        addressLine1: 'Shop 4, Andheri West',
        city: 'Mumbai',
        stateCode: '27',
        postalCode: '400058',
        timezone: 'Asia/Kolkata',
        isActive: true,
      });
      await branchRepo.save(branch);
      console.log(`Created Branch: ${branch.id}`);
    }

    console.log('2. Seeding Users & Memberships...');
    const passwordHash = await bcrypt.hash('Password@123', 12);
    const superAdminPasswordHash = await bcrypt.hash('SuperAdmin@123', 12);

    // Platform Super Admin
    let superAdmin = await userRepo.findOne({ where: { email: 'superadmin@pos.assistt.in' } });
    if (!superAdmin) {
      superAdmin = userRepo.create({
        email: 'superadmin@pos.assistt.in',
        passwordHash: superAdminPasswordHash,
        fullName: 'Platform Super Administrator',
        phone: '+919999999999',
        status: UserStatus.ACTIVE,
        isSuperAdmin: true,
      });
      await userRepo.save(superAdmin);
      console.log(`Created Super Admin User: ${superAdmin.id}`);
    } else if (!superAdmin.isSuperAdmin) {
      superAdmin.isSuperAdmin = true;
      await userRepo.save(superAdmin);
    }

    let adminUser = await userRepo.findOne({ where: { email: 'admin@kirana.dev' } });
    if (!adminUser) {
      adminUser = userRepo.create({
        email: 'admin@kirana.dev',
        passwordHash,
        fullName: 'Rajesh Store Owner',
        phone: '+919876543201',
        status: UserStatus.ACTIVE,
      });
      await userRepo.save(adminUser);
      console.log(`Created Admin User: ${adminUser.id}`);
    }

    let adminMembership = await membershipRepo.findOne({
      where: { tenantId: tenant.id, userId: adminUser.id },
    });
    if (!adminMembership) {
      adminMembership = membershipRepo.create({
        tenantId: tenant.id,
        userId: adminUser.id,
        role: 'owner',
        status: MembershipStatus.ACTIVE,
      });
      await membershipRepo.save(adminMembership);
    }

    let cashierUser = await userRepo.findOne({ where: { email: 'cashier@kirana.dev' } });
    if (!cashierUser) {
      cashierUser = userRepo.create({
        email: 'cashier@kirana.dev',
        passwordHash,
        fullName: 'Suresh Cashier',
        phone: '+919876543202',
        status: UserStatus.ACTIVE,
      });
      await userRepo.save(cashierUser);
      console.log(`Created Cashier User: ${cashierUser.id}`);
    }

    let cashierMembership = await membershipRepo.findOne({
      where: { tenantId: tenant.id, userId: cashierUser.id },
    });
    if (!cashierMembership) {
      cashierMembership = membershipRepo.create({
        tenantId: tenant.id,
        userId: cashierUser.id,
        role: 'cashier',
        status: MembershipStatus.ACTIVE,
      });
      await membershipRepo.save(cashierMembership);
    }

    console.log('3. Seeding Commercial Subscription...');
    let sub = await subscriptionRepo.findOne({ where: { tenantId: tenant.id } });
    if (!sub) {
      const end = new Date();
      end.setFullYear(end.getFullYear() + 1);
      sub = subscriptionRepo.create({
        tenantId: tenant.id,
        planCode: SubscriptionPlanCode.BASIC_KIRANA,
        status: SubscriptionStatus.ACTIVE,
        maxDevices: 5,
        maxBranches: 2,
        maxUsers: 10,
        trialEndsAt: null,
        currentPeriodEnd: end,
      });
      await subscriptionRepo.save(sub);
      console.log(`Created Subscription: ${sub.planCode}`);
    }

    console.log('4. Seeding Units & Categories...');
    const unitsMap = new Map<string, UnitEntity>();
    const unitDefs = [
      { name: 'Piece', symbol: 'PCS', decimalPlaces: 0 },
      { name: 'Kilogram', symbol: 'KG', decimalPlaces: 3 },
      { name: 'Litre', symbol: 'LTR', decimalPlaces: 3 },
      { name: 'Packet', symbol: 'PKT', decimalPlaces: 0 },
    ];
    for (const u of unitDefs) {
      let unit = await unitRepo.findOne({ where: { tenantId: tenant.id, symbol: u.symbol } });
      if (!unit) {
        unit = unitRepo.create({
          tenantId: tenant.id,
          name: u.name,
          symbol: u.symbol,
          decimalPlaces: u.decimalPlaces,
        });
        await unitRepo.save(unit);
      }
      unitsMap.set(u.symbol, unit);
    }

    const categoriesMap = new Map<string, CategoryEntity>();
    const catDefs = [
      { name: 'Groceries & Staples', code: 'CAT-GROC' },
      { name: 'Dairy & Breakfast', code: 'CAT-DAIRY' },
      { name: 'Snacks & Packaged Food', code: 'CAT-SNACK' },
      { name: 'Beverages', code: 'CAT-BEV' },
    ];
    for (const c of catDefs) {
      let cat = await categoryRepo.findOne({ where: { tenantId: tenant.id, code: c.code } });
      if (!cat) {
        cat = categoryRepo.create({ tenantId: tenant.id, name: c.name, code: c.code });
        await categoryRepo.save(cat);
      }
      categoriesMap.set(c.code, cat);
    }

    console.log('5. Seeding Products & Stock Balances...');
    const productDefs = [
      {
        name: 'Aashirvaad Shudh Chakki Atta 5kg',
        sku: 'GROC-001',
        barcode: '890103000001',
        category: 'CAT-GROC',
        unit: 'PKT',
        hsn: '11010000',
        cost: '210.00',
        price: '240.00',
        mrp: '250.00',
        initialStock: '50.000',
      },
      {
        name: 'Amul Salted Butter 500g',
        sku: 'DAIRY-001',
        barcode: '890103000002',
        category: 'CAT-DAIRY',
        unit: 'PKT',
        hsn: '04051000',
        cost: '245.00',
        price: '275.00',
        mrp: '280.00',
        initialStock: '40.000',
      },
      {
        name: 'Tata Salt Vacuum Evaporated 1kg',
        sku: 'GROC-002',
        barcode: '890103000003',
        category: 'CAT-GROC',
        unit: 'PKT',
        hsn: '25010010',
        cost: '22.00',
        price: '28.00',
        mrp: '30.00',
        initialStock: '100.000',
      },
      {
        name: 'Fortune Sunlite Refined Sunflower Oil 1L',
        sku: 'GROC-003',
        barcode: '890103000004',
        category: 'CAT-GROC',
        unit: 'LTR',
        hsn: '15121910',
        cost: '140.00',
        price: '165.00',
        mrp: '175.00',
        initialStock: '60.000',
      },
      {
        name: 'Parle-G Gold Glucose Biscuit 800g',
        sku: 'SNACK-001',
        barcode: '890103000005',
        category: 'CAT-SNACK',
        unit: 'PKT',
        hsn: '19053100',
        cost: '68.00',
        price: '80.00',
        mrp: '85.00',
        initialStock: '80.000',
      },
      {
        name: 'Maggi 2-Minute Masala Noodles 280g',
        sku: 'SNACK-002',
        barcode: '890103000006',
        category: 'CAT-SNACK',
        unit: 'PKT',
        hsn: '19023010',
        cost: '46.00',
        price: '55.00',
        mrp: '60.00',
        initialStock: '75.000',
      },
    ];

    for (const p of productDefs) {
      let prod = await productRepo.findOne({ where: { tenantId: tenant.id, sku: p.sku } });
      if (!prod) {
        prod = productRepo.create({
          tenantId: tenant.id,
          name: p.name,
          sku: p.sku,
          barcodePrimary: p.barcode,
          productType: ProductType.STOCK,
          categoryId: categoriesMap.get(p.category)?.id || null,
          baseUnitId: unitsMap.get(p.unit)?.id || null,
          hsnCode: p.hsn,
          purchaseCost: p.cost,
          sellingPrice: p.price,
          mrp: p.mrp,
          trackInventory: true,
          allowFractionalQuantity: false,
          isActive: true,
        });
        await productRepo.save(prod);
        console.log(`Created Product: ${prod.name} (${prod.sku})`);

        // Stock balance & ledger
        const balance = stockBalanceRepo.create({
          tenantId: tenant.id,
          branchId: branch.id,
          productId: prod.id,
          quantityOnHand: p.initialStock,
          lowStockThreshold: '5.000',
        });
        await stockBalanceRepo.save(balance);

        const ledger = stockLedgerRepo.create({
          tenantId: tenant.id,
          branchId: branch.id,
          productId: prod.id,
          movementType: StockMovementType.OPENING,
          quantityDelta: p.initialStock,
          unitCost: p.cost,
          sourceType: 'seed',
          sourceId: 'seed-init',
          idempotencyKey: `seed-init-${prod.sku}`,
          reason: 'Initial development inventory seed',
          occurredAt: new Date(),
        });
        await stockLedgerRepo.save(ledger);
      }
    }

    console.log('6. Seeding Customers & Khata Accounts...');
    let customer = await customerRepo.findOne({
      where: { tenantId: tenant.id, phone: '+919876543210' },
    });
    if (!customer) {
      customer = customerRepo.create({
        tenantId: tenant.id,
        name: 'Ramesh Sharma',
        phone: '+919876543210',
        creditLimit: '5000.00',
        currentBalance: '0.00',
        isActive: true,
      });
      await customerRepo.save(customer);
      console.log(`Created Customer: ${customer.name}`);
    }

    await queryRunner.commitTransaction();
    console.log('--- Database Seeding Completed Successfully! ---');
  } catch (error) {
    console.error('Seeding error, rolling back:', error);
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  runSeeds()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal seed error:', err);
      process.exit(1);
    });
}
