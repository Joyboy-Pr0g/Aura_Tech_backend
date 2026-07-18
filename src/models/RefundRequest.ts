import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Order } from './Order';
import { User } from './User';

export type RefundRequestStatus = 'pending' | 'approved' | 'rejected';

@Entity('refund_requests')
export class RefundRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id', unique: true })
  @Index()
  order_id: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customer_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'varchar', nullable: true, name: 'image_url' })
  image_url: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'image_public_id' })
  image_public_id: string | null;

  @Column({ type: 'varchar', default: 'pending' })
  @Index()
  status: RefundRequestStatus;

  @Column({ type: 'uuid', nullable: true, name: 'processed_by_admin_id' })
  processed_by_admin_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'processed_by_admin_id' })
  processed_by_admin: User | null;

  @Column({ type: 'timestamp', nullable: true, name: 'processed_at' })
  processed_at: Date | null;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejection_reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
