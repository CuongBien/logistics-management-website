const { Client } = require('pg');

async function checkOrder() {
  const orderNo = 'LMS2606081933515114';
  console.log(`Checking databases for order ${orderNo}...\n`);

  // Query OMS
  const omsClient = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'lms_oms_dev',
    password: 'postgres',
    port: 56432,
  });

  try {
    await omsClient.connect();
    const orderRes = await omsClient.query('SELECT * FROM "Orders" WHERE "WaybillCode" = $1', [orderNo]);
    if (orderRes.rows.length === 0) {
      console.log('OMS: Order not found in "Orders" table.');
    } else {
      const order = orderRes.rows[0];
      console.log('OMS Order found:');
      console.log(`- Id: ${order.Id}`);
      console.log(`- WaybillCode: ${order.WaybillCode}`);
      console.log(`- Status: ${order.Status}`);
    }
  } catch (err) {
    console.error('OMS Query Error:', err.message);
  } finally {
    await omsClient.end();
  }

  console.log('\n----------------------------------------\n');

  // Query WMS
  const wmsClient = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'lms_wms_dev',
    password: 'postgres',
    port: 56432,
  });

  try {
    await wmsClient.connect();
    const orderRes = await wmsClient.query('SELECT * FROM "OutboundOrders" WHERE "OrderNo" = $1', [orderNo]);
    if (orderRes.rows.length === 0) {
      console.log('WMS: OutboundOrder not found.');
    } else {
      const order = orderRes.rows[0];
      console.log('WMS Outbound Order found:');
      console.log(`- Id: ${order.Id}`);
      console.log(`- OrderNo: ${order.OrderNo}`);
      console.log(`- Status: ${order.Status} (enum value)`);
      
      const linesRes = await wmsClient.query('SELECT * FROM "OutboundOrderLines" WHERE "OutboundOrderId" = $1', [order.Id]);
      console.log('WMS Outbound Order Lines:');
      linesRes.rows.forEach(item => {
        console.log(`  - SKU: ${item.Sku}, RequestedQty: ${item.RequestedQty}, ReservedQty: ${item.ReservedQty}, PickedQty: ${item.PickedQty}`);
      });

      // Check linked shipment orders
      const shpOrdersRes = await wmsClient.query('SELECT * FROM "ShipmentOrders" WHERE "OutboundOrderId" = $1', [order.Id]);
      console.log('WMS ShipmentOrders links:');
      if (shpOrdersRes.rows.length === 0) {
        console.log('  - No links found in ShipmentOrders.');
      }
      for (const so of shpOrdersRes.rows) {
        console.log(`  - ShipmentId: ${so.ShipmentId}, OutboundOrderId: ${so.OutboundOrderId}`);
        const shpRes = await wmsClient.query('SELECT * FROM "Shipments" WHERE "Id" = $1', [so.ShipmentId]);
        if (shpRes.rows.length > 0) {
          const shp = shpRes.rows[0];
          console.log(`    - ShipmentNo: ${shp.ShipmentNo}, Status: ${shp.Status}, DestinationId: ${shp.DestinationId}`);
        }
      }
    }
  } catch (err) {
    console.error('WMS Query Error:', err.message);
  } finally {
    await wmsClient.end();
  }
}

checkOrder();
