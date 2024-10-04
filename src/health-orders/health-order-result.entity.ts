import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { HealthOrder } from './health-order.entity';

@Entity({ name: 'health_order_results' })
export class HealthOrderResult {
  @Column({ type: 'varchar' })
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @ManyToOne(() => HealthOrder, order => order.healthOrderResults)
  @JoinColumn({ name: 'order_id', referencedColumnName: 'id' })
  public healthOrder: HealthOrder;

  @Column({ name: 'file_data', type: 'mediumblob', nullable: true })
  public fileData?: Buffer;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  public createdAt: Date;
}
