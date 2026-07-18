import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, Index,
} from 'typeorm';
import { Order } from './Order';
import { User } from './User';
import { PaymentMethod } from './PaymentMethod';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'manual_approved';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id', unique: true })
  @Index()
  order_id: string;

  @OneToOne(() => Order, (o) => o.payment)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'uuid', nullable: true, name: 'payment_method_id' })
  payment_method_id: string | null;

  @ManyToOne(() => PaymentMethod, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payment_method_id' })
  payment_method: PaymentMethod | null;

  @Column({ type: 'varchar', nullable: true, name: 'receipt_document_url' })
  receipt_document_url: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'receipt_public_id' })
  receipt_public_id: string | null;

  @Column({ type: 'varchar', default: 'pending' })
  @Index()
  status: PaymentStatus;

  @Column({ type: 'uuid', name: 'submitted_by_customer_id' })
  submitted_by_customer_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submitted_by_customer_id' })
  submitted_by_customer: User;

  @Column({ type: 'timestamp', name: 'submitted_at' })
  @Index()
  submitted_at: Date;

  @Column({ type: 'uuid', nullable: true, name: 'approved_by_admin_id' })
  approved_by_admin_id: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by_admin_id' })
  approved_by_admin: User | null;

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  @Index()
  approved_at: Date | null;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejection_reason: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'rejected_at' })
  rejected_at: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
