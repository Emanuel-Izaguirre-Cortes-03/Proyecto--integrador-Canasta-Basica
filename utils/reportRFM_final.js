// utils/reportRFM_final.js — Reporte RFM SIMPLE - Solo tablas
const PDFDocument = require('pdfkit');

function formatMoney(valor) {
  const num = parseFloat(valor);
  if (isNaN(num)) return '$0.00';
  return '$' + num.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatPorcentaje(valor) {
  const num = parseFloat(valor);
  if (isNaN(num)) return '0.00%';
  return num.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + '%';
}

function agregarFooter(doc, pageNum, totalPages) {
  doc.fontSize(9)
     .fillColor('#666666')
     .font('Helvetica')
     .text(
       `RetailRFM © 2026 | Página ${pageNum} de ${totalPages}`,
       50,
       doc.page.height - 50,
       { align: 'center', width: doc.page.width - 100 }
     );
}

async function generarReporteRFMFinal(datosSegmentos, datosKPIs) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const fecha = new Date().toLocaleString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      // HEADER SIMPLE
      doc.fontSize(24)
         .fillColor('#1E40AF')
         .font('Helvetica-Bold')
         .text('RetailRFM - Análisis de Segmentación RFM', 50, 50);

      doc.fontSize(10)
         .fillColor('#666666')
         .font('Helvetica')
         .text(fecha, 50, 80);

      doc.moveTo(50, 100).lineTo(doc.page.width - 50, 100)
         .strokeColor('#CCCCCC').lineWidth(1).stroke();

      doc.y = 120;

      // TABLA DE KPIS
      doc.fontSize(14)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Resumen General', 50, doc.y);

      doc.y += 25;

      const kpis = [
        ['Total Clientes', (datosKPIs.TotalClientes || 0).toLocaleString('es-MX')],
        ['Ticket Promedio', formatMoney(datosKPIs.TicketPromedio || 0)],
        ['Frecuencia Promedio', parseFloat(datosKPIs.FrecuenciaPromedio || 0).toFixed(2) + ' compras'],
        ['Monto Total', formatMoney(datosKPIs.MontoTotal || 0)]
      ];

      kpis.forEach(([label, value]) => {
        doc.fontSize(11)
           .fillColor('#666666')
           .font('Helvetica')
           .text(label + ':', 50, doc.y);

        doc.fontSize(11)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(value, 250, doc.y);

        doc.y += 20;
      });

      doc.y += 20;

      // TABLA DE SEGMENTOS
      doc.fontSize(14)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Distribución por Segmento', 50, doc.y);

      doc.y += 25;

      // Headers de tabla
      const tableY = doc.y;
      doc.rect(50, tableY, 495, 25).fill('#1E40AF');

      doc.fontSize(10)
         .fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .text('Segmento', 60, tableY + 8);
      doc.text('Clientes', 180, tableY + 8);
      doc.text('%', 280, tableY + 8);
      doc.text('Ticket Prom.', 350, tableY + 8);
      doc.text('Monto Total', 450, tableY + 8);

      doc.y = tableY + 30;

      // Filas de datos
      datosSegmentos.forEach((seg, index) => {
        const rowY = doc.y;
        const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F9F9F9';

        doc.rect(50, rowY, 495, 25).fill(bgColor);

        doc.fontSize(10)
           .fillColor('#000000')
           .font('Helvetica')
           .text(seg.Tipo_Cliente || 'N/A', 60, rowY + 8);
        doc.text((seg.Cantidad || 0).toLocaleString('es-MX'), 180, rowY + 8);
        doc.text(formatPorcentaje(seg.Porcentaje || 0), 280, rowY + 8);
        doc.text(formatMoney(seg.TicketPromedio || 0), 350, rowY + 8);
        doc.text(formatMoney(seg.MontoTotal || 0), 450, rowY + 8);

        doc.y = rowY + 25;
      });


      // INSIGHTS - Solo texto
      doc.addPage();
      doc.y = 50;

      doc.fontSize(14)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Insights y Recomendaciones', 50, doc.y);

      doc.y += 25;

      const vip = datosSegmentos.find(s => s.Tipo_Cliente === 'VIP') || {};
      const inactivos = datosSegmentos.find(s => s.Tipo_Cliente === 'Inactivo') || {};

      const insights = [
        {
          titulo: 'Segmento VIP',
          texto: `Representa el ${formatPorcentaje(vip.Porcentaje || 0)} de la base con un ticket promedio de ${formatMoney(vip.TicketPromedio || 0)}. Mantener beneficios exclusivos.`
        },
        {
          titulo: 'Clientes Inactivos',
          texto: `${inactivos.Cantidad || 0} clientes inactivos (${formatPorcentaje(inactivos.Porcentaje || 0)}). Implementar campaña de reactivación urgente.`
        },
        {
          titulo: 'Oportunidad de Crecimiento',
          texto: `Enfocarse en migrar clientes Regular hacia VIP mediante programas de lealtad y comunicación personalizada.`
        }
      ];

      insights.forEach(insight => {
        doc.fontSize(12)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(insight.titulo, 50, doc.y);

        doc.y += 20;

        doc.fontSize(10)
           .fillColor('#333333')
           .font('Helvetica')
           .text(insight.texto, 50, doc.y, { width: 495 });

        doc.y += 50;
      });

      // Agregar números de página en todas las páginas (abajo a la derecha)
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(9)
           .fillColor('#666666')
           .font('Helvetica')
           .text(
             `Página ${i + 1} de ${range.count}`,
             doc.page.width - 150,
             doc.page.height - 50,
             { width: 100, align: 'right' }
           );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generarReporteRFMFinal };
