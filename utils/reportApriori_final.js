// utils/reportApriori_final.js — Apriori SIMPLE - Solo tablas
const PDFDocument = require('pdfkit');

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

async function generarAprioriFinal(reglas, parametros) {
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

      // HEADER
      doc.fontSize(24)
         .fillColor('#1E40AF')
         .font('Helvetica-Bold')
         .text('RetailRFM - Análisis de Asociaciones', 50, 50);

      doc.fontSize(10)
         .fillColor('#666666')
         .font('Helvetica')
         .text(fecha, 50, 80);

      doc.moveTo(50, 100).lineTo(doc.page.width - 50, 100)
         .strokeColor('#CCCCCC').lineWidth(1).stroke();

      doc.y = 120;

      // PARÁMETROS
      doc.fontSize(14)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Parámetros del Análisis', 50, doc.y);

      doc.y += 25;

      doc.fontSize(11)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Soporte Mínimo:', 50, doc.y);
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(`${(parametros.soporte_min * 100).toFixed(2)}%`, 250, doc.y);

      doc.y += 20;

      doc.fontSize(11)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Confianza Mínima:', 50, doc.y);
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(`${(parametros.confianza_min * 100).toFixed(2)}%`, 250, doc.y);

      doc.y += 20;

      doc.fontSize(11)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Transacciones Analizadas:', 50, doc.y);
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(parametros.total_transacciones.toLocaleString('es-MX'), 250, doc.y);

      doc.y += 40;

      // TABLA DE REGLAS
      if (reglas.length > 0) {
        doc.fontSize(14)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text('Reglas de Asociación Detectadas', 50, doc.y);

        doc.y += 25;

        // Header de tabla
        const headerY = doc.y;
        doc.rect(50, headerY, 495, 25).fill('#1E40AF');

        doc.fontSize(9)
           .fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .text('Antecedente', 60, headerY + 8);
        doc.text('Consecuente', 170, headerY + 8);
        doc.text('Soporte', 280, headerY + 8);
        doc.text('Confianza', 360, headerY + 8);
        doc.text('Lift', 460, headerY + 8);

        doc.y = headerY + 30;

        // Filas de datos (máximo 30 reglas)
        const reglasLimitadas = reglas.slice(0, 30);

        reglasLimitadas.forEach((regla, index) => {
          // Verificar espacio
          if (doc.y > 720) {
            doc.addPage();
            doc.y = 50;

            // Repetir header
            const newHeaderY = doc.y;
            doc.rect(50, newHeaderY, 495, 25).fill('#1E40AF');
            doc.fontSize(9).fillColor('#FFFFFF').font('Helvetica-Bold')
               .text('Antecedente', 60, newHeaderY + 8);
            doc.text('Consecuente', 170, newHeaderY + 8);
            doc.text('Soporte', 280, newHeaderY + 8);
            doc.text('Confianza', 360, newHeaderY + 8);
            doc.text('Lift', 460, newHeaderY + 8);

            doc.y = newHeaderY + 30;
          }

          const rowY = doc.y;
          const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F9F9F9';

          doc.rect(50, rowY, 495, 25).fill(bgColor);

          doc.fontSize(9)
             .fillColor('#000000')
             .font('Helvetica')
             .text(regla.Antecedente.substring(0, 15), 60, rowY + 8);
          doc.text(regla.Consecuente.substring(0, 15), 170, rowY + 8);
          doc.text((parseFloat(regla.Soporte) * 100).toFixed(2) + '%', 280, rowY + 8);
          doc.text((parseFloat(regla.Confianza) * 100).toFixed(2) + '%', 360, rowY + 8);
          doc.text(parseFloat(regla.Lift).toFixed(2), 460, rowY + 8);

          doc.y = rowY + 25;
        });

        // RECOMENDACIONES
        doc.y += 30;

        if (doc.y > 650) {
          doc.addPage();
          doc.y = 50;
        }

        doc.fontSize(14)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text('Recomendaciones', 50, doc.y);

        doc.y += 25;

        const topRegla = reglas[0];

        const recomendaciones = [
          `Implementar cross-selling: Sugerir "${topRegla.Consecuente}" cuando el cliente compre "${topRegla.Antecedente}".`,
          `Crear combos promocionales basados en las asociaciones más fuertes.`,
          `Optimizar ubicación de productos relacionados en punto de venta.`,
          `Mantener inventario sincronizado de productos asociados.`
        ];

        recomendaciones.forEach((rec, index) => {
          doc.fontSize(10)
             .fillColor('#333333')
             .font('Helvetica')
             .text(`${index + 1}. ${rec}`, 50, doc.y, { width: 495 });

          doc.y += 30;
        });

      } else {
        doc.fontSize(11)
           .fillColor('#666666')
           .font('Helvetica')
           .text('No se encontraron asociaciones con los parámetros especificados.', 50, doc.y);
      }

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

module.exports = { generarAprioriFinal };
