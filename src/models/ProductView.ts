import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Product } from './Product';
import { User } from './User';

@Entity('product_views')
export class ProductView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  @Index()
  product_id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'uuid', nullable: true, name: 'customer_id' })
  @Index()
  customer_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: User | null;

  @Column({ type: 'timestamp', name: 'viewed_at', default: () => 'now()' })
  @Index()
  viewed_at: Date;
}
