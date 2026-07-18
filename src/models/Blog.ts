import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 220, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', nullable: true, name: 'cover_image_public_id' })
  cover_image_public_id: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'cover_image_url' })
  cover_image_url: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'meta_title' })
  meta_title: string | null;

  @Column({ type: 'text', nullable: true, name: 'meta_description' })
  meta_description: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_published' })
  @Index()
  is_published: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'published_at' })
  @Index()
  published_at: Date | null;

  @Column({ type: 'uuid', nullable: true, name: 'author_id' })
  author_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_id' })
  author: User | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
