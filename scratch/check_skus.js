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
    const res = await client.query('SELECT * FROM "ErpSkuMirrors"');
    console.log('SKUs in OMS:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
