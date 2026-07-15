import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { ProductQuestion } from './ProductQuestion';
import { User } from './User';

@Entity('question_answers')
export class QuestionAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'question_id' })
  @Index()
  question_id: string;

  @ManyToOne(() => ProductQuestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: ProductQuestion;

  @Column({ type: 'uuid', name: 'answered_by_id' })
  @Index()
  answered_by_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'answered_by_id' })
  answered_by: User;

  @Column({ type: 'text' })
  answer: string;

  @Column({ type: 'integer', default: 0, name: 'helpful_count' })
  helpful_count: number;

  @Column({ type: 'boolean', default: false, name: 'is_seller_answer' })
  is_seller_answer: boolean;

  @Column({ type: 'varchar', default: 'pending', name: 'moderation_status' })
  moderation_status: string;

  @Column({ type: 'boolean', default: true, name: 'is_published' })
  is_published: boolean;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
