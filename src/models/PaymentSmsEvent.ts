import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { PaymentDevice } from './PaymentDevice';

@Entity('payment_sms_events')
export class PaymentSmsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'device_id' })
  @Index()
  device_id: string;

  @ManyToOne(() => PaymentDevice, (device) => device.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: PaymentDevice;

  @Column({ type: 'varchar' })
  provider: string;

  @Column({ type: 'varchar', name: 'sender_address' })
  sender_address: string;

  @Column({ type: 'text', name: 'raw_message' })
  raw_message: string;

  @Column({ type: 'timestamp', name: 'received_at' })
  @Index()
  received_at: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
