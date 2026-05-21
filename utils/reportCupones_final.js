// utils/reportCupones_final.js — Cupones SIMPLE - Solo tablas
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

async function generarCuponesFinal(campanas) {
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
         .text('RetailRFM - Cupones de Reactivación', 50, 50);

      doc.fontSize(10)
         .fillColor('#666666')
         .font('Helvetica')
         .text(fecha, 50, 80);

      doc.moveTo(50, 100).lineTo(doc.page.width - 50, 100)
         .strokeColor('#CCCCCC').lineWidth(1).stroke();

      doc.y = 120;

      // RESUMEN
      doc.fontSize(14)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Resumen de Campaña', 50, doc.y);

      doc.y += 25;

      doc.fontSize(11)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Cupones Generados:', 50, doc.y);
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(campanas.length.toString(), 250, doc.y);

      doc.y += 20;

      doc.fontSize(11)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Segmento Objetivo:', 50, doc.y);
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Inactivo', 250, doc.y);

      doc.y += 20;

      doc.fontSize(11)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Descuento Ofrecido:', 50, doc.y);
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('30%', 250, doc.y);

      doc.y += 40;

      // TABLA DE CUPONES
      doc.fontSize(14)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Lista de Cupones', 50, doc.y);

      doc.y += 25;

      // Header de tabla
      const headerY = doc.y;
      doc.rect(50, headerY, 495, 25).fill('#1E40AF');

      doc.fontSize(9)
         .fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .text('Cliente ID', 60, headerY + 8);
      doc.text('Nombre', 130, headerY + 8);
      doc.text('Categoría Favorita', 280, headerY + 8);
      doc.text('Código Cupón', 420, headerY + 8);

      doc.y = headerY + 30;

      // Filas de cupones
      campanas.forEach((campana, index) => {
        // Verificar espacio
        if (doc.y > 720) {
          doc.addPage();
          doc.y = 50;

          // Repetir header
          const newHeaderY = doc.y;
          doc.rect(50, newHeaderY, 495, 25).fill('#1E40AF');
          doc.fontSize(9).fillColor('#FFFFFF').font('Helvetica-Bold')
             .text('Cliente ID', 60, newHeaderY + 8);
          doc.text('Nombre', 130, newHeaderY + 8);
          doc.text('Categoría Favorita', 280, newHeaderY + 8);
          doc.text('Código Cupón', 420, newHeaderY + 8);

          doc.y = newHeaderY + 30;
        }

        const rowY = doc.y;
        const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F9F9F9';

        doc.rect(50, rowY, 495, 25).fill(bgColor);

        doc.fontSize(9)
           .fillColor('#000000')
           .font('Helvetica')
           .text(campana.ClienteID.toString(), 60, rowY + 8);
        doc.text(campana.Nombre.substring(0, 20), 130, rowY + 8);
        doc.text((campana.CategoriaFavorita || '-').substring(0, 18), 280, rowY + 8);
        doc.fontSize(9)
           .fillColor('#000000')
           .font('Courier-Bold')
           .text(campana.Cupon, 420, rowY + 8);

        doc.y = rowY + 25;
      });

      // INSTRUCCIONES
      doc.y += 30;

      if (doc.y > 650) {
        doc.addPage();
        doc.y = 50;
      }

      doc.fontSize(14)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Instrucciones de Uso', 50, doc.y);

      doc.y += 25;

      const instrucciones = [
        'Distribuir cupones vía email, SMS o notificación push según preferencias del cliente.',
        'Validar código en sistema POS al momento de la compra para aplicar descuento.',
        'Vigencia de 30 días a partir de la fecha de emisión de este reporte.',
        'Monitorear tasa de redención después de 2 semanas para ajustar estrategia.'
      ];

      instrucciones.forEach((inst, index) => {
        doc.fontSize(10)
           .fillColor('#333333')
           .font('Helvetica')
           .text(`${index + 1}. ${inst}`, 50, doc.y, { width: 495 });

        doc.y += 30;
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

module.exports = { generarCuponesFinal };
