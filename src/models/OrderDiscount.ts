import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Order } from './Order';
import { Coupon } from './Coupon';
import { User } from './User';

export type OrderDiscountType = 'coupon' | 'manual_adjustment' | 'promotional';

@Entity('order_discounts')
export class OrderDiscount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  @Index()
  order_id: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'uuid', nullable: true, name: 'coupon_id' })
  @Index()
  coupon_id: string | null;

  @ManyToOne(() => Coupon, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon | null;

  @Column({ type: 'varchar', name: 'discount_type' })
  discount_type: OrderDiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount_amount' })
  discount_amount: number;

  @Column({ type: 'uuid', nullable: true, name: 'applied_by_id' })
  applied_by_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'applied_by_id' })
  applied_by: User | null;

  @Column({ type: 'timestamp', name: 'applied_at', default: () => 'now()' })
  applied_at: Date;
}
