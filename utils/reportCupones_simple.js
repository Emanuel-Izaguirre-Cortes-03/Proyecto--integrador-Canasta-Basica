// utils/reportCupones_simple.js — Cupones con diseño corregido
const PDFDocument = require('pdfkit');
const {
  agregarHeaderProfesional,
  agregarKPI,
  agregarFooter
} = require('./reportGenerator');

/**
 * CUPONES DE REACTIVACIÓN SIMPLIFICADOS
 */
async function generarCuponesSimple(campanas) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      const reporteID = agregarHeaderProfesional(doc, 'Campaña de Reactivación - Cupones');

      // Resumen de campaña
      doc.fontSize(14)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Resumen de Campaña', 50, doc.y + 10);

      doc.y += 25;

      agregarKPI(doc, 50, doc.y, 'Cupones Generados', campanas.length.toString(), '#5DFC8A');
      agregarKPI(doc, 220, doc.y, 'Segmento Objetivo', 'Inactivo', '#FF6B6B');
      agregarKPI(doc, 390, doc.y, 'Descuento', '30%', '#FFD700');

      doc.y += 100;

      // Cupones como tarjetas visuales
      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Cupones Personalizados', 50, doc.y + 10);

      doc.y += 30;

      campanas.forEach((campana, index) => {
        // Verificar si necesitamos nueva página (cada 4 cupones)
        if (index > 0 && index % 4 === 0) {
          agregarFooter(doc);
          doc.addPage();
          doc.y = 50;
        }

        const cardY = doc.y;

        // Tarjeta de cupón - DISEÑO HORIZONTAL
        // Fondo amarillo
        doc.roundedRect(50, cardY, 495, 120, 10)
           .fill('#FFD700');

        // Borde blanco interno
        doc.roundedRect(55, cardY + 5, 485, 110, 8)
           .stroke('#FFFFFF')
           .lineWidth(3);

        // LADO IZQUIERDO: Información del cliente
        doc.fontSize(12)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(`${campana.Nombre}`, 70, cardY + 20, { width: 280 });

        doc.fontSize(10)
           .fillColor('#333333')
           .font('Helvetica')
           .text(`ID Cliente: ${campana.ClienteID}`, 70, cardY + 40);

        doc.fontSize(11)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(`Categoría: ${campana.CategoriaFavorita}`, 70, cardY + 60);

        doc.fontSize(9)
           .fillColor('#333333')
           .font('Helvetica')
           .text(campana.Oferta, 70, cardY + 80, { width: 280 });

        // LADO DERECHO: Código del cupón
        const cuponX = 370;

        // Caja negra para el código
        doc.roundedRect(cuponX, cardY + 20, 155, 80, 8)
           .fill('#000000');

        // Texto "CÓDIGO"
        doc.fontSize(10)
           .fillColor('#FFD700')
           .font('Helvetica-Bold')
           .text('CÓDIGO DE DESCUENTO', cuponX + 10, cardY + 30, {
             width: 135,
             align: 'center'
           });

        // El código en sí - GRANDE y LEGIBLE
        doc.fontSize(16)
           .fillColor('#FFFFFF')
           .font('Courier-Bold')
           .text(campana.Cupon, cuponX + 10, cardY + 55, {
             width: 135,
             align: 'center',
             characterSpacing: 1
           });

        doc.y = cardY + 135;
      });

      // Instrucciones de uso
      if (doc.y > 600 || campanas.length > 3) {
        agregarFooter(doc);
        doc.addPage();
        doc.y = 50;
      } else {
        doc.y += 20;
      }

      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Instrucciones de Implementación', 50, doc.y);

      doc.y += 20;

      const instrucciones = [
        {
          num: '1',
          titulo: 'Distribución',
          texto: 'Enviar cupones vía email, SMS o notificación push según preferencias del cliente.'
        },
        {
          num: '2',
          titulo: 'Validación',
          texto: 'El código debe ser ingresado en el sistema POS al momento de la compra para aplicar el descuento.'
        },
        {
          num: '3',
          titulo: 'Vigencia',
          texto: 'Los cupones tienen validez de 30 días a partir de la fecha de emisión de este reporte.'
        },
        {
          num: '4',
          titulo: 'Seguimiento',
          texto: 'Monitorear tasa de redención y ROI de la campaña después de 2 semanas para ajustar estrategia.'
        }
      ];

      instrucciones.forEach(inst => {
        // Verificar espacio
        if (doc.y > 650) {
          agregarFooter(doc);
          doc.addPage();
          doc.y = 50;
        }

        doc.roundedRect(50, doc.y, 495, 70, 5)
           .fillAndStroke('#F0F0F0', '#CCCCCC');

        // Número circular
        doc.circle(70, doc.y + 35, 20)
           .fill('#47C5FF');

        doc.fontSize(18)
           .fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .text(inst.num, 60, doc.y + 25, { width: 20, align: 'center' });

        // Título y texto
        doc.fontSize(13)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(inst.titulo, 110, doc.y + 15);

        doc.fontSize(10)
           .fillColor('#333333')
           .font('Helvetica')
           .text(inst.texto, 110, doc.y + 35, { width: 420 });

        doc.y += 85;
      });

      // Footer final
      agregarFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generarCuponesSimple
};
