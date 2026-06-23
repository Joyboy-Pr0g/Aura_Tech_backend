import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, Index,
} from 'typeorm';
import { Order } from './Order';
import { User } from './User';

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  @Index()
  order_id: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'varchar', nullable: true, name: 'previous_status' })
  previous_status: string | null;

  @Column({ type: 'varchar', name: 'new_status' })
  new_status: string;

  @Column({ type: 'uuid', nullable: true, name: 'changed_by_id' })
  changed_by_id: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by_id' })
  changed_by: User | null;

  @Column({ type: 'varchar', nullable: true, name: 'change_reason' })
  change_reason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  created_at: Date;
}
