// Test de la query completa de campañas
const { getPool } = require('./db');

async function testQueryCompleta() {
  try {
    const pool = await getPool();
    const clienteIDs = [6034, 6040, 6036];

    console.log('Testing query completa para clientes:', clienteIDs);

    const query = `
      SELECT
        c.ClienteID,
        cl.Nombre,
        cat.Nombre AS CategoriaFavorita
      FROM Clientes_RFM c
      INNER JOIN Clientes cl ON c.ClienteID = cl.ClienteID
      OUTER APPLY (
        SELECT TOP 1 cat.Nombre
        FROM Detalle_Ventas dv
        INNER JOIN Ventas v ON dv.VentaID = v.VentaID
        INNER JOIN Productos p ON dv.ProductoID = p.ProductoID
        INNER JOIN Categorias cat ON p.CategoriaID = cat.CategoriaID
        WHERE v.ClienteID = c.ClienteID
        GROUP BY cat.Nombre
        ORDER BY SUM(dv.Subtotal) DESC
      ) cat
      WHERE c.ClienteID IN (${clienteIDs.join(',')})
    `;

    console.log('\nQuery:\n', query);

    const result = await pool.request().query(query);

    console.log(`\n✓ Resultados: ${result.recordset.length}`);
    console.log(result.recordset);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit();
  }
}

testQueryCompleta();
