// utils/reportRFM_mejorado.js — Reporte RFM CORREGIDO y mejorado
const PDFDocument = require('pdfkit');

// Colores por segmento
const SEGMENT_COLORS = {
  VIP: { bg: '#FFD700', text: '#000000' },
  Regular: { bg: '#47C5FF', text: '#000000' },
  Nuevo: { bg: '#5DFC8A', text: '#000000' },
  Inactivo: { bg: '#FF6B6B', text: '#FFFFFF' }
};

/**
 * Formatea números como moneda mexicana SIN ERRORES
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
 * Formatea porcentajes con precisión
 */
function formatPorcentaje(valor, decimales = 2) {
  const num = parseFloat(valor);
  if (isNaN(num)) return '0.00%';

  return num.toLocaleString('es-MX', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }) + '%';
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
 * REPORTE RFM MEJORADO Y CORREGIDO
 */
async function generarReporteRFMMejorado(datosSegmentos, datosKPIs) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

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
      // PÁGINA 1: HEADER Y KPIS
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
         .text('Análisis de Segmentación RFM', 50, 75);

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

      // KPIs en Cards modernos
      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Indicadores Clave de Desempeño', 50, doc.y + 10);

      doc.y += 35;

      // Primera fila de KPIs
      const kpiY1 = doc.y;

      // KPI 1: Total Clientes
      doc.roundedRect(50, kpiY1, 160, 75, 8)
         .fillAndStroke('#FFFFFF', '#E0E0E0')
         .lineWidth(1);

      doc.fontSize(10)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Total Clientes', 60, kpiY1 + 15);

      doc.fontSize(24)
         .fillColor('#1E3A8A')
         .font('Helvetica-Bold')
         .text(datosKPIs.TotalClientes.toLocaleString('es-MX'), 60, kpiY1 + 35);

      // KPI 2: Total Ventas
      doc.roundedRect(225, kpiY1, 160, 75, 8)
         .fillAndStroke('#FFFFFF', '#E0E0E0')
         .lineWidth(1);

      doc.fontSize(10)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Total Ventas', 235, kpiY1 + 15);

      doc.fontSize(24)
         .fillColor('#47C5FF')
         .font('Helvetica-Bold')
         .text(datosKPIs.TotalVentas.toLocaleString('es-MX'), 235, kpiY1 + 35);

      // KPI 3: Ventas Totales (CORREGIDO - sin truncar)
      doc.roundedRect(400, kpiY1, 145, 75, 8)
         .fillAndStroke('#FFFFFF', '#E0E0E0')
         .lineWidth(1);

      doc.fontSize(10)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Ventas Totales', 410, kpiY1 + 15);

      doc.fontSize(16)
         .fillColor('#5DFC8A')
         .font('Helvetica-Bold')
         .text(formatMoney(datosKPIs.VentasTotales), 410, kpiY1 + 35, { width: 125 });

      // Segunda fila de KPIs
      const kpiY2 = kpiY1 + 95;

      // KPI 4: Ticket Promedio
      doc.roundedRect(50, kpiY2, 160, 75, 8)
         .fillAndStroke('#FFFFFF', '#E0E0E0')
         .lineWidth(1);

      doc.fontSize(10)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Ticket Promedio', 60, kpiY2 + 15);

      doc.fontSize(20)
         .fillColor('#FFD700')
         .font('Helvetica-Bold')
         .text(formatMoney(datosKPIs.TicketPromedio), 60, kpiY2 + 35, { width: 140 });

      // KPI 5: Total Productos
      doc.roundedRect(225, kpiY2, 160, 75, 8)
         .fillAndStroke('#FFFFFF', '#E0E0E0')
         .lineWidth(1);

      doc.fontSize(10)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Total Productos', 235, kpiY2 + 15);

      doc.fontSize(24)
         .fillColor('#FF6B47')
         .font('Helvetica-Bold')
         .text(datosKPIs.TotalProductos.toLocaleString('es-MX'), 235, kpiY2 + 35);

      doc.y = kpiY2 + 100;

      // ═══════════════════════════════════════
      // PÁGINA 2: DISTRIBUCIÓN POR SEGMENTO
      // ═══════════════════════════════════════

      doc.addPage();

      doc.fontSize(18)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Distribución de Clientes por Segmento', 50, 50);

      doc.y = 90;

      const totalClientes = datosSegmentos.reduce((sum, s) => sum + s.TotalClientes, 0);
      const totalVentas = datosSegmentos.reduce((sum, s) => sum + parseFloat(s.VentasTotal), 0);

      // Tabla mejorada con colores
      datosSegmentos
        .sort((a, b) => b.TotalClientes - a.TotalClientes)
        .forEach((seg, index) => {
          const y = doc.y;
          const pct = (seg.TotalClientes / totalClientes) * 100;
          const ventasPct = (parseFloat(seg.VentasTotal) / totalVentas) * 100;

          // Fila con color de fondo según segmento
          const bgColor = seg.Segmento === 'Inactivo' ? '#FFE5E5' : '#FFFFFF';
          const borderColor = SEGMENT_COLORS[seg.Segmento]?.bg || '#CCCCCC';

          doc.roundedRect(50, y, 495, 80, 8)
             .fillAndStroke(bgColor, borderColor)
             .lineWidth(2);

          // Badge del segmento (izquierda)
          const badgeColor = SEGMENT_COLORS[seg.Segmento]?.bg || '#CCCCCC';
          const textColor = SEGMENT_COLORS[seg.Segmento]?.text || '#000000';

          doc.roundedRect(60, y + 15, 100, 35, 5)
             .fill(badgeColor);

          doc.fontSize(16)
             .fillColor(textColor)
             .font('Helvetica-Bold')
             .text(seg.Segmento, 60, y + 25, { width: 100, align: 'center' });

          // Datos (derecha)
          const dataX = 180;

          doc.fontSize(11)
             .fillColor('#000000')
             .font('Helvetica')
             .text('Clientes:', dataX, y + 15);

          doc.font('Helvetica-Bold')
             .text(`${seg.TotalClientes.toLocaleString('es-MX')} (${formatPorcentaje(pct)})`, dataX + 70, y + 15);

          doc.font('Helvetica')
             .text('Ventas:', dataX, y + 35);

          doc.font('Helvetica-Bold')
             .text(`${formatMoney(seg.VentasTotal)} (${formatPorcentaje(ventasPct)})`, dataX + 70, y + 35, { width: 250 });

          doc.font('Helvetica')
             .text('Ticket:', dataX, y + 55);

          doc.font('Helvetica-Bold')
             .text(formatMoney(seg.TicketPromedio), dataX + 70, y + 55);

          // Barra de progreso de recencia
          const progressX = 420;
          const recenciaMax = 365; // 1 año
          const recenciaPct = Math.min(seg.RecenciaPromedio / recenciaMax, 1);
          const barWidth = 100;

          doc.fontSize(9)
             .fillColor('#666666')
             .font('Helvetica')
             .text('Recencia:', progressX, y + 20);

          // Barra de fondo
          doc.roundedRect(progressX, y + 35, barWidth, 10, 5)
             .fill('#E0E0E0');

          // Barra de progreso (rojo = malo, verde = bueno)
          const progressColor = recenciaPct > 0.5 ? '#FF6B6B' : '#5DFC8A';
          doc.roundedRect(progressX, y + 35, barWidth * recenciaPct, 10, 5)
             .fill(progressColor);

          doc.fontSize(8)
             .fillColor('#666666')
             .text(`${seg.RecenciaPromedio} días`, progressX, y + 50);

          doc.y = y + 95;
        });

      // ═══════════════════════════════════════
      // PÁGINA 3: TABLA DETALLADA
      // ═══════════════════════════════════════

      doc.addPage();

      doc.fontSize(18)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Análisis Detallado por Segmento', 50, 50);

      doc.y = 90;

      // Header de tabla
      const headerY = doc.y;
      doc.rect(50, headerY, 495, 30)
         .fill('#18181F');

      const headers = ['Segmento', 'Clientes', 'Ticket Prom.', 'Ventas Total', '% Total', 'Recencia', 'Frecuencia'];
      const colWidths = [80, 70, 85, 90, 60, 60, 60];

      let x = 50;
      headers.forEach((header, i) => {
        doc.fontSize(9)
           .fillColor('#1E3A8A')
           .font('Helvetica-Bold')
           .text(header, x + 5, headerY + 10, { width: colWidths[i] - 10 });
        x += colWidths[i];
      });

      doc.y = headerY + 35;

      // Filas de datos
      datosSegmentos
        .sort((a, b) => parseFloat(b.VentasTotal) - parseFloat(a.VentasTotal))
        .forEach((seg, index) => {
          const rowY = doc.y;
          const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F5F5F5';

          // Resaltar Inactivos en rojo claro
          const finalBgColor = seg.Segmento === 'Inactivo' ? '#FFE5E5' : bgColor;

          doc.rect(50, rowY, 495, 25)
             .fill(finalBgColor);

          const ventasPct = (parseFloat(seg.VentasTotal) / totalVentas) * 100;

          const rowData = [
            seg.Segmento,
            seg.TotalClientes.toLocaleString('es-MX'),
            formatMoney(seg.TicketPromedio),
            formatMoney(seg.VentasTotal),
            formatPorcentaje(ventasPct),
            `${seg.RecenciaPromedio} d`,
            seg.FrecuenciaPromedio.toString()
          ];

          x = 50;
          rowData.forEach((cell, i) => {
            const textColor = seg.Segmento === 'Inactivo' ? '#CC0000' : '#000000';

            doc.fontSize(9)
               .fillColor(textColor)
               .font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
               .text(cell, x + 5, rowY + 8, { width: colWidths[i] - 10 });
            x += colWidths[i];
          });

          doc.y = rowY + 25;
        });

      // ═══════════════════════════════════════
      // PÁGINA 4: INSIGHTS Y RECOMENDACIONES
      // ═══════════════════════════════════════

      doc.addPage();

      doc.fontSize(18)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Insights y Recomendaciones Estratégicas', 50, 50);

      doc.y = 90;

      const vipData = datosSegmentos.find(s => s.Segmento === 'VIP');
      const regularData = datosSegmentos.find(s => s.Segmento === 'Regular');
      const inactivoData = datosSegmentos.find(s => s.Segmento === 'Inactivo');

      const insights = [];

      // Insight 1: VIP o Regular (el que tenga más ventas)
      const topSegmento = datosSegmentos.sort((a, b) => parseFloat(b.VentasTotal) - parseFloat(a.VentasTotal))[0];
      const topPct = (topSegmento.TotalClientes / totalClientes) * 100;
      const topVentasPct = (parseFloat(topSegmento.VentasTotal) / totalVentas) * 100;

      insights.push({
        titulo: `Segmento ${topSegmento.Segmento}`,
        tituloColor: '#2E7D32', // Verde oscuro
        texto: `Los clientes ${topSegmento.Segmento} representan el ${formatPorcentaje(topPct)} de la base pero generan el ${formatPorcentaje(topVentasPct)} de las ventas. Su ticket promedio es ${formatMoney(topSegmento.TicketPromedio)}.`
      });

      // Insight 2: Clientes Inactivos
      if (inactivoData && inactivoData.TotalClientes > 0) {
        const inactivoPct = (inactivoData.TotalClientes / totalClientes) * 100;
        insights.push({
          titulo: 'Alerta: Clientes en Riesgo',
          tituloColor: '#D32F2F', // Rojo
          texto: `${formatPorcentaje(inactivoPct)} de los clientes están inactivos (${inactivoData.TotalClientes} clientes con recencia promedio de ${inactivoData.RecenciaPromedio} días). Se recomienda implementar campaña de reactivación inmediata.`
        });
      }

      // Insight 3: Recomendación estratégica
      insights.push({
        titulo: 'Recomendación Estratégica',
        tituloColor: '#1976D2', // Azul
        texto: 'Implementar programa de lealtad para retener clientes de alto valor. Enfoque en aumentar frecuencia de compra mediante ofertas personalizadas y comunicación segmentada.'
      });

      // Renderizar insights (SIN CUADROS GRISES)
      insights.forEach((insight, index) => {
        if (doc.y > 650) {
          doc.addPage();
          doc.y = 50;
        }

        // Línea divisoria superior (excepto el primero)
        if (index > 0) {
          doc.moveTo(50, doc.y)
             .lineTo(545, doc.y)
             .strokeColor('#E0E0E0')
             .lineWidth(1)
             .stroke();

          doc.y += 15;
        }

        // Título con color específico (SIN CUADRO GRIS)
        doc.fontSize(14)
           .fillColor(insight.tituloColor)
           .font('Helvetica-Bold')
           .text(insight.titulo, 50, doc.y);

        doc.y += 25;

        // Texto del insight
        doc.fontSize(11)
           .fillColor('#333333')
           .font('Helvetica')
           .text(insight.texto, 50, doc.y, { width: 495, align: 'left' });

        doc.y += 60;
      });

      // Footer (sin agregar páginas adicionales)
      const pageCount = doc.bufferedPageRange().count;

      // Asegurarse de que haya espacio suficiente para el footer
      if (doc.y > doc.page.height - 80) {
        // Si no hay espacio, agregar página
        doc.addPage();
      }

      // Agregar footer en la última página actual
      doc.fontSize(9)
         .fillColor('#6B6B80')
         .font('Helvetica')
         .text(
           `RetailRFM.sys © 2026 | Total de páginas: ${pageCount}`,
           50,
           doc.page.height - 50,
           { align: 'center', width: doc.page.width - 100 }
         );

      doc.end();
    } catch (error) {
      console.error('Error generando reporte:', error);
      reject(error);
    }
  });
}

module.exports = {
  generarReporteRFMMejorado
};
