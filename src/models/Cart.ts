import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn,
  OneToMany, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { User } from './User';
import { CartItem } from './CartItem';

export type CartStatus = 'active' | 'abandoned' | 'converted_to_order';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'customer_id', unique: true })
  @Index()
  customer_id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ type: 'varchar', default: 'active' })
  @Index()
  status: CartStatus;

  @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
  expires_at: Date | null;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items: CartItem[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
