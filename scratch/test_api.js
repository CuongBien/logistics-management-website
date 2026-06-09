const baseURL = 'http://127.0.0.1:5051/api';
const kcURL = 'http://127.0.0.1:18080/realms/logistics_realm/protocol/openid-connect/token';

async function getToken() {
  const params = new URLSearchParams();
  params.append('client_id', 'oms-client');
  params.append('client_secret', 'my-secret');
  params.append('username', 'admin');
  params.append('password', 'admin');
  params.append('grant_type', 'password');

  const res = await fetch(kcURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });
  if (!res.ok) {
    throw new Error(`Failed to get token: ${res.status} - ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function runTests() {
  try {
    console.log('Retrieving token from Keycloak...');
    const token = await getToken();
    console.log('Token retrieved successfully.');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n--- 1. POST /qrcode/parse ---');
    const parseRes = await fetch(`${baseURL}/qrcode/parse`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ rawValue: 'OB:LMS2606081933515114' })
    });
    console.log('Parse status:', parseRes.status);
    const parseData = await parseRes.json();
    console.log('Parse response body:', JSON.stringify(parseData, null, 2));

    console.log('\n--- 2. GET /outbound/orders/OB:LMS2606081933515114 ---');
    try {
      const res = await fetch(`${baseURL}/outbound/orders/OB:LMS2606081933515114`, {
        headers
      });
      console.log('OrderRes1 status:', res.status);
      const data = await res.text();
      console.log('OrderRes1 body:', data);
    } catch (err) {
      console.log('OrderRes1 failed:', err.message);
    }

    console.log('\n--- 3. GET /outbound/orders/21b07b73-3549-4af1-bff6-a62d2c3c770a ---');
    try {
      const res = await fetch(`${baseURL}/outbound/orders/21b07b73-3549-4af1-bff6-a62d2c3c770a`, {
        headers
      });
      console.log('OrderRes2 status:', res.status);
      const data = await res.text();
      console.log('OrderRes2 body:', data);
    } catch (err) {
      console.log('OrderRes2 failed:', err.message);
    }

    console.log('\n--- 4. GET /outbound/orders/LMS2606081933515114 ---');
    try {
      const res = await fetch(`${baseURL}/outbound/orders/LMS2606081933515114`, {
        headers
      });
      console.log('OrderRes3 status:', res.status);
      const data = await res.text();
      console.log('OrderRes3 body:', data);
    } catch (err) {
      console.log('OrderRes3 failed:', err.message);
    }

  } catch (error) {
    console.error('Test run failed:', error.message);
  }
}

runTests();
