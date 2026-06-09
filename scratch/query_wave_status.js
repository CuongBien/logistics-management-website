const { Client } = require('pg');

async function checkWave() {
  const waveNo = 'WAVE-MUL-195937-01';
  console.log(`Checking wave ${waveNo} in WMS database...\n`);

  const wmsClient = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'lms_wms_dev',
    password: 'postgres',
    port: 56432,
  });

  try {
    await wmsClient.connect();
    
    // Query Wave
    const waveRes = await wmsClient.query('SELECT * FROM "Waves" WHERE "WaveNo" = $1', [waveNo]);
    if (waveRes.rows.length === 0) {
      console.log('Wave not found in Waves table.');
      
      // Let's list a few waves to see what exists
      const wavesList = await wmsClient.query('SELECT * FROM "Waves" ORDER BY "CreatedAt" DESC LIMIT 10');
      console.log('Recent 10 waves in database:');
      wavesList.rows.forEach(w => {
        console.log(`- Id: ${w.Id}, WaveNo: ${w.WaveNo}, Status: ${w.Status}, OrderCount: ${w.OrderCount}, CreatedAt: ${w.CreatedAt}`);
      });
      
    } else {
      const wave = waveRes.rows[0];
      console.log('Wave found:');
      console.log(JSON.stringify(wave, null, 2));

      // Query Pick Tasks associated with this wave
      const waveIdStr = wave.Id;
      console.log(`\nQuerying PickTasks for WaveId ${waveIdStr} or WaveNo ${waveNo}...`);
      
      const tasksRes = await wmsClient.query(
        'SELECT t.*, b."BinCode" FROM "PickTasks" t JOIN "Bins" b ON t."FromBinId" = b."Id" WHERE t."WaveId" = $1 OR t."WaveId" = $2',
        [waveIdStr, waveNo]
      );
      
      console.log(`Found ${tasksRes.rows.length} pick tasks:`);
      tasksRes.rows.forEach(t => {
        console.log(`- TaskId: ${t.Id}, Qty: ${t.Quantity}, Status: ${t.Status}, OutboundOrderLineId: ${t.OutboundOrderLineId}, OperatorId: ${t.OperatorId}`);
      });
    }
  } catch (err) {
    console.error('Query Error:', err);
  } finally {
    await wmsClient.end();
  }
}

checkWave();
