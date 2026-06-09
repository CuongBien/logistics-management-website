const http = require('http');

const server = http.createServer((req, res) => {
  console.log('Received request:', req.method, req.url);
  
  if (req.url.startsWith('/api/skus')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      items: [
        {
          erpSkuId: '00000000-0000-0000-0000-000000000002',
          skuCode: 'A0-002',
          name: 'Product A0-002',
          unitOfMeasure: 'PCS',
          status: 'active',
          updatedAtErp: new Date().toISOString()
        }
      ],
      nextCursor: ''
    }));
  } else if (req.url.startsWith('/api/warehouses')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      items: [],
      nextCursor: ''
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(5009, '0.0.0.0', () => {
  console.log('Dummy MasterData Server running on port 5009. Waiting for ErpSyncWorker to hit...');
});
