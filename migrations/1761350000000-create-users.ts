import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1761350000000 implements MigrationInterface {
  name = 'CreateUsers1761350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // No user is created here on purpose: passwords must never be part of the migrations. Use "npm run user:create"
    await queryRunner.query(
      'CREATE TABLE `users` (' +
        '`id` varchar(36) NOT NULL, ' +
        '`username` varchar(50) NOT NULL, ' +
        '`password_hash` varchar(255) NOT NULL, ' +
        "`role` enum ('SECRETARY', 'BUSINESS_ADMIN') NOT NULL, " +
        '`enabled` tinyint NOT NULL DEFAULT 1, ' +
        '`token_version` int UNSIGNED NOT NULL DEFAULT 0, ' +
        '`created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), ' +
        '`updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), ' +
        'UNIQUE INDEX `idx_users_username` (`username`), ' +
        'PRIMARY KEY (`id`)) ENGINE=InnoDB',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX `idx_users_username` ON `users`');
    await queryRunner.query('DROP TABLE `users`');
  }
}
