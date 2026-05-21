// utils/reportTemplates.js — Plantillas específicas de reportes
const PDFDocument = require('pdfkit');
const {
  agregarHeaderProfesional,
  agregarKPI,
  generarGraficaPie,
  generarGraficaBarras,
  generarGraficaBarrasHorizontal,
  agregarTabla,
  agregarFooter,
  formatMoney,
  SEGMENT_COLORS
} = require('./reportGenerator');

/**
 * REPORTE 1: Distribución RFM y Análisis por Segmento
 */
async function generarReporteRFM(datosSegmentos, datosKPIs) {
  return new Promise(async (resolve, reject) => {
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

      doc.y = kpiY2 + 100;

      // Gráfica de distribución (Pie Chart)
      doc.addPage();
      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Distribución de Clientes por Segmento', 50, 50);

      const pieData = datosSegmentos.map(seg => ({
        label: `${seg.Segmento} (${seg.TotalClientes})`,
        value: seg.TotalClientes,
        color: SEGMENT_COLORS[seg.Segmento]?.bg || '#999999'
      }));

      const pieChart = await generarGraficaPie(pieData, 'Clientes por Segmento RFM');
      doc.image(pieChart, 50, 90, { width: 500 });

      // Gráfica de ventas por segmento (Bar Chart)
      doc.addPage();
      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Análisis de Ventas por Segmento', 50, 50);

      const barData = datosSegmentos
        .sort((a, b) => b.VentasTotal - a.VentasTotal)
        .map(seg => ({
          label: seg.Segmento,
          value: parseFloat(seg.VentasTotal),
          color: SEGMENT_COLORS[seg.Segmento]?.bg || '#999999'
        }));

      const barChart = await generarGraficaBarras(barData, 'Ventas Totales por Segmento', 'Ventas ($)');
      doc.image(barChart, 50, 90, { width: 500 });

      // Tabla detallada
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

      // Insights y recomendaciones
      doc.addPage();
      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Insights y Recomendaciones Estratégicas', 50, 50);

      doc.y += 20;

      // Calcular insights
      const vipData = datosSegmentos.find(s => s.Segmento === 'VIP');
      const inactivoData = datosSegmentos.find(s => s.Segmento === 'Inactivo');
      const totalClientes = datosSegmentos.reduce((sum, s) => sum + s.TotalClientes, 0);
      const totalVentas = datosSegmentos.reduce((sum, s) => sum + parseFloat(s.VentasTotal), 0);

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
        // Box del insight
        doc.roundedRect(50, doc.y, 495, 80, 5)
           .fillAndStroke('#F8F8F8', '#E0E0E0');

        // Icono
        doc.fontSize(30)
           .fillColor('#000000')
           .text(insight.icon, 65, doc.y + 25);

        // Título
        doc.fontSize(14)
           .fillColor(insight.color)
           .font('Helvetica-Bold')
           .text(insight.titulo, 110, doc.y - 55);

        // Texto
        doc.fontSize(11)
           .fillColor('#000000')
           .font('Helvetica')
           .text(insight.texto, 110, doc.y - 35, { width: 420 });

        doc.y += 100;
      });

      // Footer
      agregarFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * REPORTE 2: Análisis de Categorías y Asociaciones (Apriori)
 */
async function generarReporteApriori(reglas, parametros) {
  return new Promise(async (resolve, reject) => {
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

      // Gráfica de Top 10 asociaciones por Lift
      if (reglas.length > 0) {
        doc.fontSize(16)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text('Top Asociaciones por Lift', 50, doc.y + 10);

        const top10 = reglas.slice(0, 10);
        const liftData = top10.map(r => ({
          label: `${r.Antecedente} → ${r.Consecuente}`,
          value: parseFloat(r.Lift)
        }));

        const liftChart = await generarGraficaBarrasHorizontal(liftData, 'Asociaciones Más Fuertes (Lift)');
        doc.image(liftChart, 50, doc.y + 30, { width: 500 });

        // Tabla de reglas
        doc.addPage();
        doc.fontSize(16)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text('Reglas de Asociación Detectadas', 50, 50);

        const headers = ['Antecedente', 'Consecuente', 'Soporte', 'Confianza', 'Lift'];
        const rows = reglas.slice(0, 20).map(r => [
          r.Antecedente,
          r.Consecuente,
          (parseFloat(r.Soporte) * 100).toFixed(2) + '%',
          (parseFloat(r.Confianza) * 100).toFixed(2) + '%',
          parseFloat(r.Lift).toFixed(2)
        ]);

        agregarTabla(doc, headers, rows, {
          startY: 90,
          columnWidths: [110, 110, 80, 80, 60]
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

/**
 * REPORTE 3: Cupones de Reactivación
 */
async function generarReporteCupones(campanas) {
  return new Promise(async (resolve, reject) => {
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
        // Verificar si necesitamos nueva página
        if (doc.y > 650) {
          doc.addPage();
          doc.y = 50;
        }

        // Tarjeta de cupón
        const cardY = doc.y;

        // Fondo degradado simulado
        doc.roundedRect(50, cardY, 495, 100, 8)
           .fillAndStroke('#FFD700', '#E8C547');

        // Borde decorativo interno
        doc.roundedRect(60, cardY + 10, 475, 80, 5)
           .strokeColor('#FFFFFF')
           .lineWidth(2)
           .stroke();

        // Nombre del cliente
        doc.fontSize(14)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(`Cliente: ${campana.Nombre}`, 75, cardY + 20);

        // ID del cliente
        doc.fontSize(10)
           .fillColor('#333333')
           .font('Helvetica')
           .text(`ID: ${campana.ClienteID}`, 75, cardY + 38);

        // Categoría favorita
        doc.fontSize(11)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(`Categoría: ${campana.CategoriaFavorita}`, 75, cardY + 55);

        // Oferta
        doc.fontSize(10)
           .fillColor('#333333')
           .font('Helvetica')
           .text(campana.Oferta, 75, cardY + 70, { width: 300 });

        // Código de cupón (destacado)
        const cuponX = 400;
        doc.roundedRect(cuponX, cardY + 25, 130, 50, 5)
           .fill('#000000');

        doc.fontSize(10)
           .fillColor('#FFD700')
           .font('Helvetica-Bold')
           .text('CÓDIGO', cuponX + 10, cardY + 32, { align: 'center', width: 110 });

        doc.fontSize(14)
           .fillColor('#FFFFFF')
           .font('Courier-Bold')
           .text(campana.Cupon, cuponX + 10, cardY + 50, { align: 'center', width: 110, characterSpacing: 2 });

        doc.y = cardY + 115;
      });

      // Instrucciones de uso
      doc.addPage();
      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Instrucciones de Implementación', 50, 50);

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
        doc.roundedRect(50, doc.y, 495, 70, 5)
           .fillAndStroke('#F0F0F0', '#CCCCCC');

        // Número
        doc.circle(70, doc.y + 35, 20)
           .fill('#47C5FF');

        doc.fontSize(18)
           .fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .text(inst.num, 60, doc.y + 15, { width: 20, align: 'center' });

        // Título y texto
        doc.fontSize(13)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(inst.titulo, 110, doc.y - 45);

        doc.fontSize(10)
           .fillColor('#333333')
           .font('Helvetica')
           .text(inst.texto, 110, doc.y - 25, { width: 420 });

        doc.y += 85;
      });

      // Footer
      agregarFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * REPORTE 4: Catálogo de Productos por Categoría
 */
async function generarReporteProductos(productos, categorias) {
  return new Promise(async (resolve, reject) => {
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
      Object.keys(productosPorCategoria).sort().forEach(categoria => {
        const prods = productosPorCategoria[categoria];

        // Verificar espacio para nueva sección
        if (doc.y > 600) {
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

        // Tabla de productos
        const headers = ['Producto', 'Marca', 'Precio', 'Presentación'];
        const rows = prods.slice(0, 15).map(p => [
          p.Nombre.substring(0, 30),
          p.Marca || '-',
          formatMoney(p.Precio),
          p.Presentacion || '-'
        ]);

        agregarTabla(doc, headers, rows, {
          startY: doc.y,
          columnWidths: [200, 100, 90, 105],
          fontSize: 9
        });

        doc.y += 20;
      });

      // Footer
      agregarFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generarReporteRFM,
  generarReporteApriori,
  generarReporteCupones,
  generarReporteProductos
};
