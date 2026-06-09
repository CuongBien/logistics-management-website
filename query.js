const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'lms_wms_dev',
  password: 'postgres',
  port: 56432,
});
client.connect()
  .then(() => client.query('SELECT "Id", "BinCode", "Aisle", "Rack", "Shelf", "Status" FROM "Bins" LIMIT 10'))
  .then(res => console.log('Bins:', res.rows))
  .then(() => client.end())
  .catch(err => console.error('Error:', err.message));
