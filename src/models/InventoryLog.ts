import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Product } from './Product';
import { ProductVariant } from './ProductVariant';
import { User } from './User';

export type InventoryReason =
  | 'order_placed'
  | 'order_cancelled'
  | 'order_delivered'
  | 'restock'
  | 'return_received'
  | 'adjustment';

@Entity('inventory_logs')
export class InventoryLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  @Index()
  product_id: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'uuid', nullable: true, name: 'variant_id' })
  variant_id: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant | null;

  @Column({ type: 'integer', name: 'quantity_change' })
  quantity_change: number;

  @Column({ type: 'varchar' })
  @Index()
  reason: InventoryReason;

  @Column({ type: 'uuid', nullable: true, name: 'reference_id' })
  reference_id: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'changed_by_id' })
  changed_by_id: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by_id' })
  changed_by: User | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  created_at: Date;
}
