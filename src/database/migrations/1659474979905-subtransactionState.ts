import { MigrationInterface, QueryRunner } from 'typeorm';

export class subtransactionState1659474979905 implements MigrationInterface {
  name = 'subtransactionState1659474979905';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`subtransaction_entity\` CHANGE \`status\` \`status\` enum ('HOLD_PROCESSING', 'AWAITING_PAYMENT', 'HOLD', 'CANCELLED_PROCESSING', 'CANCELLED', 'COMPLETE_PROCESSING', 'COMPLETED', 'ROLLBACK_PROCESSING', 'ROLLBACKED') NOT NULL DEFAULT 'HOLD_PROCESSING'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`subtransaction_entity\` CHANGE \`status\` \`status\` enum ('HOLD_PROCESSING', 'HOLD', 'CANCELLED_PROCESSING', 'CANCELLED', 'COMPLETE_PROCESSING', 'COMPLETED', 'ROLLBACK_PROCESSING', 'ROLLBACKED') NOT NULL DEFAULT 'HOLD_PROCESSING'`
    );
  }
}
