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
import { IdTypeEnum } from '../commons/types/id-type.enum';
import { HealthOrder } from '../health-orders/health-order.entity';

@Entity({ name: 'clients' })
@Index('idx_person_type_and_id', ['personIdType', 'personId'], { unique: true })
export class Client {
  @Column({ type: 'varchar', length: 36 })
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ name: 'first_name', nullable: false, length: 100 })
  @Index('idx_client_first_name', { unique: false })
  public firstName: string;

  @Column({ name: 'last_name', nullable: false, length: 100 })
  @Index('idx_client_last_name', { unique: false })
  public lastName: string;

  @Column({ name: 'person_id_type', nullable: true, type: 'enum', enum: IdTypeEnum })
  public personIdType: IdTypeEnum;

  @Column({ name: 'person_id', nullable: true, length: 50 })
  public personId: string;

  @Column({ name: 'e_mail', nullable: true })
  public email: string;

  @OneToMany(() => HealthOrder, healthOrder => healthOrder.client)
  public healthOrders: HealthOrder[];

  @Column({ name: 'bookly_id', nullable: true, length: 50 })
  public booklyId?: string;

  @Column({ name: 'external_id', nullable: true, length: 50 })
  public externalId?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  public deletedAt?: Date;
}
