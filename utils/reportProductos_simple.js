// utils/reportProductos_simple.js — Catálogo simplificado SIN errores de layout
const PDFDocument = require('pdfkit');
const {
  agregarHeaderProfesional,
  agregarKPI,
  agregarTabla,
  agregarFooter,
  formatMoney
} = require('./reportGenerator');

/**
 * CATÁLOGO DE PRODUCTOS SIMPLIFICADO
 */
async function generarCatalogoProductosSimple(productos, categorias) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      const reporteID = agregarHeaderProfesional(doc, 'Catálogo de Productos');

      // Resumen
      doc.fontSize(14)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Resumen de Inventario', 50, doc.y + 10);

      doc.y += 25;

      agregarKPI(doc, 50, doc.y, 'Total Productos', productos.length.toString(), '#47C5FF');
      agregarKPI(doc, 220, doc.y, 'Categorías', categorias.length.toString(), '#5DFC8A');

      doc.y += 100;

      // Agrupar productos por categoría
      const productosPorCategoria = {};
      productos.forEach(p => {
        const cat = p.CategoriaNombre || 'Sin categoría';
        if (!productosPorCategoria[cat]) {
          productosPorCategoria[cat] = [];
        }
        productosPorCategoria[cat].push(p);
      });

      // Generar secciones por categoría
      Object.keys(productosPorCategoria).sort().forEach((categoria, index) => {
        const prods = productosPorCategoria[categoria];

        // Verificar espacio para nueva sección
        if (doc.y > 650) {
          agregarFooter(doc);
          doc.addPage();
          doc.y = 50;
        }

        // Header de categoría
        doc.roundedRect(50, doc.y, 495, 35, 5)
           .fillAndStroke('#18181F', '#2A2A35');

        doc.fontSize(14)
           .fillColor('#1E3A8A')
           .font('Helvetica-Bold')
           .text(`${categoria} (${prods.length} productos)`, 65, doc.y + 10);

        doc.y += 45;

        // Tabla de productos (máximo 10 por categoría para no saturar)
        const headers = ['Producto', 'Marca', 'Precio', 'Presentación'];
        const rows = prods.slice(0, 10).map(p => [
          p.Nombre.substring(0, 30) + (p.Nombre.length > 30 ? '...' : ''),
          (p.Marca || '-').substring(0, 15),
          formatMoney(p.Precio),
          (p.Presentacion || '-').substring(0, 15)
        ]);

        agregarTabla(doc, headers, rows, {
          startY: doc.y,
          columnWidths: [200, 100, 90, 105],
          fontSize: 9
        });

        doc.y += 20;

        // Si hay más de 10 productos, mostrar nota
        if (prods.length > 10) {
          doc.fontSize(9)
             .fillColor('#6B6B80')
             .font('Helvetica')
             .text(`... y ${prods.length - 10} productos más`, 50, doc.y);
          doc.y += 15;
        }
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
  generarCatalogoProductosSimple
};
