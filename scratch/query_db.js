const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'lms_wms_dev',
  password: 'postgres',
  port: 56432,
});

async function run() {
  await client.connect();
  console.log("Connected to DB.");

  try {
    const resProfiles = await client.query('SELECT "Id", "OperatorSub", "DisplayName" FROM "operator_profiles"');
    console.log("Operator Profiles in DB:", resProfiles.rows);

    const dupChecks = await client.query('SELECT "OperatorSub", count(*) FROM "operator_profiles" GROUP BY "OperatorSub" HAVING count(*) > 1');
    console.log("Duplicates count:", dupChecks.rows);
  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    await client.end();
  }
}

run();
