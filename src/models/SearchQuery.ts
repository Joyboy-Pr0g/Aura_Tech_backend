import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, Index,
} from 'typeorm';
import { User } from './User';

@Entity('search_queries')
export class SearchQuery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'customer_id' })
  @Index()
  customer_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: User | null;

  @Column({ type: 'varchar' })
  @Index()
  query: string;

  @Column({ type: 'integer', nullable: true, name: 'results_count' })
  results_count: number | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  created_at: Date;
}
