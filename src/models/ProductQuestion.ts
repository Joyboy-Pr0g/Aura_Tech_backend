import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Product } from './Product';
import { User } from './User';

@Entity('product_questions')
export class ProductQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  @Index()
  product_id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customer_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'integer', default: 0, name: 'helpful_count' })
  helpful_count: number;

  @Column({ type: 'boolean', default: true, name: 'is_published' })
  is_published: boolean;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
