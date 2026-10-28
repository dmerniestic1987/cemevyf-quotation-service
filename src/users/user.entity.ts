import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../auth/types/role.enum';

@Entity({ name: 'users' })
export class User {
  @Column({ type: 'varchar', length: 36 })
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  /** Always stored trimmed and in lower case */
  @Column({ name: 'username', length: 50 })
  @Index('idx_users_username', { unique: true })
  public username: string;

  @Column({ name: 'password_hash', length: 255 })
  public passwordHash: string;

  /** A user has exactly one role */
  @Column({ name: 'role', type: 'enum', enum: Role })
  public role: Role;

  @Column({ name: 'enabled', type: 'boolean', default: true })
  public enabled: boolean;

  /** Incremented to invalidate every token already issued to the user */
  @Column({ name: 'token_version', type: 'int', unsigned: true, default: 0 })
  public tokenVersion: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  public updatedAt: Date;
}
