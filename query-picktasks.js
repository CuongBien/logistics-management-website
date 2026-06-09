const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'lms_wms_dev',
  password: 'postgres',
  port: 56432,
});
client.connect()
  .then(() => client.query('SELECT count(*) FROM "PickTasks"'))
  .then(res => console.log('PickTasks count:', res.rows[0].count))
  .then(() => client.end())
  .catch(err => console.error('Error:', err.message));
