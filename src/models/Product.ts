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
import { Wishlist } from './Wishlist';
import { ProductReview } from './ProductReview';
import { ProductQuestion } from './ProductQuestion';

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

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'uuid', nullable: true, name: 'sub_category_id' })
  @Index()
  sub_category_id: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sub_category_id' })
  sub_category: Category | null;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'cost_price' })
  cost_price: number | null;

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

  @Column({ type: 'uuid', nullable: true, name: 'updated_by_id' })
  updated_by_id: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  created_by: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by_id' })
  updated_by: User | null;

  @OneToMany(() => ProductVariant, (v) => v.product)
  variants: ProductVariant[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.product)
  wishlists: Wishlist[];

  @OneToMany(() => ProductReview, (review) => review.product)
  reviews: ProductReview[];

  @OneToMany(() => ProductQuestion, (question) => question.product)
  questions: ProductQuestion[];

  /** Populated in list queries when a customer id is provided — not a DB column */
  is_wishlisted?: boolean;

  /** Populated on slug detail queries — not DB columns */
  average_rating?: number;
  rating_count?: number;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
