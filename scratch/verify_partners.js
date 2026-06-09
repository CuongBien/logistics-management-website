const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080';
const MASTERDATA_API_URL = 'http://localhost:5052';

async function getToken(username, password) {
  const tokenUrl = `${KEYCLOAK_URL}/realms/logistics_realm/protocol/openid-connect/token`;
  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: 'oms-client',
      client_secret: 'my-secret',
      username: username,
      password: password,
      grant_type: 'password',
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Failed to authenticate as ${username}: ${await tokenRes.text()}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function fetchPartners(token) {
  const res = await fetch(`${MASTERDATA_API_URL}/api/Partners`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  return await res.json();
}

async function runVerification() {
  console.log("==================================================");
  console.log("STARTING MASTERDATA PARTNERS VERIFICATION");
  console.log("==================================================");

  const users = [
    { username: 'admin', password: 'admin' },
    { username: 'manager1', password: 'manager' },
    { username: 'staff1', password: 'staff' },
    { username: 'customer1', password: 'customer' }
  ];

  for (const user of users) {
    console.log(`\nTesting user: ${user.username}...`);
    try {
      const token = await getToken(user.username, user.password);
      console.log(`  Successfully logged in. Token acquired.`);
      const result = await fetchPartners(token);
      // Depending on the API response structure, it could be a wrapped Result or a list directly.
      // Looking at controller: Task<ActionResult<Result<PaginatedList<PartnerDto>>>> GetList
      console.log(`  Response received successfully.`);
      console.log(`  Result isSuccess: ${result.isSuccess}`);
      if (result.isSuccess) {
        const list = result.value.items;
        console.log(`  Found ${list.length} partners.`);
        if (list.length > 0) {
          console.log(`  First partner name: ${list[0].name}, tenantId: ${list[0].tenantId}`);
        }
      } else {
        console.log(`  Result Error: ${result.error?.message || JSON.stringify(result.error)}`);
      }
    } catch (err) {
      console.error(`  ERROR testing user ${user.username}:`, err.message);
    }
  }

  console.log("\n==================================================");
  console.log("VERIFICATION COMPLETE");
  console.log("==================================================");
}

runVerification().catch(console.error);
