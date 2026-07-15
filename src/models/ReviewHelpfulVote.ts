import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ProductReview } from './ProductReview';
import { User } from './User';

@Entity('review_helpful_votes')
export class ReviewHelpfulVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'review_id' })
  review_id: string;

  @ManyToOne(() => ProductReview, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: ProductReview;

  @Column({ type: 'uuid', name: 'customer_id' })
  customer_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ type: 'boolean', name: 'is_helpful' })
  is_helpful: boolean;
}
