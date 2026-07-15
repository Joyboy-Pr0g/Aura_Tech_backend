import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Product } from './Product';

@Entity('trending_products')
export class TrendingProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  product_id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'integer', nullable: true, name: 'view_count' })
  view_count: number | null;

  @Column({ type: 'integer', nullable: true, name: 'purchase_count' })
  purchase_count: number | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true, name: 'rating_average' })
  rating_average: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, name: 'trend_score' })
  @Index()
  trend_score: number | null;

  @Column({ type: 'timestamp', name: 'calculated_at', default: () => 'now()' })
  @Index()
  calculated_at: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'valid_until' })
  valid_until: Date | null;
}
