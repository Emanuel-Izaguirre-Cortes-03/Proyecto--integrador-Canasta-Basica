# Guía de Integración - Reportes PDF en el Frontend

## Objetivo
Esta guía te ayudará a integrar los botones de descarga de reportes PDF en el archivo `index.html` principal del sistema RetailRFM.

---

## Paso 1: Agregar Funciones JavaScript

Agregar estas funciones al final del `<script>` en tu `index.html`:

```javascript
// ═══════════════════════════════════════════════════════════
//  FUNCIONES DE DESCARGA DE REPORTES PDF
// ═══════════════════════════════════════════════════════════

/**
 * Descarga el reporte de Análisis RFM en PDF
 */
async function descargarReporteRFM() {
  try {
    showLoader('Generando análisis RFM con gráficas...');

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
    showNotification('✅ Reporte RFM descargado exitosamente');

  } catch (error) {
    console.error('Error:', error);
    hideLoader();
    alert('Error al generar el reporte RFM');
  }
}

/**
 * Descarga el reporte de Análisis Apriori en PDF
 */
async function descargarReporteApriori() {
  try {
    // Obtener parámetros del formulario si existen
    const soporteMin = 0.01;
    const confianzaMin = 0.3;

    showLoader('Ejecutando análisis Apriori...');

    const response = await fetch(`${API}/reporte/apriori/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soporte_min: soporteMin, confianza_min: confianzaMin })
    });

    if (!response.ok) throw new Error('Error al generar reporte');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Apriori_${new Date().toISOString().split('T')[0]}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);
    hideLoader();
    showNotification('✅ Reporte Apriori descargado exitosamente');

  } catch (error) {
    console.error('Error:', error);
    hideLoader();
    alert('Error al generar el reporte Apriori');
  }
}

/**
 * Descarga cupones de reactivación en PDF
 */
async function descargarCupones(clienteIDs) {
  try {
    if (!clienteIDs || clienteIDs.length === 0) {
      alert('Selecciona al menos un cliente');
      return;
    }

    showLoader(`Generando ${clienteIDs.length} cupones personalizados...`);

    const response = await fetch(`${API}/reporte/cupones/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteIDs })
    });

    if (!response.ok) throw new Error('Error al generar cupones');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cupones_Reactivacion_${new Date().toISOString().split('T')[0]}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);
    hideLoader();
    showNotification(`✅ ${clienteIDs.length} cupones generados exitosamente`);

  } catch (error) {
    console.error('Error:', error);
    hideLoader();
    alert('Error al generar los cupones');
  }
}

/**
 * Descarga catálogo de productos en PDF
 */
async function descargarCatalogoProductos() {
  try {
    showLoader('Generando catálogo de productos...');

    const response = await fetch(`${API}/reporte/productos/pdf`);
    if (!response.ok) throw new Error('Error al generar catálogo');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Catalogo_Productos_${new Date().toISOString().split('T')[0]}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);
    hideLoader();
    showNotification('✅ Catálogo descargado exitosamente');

  } catch (error) {
    console.error('Error:', error);
    hideLoader();
    alert('Error al generar el catálogo');
  }
}

/**
 * Funciones auxiliares para loader y notificaciones
 */
function showLoader(message) {
  // Implementa tu propio loader o usa un div existente
  console.log(message);
}

function hideLoader() {
  // Oculta el loader
  console.log('Loader oculto');
}

function showNotification(message) {
  // Implementa tu propio sistema de notificaciones
  console.log(message);
}
```

---

## Paso 2: Agregar Botones en CU-07 (Panel de Reportes)

Dentro del `<div id="cu07">`, agregar estos botones:

```html
<!-- Sección de Reportes PDF -->
<div class="section">
  <h3>📄 Reportes PDF Profesionales</h3>

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">

    <!-- Botón Reporte RFM -->
    <button class="btn btn-accent" onclick="descargarReporteRFM()">
      <span style="font-size: 1.2em;">📈</span>
      Reporte RFM
    </button>

    <!-- Botón Catálogo Productos -->
    <button class="btn btn-primary" onclick="descargarCatalogoProductos()">
      <span style="font-size: 1.2em;">📦</span>
      Catálogo Productos
    </button>

  </div>

  <p style="margin-top: 15px; color: var(--muted); font-size: 0.9em;">
    Los reportes incluyen gráficas profesionales, KPIs destacados y diseño optimizado para impresión.
  </p>
</div>
```

---

## Paso 3: Agregar Botón en CU-06 (Panel Apriori)

Dentro del `<div id="cu06">`, después de mostrar los resultados:

```html
<!-- Botón para descargar reporte PDF -->
<div style="margin-top: 20px; text-align: center;">
  <button class="btn btn-accent" onclick="descargarReporteApriori()">
    📄 Descargar Reporte PDF
  </button>
</div>
```

---

## Paso 4: Agregar Botón en CU-08 (Panel de Reactivación)

Dentro del `<div id="cu08">`, después de generar las campañas:

```html
<!-- Función mejorada para generar campaña -->
<script>
async function generarCampana() {
  // ... código existente ...

  // Después de mostrar las campañas, agregar opción de descargar PDF
  document.getElementById('campanasResultado').innerHTML += `
    <div style="text-align: center; margin-top: 20px;">
      <button class="btn btn-accent" onclick="descargarCupones([${clientesSeleccionados.join(',')}])">
        🎁 Descargar Cupones en PDF
      </button>
    </div>
  `;
}
</script>
```

---

## Paso 5: Estilos CSS Opcionales

Si quieres agregar un estilo especial para los botones de PDF, agregar esto a tu CSS:

```css
/* Botones de PDF con icono */
.btn-pdf {
  background: linear-gradient(135deg, var(--accent2), var(--accent));
  color: var(--bg);
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.btn-pdf:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(232, 255, 71, 0.3);
}

.btn-pdf:active {
  transform: translateY(0);
}
```

---

## Paso 6: Loader Mejorado (Opcional)

Si quieres un loader más visual, agregar este HTML y CSS:

```html
<!-- Agregar al final del body -->
<div id="pdfLoader" class="pdf-loader" style="display: none;">
  <div class="loader-content">
    <div class="spinner"></div>
    <div class="loader-text" id="pdfLoaderText">Generando reporte...</div>
  </div>
</div>
```

```css
.pdf-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 15, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader-content {
  text-align: center;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid var(--surface);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loader-text {
  color: var(--accent);
  font-size: 1.2rem;
  font-weight: 600;
}
```

```javascript
// Actualizar funciones showLoader y hideLoader
function showLoader(message) {
  document.getElementById('pdfLoader').style.display = 'flex';
  document.getElementById('pdfLoaderText').textContent = message;
}

function hideLoader() {
  document.getElementById('pdfLoader').style.display = 'none';
}
```

---

## Ejemplo Completo: Panel CU-07 Mejorado

```html
<div id="cu07" class="panel">
  <h2>📊 CU-07: Reportes por Segmento</h2>

  <!-- KPIs existentes -->
  <div class="kpi-grid">
    <!-- ... KPIs actuales ... -->
  </div>

  <!-- Gráficas existentes -->
  <div class="charts">
    <!-- ... gráficas actuales ... -->
  </div>

  <!-- NUEVA SECCIÓN: Reportes PDF -->
  <div class="section" style="margin-top: 40px; padding: 25px; background: var(--surface); border-radius: 12px; border: 1px solid var(--border);">
    <h3 style="color: var(--accent); margin-bottom: 15px;">
      📄 Reportes PDF Profesionales
    </h3>

    <p style="color: var(--muted); margin-bottom: 20px;">
      Descarga reportes con diseño profesional, gráficas integradas y análisis detallado.
    </p>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">

      <button class="btn btn-accent" onclick="descargarReporteRFM()" title="Descargar análisis completo RFM">
        <span style="font-size: 1.3em;">📈</span>
        <div style="text-align: left;">
          <div style="font-weight: bold;">Análisis RFM</div>
          <div style="font-size: 0.8em; opacity: 0.8;">Segmentación y KPIs</div>
        </div>
      </button>

      <button class="btn btn-primary" onclick="descargarCatalogoProductos()" title="Descargar catálogo completo">
        <span style="font-size: 1.3em;">📦</span>
        <div style="text-align: left;">
          <div style="font-weight: bold;">Catálogo</div>
          <div style="font-size: 0.8em; opacity: 0.8;">Productos por categoría</div>
        </div>
      </button>

    </div>

    <div style="margin-top: 15px; padding: 12px; background: rgba(232, 255, 71, 0.1); border-radius: 6px; border-left: 3px solid var(--accent);">
      <small style="color: var(--muted);">
        💡 <strong>Tip:</strong> Los reportes incluyen gráficas de distribución, análisis comparativo
        y recomendaciones estratégicas automáticas.
      </small>
    </div>
  </div>
</div>
```

---

## Testing

1. **Reiniciar el servidor:**
   ```bash
   restart_server.bat
   ```

2. **Abrir index.html en el navegador**

3. **Ir al panel CU-07**

4. **Hacer clic en "Análisis RFM"**
   - Debería descargarse un PDF con gráficas y tablas
   - Verificar que tenga datos reales de la BD

5. **Probar otros botones**
   - Catálogo de Productos
   - Reporte Apriori (desde CU-06)
   - Cupones (desde CU-08)

---

## Troubleshooting

### "Error al generar el reporte"
- Verificar que el servidor esté corriendo
- Verificar que la BD tenga datos en `Clientes_RFM`
- Ejecutar `/api/rfm/actualizar` para recalcular segmentos

### PDF se descarga vacío
- Abrir la consola del navegador (F12)
- Verificar que no haya errores en el servidor
- Verificar que las consultas SQL devuelvan datos

### Loader no funciona
- Verificar que las funciones `showLoader` y `hideLoader` estén implementadas
- Verificar que el elemento `#pdfLoader` exista en el HTML

---

## Ventajas de Esta Implementación

✅ **No invasiva:** Se integra sin modificar código existente
✅ **Modular:** Cada función es independiente
✅ **Reutilizable:** Las mismas funciones sirven para múltiples paneles
✅ **User-friendly:** Descarga automática con nombre descriptivo
✅ **Profesional:** PDFs con diseño tipo Dashboard
✅ **Escalable:** Fácil agregar más tipos de reportes

---

## Próximos Pasos

1. Integrar los botones según esta guía
2. Personalizar estilos si es necesario
3. Probar cada tipo de reporte
4. Ajustar parámetros de Apriori según necesidad
5. Agregar más tipos de reportes si se requiere

---

**¡Sistema de reportes PDF listo para producción!**
