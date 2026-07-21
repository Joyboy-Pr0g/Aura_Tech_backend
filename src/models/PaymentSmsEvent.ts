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

export type SmsParseMethod = 'regex' | 'gemini' | 'failed';
export type SmsParseStatus = 'pending' | 'parsed' | 'failed';

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

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'parsed_provider' })
  parsed_provider: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'parsed_amount' })
  parsed_amount: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'parsed_currency' })
  parsed_currency: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true, name: 'parsed_account_number' })
  parsed_account_number: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'parsed_balance' })
  parsed_balance: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'parsed_sender' })
  parsed_sender: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'parse_method' })
  parse_method: SmsParseMethod | null;

  @Column({ type: 'varchar', length: 20, default: 'pending', name: 'parse_status' })
  parse_status: SmsParseStatus;

  @Column({ type: 'uuid', nullable: true, name: 'matched_order_id' })
  matched_order_id: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
