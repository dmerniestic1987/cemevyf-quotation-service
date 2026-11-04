import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHealthOrderSubtotal1762200000000 implements MigrationInterface {
  name = 'AddHealthOrderSubtotal1762200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `health_orders` ADD `subtotal_amount` decimal(14,2) NULL AFTER `status`');
    // Existing orders were saved with the exact sum of their items as total, so it is also their subtotal.
    // Their total is not rounded: the amount already quoted to the patient does not change
    await queryRunner.query('UPDATE `health_orders` SET `subtotal_amount` = `total_amount`');
    await queryRunner.query('ALTER TABLE `health_orders` MODIFY `subtotal_amount` decimal(14,2) NOT NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `health_orders` DROP COLUMN `subtotal_amount`');
  }
}
