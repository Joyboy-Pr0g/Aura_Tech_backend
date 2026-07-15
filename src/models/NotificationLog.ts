import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Notification } from './Notification';

export type NotificationChannel = 'email' | 'firebase';

export type NotificationLogStatus = 'pending' | 'sent' | 'failed';

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'notification_id' })
  @Index()
  notification_id: string;

  @ManyToOne(() => Notification, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  @Column({ type: 'varchar' })
  @Index()
  channel: NotificationChannel;

  @Column({ type: 'varchar' })
  @Index()
  status: NotificationLogStatus;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  error_message: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'sent_at' })
  sent_at: Date | null;

  @Column({ type: 'timestamp', name: 'attempted_at', default: () => 'now()' })
  attempted_at: Date;
}
