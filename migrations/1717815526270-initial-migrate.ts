import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigrate1717815526270 implements MigrationInterface {
    name = 'InitialMigrate1717815526270'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`quotations\` (\`id\` bigint NOT NULL AUTO_INCREMENT, \`e_mail\` varchar(255) NULL, \`total_amount\` decimal(12,2) NOT NULL, \`currency\` enum ('ars', 'usd', 'usdc') NOT NULL DEFAULT 'ars', \`quotation_items\` json NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, INDEX \`idx_quotations_e_mail\` (\`e_mail\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`idx_quotations_e_mail\` ON \`quotations\``);
        await queryRunner.query(`DROP TABLE \`quotations\``);
    }

}
