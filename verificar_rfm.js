// Script para verificar estructura de Clientes_RFM
const { getPool, sql } = require('./db');

async function verificarEstructura() {
  try {
    const pool = await getPool();

    // Verificar si existe la tabla/vista Clientes_RFM
    console.log('\n=== Verificando estructura Clientes_RFM ===\n');

    const checkTable = await pool.request().query(`
      SELECT
        OBJECT_ID('Clientes_RFM') as ObjectID,
        TYPE_DESC = CASE
          WHEN OBJECT_ID('Clientes_RFM', 'U') IS NOT NULL THEN 'Tabla'
          WHEN OBJECT_ID('Clientes_RFM', 'V') IS NOT NULL THEN 'Vista'
          ELSE 'No existe'
        END
    `);

    console.log('Tipo:', checkTable.recordset[0]);

    // Ver columnas primero
    console.log('\n=== Columnas de Clientes_RFM ===\n');
    const columns = await pool.request().query(`
      SELECT c.name AS Columna
      FROM sys.columns c
      WHERE c.object_id = OBJECT_ID('Clientes_RFM')
    `);
    console.table(columns.recordset);

    // Ver las últimas 10 registros
    console.log('\n=== Últimos 10 registros en Clientes_RFM ===\n');
    const clientes = await pool.request().query(`
      SELECT TOP 10 *
      FROM Clientes_RFM
      ORDER BY ClienteID DESC
    `);

    console.table(clientes.recordset);

    // Verificar nuevos clientes (recencia = 0 o muy baja)
    console.log('\n=== Clientes con Recencia <= 7 días ===\n');
    const nuevos = await pool.request().query(`
      SELECT
        c.ClienteID,
        cl.Nombre,
        c.Recencia,
        c.Frecuencia,
        c.MontoTotal,
        c.Tipo_Cliente
      FROM Clientes_RFM c
      LEFT JOIN Clientes cl ON c.ClienteID = cl.ClienteID
      WHERE c.Recencia <= 7
      ORDER BY c.Recencia ASC
    `);

    console.table(nuevos.recordset);

    // Ver si hay procedimiento almacenado para actualizar
    console.log('\n=== Procedimientos almacenados relacionados con RFM ===\n');
    const procs = await pool.request().query(`
      SELECT name, type_desc
      FROM sys.objects
      WHERE type IN ('P', 'FN', 'IF', 'TF')
        AND name LIKE '%RFM%'
    `);

    console.table(procs.recordset);

    // Verificar la definición de la vista/tabla
    console.log('\n=== Definición de Clientes_RFM ===\n');
    const def = await pool.request().query(`
      SELECT OBJECT_DEFINITION(OBJECT_ID('Clientes_RFM')) AS Definicion
    `);

    if (def.recordset[0].Definicion) {
      console.log(def.recordset[0].Definicion);
    } else {
      console.log('Es una tabla, no una vista. Mostrando columnas:');
      const columns = await pool.request().query(`
        SELECT
          c.name AS Columna,
          t.name AS Tipo,
          c.max_length AS Longitud
        FROM sys.columns c
        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID('Clientes_RFM')
      `);
      console.table(columns.recordset);
    }

    process.exit(0);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

verificarEstructura();
