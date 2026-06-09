const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080';
const KEYCLOAK_ADMIN = process.env.KEYCLOAK_ADMIN || 'admin';
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';

async function checkKeycloak() {
  const adminUrl = `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`;
  const adminRes = await fetch(adminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: 'admin-cli',
      username: KEYCLOAK_ADMIN,
      password: KEYCLOAK_ADMIN_PASSWORD,
      grant_type: 'password',
    }),
  });

  if (!adminRes.ok) {
    console.error('Failed to get admin token:', await adminRes.text());
    return;
  }

  const adminData = await adminRes.json();
  const adminToken = adminData.access_token;
  const targetRealm = 'logistics_realm';

  const usersUrl = `${KEYCLOAK_URL}/admin/realms/${targetRealm}/users?max=200`;
  const kcRes = await fetch(usersUrl, {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  });

  if (!kcRes.ok) {
    console.error('Failed to fetch users:', await kcRes.text());
    return;
  }

  const kcUsers = await kcRes.json();
  console.log(`Found ${kcUsers.length} users in Keycloak total.`);
  const staffUsers = kcUsers.filter(u => !u.username.startsWith('customer_'));
  console.log(`Found ${staffUsers.length} staff/admin users:`);
  staffUsers.forEach(u => {
    console.log(`- ID: ${u.id}, Username: ${u.username}, Email: ${u.email}`);
  });
}

checkKeycloak().catch(console.error);
