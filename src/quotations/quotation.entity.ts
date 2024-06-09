import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CurrencyEnum } from '../commons/types/currency.enum';
import { QuotationItem } from './quotation-item.entity';
import { Client } from '../clients/client.entity';

@Entity({ name: 'quotations' })
export class Quotation {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: number;

  @ManyToOne(() => Client, client => client.quotations)
  @JoinColumn({ name: 'client_id', referencedColumnName: 'id' })
  client: Client;

  @Column('decimal', { precision: 12, scale: 2, name: 'total_amount' })
  public totalAmount: number;

  @Column('enum', { name: 'currency', enum: CurrencyEnum, default: CurrencyEnum.ARS })
  public currency: CurrencyEnum;

  @OneToMany(() => QuotationItem, item => item.quotation)
  public quotationItems: QuotationItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  public deletedAt?: Date;
}
