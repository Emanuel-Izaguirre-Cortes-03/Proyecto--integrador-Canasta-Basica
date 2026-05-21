// Verificar ventas de hoy
const { getPool, sql } = require('./db');

async function verificarVentasRecientes() {
  try {
    const pool = await getPool();

    console.log('\n=== Ventas de hoy ===\n');
    const hoy = await pool.request().query(`
      SELECT
        v.VentaID,
        v.Fecha,
        v.ClienteID,
        c.Nombre AS ClienteNombre,
        v.Total,
        v.MetodoPago
      FROM Ventas v
      LEFT JOIN Clientes c ON v.ClienteID = c.ClienteID
      WHERE CAST(v.Fecha AS DATE) = CAST(GETDATE() AS DATE)
      ORDER BY v.Fecha DESC
    `);

    if (hoy.recordset.length > 0) {
      console.log(`Encontradas ${hoy.recordset.length} ventas de hoy:`);
      console.table(hoy.recordset);
    } else {
      console.log('No se encontraron ventas de hoy');
    }

    console.log('\n=== Ventas de los últimos 7 días ===\n');
    const ultimos7 = await pool.request().query(`
      SELECT
        v.VentaID,
        v.Fecha,
        v.ClienteID,
        c.Nombre AS ClienteNombre,
        v.Total,
        DATEDIFF(DAY, v.Fecha, GETDATE()) AS DiasAtras
      FROM Ventas v
      LEFT JOIN Clientes c ON v.ClienteID = c.ClienteID
      WHERE v.Fecha >= DATEADD(DAY, -7, GETDATE())
      ORDER BY v.Fecha DESC
    `);

    if (ultimos7.recordset.length > 0) {
      console.log(`Encontradas ${ultimos7.recordset.length} ventas en los últimos 7 días:`);
      console.table(ultimos7.recordset);
    } else {
      console.log('No se encontraron ventas en los últimos 7 días');
    }

    console.log('\n=== Clientes más nuevos (por FechaRegistro) ===\n');
    const clientesNuevos = await pool.request().query(`
      SELECT TOP 10
        ClienteID,
        Nombre,
        FechaRegistro,
        DATEDIFF(DAY, FechaRegistro, GETDATE()) AS DiasDesdeRegistro
      FROM Clientes
      ORDER BY FechaRegistro DESC
    `);

    console.table(clientesNuevos.recordset);

    console.log('\n=== Última venta registrada ===\n');
    const ultima = await pool.request().query(`
      SELECT TOP 1
        v.VentaID,
        v.Fecha,
        v.ClienteID,
        c.Nombre AS ClienteNombre,
        v.Total,
        DATEDIFF(DAY, v.Fecha, GETDATE()) AS DiasAtras
      FROM Ventas v
      LEFT JOIN Clientes c ON v.ClienteID = c.ClienteID
      ORDER BY v.Fecha DESC
    `);

    console.table(ultima.recordset);

    process.exit(0);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

verificarVentasRecientes();
