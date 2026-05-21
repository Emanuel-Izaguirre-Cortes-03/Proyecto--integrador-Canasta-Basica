// Script para probar la actualización de RFM
const { getPool, sql } = require('./db');

async function actualizarRFM() {
  try {
    const pool = await getPool();

    console.log('Actualizando tabla RFM...\n');

    // Limpiar la tabla
    await pool.request().query('TRUNCATE TABLE Clientes_RFM');

    // Recalcular RFM - CORREGIDO: Usar ClienteID en lugar de VentaID
    const query = `
      INSERT INTO Clientes_RFM (ClienteID, Recencia, Frecuencia, MontoTotal, TicketPromedio, Tipo_Cliente)
      SELECT
        v.ClienteID,
        DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) AS Recencia,
        COUNT(*) AS Frecuencia,
        SUM(v.Total) AS MontoTotal,
        AVG(v.Total) AS TicketPromedio,
        CASE
          WHEN DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) <= 2 AND COUNT(*) <= 2 THEN 'Nuevo'
          WHEN DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) > 120 AND COUNT(*) <= 3 THEN 'Inactivo'
          WHEN (
            CASE WHEN DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) <= 7 THEN 3
                 WHEN DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) <= 30 THEN 2
                 ELSE 1 END +
            CASE WHEN COUNT(*) >= 15 THEN 3
                 WHEN COUNT(*) >= 5 THEN 2
                 ELSE 1 END +
            CASE WHEN SUM(v.Total) >= 5000 THEN 3
                 WHEN SUM(v.Total) >= 1500 THEN 2
                 ELSE 1 END
          ) >= 8 THEN 'VIP'
          ELSE 'Regular'
        END
      FROM Ventas v
      GROUP BY v.ClienteID
      HAVING COUNT(*) > 0
    `;

    await pool.request().query(query);

    // Obtener estadísticas
    const stats = await pool.request().query(`
      SELECT
        COUNT(*) AS TotalClientes,
        SUM(CASE WHEN Tipo_Cliente = 'VIP' THEN 1 ELSE 0 END) AS Clientes_VIP,
        SUM(CASE WHEN Tipo_Cliente = 'Regular' THEN 1 ELSE 0 END) AS Clientes_Regular,
        SUM(CASE WHEN Tipo_Cliente = 'Nuevo' THEN 1 ELSE 0 END) AS Clientes_Nuevo,
        SUM(CASE WHEN Tipo_Cliente = 'Inactivo' THEN 1 ELSE 0 END) AS Clientes_Inactivo
      FROM Clientes_RFM
    `);

    console.log('✅ Tabla RFM actualizada correctamente\n');
    console.log('Estadísticas:');
    console.table(stats.recordset[0]);

    // Ver algunos clientes nuevos si existen
    const nuevos = await pool.request().query(`
      SELECT TOP 10
        c.ClienteID,
        cl.Nombre,
        c.Recencia,
        c.Frecuencia,
        c.MontoTotal,
        c.Tipo_Cliente
      FROM Clientes_RFM c
      LEFT JOIN Clientes cl ON c.ClienteID = cl.ClienteID
      WHERE c.Tipo_Cliente = 'Nuevo'
      ORDER BY c.Recencia ASC
    `);

    if (nuevos.recordset.length > 0) {
      console.log('\n📋 Clientes NUEVOS encontrados:');
      console.table(nuevos.recordset);
    } else {
      console.log('\n⚠️  No se encontraron clientes NUEVOS');
      console.log('Criterios para ser NUEVO:');
      console.log('  - Recencia <= 2 días (compró hoy o ayer)');
      console.log('  - Frecuencia <= 2 compras\n');

      // Mostrar los clientes más recientes
      const recientes = await pool.request().query(`
        SELECT TOP 10
          c.ClienteID,
          cl.Nombre,
          c.Recencia,
          c.Frecuencia,
          c.MontoTotal,
          c.Tipo_Cliente
        FROM Clientes_RFM c
        LEFT JOIN Clientes cl ON c.ClienteID = cl.ClienteID
        ORDER BY c.Recencia ASC, c.Frecuencia ASC
      `);

      console.log('Los 10 clientes más recientes:');
      console.table(recientes.recordset);
    }

    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

actualizarRFM();
