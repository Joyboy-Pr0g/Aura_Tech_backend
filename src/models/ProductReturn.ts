import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Order } from './Order';
import { OrderItem } from './OrderItem';
import { User } from './User';

export type ReturnReason =
  | 'product_not_working'
  | 'damaged'
  | 'wrong_item'
  | 'changed_mind';

export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'in_transit'
  | 'received'
  | 'refunded'
  | 'rejected';

@Entity('returns')
export class ProductReturn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, name: 'return_number' })
  return_number: string;

  @Column({ type: 'uuid', name: 'order_id' })
  @Index()
  order_id: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'uuid', name: 'order_item_id' })
  order_item_id: string;

  @ManyToOne(() => OrderItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_item_id' })
  order_item: OrderItem;

  @Column({ type: 'varchar', name: 'return_reason' })
  return_reason: ReturnReason;

  @Column({ type: 'varchar', default: 'requested' })
  @Index()
  status: ReturnStatus;

  @Column({ type: 'uuid', name: 'requested_by_customer_id' })
  requested_by_customer_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requested_by_customer_id' })
  requested_by_customer: User;

  @Column({ type: 'timestamp', name: 'requested_at', default: () => 'now()' })
  @Index()
  requested_at: Date;

  @Column({ type: 'uuid', nullable: true, name: 'approved_by_admin_id' })
  approved_by_admin_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by_admin_id' })
  approved_by_admin: User | null;

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  @Index()
  approved_at: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'received_at' })
  received_at: Date | null;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejection_reason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
