// Crear venta para el cliente Jorge
const { getPool, sql } = require('./db');

async function crearVentaJorge() {
  try {
    const pool = await getPool();

    console.log('\n=== Creando venta para cliente Jorge (ID: 5001) ===\n');

    // Insertar nueva venta (VentaID es auto-incremento)
    const result = await pool.request()
      .input('Fecha', sql.DateTime, new Date())
      .input('ClienteID', sql.Int, 5001)
      .input('VendedorID', sql.Int, 1)
      .input('Total', sql.Float, 1200.50)
      .input('MetodoPago', sql.NVarChar(20), 'TC')
      .input('NumProductos', sql.Int, 5)
      .query(`
        INSERT INTO Ventas (Fecha, ClienteID, VendedorID, Total, MetodoPago, NumProductos)
        VALUES (@Fecha, @ClienteID, @VendedorID, @Total, @MetodoPago, @NumProductos);
        SELECT SCOPE_IDENTITY() AS NuevoID;
      `);

    const nuevoVentaID = result.recordset[0].NuevoID;
    console.log(`✅ Venta ${nuevoVentaID} creada exitosamente para Jorge`);

    // Verificar la venta
    const venta = await pool.request().query(`
      SELECT
        v.VentaID,
        v.Fecha,
        v.ClienteID,
        c.Nombre,
        v.Total,
        v.MetodoPago,
        DATEDIFF(DAY, v.Fecha, GETDATE()) AS Recencia
      FROM Ventas v
      INNER JOIN Clientes c ON v.ClienteID = c.ClienteID
      WHERE v.VentaID = ${nuevoVentaID}
    `);

    console.log('\nVenta creada:');
    console.table(venta.recordset);

    // Actualizar RFM
    console.log('\n=== Actualizando tabla RFM ===\n');

    await pool.request().query('TRUNCATE TABLE Clientes_RFM');

    const queryRFM = `
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

    await pool.request().query(queryRFM);

    // Verificar cliente Jorge en RFM
    const jorgeRFM = await pool.request().query(`
      SELECT
        c.ClienteID,
        cl.Nombre,
        c.Recencia,
        c.Frecuencia,
        c.MontoTotal,
        c.TicketPromedio,
        c.Tipo_Cliente
      FROM Clientes_RFM c
      INNER JOIN Clientes cl ON c.ClienteID = cl.ClienteID
      WHERE c.ClienteID = 5001
    `);

    console.log('✅ Cliente Jorge en RFM:');
    console.table(jorgeRFM.recordset);

    // Mostrar todos los clientes nuevos
    const nuevos = await pool.request().query(`
      SELECT
        c.ClienteID,
        cl.Nombre,
        c.Recencia,
        c.Frecuencia,
        c.MontoTotal,
        c.Tipo_Cliente
      FROM Clientes_RFM c
      INNER JOIN Clientes cl ON c.ClienteID = cl.ClienteID
      WHERE c.Tipo_Cliente = 'Nuevo'
      ORDER BY c.Recencia ASC
    `);

    console.log(`\n📋 Total de clientes NUEVOS: ${nuevos.recordset.length}`);
    if (nuevos.recordset.length > 0) {
      console.table(nuevos.recordset);
    }

    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

crearVentaJorge();
