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
import { User } from './User';

export type SuspiciousReportStatus = 'open' | 'dismissed' | 'blocked' | 'deleted';

export type SuspiciousReportCategory =
  | 'profile_churn'
  | 'address_churn'
  | 'order_churn'
  | 'mixed';

export interface SuspiciousActivitySignals {
  profile_updates_24h?: number;
  password_changes_24h?: number;
  address_changes_24h?: number;
  orders_placed_24h?: number;
  orders_cancelled_7d?: number;
  refund_requests_7d?: number;
}

@Entity('suspicious_user_reports')
export class SuspiciousUserReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 32 })
  category: SuspiciousReportCategory;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  @Index()
  status: SuspiciousReportStatus;

  @Column({ type: 'jsonb', default: {} })
  signals: SuspiciousActivitySignals;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'timestamp', name: 'last_detected_at' })
  last_detected_at: Date;

  @Column({ type: 'uuid', nullable: true, name: 'reviewed_by_admin_id' })
  reviewed_by_admin_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by_admin_id' })
  reviewed_by_admin: User | null;

  @Column({ type: 'timestamp', nullable: true, name: 'reviewed_at' })
  reviewed_at: Date | null;

  @Column({ type: 'text', nullable: true, name: 'admin_note' })
  admin_note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
