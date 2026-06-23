import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Product } from './Product';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  @Index()
  product_id: string;

  @ManyToOne(() => Product, (p) => p.variants)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'varchar', unique: true })
  @Index()
  sku: string;

  @Column({ type: 'varchar', nullable: true })
  size: string | null;

  @Column({ type: 'varchar', nullable: true })
  color: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number | null;

  @Column({ type: 'integer', default: 0, name: 'stock_quantity' })
  stock_quantity: number;

  @Column({ type: 'integer', default: 0, name: 'reserved_quantity' })
  reserved_quantity: number;

  @Column({ type: 'jsonb', nullable: true })
  images: Array<{ url: string; public_id: string }> | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
