import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { User } from './User';
import { Order } from './Order';
import { Product } from './Product';

export type NotificationType =
  | 'order_confirmation'
  | 'payment_approved'
  | 'shipment_ready'
  | 'delivery_confirmation'
  | 'product_available';

export type NotificationStatus = 'pending' | 'sent' | 'failed';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customer_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ type: 'varchar', name: 'notification_type' })
  @Index()
  notification_type: NotificationType;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'uuid', nullable: true, name: 'related_order_id' })
  related_order_id: string | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'related_order_id' })
  related_order: Order | null;

  @Column({ type: 'uuid', nullable: true, name: 'related_product_id' })
  related_product_id: string | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'related_product_id' })
  related_product: Product | null;

  @Column({ type: 'varchar', default: 'pending' })
  @Index()
  status: NotificationStatus;

  @Column({ type: 'varchar', nullable: true })
  channels: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  read_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
