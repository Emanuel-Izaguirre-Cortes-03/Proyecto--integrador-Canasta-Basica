// utils/reportCatalogo_final.js — Catálogo SIMPLE - Solo tablas
const PDFDocument = require('pdfkit');

function formatMoney(valor) {
  const num = parseFloat(valor);
  if (isNaN(num)) return '$0.00';
  return '$' + num.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
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

async function generarCatalogoFinal(productos, categorias) {
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
         .text('RetailRFM - Catálogo de Productos', 50, 50);

      doc.fontSize(10)
         .fillColor('#666666')
         .font('Helvetica')
         .text(fecha, 50, 80);

      doc.moveTo(50, 100).lineTo(doc.page.width - 50, 100)
         .strokeColor('#CCCCCC').lineWidth(1).stroke();

      doc.y = 120;

      // RESUMEN
      const totalProductos = productos.length;
      const totalCategorias = categorias.length;

      doc.fontSize(14)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Resumen de Inventario', 50, doc.y);

      doc.y += 25;

      doc.fontSize(11)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Total de Productos:', 50, doc.y);

      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(totalProductos.toLocaleString('es-MX'), 250, doc.y);

      doc.y += 20;

      doc.fontSize(11)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Total de Categorías:', 50, doc.y);

      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(totalCategorias.toLocaleString('es-MX'), 250, doc.y);

      doc.y += 40;

      // Agrupar productos por categoría
      const productosPorCategoria = {};
      productos.forEach(p => {
        const cat = p.CategoriaNombre || 'Sin categoría';
        if (!productosPorCategoria[cat]) {
          productosPorCategoria[cat] = [];
        }
        productosPorCategoria[cat].push(p);
      });

      // TABLA POR CATEGORÍA
      Object.keys(productosPorCategoria).sort().forEach((categoria) => {
        const prods = productosPorCategoria[categoria];

        // Verificar espacio para nueva categoría
        if (doc.y > 650) {
          doc.addPage();
          doc.y = 50;
        }

        // Header de categoría
        doc.fontSize(14)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(categoria + ` (${prods.length} productos)`, 50, doc.y);

        doc.y += 25;

        // Header de tabla
        const headerY = doc.y;
        doc.rect(50, headerY, 495, 25).fill('#1E40AF');

        doc.fontSize(9)
           .fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .text('SKU', 60, headerY + 8);
        doc.text('Producto', 110, headerY + 8);
        doc.text('Marca', 280, headerY + 8);
        doc.text('Precio', 380, headerY + 8);
        doc.text('Presentación', 450, headerY + 8);

        doc.y = headerY + 30;

        // Filas de productos
        prods.forEach((prod, index) => {
          // Verificar espacio para nueva fila
          if (doc.y > 720) {
            doc.addPage();
            doc.y = 50;

            // Repetir header
            const newHeaderY = doc.y;
            doc.rect(50, newHeaderY, 495, 25).fill('#1E40AF');
            doc.fontSize(9).fillColor('#FFFFFF').font('Helvetica-Bold')
               .text('SKU', 60, newHeaderY + 8);
            doc.text('Producto', 110, newHeaderY + 8);
            doc.text('Marca', 280, newHeaderY + 8);
            doc.text('Precio', 380, newHeaderY + 8);
            doc.text('Presentación', 450, newHeaderY + 8);

            doc.y = newHeaderY + 30;
          }

          const rowY = doc.y;
          const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F9F9F9';

          doc.rect(50, rowY, 495, 25).fill(bgColor);

          doc.fontSize(9)
             .fillColor('#000000')
             .font('Helvetica')
             .text(prod.ProductoID.toString(), 60, rowY + 8);
          doc.text(prod.Nombre.substring(0, 22), 110, rowY + 8);
          doc.text((prod.Marca || '-').substring(0, 12), 280, rowY + 8);
          doc.text(formatMoney(prod.Precio), 380, rowY + 8);
          doc.text((prod.Presentacion || '-').substring(0, 10), 450, rowY + 8);

          doc.y = rowY + 25;
        });

        doc.y += 20;
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

module.exports = { generarCatalogoFinal };
