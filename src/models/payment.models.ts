// src/database/entities/payment.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string; // Ideally a ManyToOne relation to your OrderEntity

  @Column({ unique: true })
  stripePaymentIntentId: string;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ type: 'integer' }) // Store in cents (e.g., 1000 for $10)
  amount: number;

  @Column()
  currency: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'succeeded', 'failed', 'refunded', 'requires_action'],
    default: 'pending',
  })
  status: string;

  @Column({ nullable: true })
  paymentMethodType: string; // e.g., 'card', 'ideal', 'bank_transfer'

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  receiptUrl: string; // Useful for the frontend to show the user

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
