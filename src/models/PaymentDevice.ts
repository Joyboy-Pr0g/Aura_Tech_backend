import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { PaymentSmsEvent } from './PaymentSmsEvent';

@Entity('payment_devices')
export class PaymentDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'device_uuid', unique: true })
  @Index()
  device_uuid: string;

  @Column({ type: 'varchar', nullable: true })
  label: string | null;

  @Column({ type: 'varchar', name: 'api_key_hash' })
  api_key_hash: string;

  @Column({ type: 'boolean', default: true })
  @Index()
  enabled: boolean;

  @Column({ type: 'timestamp', name: 'last_seen', nullable: true })
  last_seen: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => PaymentSmsEvent, (event) => event.device)
  events: PaymentSmsEvent[];
}
