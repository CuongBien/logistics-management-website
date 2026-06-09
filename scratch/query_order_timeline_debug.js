const { Client } = require('pg');

async function debugTimeline() {
  const wmsClient = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'lms_wms_dev',
    password: 'postgres',
    port: 56432,
  });

  try {
    await wmsClient.connect();

    // 1. Get recent outbound orders
    const ordersRes = await wmsClient.query(
      'SELECT "Id", "OrderNo", "Status", "WarehouseId", "CreatedAt" FROM "OutboundOrders" ORDER BY "CreatedAt" DESC LIMIT 10'
    );
    console.log(`Recent Outbound Orders (Total: ${ordersRes.rows.length}):`);
    for (const order of ordersRes.rows) {
      console.log(`- OrderId: ${order.Id}, OrderNo: ${order.OrderNo}, Status: ${order.Status}, CreatedAt: ${order.CreatedAt}`);
      
      // Let's get pick tasks for this order
      const tasksRes = await wmsClient.query(
        'SELECT pt."Id", pt."Status", pt."CreatedAt", pt."StartedAt", pt."PickedAt", pt."WaveId" FROM "PickTasks" pt JOIN "OutboundOrderLines" l ON pt."OutboundOrderLineId" = l."Id" WHERE l."OutboundOrderId" = $1',
        [order.Id]
      );
      console.log(`  Pick Tasks (${tasksRes.rows.length}):`);
      tasksRes.rows.forEach(t => {
        console.log(`    * TaskId: ${t.Id}, Status: ${t.Status}, CreatedAt: ${t.CreatedAt}, StartedAt: ${t.StartedAt}, PickedAt: ${t.PickedAt}, WaveId: ${t.WaveId}`);
      });

      // Let's check if there are any ShipmentOrders or InboundReceipts
      const soRes = await wmsClient.query('SELECT * FROM "ShipmentOrders" WHERE "OutboundOrderId" = $1', [order.Id]);
      console.log(`  Shipment Orders: ${soRes.rows.length}`);
    }
  } catch (err) {
    console.error('Error debugging timeline:', err);
  } finally {
    await wmsClient.end();
  }
}

debugTimeline();
