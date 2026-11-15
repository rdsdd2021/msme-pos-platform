import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { ProductType, FoodDietaryType, KitchenStation } from '@pos/shared-types';

@Entity('products')
@Unique(['tenantId', 'sku'])
@Index(['tenantId', 'barcodePrimary'])
@Index(['tenantId', 'categoryId'])
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    name: 'product_type',
    type: 'enum',
    enum: ProductType,
    default: ProductType.STOCK,
  })
  productType!: ProductType;

  @Column({ name: 'base_unit_id', type: 'uuid', nullable: true })
  baseUnitId!: string | null;

  @Column({ type: 'varchar', length: 64 })
  sku!: string;

  @Column({ name: 'barcode_primary', type: 'varchar', length: 128, nullable: true })
  barcodePrimary!: string | null;

  @Column({ name: 'purchase_cost', type: 'numeric', precision: 14, scale: 2, default: 0 })
  purchaseCost!: string;

  @Column({ name: 'selling_price', type: 'numeric', precision: 14, scale: 2, default: 0 })
  sellingPrice!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  mrp!: string;

  @Column({ name: 'tax_category_id', type: 'uuid', nullable: true })
  taxCategoryId!: string | null;

  @Column({ name: 'hsn_code', type: 'varchar', length: 16, nullable: true })
  hsnCode!: string | null;

  @Column({ name: 'gst_rate_percent', type: 'numeric', precision: 5, scale: 2, default: 0 })
  gstRatePercent!: string;

  @Column({ name: 'package_size', type: 'varchar', length: 64, nullable: true })
  packageSize!: string | null;

  @Column({ name: 'food_type', type: 'varchar', length: 32, nullable: true })
  foodType!: FoodDietaryType | null;

  @Column({ name: 'kitchen_station', type: 'varchar', length: 64, nullable: true })
  kitchenStation!: KitchenStation | null;

  @Column({ name: 'prep_time_minutes', type: 'integer', nullable: true })
  prepTimeMinutes!: number | null;

  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable!: boolean;

  @Column({ name: 'is_made_to_order', type: 'boolean', default: false })
  isMadeToOrder!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  variants!: Array<{ name: string; price: string }> | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'track_inventory', type: 'boolean', default: true })
  trackInventory!: boolean;

  @Column({ name: 'allow_fractional_quantity', type: 'boolean', default: false })
  allowFractionalQuantity!: boolean;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
