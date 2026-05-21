// server.js — API Backend RetailOnlineDB RFM
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { getPool, sql } = require('./db');
// Reportes PDF Simples - Solo tablas
const { generarReporteRFMFinal } = require('./utils/reportRFM_final');
const { generarCatalogoFinal } = require('./utils/reportCatalogo_final');
const { generarCuponesFinal } = require('./utils/reportCupones_final');
const { generarAprioriFinal } = require('./utils/reportApriori_final');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ─────────────────────────────────────────
//  CU-05: CLASIFICAR CLIENTE RFM
//  POST /api/rfm/clasificar
//  Body: { recencia, frecuencia, monto }
// ─────────────────────────────────────────
app.post('/api/rfm/clasificar', async (req, res) => {
  const { recencia, frecuencia, monto } = req.body;

  if (recencia == null || frecuencia == null || monto == null) {
    return res.status(400).json({ error: 'Faltan campos: recencia, frecuencia, monto' });
  }

  // Scoring 1-3 por dimensión
  const sr = recencia  <= 7   ? 3 : recencia  <= 30  ? 2 : 1;
  const sf = frecuencia >= 15  ? 3 : frecuencia >= 5   ? 2 : 1;
  const sm = monto      >= 5000 ? 3 : monto      >= 1500 ? 2 : 1;
  const score = sr + sf + sm;

  let segmento;
  if (recencia === 0 && frecuencia <= 2)        segmento = 'Nuevo';
  else if (recencia > 120 && frecuencia <= 3)   segmento = 'Inactivo';
  else if (score >= 8)                          segmento = 'VIP';
  else if (score >= 5)                          segmento = 'Regular';
  else if (score <= 3 && recencia > 90)         segmento = 'Inactivo';
  else                                          segmento = 'Regular';

  const descripciones = {
    VIP:      'Cliente de alto valor: compra frecuente, monto elevado y compra reciente.',
    Regular:  'Cliente activo con comportamiento intermedio. Potencial de evolución a VIP.',
    Nuevo:    'Cliente recién ingresado. Necesita estímulos para generar la segunda compra.',
    Inactivo: 'Cliente en riesgo de churn. Requiere campaña de reactivación personalizada.',
  };

  const ofertas = {
    VIP:      '5% cashback + envío gratis + acceso anticipado a colecciones',
    Regular:  'Cupón $200 al alcanzar $2,000 mensuales + doble puntos',
    Nuevo:    '25% en primera compra + envío gratis primeras 3 compras',
    Inactivo: '30% en categoría favorita + regalo sorpresa al reactivarse',
  };

  res.json({
    segmento,
    score,
    scores: { recencia: sr, frecuencia: sf, monto: sm },
    descripcion: descripciones[segmento],
    oferta: ofertas[segmento],
  });
});

// ─────────────────────────────────────────
//  CU-05: LISTAR CLIENTES CLASIFICADOS
//  GET /api/rfm/clientes?segmento=VIP&limit=100
// ─────────────────────────────────────────
app.get('/api/rfm/clientes', async (req, res) => {
  try {
    const pool = await getPool();
    const { segmento, limit = 200 } = req.query;

    const query = `
      SELECT TOP (@limit)
        c.ClienteID,
        cl.Nombre,
        c.Recencia,
        c.Frecuencia,
        CAST(c.MontoTotal AS DECIMAL(12,2)) AS Monto,
        c.TicketPromedio,
        c.Tipo_Cliente AS Segmento
      FROM Clientes_RFM c
      INNER JOIN Clientes cl ON c.ClienteID = cl.ClienteID
      ${segmento && segmento !== 'todos' ? 'WHERE c.Tipo_Cliente = @segmento' : ''}
      ORDER BY c.MontoTotal DESC
    `;

    const request = pool.request()
      .input('limit', sql.Int, parseInt(limit));

    if (segmento && segmento !== 'todos') {
      request.input('segmento', sql.VarChar(20), segmento);
    }

    const result = await request.query(query);
    res.json({ clientes: result.recordset, total: result.recordset.length });

  } catch (err) {
    console.error('Error /api/rfm/clientes:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
//  CU-07: REPORTE — RESUMEN POR SEGMENTO
//  GET /api/reporte/resumen
// ─────────────────────────────────────────
app.get('/api/reporte/resumen', async (req, res) => {
  try {
    const pool = await getPool();

    // CORREGIDO: Leer directamente de Clientes_RFM en lugar de recalcular desde Ventas
    const query = `
      SELECT
        Tipo_Cliente AS Segmento,
        COUNT(*) AS TotalClientes,
        CAST(AVG(TicketPromedio) AS DECIMAL(12,2)) AS TicketPromedio,
        CAST(SUM(MontoTotal) AS DECIMAL(14,2)) AS VentasTotal,
        CAST(AVG(Recencia) AS DECIMAL(8,1)) AS RecenciaPromedio,
        CAST(AVG(CAST(Frecuencia AS FLOAT)) AS DECIMAL(8,1)) AS FrecuenciaPromedio
      FROM Clientes_RFM
      GROUP BY Tipo_Cliente
      ORDER BY VentasTotal DESC
    `;

    const result = await pool.request().query(query);
    res.json({ segmentos: result.recordset });

  } catch (err) {
    console.error('Error /api/reporte/resumen:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
//  CU-07: TOP CATEGORÍAS POR SEGMENTO
//  GET /api/reporte/categorias
// ─────────────────────────────────────────
app.get('/api/reporte/categorias', async (req, res) => {
  try {
    const pool = await getPool();

    // CORREGIDO: Usar Clientes_RFM en lugar de recalcular segmentos desde Ventas
    const query = `
      SELECT TOP 20
        rfm.Tipo_Cliente AS Segmento,
        LEFT(d.Descripcion, 15) AS Categoria,
        COUNT(*) AS Frecuencia,
        SUM(d.Subtotal) AS VentasCategoria
      FROM Detalle_Ventas d
      INNER JOIN Ventas v ON d.VentaID = v.VentaID
      INNER JOIN Clientes_RFM rfm ON v.ClienteID = rfm.ClienteID
      GROUP BY rfm.Tipo_Cliente, LEFT(d.Descripcion, 15)
      ORDER BY rfm.Tipo_Cliente, Frecuencia DESC
    `;

    const result = await pool.request().query(query);
    res.json({ categorias: result.recordset });

  } catch (err) {
    console.error('Error /api/reporte/categorias:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
//  CU-07: KPIs GENERALES
//  GET /api/reporte/kpis
// ─────────────────────────────────────────
app.get('/api/reporte/kpis', async (req, res) => {
  try {
    const pool = await getPool();

    // CORREGIDO: Contar clientes desde Clientes_RFM, no VentaID
    const query = `
      SELECT
        (SELECT COUNT(*) FROM Clientes_RFM)                       AS TotalClientes,
        (SELECT COUNT(*) FROM Ventas)                              AS TotalVentas,
        (SELECT CAST(SUM(Total) AS DECIMAL(14,2)) FROM Ventas)    AS VentasTotales,
        (SELECT CAST(AVG(Total) AS DECIMAL(10,2)) FROM Ventas)    AS TicketPromedio,
        (SELECT COUNT(*) FROM Productos)                           AS TotalProductos,
        (SELECT COUNT(*) FROM Detalle_Ventas)                      AS TotalLineas
    `;

    const result = await pool.request().query(query);
    res.json(result.recordset[0]);

  } catch (err) {
    console.error('Error /api/reporte/kpis:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
//  CU-01: LISTAR CATEGORÍAS
//  GET /api/categorias
// ─────────────────────────────────────────
app.get('/api/categorias', async (req, res) => {
  try {
    const pool = await getPool();

    const query = `
      SELECT
        c.CategoriaID,
        c.Nombre,
        c.Descripcion,
        COUNT(p.ProductoID) AS TotalProductos
      FROM Categorias c
      LEFT JOIN Productos p ON c.CategoriaID = p.CategoriaID
      GROUP BY c.CategoriaID, c.Nombre, c.Descripcion
      ORDER BY c.Nombre
    `;

    const result = await pool.request().query(query);
    res.json(result.recordset);

  } catch (err) {
    console.error('Error /api/categorias:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
//  CU-01: LISTAR PRODUCTOS
//  GET /api/productos?categoria=&buscar=&limit=50
// ─────────────────────────────────────────
app.get('/api/productos', async (req, res) => {
  try {
    const pool = await getPool();
    const { categoria, buscar, limit = 50 } = req.query;

    let whereClause = '';
    const conditions = [];

    if (categoria) {
      conditions.push('p.CategoriaID = @categoria');
    }
    if (buscar) {
      conditions.push('(p.Nombre LIKE @buscar OR p.Marca LIKE @buscar)');
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const query = `
      SELECT TOP (@limit)
        p.ProductoID,
        p.Nombre,
        p.Descripcion,
        CAST(p.Precio AS DECIMAL(10,2)) AS Precio,
        p.Marca,
        p.Presentacion,
        c.Nombre AS CategoriaNombre
      FROM Productos p
      LEFT JOIN Categorias c ON p.CategoriaID = c.CategoriaID
      ${whereClause}
      ORDER BY p.Nombre
    `;

    const request = pool.request()
      .input('limit', sql.Int, parseInt(limit));

    if (categoria) {
      request.input('categoria', sql.Int, parseInt(categoria));
    }
    if (buscar) {
      request.input('buscar', sql.VarChar(100), `%${buscar}%`);
    }

    const result = await request.query(query);
    res.json({ productos: result.recordset, total: result.recordset.length });

  } catch (err) {
    console.error('Error /api/productos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
//  CU-02: RECOMENDACIONES BASADAS EN APRIORI
//  GET /api/recomendaciones?categoriaID=1
// ─────────────────────────────────────────
app.get('/api/recomendaciones', async (req, res) => {
  try {
    const pool = await getPool();
    const { categoriaID } = req.query;

    if (!categoriaID) {
      return res.status(400).json({ error: 'Falta parámetro categoriaID' });
    }

    // Encontrar categorías que se compran juntas
    const queryAsociaciones = `
      WITH VentasConCategoria AS (
        SELECT DISTINCT v.VentaID
        FROM Detalle_Ventas dv
        INNER JOIN Productos p ON dv.ProductoID = p.ProductoID
        INNER JOIN Ventas v ON dv.VentaID = v.VentaID
        WHERE p.CategoriaID = @categoriaID
      )
      SELECT TOP 5
        c.CategoriaID,
        c.Nombre AS CategoriaNombre,
        COUNT(DISTINCT dv.VentaID) AS Frecuencia,
        CAST(COUNT(DISTINCT dv.VentaID) * 100.0 / (SELECT COUNT(*) FROM VentasConCategoria) AS DECIMAL(5,2)) AS Soporte
      FROM VentasConCategoria vc
      INNER JOIN Detalle_Ventas dv ON vc.VentaID = dv.VentaID
      INNER JOIN Productos p ON dv.ProductoID = p.ProductoID
      INNER JOIN Categorias c ON p.CategoriaID = c.CategoriaID
      WHERE c.CategoriaID != @categoriaID
      GROUP BY c.CategoriaID, c.Nombre
      ORDER BY Frecuencia DESC
    `;

    const result = await pool.request()
      .input('categoriaID', sql.Int, parseInt(categoriaID))
      .query(queryAsociaciones);

    const asociaciones = result.recordset;

    // Obtener productos de las categorías recomendadas
    let productos = [];
    if (asociaciones.length > 0) {
      const categoriaIDs = asociaciones.map(a => a.CategoriaID).join(',');
      const queryProductos = `
        SELECT TOP 12
          p.ProductoID,
          p.Nombre,
          CAST(p.Precio AS DECIMAL(10,2)) AS Precio,
          p.Marca,
          c.Nombre AS CategoriaNombre
        FROM Productos p
        INNER JOIN Categorias c ON p.CategoriaID = c.CategoriaID
        WHERE p.CategoriaID IN (${categoriaIDs})
        ORDER BY NEWID()
      `;

      const prodResult = await pool.request().query(queryProductos);
      productos = prodResult.recordset;
    }

    res.json({ asociaciones, productos });

  } catch (err) {
    console.error('Error /api/recomendaciones:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
//  CU-04: GENERAR COMBOS ANTI-MERMA
//  GET /api/combos
// ─────────────────────────────────────────
app.get('/api/combos', async (req, res) => {
  try {
    const pool = await getPool();

    // Calcular soporte de categorías
    const querySoporte = `
      SELECT
        c.Nombre AS CategoriaNombre,
        COUNT(DISTINCT dv.VentaID) AS Frecuencia,
        CAST(COUNT(DISTINCT dv.VentaID) * 100.0 / (SELECT COUNT(DISTINCT VentaID) FROM Detalle_Ventas) AS DECIMAL(5,2)) AS Soporte
      FROM Detalle_Ventas dv
      INNER JOIN Productos p ON dv.ProductoID = p.ProductoID
      INNER JOIN Categorias c ON p.CategoriaID = c.CategoriaID
      GROUP BY c.Nombre
      ORDER BY Soporte DESC
    `;

    const result = await pool.request().query(querySoporte);
    const categorias = result.recordset;

    // Generar 4 combos
    const combos = [];

    if (categorias.length >= 4) {
      // Combo 1: Anti-Merma (baja rotación + alta rotación)
      const bajaRotacion = categorias[categorias.length - 1];
      const altaRotacion = categorias[0];
      combos.push({
        nombre: '🌿 Combo Anti-Merma',
        mecanica: `Lleva ${altaRotacion.CategoriaNombre} y ${bajaRotacion.CategoriaNombre} juntos`,
        descuento: 20,
        categorias: [altaRotacion.CategoriaNombre, bajaRotacion.CategoriaNombre],
        tipo: 'anti-merma'
      });

      // Combo 2: Cross-Selling (top 2 categorías)
      if (categorias.length >= 2) {
        combos.push({
          nombre: '⚡ Combo Cross-Sell',
          mecanica: `Los más vendidos: ${categorias[0].CategoriaNombre} + ${categorias[1].CategoriaNombre}`,
          descuento: 15,
          categorias: [categorias[0].CategoriaNombre, categorias[1].CategoriaNombre],
          tipo: 'cross-selling'
        });
      }

      // Combo 3: Premium (top 3)
      if (categorias.length >= 3) {
        combos.push({
          nombre: '💎 Pack Premium',
          mecanica: `Triple combo premium: ${categorias[0].CategoriaNombre}, ${categorias[1].CategoriaNombre}, ${categorias[2].CategoriaNombre}`,
          descuento: 25,
          categorias: [categorias[0].CategoriaNombre, categorias[1].CategoriaNombre, categorias[2].CategoriaNombre],
          tipo: 'premium'
        });
      }

      // Combo 4: Value (rotación media)
      const mid = Math.floor(categorias.length / 2);
      if (categorias.length > mid + 1) {
        combos.push({
          nombre: '🎯 Combo Value',
          mecanica: `Aprovecha: ${categorias[mid].CategoriaNombre} + ${categorias[mid + 1].CategoriaNombre}`,
          descuento: 12,
          categorias: [categorias[mid].CategoriaNombre, categorias[mid + 1].CategoriaNombre],
          tipo: 'value'
        });
      }
    }

    res.json({ combos });

  } catch (err) {
    console.error('Error /api/combos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
//  CU-06: EJECUTAR ALGORITMO APRIORI
//  POST /api/apriori/ejecutar
//  Body: { soporte_min, confianza_min }
// ─────────────────────────────────────────
app.post('/api/apriori/ejecutar', async (req, res) => {
  try {
    const pool = await getPool();
    const { soporte_min = 0.01, confianza_min = 0.3 } = req.body;

    const totalVentas = await pool.request().query('SELECT COUNT(DISTINCT VentaID) AS Total FROM Detalle_Ventas');
    const total = totalVentas.recordset[0].Total;
    const soporteMinCount = Math.ceil(total * soporte_min);

    // Encontrar itemsets de tamaño 2 (pares de categorías)
    const query = `
      WITH ItemSets AS (
        SELECT
          c1.Nombre AS Cat1,
          c2.Nombre AS Cat2,
          COUNT(DISTINCT dv1.VentaID) AS Frecuencia
        FROM Detalle_Ventas dv1
        INNER JOIN Productos p1 ON dv1.ProductoID = p1.ProductoID
        INNER JOIN Categorias c1 ON p1.CategoriaID = c1.CategoriaID
        INNER JOIN Detalle_Ventas dv2 ON dv1.VentaID = dv2.VentaID AND dv1.ProductoID != dv2.ProductoID
        INNER JOIN Productos p2 ON dv2.ProductoID = p2.ProductoID
        INNER JOIN Categorias c2 ON p2.CategoriaID = c2.CategoriaID
        WHERE c1.Nombre < c2.Nombre
        GROUP BY c1.Nombre, c2.Nombre
        HAVING COUNT(DISTINCT dv1.VentaID) >= @soporteMin
      ),
      Cat1Count AS (
        SELECT
          c.Nombre AS CatNombre,
          COUNT(DISTINCT dv.VentaID) AS Total
        FROM Detalle_Ventas dv
        INNER JOIN Productos p ON dv.ProductoID = p.ProductoID
        INNER JOIN Categorias c ON p.CategoriaID = c.CategoriaID
        GROUP BY c.Nombre
      )
      SELECT TOP 20
        i.Cat1 AS Antecedente,
        i.Cat2 AS Consecuente,
        CAST(i.Frecuencia * 1.0 / @totalVentas AS DECIMAL(6,4)) AS Soporte,
        CAST(i.Frecuencia * 1.0 / c1.Total AS DECIMAL(6,4)) AS Confianza,
        CAST((i.Frecuencia * 1.0 / @totalVentas) / ((c1.Total * 1.0 / @totalVentas) * (c2.Total * 1.0 / @totalVentas)) AS DECIMAL(6,2)) AS Lift
      FROM ItemSets i
      INNER JOIN Cat1Count c1 ON i.Cat1 = c1.CatNombre
      INNER JOIN Cat1Count c2 ON i.Cat2 = c2.CatNombre
      WHERE CAST(i.Frecuencia * 1.0 / c1.Total AS DECIMAL(6,4)) >= @confianzaMin
      ORDER BY Lift DESC, Soporte DESC
    `;

    const result = await pool.request()
      .input('soporteMin', sql.Int, soporteMinCount)
      .input('confianzaMin', sql.Decimal(6,4), confianza_min)
      .input('totalVentas', sql.Int, total)
      .query(query);

    res.json({
      reglas: result.recordset,
      parametros: { soporte_min, confianza_min, total_transacciones: total }
    });

  } catch (err) {
    console.error('Error /api/apriori/ejecutar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
//  CU-08: LISTAR CLIENTES INACTIVOS
//  GET /api/reactivacion/clientes
// ─────────────────────────────────────────
app.get('/api/reactivacion/clientes', async (req, res) => {
  try {
    const pool = await getPool();

    const query = `
      SELECT TOP 50
        c.ClienteID,
        cl.Nombre,
        c.Recencia,
        c.Frecuencia,
        CAST(c.MontoTotal AS DECIMAL(12,2)) AS MontoTotal,
        CAST(c.TicketPromedio AS DECIMAL(10,2)) AS TicketPromedio
      FROM Clientes_RFM c
      INNER JOIN Clientes cl ON c.ClienteID = cl.ClienteID
      WHERE c.Tipo_Cliente = 'Inactivo'
      ORDER BY c.MontoTotal DESC
    `;

    const result = await pool.request().query(query);
    res.json({ clientes: result.recordset });

  } catch (err) {
    console.error('Error /api/reactivacion/clientes:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
//  CU-08: GENERAR CAMPAÑA DE REACTIVACIÓN
//  POST /api/reactivacion/generar
//  Body: { clienteIDs: [1,2,3] }
// ─────────────────────────────────────────
app.post('/api/reactivacion/generar', async (req, res) => {
  try {
    const pool = await getPool();
    const { clienteIDs } = req.body;

    console.log('📧 Generando campañas para clientes:', clienteIDs);

    if (!clienteIDs || !Array.isArray(clienteIDs) || clienteIDs.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de clienteIDs' });
    }

    // Obtener categoría favorita de cada cliente
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

    console.log('Query:', query);
    const result = await pool.request().query(query);
    console.log('Clientes encontrados:', result.recordset.length);

    const campanas = result.recordset.map(cliente => {
      const cupon = `REACT${cliente.ClienteID}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      return {
        ClienteID: cliente.ClienteID,
        Nombre: cliente.Nombre,
        CategoriaFavorita: cliente.CategoriaFavorita || 'General',
        Oferta: `30% de descuento en ${cliente.CategoriaFavorita || 'toda la tienda'} + envío gratis`,
        Cupon: cupon
      };
    });

    console.log('Campañas generadas:', campanas.length);
    res.json({ campanas });

  } catch (err) {
    console.error('❌ Error /api/reactivacion/generar:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
//  CU-09: ACTUALIZAR TABLA RFM
//  POST /api/rfm/actualizar
// ─────────────────────────────────────────
app.post('/api/rfm/actualizar', async (req, res) => {
  try {
    const pool = await getPool();

    // Limpiar la tabla
    await pool.request().query('TRUNCATE TABLE Clientes_RFM');

    // Recalcular RFM
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

    res.json({
      mensaje: 'Tabla RFM actualizada correctamente',
      fecha: new Date().toISOString(),
      estadisticas: stats.recordset[0]
    });

  } catch (err) {
    console.error('Error /api/rfm/actualizar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
//  REPORTES PDF PROFESIONALES
// ─────────────────────────────────────────

// Reporte 1: Distribución RFM (PDF)
app.get('/api/reporte/rfm/pdf', async (req, res) => {
  try {
    const pool = await getPool();

    // Obtener datos de segmentos
    const querySegmentos = `
      SELECT
        Tipo_Cliente AS Segmento,
        COUNT(*) AS TotalClientes,
        CAST(AVG(TicketPromedio) AS DECIMAL(12,2)) AS TicketPromedio,
        CAST(SUM(MontoTotal) AS DECIMAL(14,2)) AS VentasTotal,
        CAST(AVG(Recencia) AS DECIMAL(8,1)) AS RecenciaPromedio,
        CAST(AVG(CAST(Frecuencia AS FLOAT)) AS DECIMAL(8,1)) AS FrecuenciaPromedio
      FROM Clientes_RFM
      GROUP BY Tipo_Cliente
      ORDER BY VentasTotal DESC
    `;

    const resultSegmentos = await pool.request().query(querySegmentos);

    // Obtener KPIs
    const queryKPIs = `
      SELECT
        (SELECT COUNT(*) FROM Clientes_RFM) AS TotalClientes,
        (SELECT COUNT(*) FROM Ventas) AS TotalVentas,
        (SELECT CAST(SUM(Total) AS DECIMAL(14,2)) FROM Ventas) AS VentasTotales,
        (SELECT CAST(AVG(Total) AS DECIMAL(10,2)) FROM Ventas) AS TicketPromedio,
        (SELECT COUNT(*) FROM Productos) AS TotalProductos,
        (SELECT COUNT(*) FROM Detalle_Ventas) AS TotalLineas
    `;

    const resultKPIs = await pool.request().query(queryKPIs);

    // Generar PDF (VERSIÓN FINAL - SIMPLE)
    const pdfBuffer = await generarReporteRFMFinal(
      resultSegmentos.recordset,
      resultKPIs.recordset[0]
    );

    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Reporte_RFM.pdf"');
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Error /api/reporte/rfm/pdf:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Reporte 2: Análisis Apriori (PDF)
app.post('/api/reporte/apriori/pdf', async (req, res) => {
  try {
    const pool = await getPool();
    const { soporte_min = 0.01, confianza_min = 0.3 } = req.body;

    const totalVentas = await pool.request().query('SELECT COUNT(DISTINCT VentaID) AS Total FROM Detalle_Ventas');
    const total = totalVentas.recordset[0].Total;
    const soporteMinCount = Math.ceil(total * soporte_min);

    // Encontrar reglas de asociación
    const query = `
      WITH ItemSets AS (
        SELECT
          c1.Nombre AS Cat1,
          c2.Nombre AS Cat2,
          COUNT(DISTINCT dv1.VentaID) AS Frecuencia
        FROM Detalle_Ventas dv1
        INNER JOIN Productos p1 ON dv1.ProductoID = p1.ProductoID
        INNER JOIN Categorias c1 ON p1.CategoriaID = c1.CategoriaID
        INNER JOIN Detalle_Ventas dv2 ON dv1.VentaID = dv2.VentaID AND dv1.ProductoID != dv2.ProductoID
        INNER JOIN Productos p2 ON dv2.ProductoID = p2.ProductoID
        INNER JOIN Categorias c2 ON p2.CategoriaID = c2.CategoriaID
        WHERE c1.Nombre < c2.Nombre
        GROUP BY c1.Nombre, c2.Nombre
        HAVING COUNT(DISTINCT dv1.VentaID) >= @soporteMin
      ),
      Cat1Count AS (
        SELECT
          c.Nombre AS CatNombre,
          COUNT(DISTINCT dv.VentaID) AS Total
        FROM Detalle_Ventas dv
        INNER JOIN Productos p ON dv.ProductoID = p.ProductoID
        INNER JOIN Categorias c ON p.CategoriaID = c.CategoriaID
        GROUP BY c.Nombre
      )
      SELECT TOP 20
        i.Cat1 AS Antecedente,
        i.Cat2 AS Consecuente,
        CAST(i.Frecuencia * 1.0 / @totalVentas AS DECIMAL(6,4)) AS Soporte,
        CAST(i.Frecuencia * 1.0 / c1.Total AS DECIMAL(6,4)) AS Confianza,
        CAST((i.Frecuencia * 1.0 / @totalVentas) / ((c1.Total * 1.0 / @totalVentas) * (c2.Total * 1.0 / @totalVentas)) AS DECIMAL(6,2)) AS Lift
      FROM ItemSets i
      INNER JOIN Cat1Count c1 ON i.Cat1 = c1.CatNombre
      INNER JOIN Cat1Count c2 ON i.Cat2 = c2.CatNombre
      WHERE CAST(i.Frecuencia * 1.0 / c1.Total AS DECIMAL(6,4)) >= @confianzaMin
      ORDER BY Lift DESC, Soporte DESC
    `;

    const result = await pool.request()
      .input('soporteMin', sql.Int, soporteMinCount)
      .input('confianzaMin', sql.Decimal(6,4), confianza_min)
      .input('totalVentas', sql.Int, total)
      .query(query);

    // Generar PDF (VERSIÓN FINAL - SIMPLE)
    const pdfBuffer = await generarAprioriFinal(
      result.recordset,
      { soporte_min, confianza_min, total_transacciones: total }
    );

    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Apriori.pdf"');
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Error /api/reporte/apriori/pdf:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Reporte 3: Cupones de Reactivación (PDF)
app.post('/api/reporte/cupones/pdf', async (req, res) => {
  try {
    const pool = await getPool();
    const { clienteIDs } = req.body;

    if (!clienteIDs || !Array.isArray(clienteIDs) || clienteIDs.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de clienteIDs' });
    }

    // Obtener datos de clientes inactivos y su categoría favorita
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

    const result = await pool.request().query(query);

    const campanas = result.recordset.map(cliente => {
      const cupon = `REACT${cliente.ClienteID}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      return {
        ClienteID: cliente.ClienteID,
        Nombre: cliente.Nombre,
        CategoriaFavorita: cliente.CategoriaFavorita || 'General',
        Oferta: `30% de descuento en ${cliente.CategoriaFavorita || 'toda la tienda'} + envío gratis`,
        Cupon: cupon
      };
    });

    // Generar PDF (VERSIÓN FINAL - SIMPLE)
    const pdfBuffer = await generarCuponesFinal(campanas);

    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Cupones_Reactivacion.pdf"');
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Error /api/reporte/cupones/pdf:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Reporte 4: Catálogo de Productos (PDF)
app.get('/api/reporte/productos/pdf', async (req, res) => {
  try {
    const pool = await getPool();

    // Obtener productos
    const queryProductos = `
      SELECT TOP 200
        p.ProductoID,
        p.Nombre,
        CAST(p.Precio AS DECIMAL(10,2)) AS Precio,
        p.Marca,
        p.Presentacion,
        c.Nombre AS CategoriaNombre
      FROM Productos p
      LEFT JOIN Categorias c ON p.CategoriaID = c.CategoriaID
      ORDER BY c.Nombre, p.Nombre
    `;

    const resultProductos = await pool.request().query(queryProductos);

    // Obtener categorías
    const queryCategorias = `
      SELECT
        c.CategoriaID,
        c.Nombre,
        COUNT(p.ProductoID) AS TotalProductos
      FROM Categorias c
      LEFT JOIN Productos p ON c.CategoriaID = p.CategoriaID
      GROUP BY c.CategoriaID, c.Nombre
      ORDER BY c.Nombre
    `;

    const resultCategorias = await pool.request().query(queryCategorias);

    // Generar PDF (VERSIÓN FINAL - SIMPLE)
    const pdfBuffer = await generarCatalogoFinal(
      resultProductos.recordset,
      resultCategorias.recordset
    );

    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Catalogo_Productos.pdf"');
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Error /api/reporte/productos/pdf:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
//  CU-03: OFERTA POR TIPO DE CLIENTE
//  GET /api/oferta/:segmento?monto=1500
// ─────────────────────────────────────────
app.get('/api/oferta/:segmento', (req, res) => {
  const { segmento } = req.params;
  const monto = parseFloat(req.query.monto) || 0;

  const ofertas = {
    VIP: {
      tipo: 'cashback',
      pct: 5,
      descripcion: '5% cashback en todas las compras + envío gratis',
      extra: 'Acceso anticipado a nuevas colecciones. Multiplicador 3x en puntos.',
      aplicar: (m) => ({ original: m, final: m, ahorro: m * 0.05, cashback: m * 0.05 })
    },
    Regular: {
      tipo: 'descuento',
      pct: 10,
      descripcion: '10% descuento en categorías de baja rotación + doble puntos',
      extra: 'Cupón $200 al alcanzar $2,000 mensuales.',
      aplicar: (m) => ({ original: m, final: m * 0.90, ahorro: m * 0.10, cashback: 0 })
    },
    Nuevo: {
      tipo: 'descuento',
      pct: 25,
      descripcion: '25% en primera compra + envío gratis primeras 3 compras',
      extra: 'Combo bienvenida: Ropa + Calzado con 15% adicional.',
      aplicar: (m) => ({ original: m, final: m * 0.75, ahorro: m * 0.25, cashback: 0 })
    },
    Inactivo: {
      tipo: 'descuento',
      pct: 30,
      descripcion: '30% en categoría favorita — Campaña "Te extrañamos"',
      extra: 'Regalo sorpresa al reactivarse + puntos de bonificación.',
      aplicar: (m) => ({ original: m, final: m * 0.70, ahorro: m * 0.30, cashback: 0 })
    },
  };

  const oferta = ofertas[segmento];
  if (!oferta) {
    return res.status(404).json({ error: `Segmento '${segmento}' no reconocido` });
  }

  const precios = oferta.aplicar(monto);
  res.json({ segmento, oferta: { ...oferta, aplicar: undefined }, precios });
});

// ─────────────────────────────────────────
//  HELPER: OBTENER IP LOCAL
// ─────────────────────────────────────────
function getLocalIP() {
  const os = require('os');
  const nets = os.networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Buscar IPv4 que no sea localhost
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// ─────────────────────────────────────────
//  ARRANCAR SERVIDOR
// ─────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 RetailRFM API corriendo en:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Red:     http://${getLocalIP()}:${PORT}`);
  console.log(`\n   Endpoints disponibles:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/categorias                    [CU-01]`);
  console.log(`   GET  /api/productos                     [CU-01]`);
  console.log(`   GET  /api/recomendaciones               [CU-02]`);
  console.log(`   GET  /api/oferta/:segmento              [CU-03]`);
  console.log(`   GET  /api/combos                        [CU-04]`);
  console.log(`   POST /api/rfm/clasificar                [CU-05]`);
  console.log(`   GET  /api/rfm/clientes                  [CU-05]`);
  console.log(`   POST /api/rfm/actualizar                [CU-09] 🔄`);
  console.log(`   POST /api/apriori/ejecutar              [CU-06]`);
  console.log(`   GET  /api/reporte/resumen               [CU-07]`);
  console.log(`   GET  /api/reporte/kpis                  [CU-07]`);
  console.log(`   GET  /api/reporte/categorias            [CU-07]`);
  console.log(`   GET  /api/reactivacion/clientes         [CU-08]`);
  console.log(`   POST /api/reactivacion/generar          [CU-08]`);
  console.log(`\n   📊 REPORTES PDF PROFESIONALES:`);
  console.log(`   GET  /api/reporte/rfm/pdf               📄 Análisis RFM con gráficas`);
  console.log(`   POST /api/reporte/apriori/pdf           📄 Asociaciones Apriori`);
  console.log(`   POST /api/reporte/cupones/pdf           📄 Cupones de Reactivación`);
  console.log(`   GET  /api/reporte/productos/pdf         📄 Catálogo de Productos\n`);
});