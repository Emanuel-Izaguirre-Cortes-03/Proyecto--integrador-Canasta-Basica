// Test de la tabla Clientes
const { getPool, sql } = require('./db');

async function testClientes() {
  try {
    const pool = await getPool();

    // 1. Ver clientes RFM inactivos
    console.log('1. Clientes RFM Inactivos:');
    const rfm = await pool.request().query(`
      SELECT TOP 5 ClienteID, Tipo_Cliente, Recencia, Frecuencia, MontoTotal
      FROM Clientes_RFM
      WHERE Tipo_Cliente = 'Inactivo'
    `);
    console.log(rfm.recordset);

    // 2. Ver si existen en tabla Clientes
    console.log('\n2. Verificar tabla Clientes:');
    const clientes = await pool.request().query(`
      SELECT TOP 5 * FROM Clientes WHERE ClienteID IN (6034, 6040, 6036)
    `);
    console.log(`Clientes encontrados: ${clientes.recordset.length}`);
    console.log(clientes.recordset);

    // 3. Hacer el JOIN como en la query original
    console.log('\n3. JOIN Clientes_RFM con Clientes:');
    const join = await pool.request().query(`
      SELECT c.ClienteID, cl.Nombre, c.Tipo_Cliente
      FROM Clientes_RFM c
      INNER JOIN Clientes cl ON c.ClienteID = cl.ClienteID
      WHERE c.ClienteID IN (6034, 6040, 6036)
    `);
    console.log(`Registros con JOIN: ${join.recordset.length}`);
    console.log(join.recordset);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

testClientes();
