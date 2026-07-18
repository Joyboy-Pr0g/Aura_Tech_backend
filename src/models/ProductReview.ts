import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, Index,
} from 'typeorm';
import { Product } from './Product';
import { OrderItem } from './OrderItem';
import { User } from './User';
import { ProductRating } from './ProductRating';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

@Entity('product_reviews')
export class ProductReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  @Index()
  product_id: string;

  @ManyToOne(() => Product, (product) => product.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'uuid', unique: true, name: 'order_item_id' })
  order_item_id: string;

  @ManyToOne(() => OrderItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_item_id' })
  order_item: OrderItem;

  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customer_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ type: 'uuid', nullable: true, name: 'rating_id' })
  rating_id: string | null;

  @ManyToOne(() => ProductRating, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'rating_id' })
  rating: ProductRating | null;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'integer', default: 0, name: 'helpful_count' })
  helpful_count: number;

  @Column({ type: 'varchar', default: 'pending', name: 'moderation_status' })
  @Index()
  moderation_status: ModerationStatus;

  @Column({ type: 'text', nullable: true, name: 'moderation_notes' })
  moderation_notes: string | null;

  @Column({ type: 'text', nullable: true, name: 'rejected_reason' })
  rejected_reason: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_verified_purchase' })
  is_verified_purchase: boolean;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
