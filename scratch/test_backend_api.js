const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080';

async function runTest() {
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

  if (!tokenRes.ok) return;

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  const shipmentsRes = await fetch('http://localhost:5051/api/outbound/shipments', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (shipmentsRes.ok) {
    const data = await shipmentsRes.json();
    if (data.length > 0) {
      console.log("Full Shipment JSON:", JSON.stringify(data[0], null, 2));
    } else {
      console.log("No shipments found.");
    }
  }
}

runTest().catch(console.error);
