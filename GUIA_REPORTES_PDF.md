# Guía de Uso - Sistema de Reportes PDF Profesionales

## Descripción General

El sistema RetailRFM ahora incluye un módulo completo de generación de reportes PDF profesionales con visualizaciones de datos. Los reportes incluyen:

- **Diseño visual profesional** con branding RetailRFM
- **Gráficas integradas** (pie charts, barras, etc.)
- **Código de colores consistente** por segmento RFM
- **Formateo correcto** de montos y datos
- **ID único de reporte** para trazabilidad
- **Diseño tipo Dashboard** en lugar de listas simples

---

## Reportes Disponibles

### 1. Análisis de Segmentación RFM
**Endpoint:** `GET /api/reporte/rfm/pdf`

**Contenido:**
- KPIs principales del sistema (Total Clientes, Ventas, Ticket Promedio)
- Gráfica de pastel: Distribución de clientes por segmento
- Gráfica de barras: Ventas totales por segmento
- Tabla detallada con métricas por segmento
- Insights y recomendaciones estratégicas automáticas

**Ejemplo de uso:**
```javascript
// Desde el frontend
async function descargarReporteRFM() {
  const response = await fetch('http://localhost:3000/api/reporte/rfm/pdf');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Reporte_RFM.pdf';
  a.click();
}
```

**Código de colores:**
- 🟡 VIP: Dorado (#FFD700)
- 🔵 Regular: Azul (#47C5FF)
- 🟢 Nuevo: Verde (#5DFC8A)
- ⚪ Inactivo: Gris (#999999)

---

### 2. Análisis de Asociaciones (Apriori)
**Endpoint:** `POST /api/reporte/apriori/pdf`

**Parámetros del body:**
```json
{
  "soporte_min": 0.01,
  "confianza_min": 0.3
}
```

**Contenido:**
- Parámetros del análisis (soporte, confianza, total transacciones)
- Gráfica de barras horizontales: Top 10 asociaciones por Lift
- Tabla de reglas de asociación (Antecedente → Consecuente, Soporte, Confianza, Lift)
- Insights de análisis de cesta

**Ejemplo de uso:**
```javascript
async function descargarReporteApriori() {
  const response = await fetch('http://localhost:3000/api/reporte/apriori/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      soporte_min: 0.01,
      confianza_min: 0.3
    })
  });
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Reporte_Apriori.pdf';
  a.click();
}
```

---

### 3. Cupones de Reactivación
**Endpoint:** `POST /api/reporte/cupones/pdf`

**Parámetros del body:**
```json
{
  "clienteIDs": [1, 5, 12, 23, 45]
}
```

**Contenido:**
- Resumen de campaña
- **Cupones como tarjetas visuales** con diseño tipo "gift card"
- Código de cupón en tipografía monoespaciada y negrita
- Información personalizada (nombre, categoría favorita, oferta)
- Instrucciones de implementación paso a paso

**Características especiales:**
- Cada cupón tiene un código único generado automáticamente
- Formato: `REACTxxxxx` donde xxxxx es un ID único
- Diseño con fondo dorado y borde decorativo
- Código destacado en tipografía Courier Bold para fácil lectura

**Ejemplo de uso:**
```javascript
async function descargarCuponesReactivacion(clienteIDs) {
  const response = await fetch('http://localhost:3000/api/reporte/cupones/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clienteIDs })
  });
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Cupones_Reactivacion.pdf';
  a.click();
}
```

---

### 4. Catálogo de Productos
**Endpoint:** `GET /api/reporte/productos/pdf`

**Contenido:**
- Resumen de inventario (total productos, categorías)
- Productos agrupados por categoría
- Tabla con nombre, marca, precio, presentación
- Headers diferenciados por categoría

**Ejemplo de uso:**
```javascript
async function descargarCatalogoProductos() {
  const response = await fetch('http://localhost:3000/api/reporte/productos/pdf');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Catalogo_Productos.pdf';
  a.click();
}
```

---

## Características de Diseño

### Header Profesional
Todos los reportes incluyen un header con:
- Logo/Brand RetailRFM en amarillo neón (#E8FF47)
- Título del reporte en tipografía bold
- ID único de reporte (formato: RPT-TIMESTAMP-RANDOM)
- Fecha y hora de generación en español
- Línea decorativa amarilla

### KPIs Destacados
Los indicadores clave se muestran en cajas con:
- Fondo oscuro (#18181F)
- Borde sutil (#2A2A35)
- Label en gris (#6B6B80)
- Valor destacado en color específico
- Tipografía bold para valores

### Tablas Profesionales
- Header con fondo oscuro (#18181F) y texto amarillo (#E8FF47)
- Filas alternadas (blanco/gris claro) para mejor legibilidad
- Bordes sutiles
- Alineación correcta de columnas
- Formateo de montos con separadores de miles y decimales

### Gráficas
- Generadas con Chart.js
- Colores consistentes con la paleta RFM
- Labels claros y legibles
- Porcentajes en gráficas de pastel
- Valores formateados en gráficas de barras

### Footer
- Número de página (Página X de Y)
- Copyright RetailRFM.sys
- Centrado en la parte inferior

---

## Integración con Frontend

### Botón de Descarga Simple
```html
<button onclick="descargarReporteRFM()" class="btn btn-primary">
  📄 Descargar Reporte RFM
</button>
```

### Con Indicador de Carga
```javascript
async function descargarReporteConLoader(tipo) {
  const loader = document.getElementById('loader');
  loader.style.display = 'block';

  try {
    let url, filename;

    switch(tipo) {
      case 'rfm':
        url = '/api/reporte/rfm/pdf';
        filename = 'Reporte_RFM.pdf';
        break;
      case 'productos':
        url = '/api/reporte/productos/pdf';
        filename = 'Catalogo_Productos.pdf';
        break;
    }

    const response = await fetch(`http://localhost:3000${url}`);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    a.click();

    window.URL.revokeObjectURL(downloadUrl);

  } catch (error) {
    console.error('Error al descargar:', error);
    alert('Error al generar el reporte');
  } finally {
    loader.style.display = 'none';
  }
}
```

---

## Ejemplo de Integración Completa

Aquí hay un ejemplo de cómo agregar botones de descarga de reportes en el panel CU-07:

```javascript
// Agregar al panel de reportes en index.html

async function descargarReporteRFM() {
  try {
    showLoader('Generando reporte PDF...');

    const response = await fetch(`${API}/reporte/rfm/pdf`);
    if (!response.ok) throw new Error('Error al generar reporte');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_RFM_${new Date().toISOString().split('T')[0]}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);
    hideLoader();
    showNotification('Reporte descargado exitosamente', 'success');

  } catch (error) {
    console.error('Error:', error);
    hideLoader();
    showNotification('Error al generar el reporte', 'error');
  }
}

// Agregar botón en el HTML
// <button class="btn btn-accent" onclick="descargarReporteRFM()">
//   📄 Descargar Reporte PDF
// </button>
```

---

## Personalización

### Cambiar Colores de Segmentos
Editar `utils/reportGenerator.js`:

```javascript
const SEGMENT_COLORS = {
  VIP: { bg: '#TU_COLOR', text: '#000000', label: 'VIP' },
  // ... otros segmentos
};
```

### Agregar Nuevos KPIs
Editar la función `generarReporteRFM` en `utils/reportTemplates.js`:

```javascript
agregarKPI(doc, x, y, 'Nuevo KPI', valor, color);
```

### Modificar Diseño de Header
Editar la función `agregarHeaderProfesional` en `utils/reportGenerator.js`.

---

## Troubleshooting

### Error: "Cannot find module 'pdfkit'"
```bash
npm install pdfkit chartjs-node-canvas uuid
```

### PDF se descarga pero está vacío
Verificar que la base de datos tenga datos en las tablas correspondientes.

### Gráficas no se muestran
Verificar que `chartjs-node-canvas` esté instalado correctamente y que Canvas esté disponible en el sistema.

### Error de memoria en reportes grandes
Limitar el número de registros en las consultas SQL (ya implementado con TOP 200).

---

## Próximas Mejoras Sugeridas

1. **Programación de reportes**: Generar y enviar reportes automáticamente por email
2. **Filtros personalizados**: Permitir filtrar por fechas, segmentos específicos, etc.
3. **Temas personalizables**: Dark mode, light mode, colores corporativos
4. **Exportar a Excel**: Además de PDF, permitir exportación a XLSX
5. **Dashboard interactivo**: Visualización en tiempo real antes de generar PDF

---

## Soporte

Para más información sobre el sistema RetailRFM, consulta:
- `README.md` - Documentación general
- `CONTEXTO_RetailRFM.md` - Contexto del proyecto
- `DOCUMENTACION_SISTEMA.md` - Documentación técnica completa
