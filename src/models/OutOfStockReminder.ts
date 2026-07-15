import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, Index,
} from 'typeorm';
import { Product } from './Product';
import { ProductVariant } from './ProductVariant';
import { User } from './User';

export type OutOfStockReminderStatus = 'active' | 'notified' | 'cancelled';

@Entity('out_of_stock_reminders')
export class OutOfStockReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  @Index()
  product_id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'uuid', nullable: true, name: 'product_variant_id' })
  product_variant_id: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_variant_id' })
  product_variant: ProductVariant | null;

  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customer_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ type: 'varchar', default: 'active' })
  @Index()
  status: OutOfStockReminderStatus;

  @Column({ type: 'timestamp', name: 'requested_at', default: () => 'now()' })
  requested_at: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'notified_at' })
  notified_at: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
  cancelled_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
