import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Category } from './Category';
import { User } from './User';
import { ProductVariant } from './ProductVariant';

export interface ProductImage {
  url: string;
  public_id: string;
  is_primary: boolean;
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'category_id' })
  @Index()
  category_id: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  brand: string | null;

  @Column({ type: 'jsonb', default: '{}' })
  features: Record<string, any>;

  @Column({ type: 'integer', default: 0, name: 'stock_quantity' })
  stock_quantity: number;

  @Column({ type: 'integer', default: 0, name: 'reserved_quantity' })
  reserved_quantity: number;

  @Column({ type: 'jsonb', nullable: true })
  images: ProductImage[] | null;

  @Column({ type: 'uuid', nullable: true, name: 'created_by_id' })
  created_by_id: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  created_by: User | null;

  @OneToMany(() => ProductVariant, (v) => v.product)
  variants: ProductVariant[];

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
