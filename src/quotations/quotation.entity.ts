import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index, OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {CurrencyEnum} from "../commons/types/currency.enum";
import {QuotationItem} from "./quotation-item.entity";


@Entity({ name: 'quotations' })

export class Quotation {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: number;

  @Column({ name: 'e_mail', nullable: true })
  @Index('idx_quotations_e_mail',{ unique: false })
  public eMail: string;

  @Column("decimal", { precision: 12, scale: 2, name: 'total_amount'})
  public totalAmount: number;

  @Column("enum", { name: 'currency', enum: CurrencyEnum, default: CurrencyEnum.ARS})
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
