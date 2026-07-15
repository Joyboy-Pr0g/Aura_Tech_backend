import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { ProductReturn } from './ProductReturn';
import { User } from './User';

export type RefundMethod = 'bank_transfer' | 'original_payment';

export type RefundStatus = 'pending' | 'processed' | 'failed';

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'return_id' })
  @Index()
  return_id: string;

  @ManyToOne(() => ProductReturn, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'return_id' })
  return_request: ProductReturn;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', nullable: true, name: 'refund_method' })
  refund_method: RefundMethod | null;

  @Column({ type: 'varchar', default: 'pending' })
  @Index()
  status: RefundStatus;

  @Column({ type: 'uuid', nullable: true, name: 'processed_by_admin_id' })
  processed_by_admin_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'processed_by_admin_id' })
  processed_by_admin: User | null;

  @Column({ type: 'timestamp', nullable: true, name: 'processed_at' })
  processed_at: Date | null;

  @Column({ type: 'varchar', nullable: true, name: 'transaction_reference' })
  transaction_reference: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
