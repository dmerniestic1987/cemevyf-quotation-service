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
import { Quotation } from './quotation.entity';

@Entity({ name: 'clients' })
@Index('idx_client_type_and_id', ['clientIdType', 'clientId'], { unique: true })
export class Client {
  @Column({ type: 'varchar' })
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ name: 'phone_number', nullable: true })
  public phoneNumber: string;

  @Column({ name: 'e_mail', nullable: false })
  @Index('idx_client_e_mail', { unique: true })
  public eMail: string;

  @Column({ name: 'first_name', nullable: false })
  @Index('idx_client_first_name', { unique: false })
  public clientFirstName: string;

  @Column({ name: 'last_name', nullable: false })
  @Index('idx_client_last_name', { unique: false })
  public clientLastName: string;

  @Column({ name: 'client_id_type', nullable: true, type: 'enum', enum: PersonIdTypeEnum })
  public clientIdType: PersonIdTypeEnum;

  @Column({ name: 'client_id', nullable: true })
  public clientId: string;

  @OneToMany(() => Quotation, quotation => quotation.client)
  public quotations: Quotation[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  public deletedAt?: Date;
}
