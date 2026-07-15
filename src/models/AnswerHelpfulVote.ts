import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { QuestionAnswer } from './QuestionAnswer';
import { User } from './User';

@Entity('answer_helpful_votes')
export class AnswerHelpfulVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'answer_id' })
  answer_id: string;

  @ManyToOne(() => QuestionAnswer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'answer_id' })
  answer: QuestionAnswer;

  @Column({ type: 'uuid', name: 'customer_id' })
  customer_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ type: 'boolean', name: 'is_helpful' })
  is_helpful: boolean;
}
