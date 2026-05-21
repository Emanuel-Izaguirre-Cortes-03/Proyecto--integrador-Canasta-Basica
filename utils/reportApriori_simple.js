// utils/reportApriori_simple.js — Apriori simplificado SIN gráficas
const PDFDocument = require('pdfkit');
const {
  agregarHeaderProfesional,
  agregarKPI,
  agregarTabla,
  agregarFooter
} = require('./reportGenerator');

/**
 * REPORTE APRIORI SIMPLIFICADO - Sin gráficas
 */
async function generarAprioriSimple(reglas, parametros) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      const reporteID = agregarHeaderProfesional(doc, 'Análisis de Asociaciones (Apriori)');

      // Parámetros del análisis
      doc.fontSize(14)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Parámetros del Análisis', 50, doc.y + 10);

      doc.y += 25;

      const paramY = doc.y;
      agregarKPI(doc, 50, paramY, 'Soporte Mínimo', `${(parametros.soporte_min * 100).toFixed(2)}%`, '#47C5FF');
      agregarKPI(doc, 220, paramY, 'Confianza Mínima', `${(parametros.confianza_min * 100).toFixed(2)}%`, '#5DFC8A');
      agregarKPI(doc, 390, paramY, 'Transacciones', parametros.total_transacciones.toLocaleString('es-MX'), '#1E3A8A');

      doc.y = paramY + 100;

      // Top 10 asociaciones (TABLA en lugar de gráfica)
      if (reglas.length > 0) {
        doc.fontSize(16)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text('Top 10 Asociaciones por Lift', 50, doc.y + 10);

        doc.y += 25;

        const top10 = reglas.slice(0, 10);
        const headersTop = ['#', 'Asociación', 'Lift'];
        const rowsTop = top10.map((r, idx) => [
          (idx + 1).toString(),
          `${r.Antecedente} → ${r.Consecuente}`,
          parseFloat(r.Lift).toFixed(2)
        ]);

        agregarTabla(doc, headersTop, rowsTop, {
          startY: doc.y,
          columnWidths: [40, 350, 100]
        });

        // Tabla de reglas completa
        doc.addPage();
        doc.fontSize(16)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text('Reglas de Asociación Detectadas', 50, 50);

        const headers = ['Antecedente', 'Consecuente', 'Soporte', 'Confianza', 'Lift'];
        const rows = reglas.slice(0, 20).map(r => [
          r.Antecedente.substring(0, 15),
          r.Consecuente.substring(0, 15),
          (parseFloat(r.Soporte) * 100).toFixed(2) + '%',
          (parseFloat(r.Confianza) * 100).toFixed(2) + '%',
          parseFloat(r.Lift).toFixed(2)
        ]);

        agregarTabla(doc, headers, rows, {
          startY: 90,
          columnWidths: [95, 95, 80, 80, 60]
        });

        // Insights
        doc.addPage();
        doc.fontSize(16)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text('Insights de Análisis de Cesta', 50, 50);

        doc.y += 20;

        const topRegla = reglas[0];
        const insights = [
          {
            icon: '🎯',
            titulo: 'Asociación Más Fuerte',
            color: '#47C5FF',
            texto: `Los clientes que compran "${topRegla.Antecedente}" tienen ${parseFloat(topRegla.Lift).toFixed(2)}x más probabilidad de comprar "${topRegla.Consecuente}". Considere crear un combo promocional.`
          },
          {
            icon: '💡',
            titulo: 'Recomendación de Cross-Selling',
            color: '#5DFC8A',
            texto: `Implementar sugerencias automáticas en el punto de venta basadas en las asociaciones detectadas para aumentar el ticket promedio.`
          },
          {
            icon: '📦',
            titulo: 'Optimización de Inventario',
            color: '#FFD700',
            texto: `Mantener stock adecuado de productos asociados para evitar pérdida de oportunidades de venta cruzada.`
          }
        ];

        insights.forEach(insight => {
          // Verificar espacio
          if (doc.y > 650) {
            agregarFooter(doc);
            doc.addPage();
            doc.y = 50;
          }

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
      } else {
        doc.fontSize(12)
           .fillColor('#999999')
           .font('Helvetica')
           .text('No se encontraron asociaciones con los parámetros especificados.', 50, doc.y + 20);
      }

      // Footer
      agregarFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generarAprioriSimple
};
