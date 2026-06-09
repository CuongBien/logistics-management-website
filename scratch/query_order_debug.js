const { Client } = require('pg');

async function checkOrder() {
  const orderNo = 'LMS2606081943034021';
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
      
      const linesRes = await omsClient.query('SELECT * FROM "OrderItems" WHERE "OrderId" = $1', [order.Id]);
      console.log('OMS Order Items:');
      linesRes.rows.forEach(item => {
        console.log(`  - SKU: ${item.Sku}, SkuCode: ${item.SkuCode}, Quantity: ${item.Quantity}, Price: ${item.Price}`);
      });
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
      console.log(`- Status: ${order.Status} (enum)`);
      
      const linesRes = await wmsClient.query('SELECT * FROM "OutboundOrderLines" WHERE "OutboundOrderId" = $1', [order.Id]);
      console.log('WMS Outbound Order Lines:');
      linesRes.rows.forEach(item => {
        console.log(`  - SKU: ${item.Sku}, RequestedQty: ${item.RequestedQty}, ReservedQty: ${item.ReservedQty}, PickedQty: ${item.PickedQty}`);
      });

      const reservationsRes = await wmsClient.query(
        'SELECT r.*, b."BinCode" FROM "inventory_reservations" r JOIN "InventoryItems" i ON r."InventoryItemId" = i."Id" JOIN "Bins" b ON i."BinId" = b."Id" WHERE r."ReferenceId" = $1',
        [order.Id.toString()]
      );
      console.log('WMS Inventory Reservations:');
      reservationsRes.rows.forEach(res => {
        console.log(`  - ResId: ${res.Id}, SKU: ${res.Sku}, Qty: ${res.Quantity}, BinCode: ${res.BinCode}, Status: ${res.Status}`);
      });

      const tasksRes = await wmsClient.query(
        'SELECT t.*, b."BinCode" FROM "PickTasks" t JOIN "Bins" b ON t."FromBinId" = b."Id" WHERE t."OutboundOrderLineId" IN (SELECT "Id" FROM "OutboundOrderLines" WHERE "OutboundOrderId" = $1)',
        [order.Id]
      );
      console.log('WMS Pick Tasks:');
      tasksRes.rows.forEach(task => {
        console.log(`  - TaskId: ${task.Id}, BinCode: ${task.BinCode}, WaveId: ${task.WaveId}, Qty: ${task.Quantity}, Status: ${task.Status}`);
      });
    }
  } catch (err) {
    console.error('WMS Query Error:', err.message);
  } finally {
    await wmsClient.end();
  }
}

checkOrder();
