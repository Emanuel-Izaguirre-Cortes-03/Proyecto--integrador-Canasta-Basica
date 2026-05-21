// utils/reportTemplates_simple.js — Versión simplificada SIN gráficas (para emergencias)
const PDFDocument = require('pdfkit');
const {
  agregarHeaderProfesional,
  agregarKPI,
  agregarTabla,
  agregarFooter,
  formatMoney,
  SEGMENT_COLORS
} = require('./reportGenerator');

/**
 * REPORTE RFM SIMPLIFICADO - Sin gráficas (solo tablas y KPIs)
 */
async function generarReporteRFMSimple(datosSegmentos, datosKPIs) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      const reporteID = agregarHeaderProfesional(doc, 'Análisis de Segmentación RFM');

      // KPIs principales
      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Indicadores Clave de Desempeño', 50, doc.y + 10);

      doc.y += 30;

      // KPIs en grid
      const kpiY = doc.y;
      agregarKPI(doc, 50, kpiY, 'Total Clientes', datosKPIs.TotalClientes.toLocaleString('es-MX'), '#1E3A8A');
      agregarKPI(doc, 220, kpiY, 'Total Ventas', datosKPIs.TotalVentas.toLocaleString('es-MX'), '#47C5FF');
      agregarKPI(doc, 390, kpiY, 'Ventas Totales', formatMoney(datosKPIs.VentasTotales), '#5DFC8A');

      doc.y = kpiY + 90;

      const kpiY2 = doc.y;
      agregarKPI(doc, 50, kpiY2, 'Ticket Promedio', formatMoney(datosKPIs.TicketPromedio), '#FFD700');
      agregarKPI(doc, 220, kpiY2, 'Total Productos', datosKPIs.TotalProductos.toLocaleString('es-MX'), '#FF6B47');

      doc.y = kpiY2 + 120;

      // Distribución por segmento (TABLA en lugar de gráfica)
      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Distribución de Clientes por Segmento', 50, doc.y);

      doc.y += 20;

      const totalClientes = datosSegmentos.reduce((sum, s) => sum + s.TotalClientes, 0);

      const headersDistrib = ['Segmento', 'Clientes', 'Porcentaje'];
      const rowsDistrib = datosSegmentos.map(seg => {
        const pct = ((seg.TotalClientes / totalClientes) * 100).toFixed(1);
        return [
          seg.Segmento,
          seg.TotalClientes.toLocaleString('es-MX'),
          `${pct}%`
        ];
      });

      agregarTabla(doc, headersDistrib, rowsDistrib, {
        startY: doc.y,
        columnWidths: [150, 150, 150]
      });

      // Ventas por segmento (TABLA en lugar de gráfica)
      doc.addPage();
      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Análisis de Ventas por Segmento', 50, 50);

      doc.y += 20;

      const headersVentas = ['Segmento', 'Ventas Totales', 'Ticket Prom.', '% del Total'];
      const totalVentas = datosSegmentos.reduce((sum, s) => sum + parseFloat(s.VentasTotal), 0);

      const rowsVentas = datosSegmentos
        .sort((a, b) => parseFloat(b.VentasTotal) - parseFloat(a.VentasTotal))
        .map(seg => {
          const pct = ((parseFloat(seg.VentasTotal) / totalVentas) * 100).toFixed(1);
          return [
            seg.Segmento,
            formatMoney(seg.VentasTotal),
            formatMoney(seg.TicketPromedio),
            `${pct}%`
          ];
        });

      agregarTabla(doc, headersVentas, rowsVentas, {
        startY: doc.y,
        columnWidths: [100, 130, 130, 90]
      });

      // Tabla detallada completa
      doc.addPage();
      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Desglose Detallado por Segmento', 50, 50);

      const headers = ['Segmento', 'Clientes', 'Ticket Prom.', 'Ventas Total', 'Recencia', 'Frecuencia'];
      const rows = datosSegmentos.map(seg => [
        seg.Segmento,
        seg.TotalClientes.toLocaleString('es-MX'),
        formatMoney(seg.TicketPromedio),
        formatMoney(seg.VentasTotal),
        `${seg.RecenciaPromedio} días`,
        seg.FrecuenciaPromedio
      ]);

      agregarTabla(doc, headers, rows, {
        startY: 90,
        columnWidths: [80, 70, 90, 100, 80, 75]
      });

      // Insights
      doc.addPage();
      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Insights y Recomendaciones Estratégicas', 50, 50);

      doc.y += 20;

      const vipData = datosSegmentos.find(s => s.Segmento === 'VIP');
      const inactivoData = datosSegmentos.find(s => s.Segmento === 'Inactivo');

      const insights = [];

      if (vipData) {
        const vipPct = ((vipData.TotalClientes / totalClientes) * 100).toFixed(1);
        const vipVentasPct = ((parseFloat(vipData.VentasTotal) / totalVentas) * 100).toFixed(1);
        insights.push({
          icon: '⭐',
          titulo: 'Segmento VIP',
          color: '#FFD700',
          texto: `Los clientes VIP representan el ${vipPct}% de la base pero generan el ${vipVentasPct}% de las ventas totales. Su ticket promedio es ${formatMoney(vipData.TicketPromedio)}.`
        });
      }

      if (inactivoData) {
        const inactivoPct = ((inactivoData.TotalClientes / totalClientes) * 100).toFixed(1);
        insights.push({
          icon: '⚠️',
          titulo: 'Clientes en Riesgo',
          color: '#FF6B6B',
          texto: `${inactivoPct}% de los clientes están inactivos (${inactivoData.TotalClientes} clientes). Se recomienda implementar campaña de reactivación inmediata.`
        });
      }

      insights.push({
        icon: '📊',
        titulo: 'Recomendación Estratégica',
        color: '#47C5FF',
        texto: 'Implementar programa de lealtad para migrar clientes Regular a VIP. Enfoque en aumentar frecuencia de compra mediante ofertas personalizadas.'
      });

      insights.forEach(insight => {
        doc.roundedRect(50, doc.y, 495, 80, 5)
           .fillAndStroke('#F8F8F8', '#E0E0E0');

        doc.fontSize(30)
           .fillColor('#000000')
           .text(insight.icon, 65, doc.y + 25);

        doc.fontSize(14)
           .fillColor(insight.color)
           .font('Helvetica-Bold')
           .text(insight.titulo, 110, doc.y - 55);

        doc.fontSize(11)
           .fillColor('#000000')
           .font('Helvetica')
           .text(insight.texto, 110, doc.y - 35, { width: 420 });

        doc.y += 100;
      });

      // Footer (versión simple sin numeración)
      agregarFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generarReporteRFMSimple
};
