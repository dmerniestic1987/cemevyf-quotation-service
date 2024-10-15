import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HealthOrder } from './health-order.entity';

@Entity({ name: 'health_order_items' })
export class HealthOrderItem {
  @PrimaryColumn({ type: 'integer' })
  public id: number;

  @PrimaryColumn({ name: 'order_id', type: 'bigint' })
  public quotationId: number;

  @ManyToOne(() => HealthOrder, quotation => quotation.healthOrderItems)
  @JoinColumn({ name: 'order_id', referencedColumnName: 'id' })
  healthOrder: HealthOrder;

  @Column({ name: 'code', nullable: true })
  public code: string;

  @Column({ name: 'name', nullable: true })
  public name: string;

  @Column('decimal', { precision: 12, scale: 2, name: 'unit_price' })
  public unitPrice: number;

  @Column({ name: 'item_count', type: 'integer' })
  public itemCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  public deletedAt?: Date;
}
