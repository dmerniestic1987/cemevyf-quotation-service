import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1717904137407 implements MigrationInterface {
    name = 'InitialMigration1717904137407'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`quotation_items\` (\`id\` bigint NOT NULL, \`code\` varchar(255) NULL, \`name\` varchar(255) NULL, \`unit_price\` decimal(12,2) NOT NULL, \`item_count\` int NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`quotation_id\` bigint NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`clients\` (\`id\` varchar(36) NOT NULL, \`phone_number\` varchar(255) NULL, \`e_mail\` varchar(255) NOT NULL, \`first_name\` varchar(255) NOT NULL, \`last_name\` varchar(255) NOT NULL, \`client_id_type\` enum ('dni', 'pass', 'cuil', 'cuit') NULL, \`client_id\` varchar(255) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, UNIQUE INDEX \`idx_client_e_mail\` (\`e_mail\`), INDEX \`idx_client_first_name\` (\`first_name\`), INDEX \`idx_client_last_name\` (\`last_name\`), UNIQUE INDEX \`idx_client_type_and_id\` (\`client_id_type\`, \`client_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`quotations\` (\`id\` bigint NOT NULL AUTO_INCREMENT, \`total_amount\` decimal(12,2) NOT NULL, \`currency\` enum ('ARS', 'USD', 'USDC') NOT NULL DEFAULT 'ARS', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`client_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`quotation_items\` ADD CONSTRAINT \`FK_c9e2dea84928feba1d24874c160\` FOREIGN KEY (\`quotation_id\`) REFERENCES \`quotations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`quotations\` ADD CONSTRAINT \`FK_118e5246cab853e3c1d958732d8\` FOREIGN KEY (\`client_id\`) REFERENCES \`clients\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`quotations\` DROP FOREIGN KEY \`FK_118e5246cab853e3c1d958732d8\``);
        await queryRunner.query(`ALTER TABLE \`quotation_items\` DROP FOREIGN KEY \`FK_c9e2dea84928feba1d24874c160\``);
        await queryRunner.query(`DROP TABLE \`quotations\``);
        await queryRunner.query(`DROP INDEX \`idx_client_type_and_id\` ON \`clients\``);
        await queryRunner.query(`DROP INDEX \`idx_client_last_name\` ON \`clients\``);
        await queryRunner.query(`DROP INDEX \`idx_client_first_name\` ON \`clients\``);
        await queryRunner.query(`DROP INDEX \`idx_client_e_mail\` ON \`clients\``);
        await queryRunner.query(`DROP TABLE \`clients\``);
        await queryRunner.query(`DROP TABLE \`quotation_items\``);
    }

}
