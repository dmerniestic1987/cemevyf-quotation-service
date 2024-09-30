import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity, Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CurrencyEnum } from '../commons/types/currency.enum';
import { HealthOrderItem } from './health-order-item.entity';
import { Client } from '../clients/client.entity';
import { HealthOrderStatus } from './types/health-order-status';

@Entity({ name: 'health_orders' })
export class HealthOrder {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: number;

  @Index({unique: false})
  @Column('enum', { name: 'status', enum: HealthOrderStatus, default: HealthOrderStatus.QUOTED })
  public status: HealthOrderStatus;

  @ManyToOne(() => Client, client => client.healthOrders)
  @JoinColumn({ name: 'client_id', referencedColumnName: 'id' })
  client: Client;

  @Column('decimal', { precision: 14, scale: 2, name: 'total_amount' })
  public totalAmount: number;

  @Column('enum', { name: 'currency', enum: CurrencyEnum, default: CurrencyEnum.ARS })
  public currency: CurrencyEnum;

  @OneToMany(() => HealthOrderItem, item => item.quotation)
  public healthOrderItems: HealthOrderItem[];

  @Column({ name: 'executed_at', type: 'timestamp' })
  public executedAt: Date;

  @Column({ name: 'results_uploaded_at', type: 'timestamp' })
  public resultsUploadedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  public deletedAt?: Date;
}
