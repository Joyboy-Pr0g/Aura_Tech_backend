import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './User';

@Entity('site_visits')
export class SiteVisit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true, name: 'visitor_id' })
  visitor_id: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'customer_id' })
  @Index()
  customer_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: User | null;

  @Column({ type: 'varchar' })
  path: string;

  @Column({ type: 'varchar', nullable: true })
  referrer: string | null;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  user_agent: string | null;

  @Column({ type: 'timestamp', name: 'visited_at', default: () => 'now()' })
  @Index()
  visited_at: Date;
}
