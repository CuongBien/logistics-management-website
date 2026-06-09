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
    const resRoleAss = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'OperatorRoleAssignments'");
    console.log("OperatorRoleAssignments columns:", resRoleAss.rows);

    const resProfiles = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'operator_profiles'");
    console.log("operator_profiles columns:", resProfiles.rows);
  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    await client.end();
  }
}

run();
