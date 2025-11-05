import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1761763218492 implements MigrationInterface {
  name = "AutoMigration1761763218492";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_f553f5313c43fdf919c0627eb7\` ON \`verification\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`verification\` ADD UNIQUE INDEX \`IDX_f553f5313c43fdf919c0627eb7\` (\`email\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_1031171c13130102495201e3e2\` ON \`order\` (\`id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_2e4299a343a81574217255c00c\` ON \`review\` (\`id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_bebc9158e480b949565b4dc7a8\` ON \`product\` (\`id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_22cc43e9a74d7498546e9a63e7\` ON \`product\` (\`name\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_ff0c0301a95e517153df97f681\` ON \`product\` (\`categoryId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_bd94725aa84f8cf37632bcde99\` ON \`cart_item\` (\`id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_c524ec48751b9b5bcfbf6e59be\` ON \`cart\` (\`id\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_c524ec48751b9b5bcfbf6e59be\` ON \`cart\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_bd94725aa84f8cf37632bcde99\` ON \`cart_item\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_ff0c0301a95e517153df97f681\` ON \`product\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_22cc43e9a74d7498546e9a63e7\` ON \`product\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_bebc9158e480b949565b4dc7a8\` ON \`product\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_2e4299a343a81574217255c00c\` ON \`review\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_1031171c13130102495201e3e2\` ON \`order\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`verification\` DROP INDEX \`IDX_f553f5313c43fdf919c0627eb7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\``,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_f553f5313c43fdf919c0627eb7\` ON \`verification\` (\`email\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\` (\`email\`)`,
    );
  }
}
