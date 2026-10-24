import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoreFilesOnDisk1761340000000 implements MigrationInterface {
  name = 'StoreFilesOnDisk1761340000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ total }] = await queryRunner.query('SELECT COUNT(*) AS total FROM `health_order_files`');
    if (Number(total) > 0) {
      throw new Error(
        `health_order_files has ${total} row(s) with the file content stored in the database. ` +
          'Export or delete them before running this migration: the new schema stores files on disk.',
      );
    }
    await queryRunner.query('ALTER TABLE `health_order_files` DROP COLUMN `file_data`');
    await queryRunner.query('ALTER TABLE `health_order_files` RENAME COLUMN `mimeType` TO `mime_type`');
    // TypeORM derives index names from the column name, so the index follows the renamed column
    await queryRunner.query(
      'ALTER TABLE `health_order_files` RENAME INDEX `IDX_1963cae78fc7fd733f026f11ae` TO `IDX_1d4955e725d5cda600c83a9961`',
    );
    await queryRunner.query(
      'ALTER TABLE `health_order_files` ' +
        'ADD `stored_file_name` varchar(255) NOT NULL, ' +
        'ADD `original_name` varchar(255) NOT NULL, ' +
        'ADD `size_bytes` int UNSIGNED NOT NULL, ' +
        'ADD `checksum_sha256` char(64) NOT NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX `IDX_health_order_files_stored_file_name` ON `health_order_files` (`stored_file_name`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX `IDX_health_order_files_stored_file_name` ON `health_order_files`');
    await queryRunner.query(
      'ALTER TABLE `health_order_files` ' +
        'DROP COLUMN `checksum_sha256`, DROP COLUMN `size_bytes`, ' +
        'DROP COLUMN `original_name`, DROP COLUMN `stored_file_name`',
    );
    await queryRunner.query(
      'ALTER TABLE `health_order_files` RENAME INDEX `IDX_1d4955e725d5cda600c83a9961` TO `IDX_1963cae78fc7fd733f026f11ae`',
    );
    await queryRunner.query('ALTER TABLE `health_order_files` RENAME COLUMN `mime_type` TO `mimeType`');
    await queryRunner.query('ALTER TABLE `health_order_files` ADD `file_data` mediumblob NULL');
  }
}
