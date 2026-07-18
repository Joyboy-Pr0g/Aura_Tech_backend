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

export type ExpenseType = 'expense' | 'refund';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  @Index()
  type: ExpenseType;

  @Column({ type: 'uuid', nullable: true, name: 'order_id' })
  @Index()
  order_id: string | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order: Order | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', name: 'receipt_url' })
  receipt_url: string;

  @Column({ type: 'varchar', nullable: true, name: 'receipt_public_id' })
  receipt_public_id: string | null;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'uuid', name: 'created_by_admin_id' })
  created_by_admin_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_admin_id' })
  created_by_admin: User;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
