import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { HealthOrder } from './health-order.entity';
import { HealthOrderFileType } from './types/health-order-file-type';

@Entity({ name: 'health_order_files' })
export class HealthOrderFile {
  @Column({ type: 'varchar', length: 36 })
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', length: 70 })
  @Index({ unique: false })
  public mimeType: string;

  @ManyToOne(() => HealthOrder, order => order.healthOrderFiles)
  @JoinColumn({ name: 'order_id', referencedColumnName: 'id' })
  public healthOrder: HealthOrder;

  @Column({ name: 'file_type', type: 'enum', enum: HealthOrderFileType })
  @Index({ unique: false })
  public fileType: HealthOrderFileType;

  @Column({ name: 'file_data', type: 'mediumblob', nullable: true })
  public fileData?: Buffer;

  @Column({ name: 'additional_notes', type: 'text', nullable: true })
  public additionalNotes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  public createdAt: Date;
}
