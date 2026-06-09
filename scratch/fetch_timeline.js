const fetch = require('node-fetch');

async function getDemoToken() {
  const url = "http://127.0.0.1:18080/realms/logistics_realm/protocol/openid-connect/token";
  const params = new URLSearchParams();
  params.append('client_id', 'portal-client');
  params.append('username', 'demo_client');
  params.append('password', 'demo');
  params.append('grant_type', 'password');

  const res = await fetch(url, {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  if (!res.ok) {
    throw new Error('Keycloak authentication failed: ' + await res.text());
  }
  const data = await res.json();
  return data.access_token;
}

async function main() {
  try {
    const token = await getDemoToken();
    console.log("Got access token from Keycloak.");

    const orderId = '21b07b73-3549-4af1-bff6-a62d2c3c770a';
    const apiUrl = `http://127.0.0.1:5051/api/outbound/orders/${orderId}/tracking-timeline`;
    
    const res = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log("Timeline API Status:", res.status);
    const data = await res.json();
    console.log("Response Body:", JSON.stringify(data, null, 2));

  } catch (err) {
    console.error("Error:", err);
  }
}

main();
