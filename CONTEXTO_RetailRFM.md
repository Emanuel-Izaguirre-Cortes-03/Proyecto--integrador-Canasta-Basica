# CONTEXTO DEL PROYECTO — RetailRFM Sistema de Casos de Uso

## ¿Qué es este proyecto?

Es una aplicación web de inteligencia comercial para una tienda retail, conectada a una base de datos SQL Server real llamada **RetailOnlineDB_v2**. El sistema implementa **8 casos de uso** basados en análisis de Market Basket Analysis (Apriori) y segmentación RFM de clientes.

El proyecto está dividido en dos partes:
- **Backend**: Node.js + Express (`server.js`) que expone una API REST
- **Frontend**: Un solo archivo `index.html` que consume esa API

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Base de datos | SQL Server 2019 — instancia `localhost\MSSQLSERVER02` puerto `50920` |
| Backend | Node.js v24 + Express + mssql |
| Frontend | HTML + CSS + Vanilla JS (sin frameworks) |
| Autenticación BD | SQL Server Auth — usuario `rfmuser`, password `Rfm1234!` |

---

## Estructura de Archivos

```
implementacion bd/          ← carpeta en Escritorio del usuario
├── server.js               ← API REST (8 endpoints principales)
├── db.js                   ← Conexión a SQL Server
├── .env                    ← Variables de entorno
├── package.json
└── index.html              ← Frontend completo
```

### db.js (conexión actual que funciona)
```javascript
const sql = require('mssql');
const config = {
  server: 'localhost\\MSSQLSERVER02',
  database: 'RetailOnlineDB_v2',
  port: 50920,
  user: 'rfmuser',
  password: 'Rfm1234!',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  }
};
```

---

## Base de Datos — RetailOnlineDB_v2

### Tablas y columnas relevantes

```sql
-- Clientes
ClienteID, Nombre, Edad, Genero, Ciudad, Estado, NivelSocioeconomico, FechaRegistro

-- Clientes_RFM (tabla de segmentación ya calculada)
ClienteID, Recencia, Frecuencia, MontoTotal, TicketPromedio, Tipo_Cliente
-- Tipo_Cliente puede ser: 'VIP', 'Regular', 'Nuevo', 'Inactivo'

-- Ventas
VentaID, Fecha, VendedorID, Total, MetodoPago, NumProductos, ArticuloMasComprado

-- Detalle_Ventas
DetalleID, VentaID, ProductoID, Cantidad, PrecioUnitario, Subtotal

-- Productos
ProductoID, Nombre, Descripcion, Precio, CategoriaID, Marca, Presentacion

-- Categorias
CategoriaID, Nombre, Descripcion

-- Vendedores
VendedorID, Nombre, Sucursal
```

### Datos importantes
- 400,000 ventas registradas
- ~8,739 productos en catálogo
- 5,000 clientes clasificados por RFM
- 12 categorías de producto
- Tickets promedio: ~$43,124

---

## Los 8 Casos de Uso

### ✅ CU-03, CU-05, CU-07 — YA IMPLEMENTADOS Y FUNCIONANDO

**CU-05 — Clasificar Clientes RFM**
- Formulario donde ingresas Recencia (días sin comprar), Frecuencia (compras totales), Monto
- El backend calcula score 1-9 y asigna segmento
- Tabla de clientes reales desde `Clientes_RFM JOIN Clientes`
- Filtros por segmento (VIP / Regular / Nuevo / Inactivo)
- Endpoint: `POST /api/rfm/clasificar`, `GET /api/rfm/clientes`

**CU-03 — Ofertas por Tipo de Cliente**
- 4 tarjetas mostrando beneficios por segmento
- Simulador de checkout: seleccionas tipo + monto → API calcula precio final
- VIP: 5% cashback | Regular: 10% desc | Nuevo: 25% desc | Inactivo: 30% desc
- Endpoint: `GET /api/oferta/:segmento?monto=1500`

**CU-07 — Reporte por Segmento**
- KPIs reales desde BD (total ventas, monto total, ticket promedio, total productos)
- Gráfica de barras de ventas por segmento
- Donut chart de distribución de clientes por segmento
- Datos vienen de `Clientes_RFM` agrupados por `Tipo_Cliente`
- Endpoints: `GET /api/reporte/resumen`, `GET /api/reporte/kpis`

---

### ❌ CU-01, CU-02, CU-04, CU-06, CU-08 — PENDIENTES DE IMPLEMENTAR EN EL FRONTEND

El `server.js` ya tiene todos los endpoints para estos 5 casos de uso. Lo que falta es el **frontend** — las pestañas y componentes en `index.html`.

**CU-01 — Consultar Productos y Categorías**
- Buscador de productos por categoría y texto libre
- Grid de tarjetas de productos con nombre, marca, precio, categoría
- Cards resumen de cuántos productos tiene cada categoría
- Endpoints ya listos: `GET /api/categorias`, `GET /api/productos?categoria=1&buscar=nike&limit=50`

**CU-02 — Recomendaciones basadas en Apriori**
- El usuario selecciona una categoría (simula "agregar al carrito")
- El sistema busca qué otras categorías se compran juntas en `Detalle_Ventas`
- Muestra barra de asociaciones con porcentaje de soporte
- Muestra productos recomendados de esas categorías
- Endpoint: `GET /api/recomendaciones?categoriaID=1`

**CU-04 — Combos Anti-Merma**
- Muestra 4 combos generados automáticamente desde la BD
- Identifica categorías con menor soporte (perecederos en riesgo de merma)
- Cada combo muestra: nombre, mecánica, descuento, categorías incluidas, tipo (anti-merma / cross-selling)
- Endpoint: `GET /api/combos`

**CU-06 — Ejecutar Análisis Apriori**
- Panel con sliders para soporte mínimo y confianza mínima
- Botón "Ejecutar Apriori" → llama al backend
- El backend calcula itemsets de tamaño 1 y 2 desde transacciones reales
- Muestra tabla de reglas con: Antecedente → Consecuente | Soporte | Confianza | Lift
- Endpoint: `POST /api/apriori/ejecutar` body: `{ soporte_min: 0.01, confianza_min: 0.30 }`

**CU-08 — Campaña de Reactivación de Clientes Inactivos**
- Lista los 50 clientes inactivos con mayor MontoTotal histórico
- El usuario puede seleccionar clientes con checkboxes
- Botón "Generar Campaña" → API devuelve cupones personalizados por categoría favorita
- Muestra cards de campaña con: nombre cliente, canal (Email/SMS/Push), oferta, cupón
- Endpoints: `GET /api/reactivacion/clientes`, `POST /api/reactivacion/generar` body: `{ clienteIDs: [1,2,3] }`

---

## API Endpoints Completos

```
GET  /api/health
GET  /api/categorias
GET  /api/productos?categoria=&buscar=&limit=50
GET  /api/recomendaciones?categoriaID=1
GET  /api/oferta/:segmento?monto=1500
GET  /api/combos
POST /api/rfm/clasificar         body: { recencia, frecuencia, monto }
GET  /api/rfm/clientes?segmento=VIP&limit=100
POST /api/apriori/ejecutar       body: { soporte_min, confianza_min }
GET  /api/reporte/resumen
GET  /api/reporte/kpis
GET  /api/reactivacion/clientes
POST /api/reactivacion/generar   body: { clienteIDs: [] }
```

---

## Estado Actual del index.html

El `index.html` tiene estas **3 pestañas funcionando**:
- `CU-05 Clasificar` — activa por default
- `CU-03 Ofertas`
- `CU-07 Reporte`

**Lo que hay que agregar** son 5 pestañas nuevas en el nav y sus paneles correspondientes:
```html
<button class="nav-tab" onclick="showPanel('cu01',this)">CU-01 Productos</button>
<button class="nav-tab" onclick="showPanel('cu02',this)">CU-02 Recomend.</button>
<button class="nav-tab" onclick="showPanel('cu04',this)">CU-04 Anti-Merma</button>
<button class="nav-tab" onclick="showPanel('cu06',this)">CU-06 Apriori</button>
<button class="nav-tab" onclick="showPanel('cu08',this)">CU-08 Reactivar</button>
```

---

## Diseño Visual (CSS Variables)

El frontend usa un tema oscuro con estas variables:
```css
--bg: #0a0a0f          /* fondo principal */
--surface: #111118     /* tarjetas y panels */
--surface2: #18181f    /* encabezados de tabla */
--border: #2a2a35      /* bordes */
--accent: #e8ff47      /* amarillo neón — color principal */
--accent2: #47c5ff     /* azul cyan */
--accent3: #ff6b47     /* naranja */
--accent4: #b847ff     /* morado */
--text: #f0f0f5        /* texto principal */
--muted: #6b6b80       /* texto secundario */
--vip: #ffd700         /* dorado VIP */
--regular: #47c5ff     /* azul Regular */
--nuevo: #5dfc8a       /* verde Nuevo */
--inactivo: #ff6b6b    /* rojo Inactivo */
```

Fuentes: `Syne` (títulos, valores grandes) + `Space Mono` (cuerpo, monospace)

---

## Lógica de Clasificación RFM (JavaScript + API)

```javascript
// Score 1-3 por dimensión
const sr = recencia  <= 7   ? 3 : recencia  <= 30  ? 2 : 1;
const sf = frecuencia >= 15  ? 3 : frecuencia >= 5   ? 2 : 1;
const sm = monto      >= 5000 ? 3 : monto      >= 1500 ? 2 : 1;
const score = sr + sf + sm; // 3-9

// Reglas de segmentación
if (recencia === 0 && frecuencia <= 2)       → 'Nuevo'
if (recencia > 120 && frecuencia <= 3)       → 'Inactivo'
if (score >= 8)                              → 'VIP'
if (score >= 5)                              → 'Regular'
if (score <= 3 && recencia > 90)             → 'Inactivo'
else                                         → 'Regular'
```

---

## Funciones JS Clave ya Implementadas

```javascript
const API = 'http://localhost:3000/api';
const SEG_COLOR = { VIP:'var(--vip)', Regular:'var(--regular)', Nuevo:'var(--nuevo)', Inactivo:'var(--inactivo)' };
const SEG_EMOJI = { VIP:'⭐', Regular:'◆', Nuevo:'✦', Inactivo:'◉' };
const SEG_CLASS = { VIP:'seg-vip', Regular:'seg-regular', Nuevo:'seg-nuevo', Inactivo:'seg-inactivo' };

checkAPI()           // verifica conexión al backend, carga KPIs y clientes
cargarKPIs()         // GET /api/reporte/kpis → llena cards superiores
clasificarCliente()  // POST /api/rfm/clasificar → muestra resultado
cargarClientes(seg)  // GET /api/rfm/clientes → llena tabla
renderTabla(data)    // renderiza filas con nombre, score, segmento
simular()            // GET /api/oferta/:tipo → muestra precio con descuento
cargarReporte()      // GET /api/reporte/resumen → llena charts
showPanel(id, btn)   // navegación entre pestañas
```

---

## Lo que Necesita Hacer el Siguiente Chat

1. **Recibir el `index.html` actual** (el usuario lo pegará)
2. **Agregar las 5 pestañas faltantes** al nav y sus paneles completos
3. **Implementar las funciones JS** para cada CU nuevo:
   - `cargarCategorias()` — llena el select y las cards de CU-01
   - `buscarProductos()` — busca productos con filtros en CU-01
   - `obtenerRecomendaciones()` — CU-02
   - `cargarCombos()` — CU-04
   - `ejecutarApriori()` — CU-06 con parámetros configurables
   - `cargarInactivos()` — CU-08 lista clientes
   - `generarCampana()` — CU-08 genera cupones
4. **Mantener el estilo visual** exacto — mismo tema oscuro, mismas fuentes, mismas variables CSS
5. **Todo en un solo archivo HTML** — sin frameworks, sin librerías externas salvo Google Fonts

---

## Notas Importantes

- El backend **ya está completo** — no hay que tocar `server.js` ni `db.js`
- El frontend debe tener **fallback offline**: si la API falla, mostrar datos de ejemplo en lugar de pantalla rota
- La función `showPanel(id, btn)` ya existe y maneja la navegación — solo hay que agregar los nuevos `id` de paneles
- Las clases CSS `.seg-pill`, `.seg-vip`, `.seg-regular`, `.seg-nuevo`, `.seg-inactivo`, `.card`, `.btn`, etc. ya están definidas y se pueden reutilizar
- Cuando se carga CU-07 se debe llamar `cargarReporte()` automáticamente (ya implementado)
- Agregar llamadas similares al cargar CU-04 → `cargarCombos()` y CU-08 → `cargarInactivos()`
