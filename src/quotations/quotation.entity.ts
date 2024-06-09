import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CurrencyEnum } from '../commons/types/currency.enum';
import { QuotationItem } from './quotation-item.entity';
import { PersonIdTypeEnum } from '../commons/types/person-id-type.enum';

@Entity({ name: 'quotations' })
export class Quotation {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: number;

  @Column({ name: 'e_mail', nullable: true })
  @Index('idx_quotations_e_mail', { unique: false })
  public eMail: string;

  @Column({ name: 'patient_first_name', nullable: true })
  @Index('idx_first_name', { unique: false })
  public patientFirstName: string;

  @Column({ name: 'patient_last_name', nullable: true })
  @Index('idx_last_name', { unique: false })
  public patientLastName: string;

  @Column({ name: 'patient_id_type', nullable: true, type: 'enum', enum: PersonIdTypeEnum })
  @Index('idx_patient_id_type', { unique: false })
  public patientIdType: PersonIdTypeEnum;

  @Column({ name: 'patient_id', nullable: true })
  @Index('idx_patient', { unique: false })
  public patientId: string;

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
