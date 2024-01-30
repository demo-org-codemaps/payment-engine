import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubTransactionTable1653952027740 implements MigrationInterface {
  name = 'CreateSubTransactionTable1653952027740';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`subtransaction_entity\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`version\` int NOT NULL, \`order_id\` varchar(255) NOT NULL, \`idemp_key\` varchar(255) NOT NULL, \`amount\` bigint NOT NULL, \`currency\` varchar(255) NOT NULL DEFAULT 'PKR', \`payment_method\` varchar(255) NOT NULL DEFAULT 'WALLET', \`status\` enum ('HOLD_PROCESSING', 'HOLD', 'CANCELLED_PROCESSING', 'CANCELLED', 'COMPLETE_PROCESSING', 'COMPLETED', 'ROLLBACK_PROCESSING', 'ROLLBACKED') NOT NULL DEFAULT 'HOLD_PROCESSING', UNIQUE INDEX \`IDX_2074270baf6d812f8c9837d0b3\` (\`idemp_key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_2074270baf6d812f8c9837d0b3\` ON \`subtransaction_entity\``);
    await queryRunner.query(`DROP TABLE \`subtransaction_entity\``);
  }
}
