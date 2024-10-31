import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialCommit1730386740242 implements MigrationInterface {
    name = 'InitialCommit1730386740242'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`health_order_items\` (\`id\` int NOT NULL, \`order_id\` bigint NOT NULL, \`code\` varchar(255) NULL, \`name\` varchar(255) NULL, \`unit_price\` decimal(12,2) NOT NULL, \`item_count\` int NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, PRIMARY KEY (\`id\`, \`order_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`clients\` (\`id\` varchar(36) NOT NULL, \`first_name\` varchar(100) NOT NULL, \`last_name\` varchar(100) NOT NULL, \`person_id_type\` enum ('dni', 'pass', 'cuil', 'cuit', 'other') NULL, \`person_id\` varchar(50) NULL, \`e_mail\` varchar(255) NULL, \`bookly_id\` varchar(50) NULL, \`external_id\` varchar(50) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, INDEX \`idx_client_first_name\` (\`first_name\`), INDEX \`idx_client_last_name\` (\`last_name\`), UNIQUE INDEX \`idx_person_type_and_id\` (\`person_id_type\`, \`person_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`health_order_results\` (\`id\` varchar(36) NOT NULL, \`file_data\` mediumblob NULL, \`additional_notes\` text NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`order_id\` bigint NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`health_orders\` (\`id\` bigint NOT NULL AUTO_INCREMENT, \`status\` enum ('1', '2', '3', '4') NOT NULL DEFAULT '1', \`total_amount\` decimal(14,2) NOT NULL, \`currency\` enum ('ARS', 'USD', 'USDC') NOT NULL DEFAULT 'ARS', \`executed_at\` timestamp NULL, \`results_uploaded_at\` timestamp NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`client_id\` varchar(36) NULL, INDEX \`IDX_6afae116f365af8ca8ecf5091d\` (\`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`health_order_files\` (\`id\` varchar(36) NOT NULL, \`mimeType\` varchar(70) NOT NULL, \`file_data\` mediumblob NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`order_id\` bigint NULL, INDEX \`IDX_1963cae78fc7fd733f026f11ae\` (\`mimeType\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`health_order_items\` ADD CONSTRAINT \`FK_c0d11eb5131d90312546b84ad37\` FOREIGN KEY (\`order_id\`) REFERENCES \`health_orders\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`health_order_results\` ADD CONSTRAINT \`FK_5b34e0c382b06fe5c4df49969a8\` FOREIGN KEY (\`order_id\`) REFERENCES \`health_orders\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`health_orders\` ADD CONSTRAINT \`FK_4a80ede16379067fef51f6c8a69\` FOREIGN KEY (\`client_id\`) REFERENCES \`clients\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`health_order_files\` ADD CONSTRAINT \`FK_7effe9ac785f905cf5867bc68a7\` FOREIGN KEY (\`order_id\`) REFERENCES \`health_orders\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`health_order_files\` DROP FOREIGN KEY \`FK_7effe9ac785f905cf5867bc68a7\``);
        await queryRunner.query(`ALTER TABLE \`health_orders\` DROP FOREIGN KEY \`FK_4a80ede16379067fef51f6c8a69\``);
        await queryRunner.query(`ALTER TABLE \`health_order_results\` DROP FOREIGN KEY \`FK_5b34e0c382b06fe5c4df49969a8\``);
        await queryRunner.query(`ALTER TABLE \`health_order_items\` DROP FOREIGN KEY \`FK_c0d11eb5131d90312546b84ad37\``);
        await queryRunner.query(`DROP INDEX \`IDX_1963cae78fc7fd733f026f11ae\` ON \`health_order_files\``);
        await queryRunner.query(`DROP TABLE \`health_order_files\``);
        await queryRunner.query(`DROP INDEX \`IDX_6afae116f365af8ca8ecf5091d\` ON \`health_orders\``);
        await queryRunner.query(`DROP TABLE \`health_orders\``);
        await queryRunner.query(`DROP TABLE \`health_order_results\``);
        await queryRunner.query(`DROP INDEX \`idx_person_type_and_id\` ON \`clients\``);
        await queryRunner.query(`DROP INDEX \`idx_client_last_name\` ON \`clients\``);
        await queryRunner.query(`DROP INDEX \`idx_client_first_name\` ON \`clients\``);
        await queryRunner.query(`DROP TABLE \`clients\``);
        await queryRunner.query(`DROP TABLE \`health_order_items\``);
    }

}
