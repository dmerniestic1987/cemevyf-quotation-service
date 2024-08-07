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
import { ClientIdTypeEnum } from '../commons/types/client-id-type.enum';
import { Quotation } from '../quotations/quotation.entity';

@Entity({ name: 'clients' })
@Index('idx_client_type_and_id', ['clientIdType', 'clientId'], { unique: true })
export class Client {
  @Column({ type: 'varchar' })
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ name: 'first_name', nullable: false })
  @Index('idx_client_first_name', { unique: false })
  public clientFirstName: string;

  @Column({ name: 'last_name', nullable: false })
  @Index('idx_client_last_name', { unique: false })
  public clientLastName: string;

  @Column({ name: 'client_id_type', nullable: true, type: 'enum', enum: ClientIdTypeEnum })
  public clientIdType: ClientIdTypeEnum;

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
