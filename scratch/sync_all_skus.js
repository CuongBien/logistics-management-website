const { Client } = require('pg');

async function run() {
  const wmsClient = new Client({
    host: '127.0.0.1',
    port: 56432,
    database: 'lms_wms_dev',
    user: 'postgres',
    password: 'postgres'
  });

  const omsClient = new Client({
    host: '127.0.0.1',
    port: 56432,
    database: 'lms_oms_dev',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await wmsClient.connect();
    await omsClient.connect();

    // Fetch all SKUs from Warehouse
    const wmsRes = await wmsClient.query('SELECT * FROM "erp_skus"');
    const skus = wmsRes.rows;
    console.log(`Found ${skus.length} SKUs in WMS.`);

    if (skus.length === 0) {
      console.log('No SKUs to copy.');
      return;
    }

    // Insert into OMS for default-tenant and tenant-1
    for (const sku of skus) {
      for (const tenant of ['default-tenant', 'tenant-1']) {
        const query = `
          INSERT INTO "erp_skus" ("Id", "TenantId", "ErpSkuId", "SkuCode", "Name", "UnitOfMeasure", "Status", "UpdatedAtErp", "SyncedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          ON CONFLICT DO NOTHING;
        `;
        // Generate a random UUID for the new row's ID
        const crypto = require('crypto');
        const newId = crypto.randomUUID();

        await omsClient.query(query, [
          newId,
          tenant,
          sku.ErpSkuId || sku.Id, 
          sku.SkuCode,
          sku.Name,
          sku.UnitOfMeasure || 'PCS',
          sku.Status || 'active'
        ]);
      }
    }

    console.log(`Successfully copied ${skus.length} SKUs to OMS for both tenants.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await wmsClient.end();
    await omsClient.end();
  }
}

run();
