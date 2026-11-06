import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../tenants/entities/user.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { BranchEntity } from '../tenants/entities/branch.entity';
import { TenantMembershipEntity } from '../tenants/entities/tenant-membership.entity';
import { AuditLogEntity } from '../tenants/entities/audit-log.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { StockBalanceEntity } from '../catalog/entities/stock-balance.entity';
import { CategoryEntity } from '../catalog/entities/category.entity';
import { RegisterDto, RegisterMerchantDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto';
import {
  UserStatus,
  Role,
  MembershipStatus,
  TenantStatus,
  BusinessType,
  ProductType,
  getPermissionsForRoles,
  DEFAULT_MODULES_BY_BUSINESS,
} from '@pos/shared-types';

export interface JwtPayload {
  sub: string;
  email: string;
  isSuperAdmin?: boolean;
}

const SALT_ROUNDS = 12;

interface StarterSeedItem {
  name: string;
  sku: string;
  categoryCode: string;
  categoryName: string;
  barcode: string | null;
  cost: string;
  price: string;
  mrp: string;
  hsn: string;
  gstRate: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async registerMerchant(dto: RegisterMerchantDto): Promise<AuthResponseDto> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    if (dto.gstin && dto.stateCode && /^[0-9]{2}$/.test(dto.stateCode)) {
      const gstinClean = dto.gstin.trim().toUpperCase();
      const gstinPrefix = gstinClean.substring(0, 2);
      if (gstinPrefix !== dto.stateCode) {
        throw new BadRequestException(
          `State code prefix of GSTIN (${gstinPrefix}) must match the branch state code (${dto.stateCode})`,
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const savedUser = await this.dataSource.transaction(async (manager) => {
      // 1. Create User
      const user = manager.create(UserEntity, {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName.trim(),
        phone: dto.phone ?? null,
        status: UserStatus.ACTIVE,
      });
      const persistedUser = await manager.save(user);

      // 2. Create Tenant
      const storeName = dto.storeName.trim();
      const resolvedModules =
        dto.enabledModules && dto.enabledModules.length > 0
          ? dto.enabledModules
          : DEFAULT_MODULES_BY_BUSINESS[dto.businessType] ||
            DEFAULT_MODULES_BY_BUSINESS[BusinessType.GROCERY];

      const tenant = manager.create(TenantEntity, {
        legalName: storeName,
        displayName: storeName,
        businessType: dto.businessType,
        defaultTimezone: 'Asia/Kolkata',
        defaultCurrency: 'INR',
        status: TenantStatus.TRIAL,
        settings: {
          enabledModules: resolvedModules,
          allowNegativeStock: dto.allowNegativeStock ?? false,
        },
      });
      const persistedTenant = await manager.save(tenant);

      // 3. Create Main Branch
      const branch = manager.create(BranchEntity, {
        tenantId: persistedTenant.id,
        code: 'MAIN',
        name: 'Main Store',
        stateCode: dto.stateCode,
        gstin: dto.gstin ? dto.gstin.trim().toUpperCase() : null,
        city: dto.city ? dto.city.trim() : null,
        timezone: 'Asia/Kolkata',
        isActive: true,
      });
      const persistedBranch = await manager.save(branch);

      // 4. Create Owner Membership
      const membership = manager.create(TenantMembershipEntity, {
        tenantId: persistedTenant.id,
        userId: persistedUser.id,
        status: MembershipStatus.ACTIVE,
        role: Role.OWNER,
        roles: [Role.OWNER],
        branchId: null, // Tenant-wide scope for owner
      });
      await manager.save(membership);

      // 5. Seed sample industry catalog only if explicitly requested (default false for clean commercial store)
      if (dto.seedSampleCatalog === true) {
        await this.seedIndustryCatalog(
          manager,
          persistedTenant.id,
          persistedBranch.id,
          dto.businessType,
        );
      }

      // 6. Record Audit Log
      const auditLog = manager.create(AuditLogEntity, {
        tenantId: persistedTenant.id,
        userId: persistedUser.id,
        action: 'MERCHANT_ONBOARDED',
        resourceType: 'tenant',
        resourceId: persistedTenant.id,
        details: {
          storeName: persistedTenant.displayName,
          businessType: persistedTenant.businessType,
          stateCode: persistedBranch.stateCode,
          seeded: dto.seedSampleCatalog === true,
        },
      });
      await manager.save(auditLog);

      return persistedUser;
    });

    return this.generateTokens(savedUser);
  }

  private async seedIndustryCatalog(
    manager: EntityManager,
    tenantId: string,
    branchId: string,
    businessType: BusinessType,
  ): Promise<void> {
    const items = this.getStarterItems(businessType);
    if (!items || items.length === 0) return;

    // Distinct categories map
    const categoryMap = new Map<string, string>(); // categoryCode -> categoryId
    for (const item of items) {
      if (!categoryMap.has(item.categoryCode)) {
        const cat = manager.create(CategoryEntity, {
          tenantId,
          code: item.categoryCode,
          name: item.categoryName,
          isActive: true,
        });
        const savedCat = await manager.save(cat);
        categoryMap.set(item.categoryCode, savedCat.id);
      }
    }

    // Insert Products and Initial Stock
    for (const item of items) {
      const categoryId = categoryMap.get(item.categoryCode) || null;
      const product = manager.create(ProductEntity, {
        tenantId,
        categoryId,
        name: item.name,
        sku: item.sku,
        barcodePrimary: item.barcode,
        purchaseCost: item.cost,
        sellingPrice: item.price,
        mrp: item.mrp,
        hsnCode: item.hsn,
        gstRatePercent: item.gstRate,
        productType: ProductType.STOCK,
        trackInventory: true,
        allowFractionalQuantity: false,
        isActive: true,
      });
      const savedProduct = await manager.save(product);

      const stockBalance = manager.create(StockBalanceEntity, {
        tenantId,
        branchId,
        productId: savedProduct.id,
        quantityOnHand: '50.000',
        lowStockThreshold: '10.000',
      });
      await manager.save(stockBalance);
    }
  }

  private getStarterItems(businessType: BusinessType): StarterSeedItem[] {
    switch (businessType) {
      case BusinessType.RESTAURANT:
        return [
          {
            name: 'Special Masala Chai',
            sku: 'RES-TEA-MASALA',
            categoryCode: 'BEV',
            categoryName: 'Beverages',
            barcode: null,
            cost: '8.00',
            price: '25.00',
            mrp: '25.00',
            hsn: '2101',
            gstRate: '5.00',
          },
          {
            name: 'South Indian Filter Coffee',
            sku: 'RES-COFFEE-FILTER',
            categoryCode: 'BEV',
            categoryName: 'Beverages',
            barcode: null,
            cost: '12.00',
            price: '35.00',
            mrp: '35.00',
            hsn: '2101',
            gstRate: '5.00',
          },
          {
            name: 'Crispy Veg Burger',
            sku: 'RES-BURGER-VEG',
            categoryCode: 'QUICK',
            categoryName: 'Quick Bites',
            barcode: null,
            cost: '45.00',
            price: '99.00',
            mrp: '99.00',
            hsn: '2106',
            gstRate: '5.00',
          },
          {
            name: 'Classic Margherita Pizza 8-inch',
            sku: 'RES-PIZZA-MARG',
            categoryCode: 'PIZZA',
            categoryName: 'Pizzas',
            barcode: null,
            cost: '85.00',
            price: '199.00',
            mrp: '199.00',
            hsn: '2106',
            gstRate: '5.00',
          },
          {
            name: 'Paneer Butter Masala (Full)',
            sku: 'RES-CURRY-PANEER',
            categoryCode: 'MAIN',
            categoryName: 'Main Course',
            barcode: null,
            cost: '110.00',
            price: '260.00',
            mrp: '260.00',
            hsn: '2106',
            gstRate: '5.00',
          },
          {
            name: 'Butter Garlic Naan',
            sku: 'RES-BREAD-NAAN',
            categoryCode: 'BREAD',
            categoryName: 'Breads',
            barcode: null,
            cost: '15.00',
            price: '45.00',
            mrp: '45.00',
            hsn: '1905',
            gstRate: '5.00',
          },
          {
            name: 'Veg Dum Biryani with Raita',
            sku: 'RES-BIRYANI-VEG',
            categoryCode: 'MAIN',
            categoryName: 'Main Course',
            barcode: null,
            cost: '90.00',
            price: '220.00',
            mrp: '220.00',
            hsn: '2106',
            gstRate: '5.00',
          },
          {
            name: 'Packaged Mineral Water 1L',
            sku: 'RES-WATER-1L',
            categoryCode: 'BEV',
            categoryName: 'Beverages',
            barcode: '890103000099',
            cost: '12.00',
            price: '20.00',
            mrp: '20.00',
            hsn: '2201',
            gstRate: '18.00',
          },
        ];
      case BusinessType.PHARMACY:
        return [
          {
            name: 'Dolo 650mg Tablets (Strip of 15)',
            sku: 'PHARM-DOLO-650',
            categoryCode: 'ANALGESIC',
            categoryName: 'Analgesics & Pain',
            barcode: '890203000001',
            cost: '24.00',
            price: '34.00',
            mrp: '34.00',
            hsn: '3004',
            gstRate: '12.00',
          },
          {
            name: 'Cetirizine 10mg Tablets (Strip of 10)',
            sku: 'PHARM-CET-10',
            categoryCode: 'ALLERGY',
            categoryName: 'Allergy & Cold',
            barcode: '890203000002',
            cost: '12.00',
            price: '20.00',
            mrp: '22.00',
            hsn: '3004',
            gstRate: '12.00',
          },
          {
            name: 'Benadryl Cough Syrup 100ml',
            sku: 'PHARM-BEN-100',
            categoryCode: 'COUGH',
            categoryName: 'Cough Syrups',
            barcode: '890203000003',
            cost: '95.00',
            price: '125.00',
            mrp: '130.00',
            hsn: '3004',
            gstRate: '12.00',
          },
          {
            name: 'Limcee Vitamin C 500mg (Strip of 15)',
            sku: 'PHARM-LIM-500',
            categoryCode: 'VITAMINS',
            categoryName: 'Vitamins & Supplements',
            barcode: '890203000004',
            cost: '18.00',
            price: '26.00',
            mrp: '28.00',
            hsn: '3004',
            gstRate: '12.00',
          },
          {
            name: 'Digital Clinical Thermometer',
            sku: 'PHARM-THERMO-DIG',
            categoryCode: 'DEVICES',
            categoryName: 'Medical Devices',
            barcode: '890203000005',
            cost: '130.00',
            price: '199.00',
            mrp: '220.00',
            hsn: '9025',
            gstRate: '18.00',
          },
          {
            name: 'Hansaplast Medicated Bandage (Pack of 10)',
            sku: 'PHARM-HANS-10',
            categoryCode: 'FIRSTAID',
            categoryName: 'First Aid & Wound Care',
            barcode: '890203000006',
            cost: '30.00',
            price: '40.00',
            mrp: '40.00',
            hsn: '3005',
            gstRate: '12.00',
          },
        ];
      case BusinessType.GROCERY:
      default:
        return [
          {
            name: 'Aashirvaad Shudh Chakki Atta 5kg',
            sku: 'GRO-ATTA-5KG',
            categoryCode: 'GRAINS',
            categoryName: 'Flours & Grains',
            barcode: '890103000001',
            cost: '210.00',
            price: '245.00',
            mrp: '260.00',
            hsn: '1101',
            gstRate: '5.00',
          },
          {
            name: 'Fortune Sunlite Refined Sunflower Oil 1L',
            sku: 'GRO-OIL-1L',
            categoryCode: 'OILS',
            categoryName: 'Oils & Ghee',
            barcode: '890103000002',
            cost: '140.00',
            price: '165.00',
            mrp: '175.00',
            hsn: '1512',
            gstRate: '5.00',
          },
          {
            name: 'India Gate Basmati Rice Feast 1kg',
            sku: 'GRO-RICE-1KG',
            categoryCode: 'GRAINS',
            categoryName: 'Flours & Grains',
            barcode: '890103000003',
            cost: '95.00',
            price: '115.00',
            mrp: '125.00',
            hsn: '1006',
            gstRate: '5.00',
          },
          {
            name: 'Tata Salt Vacuum Evaporated 1kg',
            sku: 'GRO-SALT-1KG',
            categoryCode: 'SPICES',
            categoryName: 'Spices & Essentials',
            barcode: '890103000004',
            cost: '22.00',
            price: '28.00',
            mrp: '28.00',
            hsn: '2501',
            gstRate: '0.00',
          },
          {
            name: 'Madhur Pure & Hygienic Sugar 1kg',
            sku: 'GRO-SUGAR-1KG',
            categoryCode: 'SPICES',
            categoryName: 'Spices & Essentials',
            barcode: '890103000005',
            cost: '42.00',
            price: '48.00',
            mrp: '52.00',
            hsn: '1701',
            gstRate: '5.00',
          },
          {
            name: 'Tata Sampann Toor Dal 1kg',
            sku: 'GRO-DAL-1KG',
            categoryCode: 'GRAINS',
            categoryName: 'Flours & Grains',
            barcode: '890103000006',
            cost: '145.00',
            price: '168.00',
            mrp: '180.00',
            hsn: '0713',
            gstRate: '0.00',
          },
          {
            name: 'Maggi 2-Minute Masala Noodles 70g',
            sku: 'GRO-MAGGI-70G',
            categoryCode: 'SNACKS',
            categoryName: 'Snacks & Packaged Food',
            barcode: '890103000007',
            cost: '11.50',
            price: '14.00',
            mrp: '14.00',
            hsn: '1902',
            gstRate: '12.00',
          },
          {
            name: 'Dettol Original Bathing Soap 75g',
            sku: 'GRO-DETTOL-75G',
            categoryCode: 'PERSONAL',
            categoryName: 'Personal Care',
            barcode: '890103000008',
            cost: '32.00',
            price: '38.00',
            mrp: '40.00',
            hsn: '3401',
            gstRate: '18.00',
          },
          {
            name: 'Amul Pasteurised Butter 100g',
            sku: 'GRO-BUTTER-100G',
            categoryCode: 'DAIRY',
            categoryName: 'Dairy & Bakery',
            barcode: '890103000009',
            cost: '50.00',
            price: '58.00',
            mrp: '60.00',
            hsn: '0405',
            gstRate: '12.00',
          },
          {
            name: 'Amul Taaza Homogenised Milk 500ml',
            sku: 'GRO-MILK-500ML',
            categoryCode: 'DAIRY',
            categoryName: 'Dairy & Bakery',
            barcode: '890103000010',
            cost: '26.00',
            price: '30.00',
            mrp: '30.00',
            hsn: '0401',
            gstRate: '0.00',
          },
        ];
    }
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone ?? null,
      status: UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);
    return this.generateTokens(savedUser);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateTokens(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'changeme_refresh_secret_dev_only_min_32_chars_x',
        ),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    const matches = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshTokenHash: null });
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['memberships', 'memberships.tenant'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      isSuperAdmin: !!user.isSuperAdmin,
      memberships: (user.memberships || []).map((m) => {
        const rawRoles = m.roles && m.roles.length > 0 ? m.roles : [m.role as Role];
        const roles = rawRoles.map((r) => r as Role);
        const isOwner = roles.includes(Role.OWNER) || m.role === Role.OWNER;
        const permissions = getPermissionsForRoles(roles);
        const tenantBusinessType = m.tenant?.businessType ?? BusinessType.GROCERY;
        const tenantSettings = (m.tenant?.settings as any) || {};
        const enabledModules =
          tenantSettings?.enabledModules ??
          (DEFAULT_MODULES_BY_BUSINESS[tenantBusinessType] ||
            DEFAULT_MODULES_BY_BUSINESS[BusinessType.GROCERY]);

        return {
          tenantId: m.tenantId,
          tenantName: m.tenant?.displayName ?? '',
          businessType: tenantBusinessType,
          enabledModules,
          branchId: m.branchId ?? null,
          role: m.role,
          roles,
          status: m.status,
          permissions,
          isOwner,
        };
      }),
    };
  }

  private async generateTokens(user: UserEntity): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isSuperAdmin: !!user.isSuperAdmin,
    };
    const accessSecret = this.configService.get<string>(
      'JWT_SECRET',
      'changeme_jwt_secret_dev_only_min_32_chars_xxxx',
    );
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'changeme_refresh_secret_dev_only_min_32_chars_x',
    );
    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '24h');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.userRepository.update(user.id, { refreshTokenHash });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isSuperAdmin: !!user.isSuperAdmin,
      },
    };
  }
}
