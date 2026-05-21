// utils/reportCatalogo_mejorado.js — Catálogo de Productos CORREGIDO
const PDFDocument = require('pdfkit');

/**
 * Formatea números como moneda mexicana CORRECTAMENTE
 */
function formatMoney(valor) {
  const num = parseFloat(valor);
  if (isNaN(num)) return '$0.00';

  return '$' + num.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Genera ID único de reporte
 */
function generarReporteID() {
  const fecha = new Date();
  const timestamp = fecha.getTime().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RPT-${timestamp}-${random}`;
}

/**
 * CATÁLOGO DE PRODUCTOS MEJORADO Y CORREGIDO
 */
async function generarCatalogoMejorado(productos, categorias) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const reporteID = generarReporteID();
      const fecha = new Date().toLocaleString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // ═══════════════════════════════════════
      // PÁGINA 1: HEADER Y RESUMEN
      // ═══════════════════════════════════════

      // Header profesional
      doc.rect(0, 0, doc.page.width, 100).fill('#0A0A0F');

      doc.fontSize(28)
         .fillColor('#1E3A8A')
         .font('Helvetica-Bold')
         .text('RetailRFM', 50, 25);

      doc.fontSize(10)
         .fillColor('#6B6B80')
         .font('Helvetica')
         .text('Sistema de Inteligencia Comercial', 50, 55);

      doc.fontSize(18)
         .fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .text('Catálogo de Productos', 50, 75);

      const rightX = doc.page.width - 250;
      doc.fontSize(9)
         .fillColor('#6B6B80')
         .text('ID de Reporte:', rightX, 30);

      doc.fontSize(11)
         .fillColor('#1E3A8A')
         .font('Helvetica-Bold')
         .text(reporteID, rightX, 43);

      doc.fontSize(9)
         .fillColor('#6B6B80')
         .font('Helvetica')
         .text('Generado:', rightX, 65);

      doc.fontSize(9)
         .fillColor('#FFFFFF')
         .text(fecha, rightX, 78);

      doc.moveTo(50, 110)
         .lineTo(doc.page.width - 50, 110)
         .strokeColor('#1E3A8A')
         .lineWidth(2)
         .stroke();

      doc.y = 130;

      // Calcular totales REALES
      const totalProductosReal = productos.length;
      const totalCategoriasReal = categorias.length;

      // Agrupar productos por categoría
      const productosPorCategoria = {};
      productos.forEach(p => {
        const cat = p.CategoriaNombre || 'Sin categoría';
        if (!productosPorCategoria[cat]) {
          productosPorCategoria[cat] = [];
        }
        productosPorCategoria[cat].push(p);
      });

      // KPIs corregidos
      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Resumen de Inventario', 50, doc.y + 10);

      doc.y += 35;

      // KPI 1: Total Productos REAL
      doc.roundedRect(50, doc.y, 160, 75, 8)
         .fillAndStroke('#FFFFFF', '#E0E0E0')
         .lineWidth(1);

      doc.fontSize(10)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Total Productos', 60, doc.y + 15);

      doc.fontSize(24)
         .fillColor('#47C5FF')
         .font('Helvetica-Bold')
         .text(totalProductosReal.toLocaleString('es-MX'), 60, doc.y + 35);

      // KPI 2: Total Categorías REAL
      doc.roundedRect(225, doc.y, 160, 75, 8)
         .fillAndStroke('#FFFFFF', '#E0E0E0')
         .lineWidth(1);

      doc.fontSize(10)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Categorías', 235, doc.y + 15);

      doc.fontSize(24)
         .fillColor('#5DFC8A')
         .font('Helvetica-Bold')
         .text(totalCategoriasReal.toLocaleString('es-MX'), 235, doc.y + 35);

      // KPI 3: Promedio de productos por categoría
      const promedioPorCat = Math.round(totalProductosReal / totalCategoriasReal);

      doc.roundedRect(400, doc.y, 145, 75, 8)
         .fillAndStroke('#FFFFFF', '#E0E0E0')
         .lineWidth(1);

      doc.fontSize(10)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Promedio/Categoría', 410, doc.y + 15);

      doc.fontSize(24)
         .fillColor('#FFD700')
         .font('Helvetica-Bold')
         .text(promedioPorCat.toLocaleString('es-MX'), 410, doc.y + 35);

      doc.y += 95;

      // ═══════════════════════════════════════
      // GRÁFICA DE BARRAS: Productos por Categoría
      // ═══════════════════════════════════════

      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Distribución de Productos por Categoría', 50, doc.y + 20);

      doc.y += 45;

      // Obtener top 10 categorías por cantidad
      const categoriasOrdenadas = Object.keys(productosPorCategoria)
        .map(cat => ({
          nombre: cat,
          cantidad: productosPorCategoria[cat].length
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10);

      const maxCantidad = categoriasOrdenadas[0]?.cantidad || 1;
      const barMaxWidth = 300;

      categoriasOrdenadas.forEach((cat, index) => {
        const y = doc.y;
        const barWidth = (cat.cantidad / maxCantidad) * barMaxWidth;

        // Nombre de categoría
        doc.fontSize(10)
           .fillColor('#000000')
           .font('Helvetica')
           .text(cat.nombre.substring(0, 20), 50, y + 5, { width: 150 });

        // Barra
        doc.roundedRect(210, y, barMaxWidth, 20, 5)
           .fill('#E0E0E0');

        const barColor = index < 3 ? '#47C5FF' : '#5DFC8A';
        doc.roundedRect(210, y, barWidth, 20, 5)
           .fill(barColor);

        // Cantidad
        doc.fontSize(10)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(cat.cantidad.toString(), 520, y + 5);

        doc.y = y + 30;
      });

      // ═══════════════════════════════════════
      // CATÁLOGO POR CATEGORÍAS
      // ═══════════════════════════════════════

      Object.keys(productosPorCategoria).sort().forEach((categoria) => {
        const prods = productosPorCategoria[categoria];

        // NUEVA PÁGINA para cada categoría
        doc.addPage();

        // Header de categoría
        doc.roundedRect(50, 50, 495, 50, 8)
           .fillAndStroke('#18181F', '#1E3A8A')
           .lineWidth(2);

        doc.fontSize(18)
           .fillColor('#1E3A8A')
           .font('Helvetica-Bold')
           .text(categoria, 70, 65);

        doc.fontSize(12)
           .fillColor('#FFFFFF')
           .font('Helvetica')
           .text(`${prods.length} productos`, 70, 85);

        doc.y = 120;

        // Encontrar producto más caro y más barato
        const masCaro = prods.reduce((max, p) => parseFloat(p.Precio) > parseFloat(max.Precio) ? p : max);
        const masBarato = prods.reduce((min, p) => parseFloat(p.Precio) < parseFloat(min.Precio) ? p : min);

        // Tabla de productos con SKU
        // Header de tabla
        const headerY = doc.y;
        doc.rect(50, headerY, 495, 30)
           .fill('#18181F');

        const headers = ['SKU', 'Producto', 'Marca', 'Precio', 'Presentación'];
        const colWidths = [60, 180, 100, 80, 75];

        let x = 50;
        headers.forEach((header, i) => {
          doc.fontSize(9)
             .fillColor('#1E3A8A')
             .font('Helvetica-Bold')
             .text(header, x + 5, headerY + 10, { width: colWidths[i] - 10 });
          x += colWidths[i];
        });

        doc.y = headerY + 35;

        // Filas de productos
        prods.forEach((prod, index) => {
          // Verificar espacio para nueva fila
          if (doc.y > 700) {
            doc.addPage();
            doc.y = 50;

            // Repetir header en nueva página
            const newHeaderY = doc.y;
            doc.rect(50, newHeaderY, 495, 30)
               .fill('#18181F');

            x = 50;
            headers.forEach((header, i) => {
              doc.fontSize(9)
                 .fillColor('#1E3A8A')
                 .font('Helvetica-Bold')
                 .text(header, x + 5, newHeaderY + 10, { width: colWidths[i] - 10 });
              x += colWidths[i];
            });

            doc.y = newHeaderY + 35;
          }

          const rowY = doc.y;
          const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F5F5F5';

          // Destacar más caro en verde y más barato en naranja
          let finalBgColor = bgColor;
          let textColor = '#000000';
          let badge = '';

          if (prod.ProductoID === masCaro.ProductoID && parseFloat(masCaro.Precio) !== parseFloat(masBarato.Precio)) {
            finalBgColor = '#E8F5E9'; // Verde claro
            badge = '🔼 MÁS CARO';
          } else if (prod.ProductoID === masBarato.ProductoID && parseFloat(masCaro.Precio) !== parseFloat(masBarato.Precio)) {
            finalBgColor = '#FFF3E0'; // Naranja claro
            badge = '🔽 MÁS BARATO';
          }

          doc.rect(50, rowY, 495, 25)
             .fill(finalBgColor);

          const rowData = [
            prod.ProductoID.toString(), // SKU
            prod.Nombre.substring(0, 30) + (prod.Nombre.length > 30 ? '...' : ''),
            (prod.Marca || '-').substring(0, 15),
            formatMoney(prod.Precio), // PRECIO CORREGIDO
            (prod.Presentacion || '-').substring(0, 12)
          ];

          x = 50;
          rowData.forEach((cell, i) => {
            doc.fontSize(9)
               .fillColor(textColor)
               .font('Helvetica')
               .text(cell, x + 5, rowY + 8, { width: colWidths[i] - 10 });
            x += colWidths[i];
          });

          // Badge de más caro/barato (si aplica)
          if (badge) {
            doc.fontSize(7)
               .fillColor('#666666')
               .font('Helvetica-Bold')
               .text(badge, 50, rowY - 10);
          }

          doc.y = rowY + 25;
        });

        // Estadísticas de la categoría al final
        doc.y += 20;

        const precioMin = Math.min(...prods.map(p => parseFloat(p.Precio)));
        const precioMax = Math.max(...prods.map(p => parseFloat(p.Precio)));
        const precioPromedio = prods.reduce((sum, p) => sum + parseFloat(p.Precio), 0) / prods.length;

        doc.roundedRect(50, doc.y, 495, 60, 8)
           .fillAndStroke('#F0F0F0', '#CCCCCC')
           .lineWidth(1);

        doc.fontSize(11)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text('Estadísticas de la Categoría', 65, doc.y + 15);

        doc.fontSize(10)
           .fillColor('#333333')
           .font('Helvetica')
           .text(`Precio Mínimo: ${formatMoney(precioMin)}`, 65, doc.y + 35);

        doc.text(`Precio Promedio: ${formatMoney(precioPromedio)}`, 220, doc.y + 35);

        doc.text(`Precio Máximo: ${formatMoney(precioMax)}`, 400, doc.y + 35);
      });

      // Footer simple (sin switchToPage para evitar errores)
      doc.end();
    } catch (error) {
      console.error('Error generando catálogo:', error);
      reject(error);
    }
  });
}

module.exports = {
  generarCatalogoMejorado
};
