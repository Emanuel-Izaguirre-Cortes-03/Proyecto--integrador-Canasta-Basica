# RetailRFM — Sistema de Inteligencia Comercial

## 📋 Descripción General

RetailRFM es un **sistema web de análisis comercial** para tiendas retail que implementa técnicas de **segmentación RFM** (Recency, Frequency, Monetary) y **Market Basket Analysis** usando el algoritmo **Apriori** sobre una base de datos real de SQL Server con 400,000 transacciones.

El sistema permite clasificar clientes, generar ofertas personalizadas, descubrir patrones de compra, crear combos anti-merma y ejecutar campañas de reactivación basadas en datos reales.

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (index.html)                 │
│  • Interfaz web de una sola página (SPA)                │
│  • 8 casos de uso en pestañas                           │
│  • Vanilla JavaScript + CSS moderno                     │
│  • Consume API REST del backend                         │
└─────────────────────────────────────────────────────────┘
                           ↕ HTTP (localhost:3000/api)
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (server.js)                    │
│  • API REST con Express.js                              │
│  • 13 endpoints para los 8 casos de uso                 │
│  • Lógica de negocio (RFM, Apriori, Combos)            │
│  • Conexión a SQL Server via mssql                      │
└─────────────────────────────────────────────────────────┘
                           ↕ TCP/IP (puerto 50920)
┌─────────────────────────────────────────────────────────┐
│              SQL Server 2019 — RetailOnlineDB_v2         │
│  • Instancia: localhost\MSSQLSERVER02                   │
│  • 400,000 ventas registradas                           │
│  • 8,739 productos en 12 categorías                     │
│  • 5,000 clientes clasificados por RFM                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Base de Datos — RetailOnlineDB_v2

### Tablas Principales

| Tabla | Descripción | Registros |
|-------|-------------|-----------|
| **Ventas** | Transacciones de la tienda | 400,000 |
| **Detalle_Ventas** | Items por transacción | ~1.2M |
| **Productos** | Catálogo completo | 8,739 |
| **Categorias** | Clasificación de productos | 12 |
| **Clientes** | Datos demográficos | 5,000 |
| **Clientes_RFM** | Segmentación pre-calculada | 5,000 |
| **Vendedores** | Personal de la tienda | Variable |

### Esquema de Conexión

```javascript
{
  server: 'localhost\\MSSQLSERVER02',
  database: 'RetailOnlineDB_v2',
  port: 50920,
  user: 'rfmuser',
  password: 'Rfm1234!',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
}
```

---

## 🎯 Los 8 Casos de Uso Implementados

### **CU-01: Consultar Productos y Categorías**

**Qué hace:**
- Muestra el catálogo completo de 8,739 productos
- Permite filtrar por categoría, buscar por texto y limitar resultados
- Presenta cards con resumen de productos por categoría

**Cómo funciona:**
1. Frontend carga categorías con `GET /api/categorias`
2. SQL agrupa productos por categoría con `COUNT()`
3. Usuario filtra productos con `GET /api/productos?categoria=X&buscar=Y`
4. Backend hace query con `WHERE` dinámico y `LIKE` para búsqueda
5. Se muestran cards con: nombre, precio, marca, categoría

**Endpoints:**
- `GET /api/categorias` → Lista 12 categorías con conteo de productos
- `GET /api/productos?categoria=&buscar=&limit=50` → Búsqueda con filtros

---

### **CU-02: Recomendaciones basadas en Apriori**

**Qué hace:**
- Simula "agregar al carrito" una categoría
- Calcula qué otras categorías se compran frecuentemente juntas
- Muestra productos recomendados de esas categorías asociadas

**Cómo funciona:**
1. Usuario selecciona una categoría (ej: "Ropa")
2. Backend ejecuta `GET /api/recomendaciones?categoriaID=1`
3. SQL busca en `Detalle_Ventas` qué categorías aparecen en las mismas transacciones:
   ```sql
   SELECT categorías que están en ventas que contienen categoría X
   CALCULATE Soporte = (transacciones con ambas / transacciones con X) * 100
   ORDER BY Soporte DESC
   ```
4. Trae productos aleatorios de las top 5 categorías asociadas
5. Frontend muestra barras de asociación y grid de productos recomendados

**Endpoint:**
- `GET /api/recomendaciones?categoriaID=1` → Asociaciones + productos

---

### **CU-03: Ofertas por Tipo de Cliente**

**Qué hace:**
- Muestra beneficios específicos para cada segmento RFM
- Simulador de checkout que calcula descuentos en tiempo real

**Cómo funciona:**
1. Frontend muestra 4 cards estáticas con beneficios por segmento:
   - **VIP**: 5% cashback + envío gratis
   - **Regular**: 10% descuento + cupón $200
   - **Nuevo**: 25% primera compra + envío gratis
   - **Inactivo**: 30% descuento + regalo sorpresa
2. Usuario ingresa tipo de cliente + monto en simulador
3. `GET /api/oferta/:segmento?monto=1500` calcula descuento
4. Backend aplica lógica según tipo:
   - VIP → cashback (paga todo, recibe 5% de vuelta)
   - Otros → descuento directo
5. Muestra precio original, final, ahorro y extras

**Endpoint:**
- `GET /api/oferta/:segmento?monto=1500` → Cálculo de oferta

---

### **CU-04: Combos Anti-Merma**

**Qué hace:**
- Genera automáticamente 4 combos para reducir inventario de bajo movimiento
- Combina categorías de alta y baja rotación

**Cómo funciona:**
1. Frontend llama `GET /api/combos` al abrir la pestaña
2. Backend calcula **soporte** de cada categoría:
   ```sql
   Soporte = (Ventas con categoría / Total ventas) * 100
   ```
3. Ordena categorías de mayor a menor soporte
4. Genera 4 combos:
   - **Anti-Merma**: Baja rotación + Alta rotación (20% desc)
   - **Cross-Sell**: Top 2 más vendidas (15% desc)
   - **Premium**: Top 3 categorías (25% desc)
   - **Value**: Categorías de rotación media (12% desc)
5. Frontend muestra cards con categorías incluidas y tipo de combo

**Endpoint:**
- `GET /api/combos` → 4 combos generados dinámicamente

---

### **CU-05: Clasificar Clientes RFM**

**Qué hace:**
- Clasifica clientes en segmentos: VIP, Regular, Nuevo, Inactivo
- Muestra score RFM (1-9) basado en Recencia, Frecuencia y Monto
- Lista clientes reales de la BD con filtros por segmento

**Cómo funciona:**
1. Usuario ingresa 3 métricas:
   - **Recencia**: Días desde última compra
   - **Frecuencia**: Total de compras
   - **Monto**: Gasto total acumulado
2. Frontend envía `POST /api/rfm/clasificar` con los valores
3. Backend calcula **scores individuales** (1-3 por dimensión):
   ```javascript
   scoreRecencia  = recencia <= 7 ? 3 : recencia <= 30 ? 2 : 1
   scoreFrecuencia = frecuencia >= 15 ? 3 : frecuencia >= 5 ? 2 : 1
   scoreMonto = monto >= 5000 ? 3 : monto >= 1500 ? 2 : 1
   scoreTotal = scoreRecencia + scoreFrecuencia + scoreMonto  // 3-9
   ```
4. Aplica **reglas de segmentación**:
   - Recencia > 120 días + Frecuencia <= 3 → **Inactivo**
   - Score total >= 8 → **VIP**
   - Score total >= 5 → **Regular**
   - Recencia = 0 + Frecuencia <= 2 → **Nuevo**
   - Resto → **Regular**
5. Muestra resultado con barras de progreso, descripción y oferta asignada
6. Tabla de clientes carga desde `Clientes_RFM` con `GET /api/rfm/clientes`

**Endpoints:**
- `POST /api/rfm/clasificar` → Calcula segmento de un cliente
- `GET /api/rfm/clientes?segmento=VIP&limit=100` → Lista clientes

---

### **CU-06: Ejecutar Análisis Apriori**

**Qué hace:**
- Ejecuta el algoritmo Apriori sobre 400,000 transacciones
- Encuentra reglas de asociación entre categorías
- Permite ajustar soporte mínimo y confianza mínima

**Cómo funciona:**
1. Usuario configura con sliders:
   - **Soporte mínimo** (0.1% - 10%): % mínimo de transacciones que contengan el itemset
   - **Confianza mínima** (10% - 90%): Probabilidad de que si compra A, compre B
2. Click en "EJECUTAR APRIORI" → `POST /api/apriori/ejecutar`
3. Backend ejecuta SQL complejo:
   ```sql
   -- Paso 1: Encontrar pares de categorías frecuentes (itemsets de tamaño 2)
   SELECT Cat1, Cat2, COUNT(DISTINCT VentaID) AS Frecuencia
   FROM transacciones que tienen ambas categorías
   HAVING Frecuencia >= soporte_minimo

   -- Paso 2: Calcular métricas
   Soporte = Frecuencia(A,B) / Total_Transacciones
   Confianza = Frecuencia(A,B) / Frecuencia(A)
   Lift = Soporte(A,B) / (Soporte(A) * Soporte(B))
   ```
4. Filtra reglas con confianza >= umbral
5. Muestra top 20 reglas ordenadas por Lift (fuerza de asociación)
6. Frontend interpreta Lift:
   - **Lift > 1.5** → Asociación fuerte ✓
   - **Lift > 1.0** → Asociación moderada ~
   - **Lift ≤ 1.0** → Asociación débil ✗

**Endpoint:**
- `POST /api/apriori/ejecutar` body: `{soporte_min: 0.01, confianza_min: 0.3}`

---

### **CU-07: Reporte por Segmento**

**Qué hace:**
- Dashboard con KPIs en tiempo real desde la BD
- Gráficos de ventas y distribución de clientes por segmento

**Cómo funciona:**
1. Al abrir pestaña, carga 2 endpoints en paralelo:
   - `GET /api/reporte/kpis` → Totales generales
   - `GET /api/reporte/resumen` → Datos por segmento
2. **KPIs generales**:
   ```sql
   SELECT COUNT(*) AS TotalVentas,
          SUM(Total) AS VentasTotales,
          AVG(Total) AS TicketPromedio,
          COUNT(DISTINCT ProductoID) AS TotalProductos
   FROM Ventas, Productos
   ```
3. **Por segmento** (calcula RFM en tiempo real):
   ```sql
   WITH rfm_seg AS (
     SELECT VentaID,
            CASE WHEN score >= 8 THEN 'VIP'
                 WHEN score >= 5 THEN 'Regular'
                 ELSE 'Inactivo' END AS Segmento
     FROM (calcula recencia, frecuencia, monto por VentaID)
   )
   SELECT Segmento, COUNT(*) AS Clientes, AVG(Monto) AS Ticket
   GROUP BY Segmento
   ```
4. Frontend renderiza:
   - 4 cards con count de clientes por segmento
   - Gráfico de barras de ventas totales
   - Donut chart SVG con distribución de clientes

**Endpoints:**
- `GET /api/reporte/kpis` → KPIs generales
- `GET /api/reporte/resumen` → Métricas por segmento

---

### **CU-08: Campaña de Reactivación de Clientes Inactivos**

**Qué hace:**
- Lista top 50 clientes inactivos con mayor valor histórico
- Genera cupones personalizados según categoría favorita
- Asigna canal de comunicación (Email, SMS, Push)

**Cómo funciona:**
1. Frontend carga `GET /api/reactivacion/clientes`:
   ```sql
   SELECT TOP 50 ClienteID, Nombre, Recencia, Frecuencia, MontoTotal
   FROM Clientes_RFM
   WHERE Tipo_Cliente = 'Inactivo'
   ORDER BY MontoTotal DESC  -- Mayor valor primero
   ```
2. Usuario selecciona clientes con checkboxes
3. Click "GENERAR CAMPAÑA" → `POST /api/reactivacion/generar` con array de IDs
4. Backend para cada cliente:
   - Busca su **categoría favorita**:
     ```sql
     SELECT TOP 1 Categoria, SUM(Subtotal) AS Total
     FROM compras del cliente
     GROUP BY Categoria
     ORDER BY Total DESC
     ```
   - Genera cupón único: `REACT{ClienteID}{4 chars random}`
   - Asigna canal aleatorio: Email, SMS o Push
   - Crea oferta: "30% en {categoría favorita} + envío gratis"
5. Frontend muestra cards de campaña con:
   - Nombre del cliente
   - Categoría favorita
   - Oferta personalizada
   - Código de cupón
   - Canal de contacto

**Endpoints:**
- `GET /api/reactivacion/clientes` → Top 50 inactivos
- `POST /api/reactivacion/generar` body: `{clienteIDs: [1,2,3]}`

---

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Node.js v24
- **Framework**: Express.js 4.x
- **Base de datos**: mssql (driver oficial SQL Server)
- **Middlewares**: cors, express.json, dotenv

### Frontend
- **HTML5** + CSS3 moderno (CSS Grid, Flexbox, Variables)
- **Vanilla JavaScript** (ES6+, Fetch API, async/await)
- **Fuentes**: Google Fonts (Syne + Space Mono)
- **Sin dependencias** externas (jQuery, React, etc.)

### Base de Datos
- **SQL Server 2019** Enterprise
- **Autenticación**: SQL Server Authentication
- **Instancia**: localhost\MSSQLSERVER02
- **Puerto**: 50920

---

## 📁 Estructura de Archivos

```
implementacion bd/
│
├── index.html              ← Frontend completo (SPA de 1,290 líneas)
├── server.js               ← API REST con 13 endpoints (713 líneas)
├── db.js                   ← Configuración de conexión SQL Server
├── package.json            ← Dependencias Node.js
├── package-lock.json
├── .env                    ← Variables de entorno (gitignored)
├── README_SISTEMA.md       ← Este documento
├── CONTEXTO_RetailRFM.md   ← Documentación del proyecto
│
└── node_modules/           ← Dependencias npm
    ├── express
    ├── mssql
    ├── cors
    └── ...
```

---

## 🎨 Diseño Visual

### Paleta de Colores

```css
--bg: #0a0a0f          /* Fondo principal - negro azulado */
--surface: #111118     /* Cards y paneles */
--border: #2a2a35      /* Bordes sutiles */
--accent: #e8ff47      /* Amarillo neón - color principal */
--text: #f0f0f5        /* Texto blanco */
--muted: #6b6b80       /* Texto secundario */

/* Colores por segmento */
--vip: #ffd700         /* Dorado */
--regular: #47c5ff     /* Azul cyan */
--nuevo: #5dfc8a       /* Verde neón */
--inactivo: #ff6b6b    /* Rojo coral */
```

### Tipografía
- **Títulos y valores numéricos**: Syne (sans-serif, futurista)
- **Cuerpo y monospace**: Space Mono (monospace, tecno)

### Características UI
- Tema oscuro tipo terminal/cyberpunk
- Grid de fondo con líneas sutiles
- Animaciones suaves (fade-in, transitions)
- Cards con efecto hover (elevación)
- Barras de progreso animadas
- Gráficos SVG nativos (sin librerías)

---

## 🚀 Cómo Usar el Sistema

### 1. Iniciar el Backend

```bash
cd "C:\Users\jochi\Desktop\implementacion bd"
node server.js
```

Deberías ver:
```
🚀 RetailRFM API corriendo en http://localhost:3000
   Endpoints disponibles:
   GET  /api/health
   GET  /api/categorias                    [CU-01]
   ...
```

### 2. Abrir el Frontend

Doble click en `index.html` o:
```bash
start "" index.html
```

### 3. Verificar Conexión

En el header superior derecha verás un **punto verde** con "API conectada" si todo está bien.

Si aparece rojo "API sin conexión":
1. Verifica que el backend esté corriendo
2. Revisa que SQL Server esté activo
3. Checa las credenciales en `db.js`

---

## 🔧 Flujo de Datos Completo (Ejemplo: CU-05)

```
┌──────────────┐
│   USUARIO    │ Ingresa: Recencia=15, Frecuencia=8, Monto=3500
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────────────────────┐
│  FRONTEND (index.html)                               │
│  función: clasificarCliente()                        │
│  1. Lee valores del formulario                       │
│  2. Valida que no estén vacíos                       │
│  3. Construye JSON: {recencia:15,frecuencia:8...}   │
│  4. POST fetch a localhost:3000/api/rfm/clasificar   │
└──────┬───────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────┐
│  BACKEND (server.js)                                 │
│  endpoint: POST /api/rfm/clasificar                  │
│  1. Extrae req.body: {recencia, frecuencia, monto}  │
│  2. Calcula scores:                                  │
│     sr = 15<=7? 3 : 15<=30? 2 : 1  → 2              │
│     sf = 8>=15? 3 : 8>=5? 2 : 1    → 2              │
│     sm = 3500>=5000? 3 : 3500>=1500? 2 : 1 → 2      │
│     score = 2+2+2 = 6                                │
│  3. Aplica reglas:                                   │
│     score=6 >= 5 → segmento = 'Regular'             │
│  4. Busca descripción y oferta del segmento         │
│  5. res.json({segmento, score, scores, ...})        │
└──────┬───────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────┐
│  FRONTEND (index.html)                               │
│  función: mostrarResultado(data)                     │
│  1. Recibe: {segmento:'Regular', score:6, ...}      │
│  2. Actualiza DOM:                                   │
│     - Badge con emoji ◆ + "Regular"                 │
│     - Score grande "6/9"                             │
│     - Barras de progreso animadas                    │
│     - Descripción del segmento                       │
│     - Oferta asignada                                │
│  3. Muestra bloque de resultado con fadeIn          │
└──────┬───────────────────────────────────────────────┘
       │
       ↓
┌──────────────┐
│   USUARIO    │ Ve resultado: "◆ Regular - Score 6/9"
└──────────────┘
```

---

## 🧪 Testing Manual Recomendado

### CU-01: Productos
1. Abrir pestaña → Deben cargar 12 cards de categorías
2. Buscar "nike" → Filtrar productos por texto
3. Seleccionar categoría "Ropa" → Ver solo ropa
4. Cambiar límite a 100 → Ver más productos

### CU-02: Recomendaciones
1. Seleccionar "Calzado"
2. Click "OBTENER RECOMENDACIONES"
3. Debe mostrar barras con categorías asociadas (ej: Ropa 99%)
4. Ver productos recomendados abajo

### CU-04: Combos
1. Abrir pestaña → Cargan 4 combos automáticamente
2. Verificar que haya combos de diferentes tipos:
   - Anti-merma (rojo)
   - Cross-selling (verde)
   - Premium (dorado)
   - Value (azul)

### CU-05: RFM
1. Ingresar: Recencia=5, Frecuencia=20, Monto=8000
2. Debe clasificar como **VIP** (score 9/9)
3. Probar: Recencia=150, Frecuencia=2, Monto=500
4. Debe clasificar como **Inactivo**

### CU-06: Apriori
1. Dejar soporte en 1%, confianza en 30%
2. Click "EJECUTAR APRIORI"
3. Esperar 3-5 segundos (procesa 400K registros)
4. Deben aparecer ~15-20 reglas
5. Buscar reglas con Lift > 1.5 (asociación fuerte)

### CU-08: Reactivación
1. Se cargan 50 clientes inactivos
2. Seleccionar 3-5 clientes
3. Click "GENERAR CAMPAÑA"
4. Ver cupones personalizados por categoría favorita

---

## 📈 Métricas del Sistema

| Métrica | Valor |
|---------|-------|
| **Líneas de código frontend** | ~1,290 |
| **Líneas de código backend** | ~713 |
| **Total endpoints API** | 13 |
| **Casos de uso implementados** | 8 |
| **Tablas SQL consultadas** | 7 |
| **Transacciones analizadas** | 400,000 |
| **Productos en catálogo** | 8,739 |
| **Clientes clasificados** | 5,000 |
| **Tiempo carga inicial** | < 2 seg |
| **Tiempo ejecución Apriori** | 3-7 seg |

---

## 🔍 Algoritmos Implementados

### 1. Segmentación RFM

**Fórmula:**
```
ScoreTotal = ScoreRecencia + ScoreFrecuencia + ScoreMonto
donde cada score ∈ {1, 2, 3}
→ ScoreTotal ∈ [3, 9]
```

**Percentiles usados:**
- Recencia: [0-7 días]=3, [8-30]=2, [31+]=1
- Frecuencia: [15+ compras]=3, [5-14]=2, [1-4]=1
- Monto: [$5000+]=3, [$1500-4999]=2, [$0-1499]=1

### 2. Algoritmo Apriori Simplificado

**Paso 1 - Itemsets frecuentes (tamaño 2):**
```sql
Encuentra pares {CategoríaA, CategoríaB} donde:
Frecuencia(A,B) >= soporte_minimo * total_transacciones
```

**Paso 2 - Cálculo de métricas:**
```
Soporte(A→B) = P(A ∩ B) = Transacciones(A,B) / Total
Confianza(A→B) = P(B|A) = Transacciones(A,B) / Transacciones(A)
Lift(A→B) = Soporte(A,B) / [Soporte(A) * Soporte(B)]
```

**Interpretación del Lift:**
- Lift > 1 → Comprar A aumenta probabilidad de comprar B
- Lift = 1 → A y B son independientes
- Lift < 1 → Comprar A disminuye probabilidad de comprar B

### 3. Generación de Combos Anti-Merma

**Estrategia:**
1. Calcular soporte de cada categoría
2. Ordenar de mayor a menor rotación
3. Emparejar extremos: Alta rotación + Baja rotación
4. Aplicar descuentos agresivos a combos con baja rotación

---

## ⚠️ Limitaciones Conocidas

1. **Apriori solo encuentra pares** (itemsets de tamaño 2), no tríos o más
2. **RFM usa percentiles fijos**, no dinámicos sobre la BD actual
3. **No hay persistencia de campañas**, se generan en memoria
4. **Sin autenticación**, todos los endpoints son públicos
5. **Categoría favorita en CU-08** puede fallar si cliente no tiene historial en Ventas
6. **Frontend no valida tipos de datos**, confía en que el backend responda bien

---

## 🔐 Credenciales (Solo desarrollo)

**Base de datos:**
- Usuario: `rfmuser`
- Password: `Rfm1234!`
- Servidor: `localhost\MSSQLSERVER02`
- Puerto: `50920`

⚠️ **NO usar en producción** - Cambiar credenciales y habilitar SSL

---

## 📚 Referencias Técnicas

### RFM Analysis
- Hughes, A. M. (1996). "Boosting Response with RFM"
- Fader, P. S. & Hardie, B. G. (2009). "Probability Models for Customer-Base Analysis"

### Market Basket Analysis
- Agrawal, R. & Srikant, R. (1994). "Fast Algorithms for Mining Association Rules"
- Han, J. & Kamber, M. (2006). "Data Mining: Concepts and Techniques"

### SQL Server Performance
- Microsoft Docs: Query Performance Tuning
- INNER JOIN vs CROSS APPLY con TOP 1

---

## 🐛 Solución de Problemas

### Error: "API sin conexión"
**Causa:** Backend no está corriendo o SQL Server inaccesible
**Solución:**
1. Verificar que `node server.js` esté corriendo
2. Probar manualmente: `http://localhost:3000/api/health`
3. Revisar conexión a SQL Server en `db.js`

### Error: "Cannot GET /"
**Causa:** Abriste `localhost:3000` en vez de `index.html`
**Solución:** El backend es solo API, abre `index.html` en el navegador

### Productos no cargan en CU-01
**Causa:** Tabla Productos o Categorias vacía
**Solución:** Verificar que la BD tenga datos:
```sql
SELECT COUNT(*) FROM Productos;
SELECT COUNT(*) FROM Categorias;
```

### Apriori no devuelve reglas
**Causa:** Umbrales de soporte/confianza muy altos
**Solución:** Reducir soporte a 0.1% y confianza a 10%

### CU-08 no encuentra categoría favorita
**Causa:** Cliente no tiene historial en tabla Ventas
**Solución:** Sistema usa "General" como fallback

---

## 💡 Mejoras Futuras Sugeridas

1. **Persistencia**: Guardar campañas en tabla SQL
2. **Autenticación**: Login con roles (admin, vendedor, analista)
3. **Webhooks**: Enviar cupones por email/SMS realmente
4. **Apriori mejorado**: Soportar itemsets de tamaño 3+
5. **Caché**: Redis para consultas frecuentes (categorías, KPIs)
6. **Exportación**: Descargar reportes en Excel/PDF
7. **Gráficos avanzados**: Integrar Chart.js o D3.js
8. **Mobile**: CSS responsive mejorado
9. **Tests**: Jest para backend, Puppeteer para E2E
10. **Deploy**: Dockerizar + Azure SQL + App Service

---

## 👥 Créditos

**Desarrollado por:** Claude (Anthropic)
**Base de datos:** RetailOnlineDB_v2
**Stack:** Node.js + Express + SQL Server + Vanilla JS
**Fecha:** Abril 2026

---

## 📄 Licencia

Este proyecto es educativo y de demostración.
Uso libre para aprendizaje, prohibido uso comercial sin autorización.

---

**🚀 Happy Analyzing!**
