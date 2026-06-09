const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: '127.0.0.1',
    port: 56432,
    database: 'lms_oms_dev',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    const result = await client.query(`
      INSERT INTO "erp_skus" ("Id", "TenantId", "ErpSkuId", "SkuCode", "Name", "UnitOfMeasure", "Status", "UpdatedAtErp", "SyncedAt")
      VALUES 
        ('00000000-0000-0000-0000-000000000001', 'default-tenant', '00000000-0000-0000-0000-000000000002', 'A0-002', 'Product A0-002', 'PCS', 'active', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000003', 'tenant-1', '00000000-0000-0000-0000-000000000002', 'A0-002', 'Product A0-002', 'PCS', 'active', NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `);

    console.log(`Inserted ${result.rowCount} row(s) into erp_skus table.`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
