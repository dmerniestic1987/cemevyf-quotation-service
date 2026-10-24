import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { HealthOrder } from './health-order.entity';
import { HealthOrderFileType } from './types/health-order-file-type';

@Entity({ name: 'health_order_files' })
export class HealthOrderFile {
  @Column({ type: 'varchar', length: 36 })
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 70 })
  @Index({ unique: false })
  public mimeType: string;

  @Column({ name: 'stored_file_name', type: 'varchar', length: 255 })
  @Index('IDX_health_order_files_stored_file_name', { unique: true })
  public storedFileName: string;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  public originalName: string;

  @Column({ name: 'size_bytes', type: 'int', unsigned: true })
  public sizeBytes: number;

  @Column({ name: 'checksum_sha256', type: 'char', length: 64 })
  public checksumSha256: string;

  @ManyToOne(() => HealthOrder, order => order.healthOrderFiles)
  @JoinColumn({ name: 'order_id', referencedColumnName: 'id' })
  public healthOrder: HealthOrder;

  @Column({ name: 'file_type', type: 'enum', enum: HealthOrderFileType })
  @Index({ unique: false })
  public fileType: HealthOrderFileType;

  @Column({ name: 'additional_notes', type: 'text', nullable: true })
  public additionalNotes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  public createdAt: Date;
}
