// utils/reportGenerator.js — Sistema profesional de generación de reportes PDF
const PDFDocument = require('pdfkit');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { v4: uuidv4 } = require('uuid');

// Configuración de colores por segmento (código de colores consistente)
const SEGMENT_COLORS = {
  VIP: { bg: '#FFD700', text: '#000000', label: 'VIP' },          // Dorado
  Regular: { bg: '#47C5FF', text: '#000000', label: 'Regular' },  // Azul
  Nuevo: { bg: '#5DFC8A', text: '#000000', label: 'Nuevo' },      // Verde
  Inactivo: { bg: '#999999', text: '#FFFFFF', label: 'Inactivo' } // Gris
};

// Configuración de gráficas
const chartConfig = {
  width: 600,
  height: 400,
  backgroundColour: 'white',
  plugins: {
    modern: ['chartjs-plugin-datalabels']
  }
};

/**
 * Genera un ID único para el reporte
 */
function generarReporteID() {
  const fecha = new Date();
  const timestamp = fecha.getTime().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RPT-${timestamp}-${random}`;
}

/**
 * Formatea números como moneda mexicana
 */
function formatMoney(valor) {
  return `$${parseFloat(valor).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Formatea fecha y hora de manera profesional
 */
function formatDateTime(date = new Date()) {
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Agrega encabezado profesional al PDF con branding
 */
function agregarHeaderProfesional(doc, titulo, reporteID = null) {
  const id = reporteID || generarReporteID();
  const fecha = formatDateTime();

  // Fondo del header
  doc.rect(0, 0, doc.page.width, 100).fill('#0A0A0F');

  // Logo/Brand (RetailRFM)
  doc.fontSize(28)
     .fillColor('#1E40AF')
     .font('Helvetica-Bold')
     .text('RetailRFM', 50, 25);

  doc.fontSize(10)
     .fillColor('#6B6B80')
     .font('Helvetica')
     .text('Sistema de Inteligencia Comercial', 50, 55);

  // Título del reporte
  doc.fontSize(18)
     .fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .text(titulo, 50, 75, { width: 300 });

  // ID de reporte y fecha (alineados a la derecha)
  const rightX = doc.page.width - 250;
  doc.fontSize(9)
     .fillColor('#6B6B80')
     .font('Helvetica')
     .text('ID de Reporte:', rightX, 30);

  doc.fontSize(11)
     .fillColor('#1E40AF')
     .font('Helvetica-Bold')
     .text(id, rightX, 43, { characterSpacing: 1 });

  doc.fontSize(9)
     .fillColor('#6B6B80')
     .font('Helvetica')
     .text('Generado:', rightX, 65);

  doc.fontSize(9)
     .fillColor('#FFFFFF')
     .text(fecha, rightX, 78);

  // Línea decorativa
  doc.moveTo(50, 110)
     .lineTo(doc.page.width - 50, 110)
     .strokeColor('#1E40AF')
     .lineWidth(2)
     .stroke();

  doc.y = 130;
  return id;
}

/**
 * Agrega un KPI destacado con diseño visual
 */
function agregarKPI(doc, x, y, label, value, color = '#1E40AF') {
  // Fondo del KPI
  doc.roundedRect(x, y, 150, 70, 5)
     .fillAndStroke('#18181F', '#2A2A35');

  // Label
  doc.fontSize(10)
     .fillColor('#6B6B80')
     .font('Helvetica')
     .text(label, x + 10, y + 10, { width: 130, align: 'left' });

  // Valor
  doc.fontSize(20)
     .fillColor(color)
     .font('Helvetica-Bold')
     .text(value, x + 10, y + 32, { width: 130, align: 'left' });
}

/**
 * Genera gráfica de pastel (distribución RFM)
 */
async function generarGraficaPie(data, titulo) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas(chartConfig);

  const labels = data.map(d => d.label);
  const values = data.map(d => d.value);
  const colors = data.map(d => d.color);

  const configuration = {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#FFFFFF',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 14, family: 'Arial', weight: 'bold' },
            padding: 15,
            color: '#000000'
          }
        },
        title: {
          display: true,
          text: titulo,
          font: { size: 18, family: 'Arial', weight: 'bold' },
          color: '#000000',
          padding: { top: 10, bottom: 20 }
        },
        datalabels: {
          color: '#000000',
          font: { size: 14, weight: 'bold' },
          formatter: (value, ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${percentage}%`;
          }
        }
      }
    },
    plugins: [{
      id: 'datalabels',
      afterDatasetsDraw: (chart) => {
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset, i) => {
          const meta = chart.getDatasetMeta(i);
          if (!meta.hidden) {
            meta.data.forEach((element, index) => {
              const data = dataset.data[index];
              const total = dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((data / total) * 100).toFixed(1);

              ctx.fillStyle = '#000000';
              const fontSize = 14;
              const fontStyle = 'bold';
              const fontFamily = 'Arial';
              ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;

              const dataString = `${percentage}%`;
              const position = element.tooltipPosition();

              ctx.fillText(dataString, position.x - 20, position.y);
            });
          }
        });
      }
    }]
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

/**
 * Genera gráfica de barras (ventas por segmento)
 */
async function generarGraficaBarras(data, titulo, label = 'Ventas') {
  const chartJSNodeCanvas = new ChartJSNodeCanvas(chartConfig);

  const labels = data.map(d => d.label);
  const values = data.map(d => d.value);
  const colors = data.map(d => d.color);

  const configuration = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(c => c),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: { size: 12 },
            color: '#000000',
            callback: function(value) {
              if (label.includes('$') || label.includes('Ventas')) {
                return '$' + value.toLocaleString('es-MX');
              }
              return value.toLocaleString('es-MX');
            }
          },
          grid: {
            color: '#E0E0E0'
          }
        },
        x: {
          ticks: {
            font: { size: 12, weight: 'bold' },
            color: '#000000'
          },
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: titulo,
          font: { size: 18, family: 'Arial', weight: 'bold' },
          color: '#000000',
          padding: { top: 10, bottom: 20 }
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

/**
 * Genera gráfica de barras horizontales (para reglas Apriori)
 */
async function generarGraficaBarrasHorizontal(data, titulo) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ ...chartConfig, height: Math.max(400, data.length * 40) });

  const labels = data.map(d => d.label);
  const values = data.map(d => d.value);

  const configuration = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Lift',
        data: values,
        backgroundColor: '#47C5FF',
        borderColor: '#47C5FF',
        borderWidth: 2
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            font: { size: 12 },
            color: '#000000'
          },
          grid: {
            color: '#E0E0E0'
          }
        },
        y: {
          ticks: {
            font: { size: 11 },
            color: '#000000'
          },
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: titulo,
          font: { size: 18, family: 'Arial', weight: 'bold' },
          color: '#000000',
          padding: { top: 10, bottom: 20 }
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

/**
 * Genera tabla profesional con datos
 */
function agregarTabla(doc, headers, rows, options = {}) {
  const {
    startX = 50,
    startY = doc.y + 20,
    columnWidths = null,
    headerBg = '#18181F',
    headerText = '#1E40AF',
    rowBg1 = '#FFFFFF',
    rowBg2 = '#F5F5F5',
    textColor = '#000000',
    fontSize = 10
  } = options;

  let y = startY;
  const tableWidth = doc.page.width - 100;
  const colWidths = columnWidths || headers.map(() => tableWidth / headers.length);

  // Header
  doc.rect(startX, y, tableWidth, 25)
     .fillAndStroke(headerBg, '#2A2A35');

  let x = startX;
  headers.forEach((header, i) => {
    doc.fontSize(fontSize)
       .fillColor(headerText)
       .font('Helvetica-Bold')
       .text(header, x + 5, y + 8, { width: colWidths[i] - 10, align: 'left' });
    x += colWidths[i];
  });

  y += 25;

  // Rows
  rows.forEach((row, rowIdx) => {
    const bgColor = rowIdx % 2 === 0 ? rowBg1 : rowBg2;
    doc.rect(startX, y, tableWidth, 20)
       .fill(bgColor);

    x = startX;
    row.forEach((cell, cellIdx) => {
      doc.fontSize(fontSize - 1)
         .fillColor(textColor)
         .font('Helvetica')
         .text(String(cell), x + 5, y + 5, { width: colWidths[cellIdx] - 10, align: 'left' });
      x += colWidths[cellIdx];
    });

    y += 20;
  });

  doc.y = y + 10;
}

/**
 * Genera footer con número de página (VERSIÓN CORREGIDA)
 * Nota: En lugar de usar switchToPage que causa errores,
 * esta función debe llamarse MANUALMENTE en cada página antes de addPage()
 */
function agregarFooter(doc, pageNum = null, totalPages = null) {
  const y = doc.page.height - 50;

  let texto = 'RetailRFM.sys © 2026';
  if (pageNum && totalPages) {
    texto = `Página ${pageNum} de ${totalPages} | ${texto}`;
  }

  doc.fontSize(9)
     .fillColor('#6B6B80')
     .font('Helvetica')
     .text(
       texto,
       50,
       y,
       { align: 'center', width: doc.page.width - 100 }
     );
}

module.exports = {
  generarReporteID,
  formatMoney,
  formatDateTime,
  agregarHeaderProfesional,
  agregarKPI,
  generarGraficaPie,
  generarGraficaBarras,
  generarGraficaBarrasHorizontal,
  agregarTabla,
  agregarFooter,
  SEGMENT_COLORS
};
