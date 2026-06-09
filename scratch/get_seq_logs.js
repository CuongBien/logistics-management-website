const client = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 8081,
  path: '/api/events?count=20',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

const req = client.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const logs = JSON.parse(data);
      console.log("Recent Seq Logs Count:", logs.length);
      for (const log of logs) {
        // filter for exceptions or warnings
        if (log.Level === 'Error' || log.Level === 'Fatal' || log.Exception) {
          console.log(`[${log.Timestamp}] [${log.Level}] ${log.MessageTemplate}`);
          if (log.Exception) {
            console.log("Exception:", log.Exception);
          }
          console.log("-----------------------------------------");
        }
      }
    } catch (e) {
      console.error("Failed to parse JSON:", e.message);
      console.log("Raw response:", data.slice(0, 1000));
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
