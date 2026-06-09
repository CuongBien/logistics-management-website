const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080';
const WMS_API_URL = 'http://localhost:5051';

async function runVerification() {
  console.log("==================================================");
  console.log("STARTING FIXES VERIFICATION");
  console.log("==================================================");

  // 1. Get token
  console.log("1. Authenticating admin user on Keycloak...");
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

  if (!tokenRes.ok) {
    console.error("FAILED to authenticate admin:", await tokenRes.text());
    process.exit(1);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  console.log("SUCCESS: Authenticated successfully.");

  // 2. Fetch warehouses list (Verify isAdmin check in LayoutQueries)
  console.log("\n2. Fetching warehouses list (all=false)...");
  const whRes = await fetch(`${WMS_API_URL}/api/Warehouse?all=false`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!whRes.ok) {
    console.error("FAILED to fetch warehouses:", whRes.status, await whRes.text());
  } else {
    const warehouses = await whRes.json();
    console.log(`SUCCESS: Returned ${warehouses.length} warehouses.`);
    if (warehouses.length === 9) {
      console.log("  => PASS: Admin verification check resolved successfully (sees all 9 warehouses)!");
    } else {
      console.log(`  => WARNING: Expected 9 warehouses, got ${warehouses.length}. Check admin assignments.`);
    }
  }

  // 3. Fetch shipments list (Verify tenantId fallback)
  console.log("\n3. Fetching shipments list...");
  const shipmentsRes = await fetch(`${WMS_API_URL}/api/outbound/shipments`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!shipmentsRes.ok) {
    console.error("FAILED to fetch shipments:", shipmentsRes.status, await shipmentsRes.text());
  } else {
    const shipments = await shipmentsRes.json();
    console.log(`SUCCESS: Returned ${shipments.length} shipments.`);
    if (shipments.length > 0) {
      console.log("  => PASS: Default tenant fallback resolved successfully (shipments found)!");
    } else {
      console.log("  => FAIL: Shipments list returned 0. Tenant ID fallback failed.");
    }
  }

  // 4. Fetch outbound order list & detail (Verify tenantId fallback on specific order query)
  console.log("\n4. Fetching outbound orders and testing detail lookup...");
  const ordersRes = await fetch(`${WMS_API_URL}/api/outbound/orders`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!ordersRes.ok) {
    console.error("FAILED to fetch orders:", ordersRes.status, await ordersRes.text());
  } else {
    const orders = await ordersRes.json();
    console.log(`SUCCESS: Returned ${orders.length} orders total.`);
    if (orders.length > 0) {
      const sampleOrder = orders[0];
      const sampleId = sampleOrder.id;
      console.log(`Fetching detail for sample Order ID: ${sampleId} (OrderNo: ${sampleOrder.orderNo})...`);
      
      const detailRes = await fetch(`${WMS_API_URL}/api/outbound/orders/${sampleId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!detailRes.ok) {
        console.error(`  => FAIL: Detail fetch failed with status ${detailRes.status}:`, await detailRes.text());
      } else {
        const detail = await detailRes.json();
        console.log(`  => PASS: Successfully fetched order details (OrderNo: ${detail.orderNo})!`);
      }
    } else {
      console.log("  => WARNING: No orders found to test detail lookup.");
    }
  }

  console.log("\n==================================================");
  console.log("VERIFICATION COMPLETE");
  console.log("==================================================");
}

runVerification().catch(console.error);
