const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080';
const WMS_API_URL = 'http://localhost:5051';

async function run() {
  const tokenUrl = `${KEYCLOAK_URL}/realms/logistics_realm/protocol/openid-connect/token`;
  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: 'oms-client',
      client_secret: 'my-secret',
      username: 'admin',
      password: 'admin',
      grant_type: 'password',
    }),
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  const shipmentsRes = await fetch(`${WMS_API_URL}/api/outbound/shipments`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const shipments = await shipmentsRes.json();
  console.log("First 3 shipments from API:");
  console.log(JSON.stringify(shipments.slice(0, 3), null, 2));
}

run().catch(console.error);
