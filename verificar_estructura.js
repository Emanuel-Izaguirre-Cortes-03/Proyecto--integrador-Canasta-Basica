// Verificar estructura de tablas
const { getPool, sql } = require('./db');

async function verificarEstructura() {
  try {
    const pool = await getPool();

    console.log('\n=== Estructura de tabla Ventas ===\n');
    const ventasColumns = await pool.request().query(`
      SELECT
        c.name AS Columna,
        t.name AS Tipo
      FROM sys.columns c
      INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
      WHERE c.object_id = OBJECT_ID('Ventas')
      ORDER BY c.column_id
    `);
    console.table(ventasColumns.recordset);

    console.log('\n=== Primeras 5 ventas ===\n');
    const ventas = await pool.request().query('SELECT TOP 5 * FROM Ventas');
    console.table(ventas.recordset);

    console.log('\n=== Estructura de tabla Clientes ===\n');
    const clientesColumns = await pool.request().query(`
      SELECT
        c.name AS Columna,
        t.name AS Tipo
      FROM sys.columns c
      INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
      WHERE c.object_id = OBJECT_ID('Clientes')
      ORDER BY c.column_id
    `);
    console.table(clientesColumns.recordset);

    console.log('\n=== Primeros 5 clientes ===\n');
    const clientes = await pool.request().query('SELECT TOP 5 * FROM Clientes');
    console.table(clientes.recordset);

    console.log('\n=== Restricciones FK de Clientes_RFM ===\n');
    const fks = await pool.request().query(`
      SELECT
        fk.name AS FK_Name,
        OBJECT_NAME(fk.parent_object_id) AS Tabla,
        COL_NAME(fc.parent_object_id, fc.parent_column_id) AS Columna,
        OBJECT_NAME(fk.referenced_object_id) AS TablaReferencia,
        COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ColumnaReferencia
      FROM sys.foreign_keys AS fk
      INNER JOIN sys.foreign_key_columns AS fc
        ON fk.object_id = fc.constraint_object_id
      WHERE OBJECT_NAME(fk.parent_object_id) = 'Clientes_RFM'
    `);
    console.table(fks.recordset);

    process.exit(0);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

verificarEstructura();
