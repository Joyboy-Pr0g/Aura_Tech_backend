import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  @Index()
  code: string;

  @Column({ type: 'varchar', name: 'discount_type' })
  discount_type: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount_value' })
  discount_value: number;

  @Column({ type: 'integer', nullable: true, name: 'max_uses' })
  max_uses: number | null;

  @Column({ type: 'integer', default: 0, name: 'current_uses' })
  current_uses: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'min_purchase_amount' })
  min_purchase_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'max_discount_amount' })
  max_discount_amount: number | null;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  @Index()
  expires_at: Date | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
