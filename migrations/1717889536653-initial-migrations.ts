import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigrations1717889536653 implements MigrationInterface {
    name = 'InitialMigrations1717889536653'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`quotation_items\` (\`id\` bigint NOT NULL, \`code\` varchar(255) NULL, \`name\` varchar(255) NULL, \`unit_price\` decimal(12,2) NOT NULL, \`item_count\` int NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`quotation_id\` bigint NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`quotations\` (\`id\` bigint NOT NULL AUTO_INCREMENT, \`e_mail\` varchar(255) NULL, \`total_amount\` decimal(12,2) NOT NULL, \`currency\` enum ('ars', 'usd', 'usdc') NOT NULL DEFAULT 'ars', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, INDEX \`idx_quotations_e_mail\` (\`e_mail\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`quotation_items\` ADD CONSTRAINT \`FK_c9e2dea84928feba1d24874c160\` FOREIGN KEY (\`quotation_id\`) REFERENCES \`quotations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`quotation_items\` DROP FOREIGN KEY \`FK_c9e2dea84928feba1d24874c160\``);
        await queryRunner.query(`DROP INDEX \`idx_quotations_e_mail\` ON \`quotations\``);
        await queryRunner.query(`DROP TABLE \`quotations\``);
        await queryRunner.query(`DROP TABLE \`quotation_items\``);
    }

}
