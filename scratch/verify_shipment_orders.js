const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080';
const WMS_API_URL = 'http://localhost:5051';

async function run() {
  console.log("==========================================");
  console.log("VERIFYING SHIPMENT ORDERS API");
  console.log("==========================================");

  // 1. Get access token
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

  // 2. Fetch shipments list
  const shipmentsRes = await fetch(`${WMS_API_URL}/api/outbound/shipments`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const shipments = await shipmentsRes.json();
  console.log(`Successfully fetched ${shipments.length} shipments.`);
  if (shipments.length === 0) {
    console.error("No shipments found!");
    process.exit(1);
  }

  // Find a shipment to test (specifically the one we verified has a routeId in DB)
  const targetId = 'a574963c-b7a3-431e-b4ce-c86d4fd6b506';
  const detailRes1 = await fetch(`${WMS_API_URL}/api/outbound/shipments`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const shipmentsList = await detailRes1.json();
  const testShipment = shipmentsList.find(s => s.id === targetId) || shipmentsList[0];
  console.log(`\nTesting with Shipment ID: ${testShipment.id} (ShipmentNo: ${testShipment.shipmentNo})`);
  console.log(`- RouteId: ${testShipment.routeId}`);
  console.log(`- Status: ${testShipment.status}`);
  console.log(`- DestinationType: ${testShipment.destinationType}`);
  console.log(`- DestinationId: ${testShipment.destinationId}`);

  // 3. Fetch orders for this shipment
  const ordersUrl = `${WMS_API_URL}/api/outbound/shipments/${testShipment.id}/orders`;
  console.log(`\nFetching orders from: ${ordersUrl}`);
  const ordersRes = await fetch(ordersUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!ordersRes.ok) {
    console.error(`FAILED to fetch orders: ${ordersRes.status}`, await ordersRes.text());
    process.exit(1);
  }

  const orders = await ordersRes.json();
  console.log(`SUCCESS: Fetched ${orders.length} orders for this shipment.`);
  if (orders.length > 0) {
    console.log("\nFirst Order details:");
    const order = orders[0];
    console.log(`- OrderId: ${order.orderId}`);
    console.log(`- OrderNo: ${order.orderNo}`);
    console.log(`- Status: ${order.status}`);
    console.log(`- Lines count: ${order.lines?.length}`);
    if (order.lines?.length > 0) {
      console.log("  Lines:");
      order.lines.forEach(l => {
        console.log(`    * SKU: ${l.sku}, RequestedQty: ${l.requestedQty}`);
      });
    }
  } else {
    console.log("WARNING: Shipment has no orders associated with it.");
  }
}

run().catch(console.error);
