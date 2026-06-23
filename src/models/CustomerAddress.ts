import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index,
} from 'typeorm';
import { User } from './User';

export type AddressType = 'shipping' | 'billing' | 'both';

@Entity('customer_addresses')
export class CustomerAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customer_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'varchar', name: 'full_name' })
  full_name: string;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ type: 'varchar' })
  city: string;

  @Column({ type: 'varchar' })
  governorate: string;

  @Column({ type: 'varchar', nullable: true })
  district: string | null;

  @Column({ type: 'text', name: 'street_address' })
  street_address: string;

  @Column({ type: 'varchar', nullable: true, name: 'postal_code' })
  postal_code: string | null;

  @Column({ type: 'varchar', default: 'both' })
  type: AddressType;

  @Column({ type: 'boolean', default: false, name: 'is_default' })
  is_default: boolean;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
