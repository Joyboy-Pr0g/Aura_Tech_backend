import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('admin_action_logs')
export class AdminActionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'admin_id' })
  @Index()
  admin_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @Column({ type: 'varchar' })
  @Index()
  action: string;

  @Column({ type: 'varchar', name: 'entity_type' })
  entity_type: string;

  @Column({ type: 'uuid', name: 'entity_id' })
  @Index()
  entity_id: string;

  @Column({ type: 'jsonb', nullable: true, name: 'changes_json' })
  changes_json: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'ip_address' })
  ip_address: string | null;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  user_agent: string | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  created_at: Date;
}
