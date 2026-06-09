const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'lms_wms_dev',
  password: 'postgres',
  port: 56432,
});

async function check() {
  await client.connect();
  console.log("Connected to WMS db");

  const whId = 'a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
  const res = await client.query(`
    SELECT ora."Id", op."DisplayName", op."OperatorSub", r."Code" as "RoleCode", ora."Status"
    FROM "OperatorRoleAssignments" ora
    JOIN "operator_profiles" op ON ora."OperatorProfileId" = op."Id"
    JOIN "Roles" r ON ora."RoleId" = r."Id"
    WHERE ora."WarehouseId" = $1
  `, [whId]);

  console.log(`Role Assignments in HCM Mega Hub (${whId}):`);
  res.rows.forEach(r => {
    console.log(`- AssignId: ${r.Id}, Name: ${r.DisplayName}, Sub: ${r.OperatorSub}, Role: ${r.RoleCode}, Status: ${r.Status}`);
  });

  await client.end();
}

check().catch(err => {
  console.error("DB Check Error:", err);
  process.exit(1);
});
