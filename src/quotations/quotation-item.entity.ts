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
import { Quotation } from './quotation.entity';

@Entity({ name: 'quotation_items' })
export class QuotationItem {
  @PrimaryColumn({ type: 'bigint' })
  public id: number;

  @ManyToOne(() => Quotation, quotation => quotation.quotationItems)
  @JoinColumn({ name: 'quotation_id', referencedColumnName: 'id' })
  quotation: Quotation;

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
