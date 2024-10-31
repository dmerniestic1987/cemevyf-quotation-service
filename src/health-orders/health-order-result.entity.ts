import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { HealthOrder } from './health-order.entity';

@Entity({ name: 'health_order_results' })
export class HealthOrderResult {
  @Column({ type: 'varchar', length: 36 })
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @ManyToOne(() => HealthOrder, order => order.healthOrderResults)
  @JoinColumn({ name: 'order_id', referencedColumnName: 'id' })
  public healthOrder: HealthOrder;

  @Column({ name: 'file_data', type: 'mediumblob', nullable: true })
  public fileData?: Buffer;

  @Column({ name: 'additional_notes', type: 'text', nullable: true })
  public additionalNotes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  public createdAt: Date;
}
