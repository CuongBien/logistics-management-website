const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'lms_wms_dev',
  password: 'postgres',
  port: 56432,
});

async function main() {
  await client.connect();
  try {
    const res = await client.query(
      `SELECT * FROM "PackVerifications" WHERE "OutboundOrderId" = $1`, 
      ['21b07b73-3549-4af1-bff6-a62d2c3c770a']
    );
    console.log('QUERY RESULT:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await client.end();
  }
}

main();
