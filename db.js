const sql = require('mssql');

const config = {
  server: 'localhost\\MSSQLSERVER02',
  database: 'RetailOnlineDB_v2',
  port: 50920,
  user: 'rfmuser',
  password: 'Rfm1234!',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  }
};

let pool = null;

async function getPool() {
  if (pool) return pool;
  try {
    pool = await sql.connect(config);
    console.log('✅ Conectado a SQL Server — RetailOnlineDB_v2');
    return pool;
  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  }
}

module.exports = { getPool, sql };