# 🏗️ Arquitectura Técnica - Sistema RetailOnlineDB

## 📋 Índice Técnico

1. [Arquitectura de Software](#arquitectura-de-software)
2. [Modelo de Datos](#modelo-de-datos)
3. [Algoritmos Implementados](#algoritmos-implementados)
4. [Decisiones de Diseño](#decisiones-de-diseño)
5. [Optimización y Performance](#optimización-y-performance)
6. [Seguridad](#seguridad)
7. [Escalabilidad](#escalabilidad)

---

## 🏛️ Arquitectura de Software

### Patrón Arquitectónico: MVC (Model-View-Controller)

```
┌──────────────────────────────────────────────┐
│                   CLIENTE                    │
│         (Navegador Web - View)               │
└─────────────────┬────────────────────────────┘
                  │ HTTP/REST
                  ▼
┌──────────────────────────────────────────────┐
│              API BACKEND                     │
│         (Express.js - Controller)            │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │  Middleware Stack                  │     │
│  │  - CORS                            │     │
│  │  - Body Parser (JSON)              │     │
│  │  - Error Handler                   │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │  Business Logic Layer              │     │
│  │  - Clasificación RFM               │     │
│  │  - Algoritmo Apriori               │     │
│  │  - Generación de Ofertas           │     │
│  │  - Análisis de Patrones            │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │  Data Access Layer (db.js)         │     │
│  │  - Connection Pool                 │     │
│  │  - Query Builder                   │     │
│  │  - Transaction Management          │     │
│  └────────────────────────────────────┘     │
└─────────────────┬────────────────────────────┘
                  │ mssql Driver
                  ▼
┌──────────────────────────────────────────────┐
│          SQL SERVER DATABASE                 │
│              (Model - Data)                  │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │  Tablas Transaccionales            │     │
│  │  - Ventas                          │     │
│  │  - Detalle_Ventas                  │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │  Tablas Maestras                   │     │
│  │  - Clientes                        │     │
│  │  - Productos                       │     │
│  │  - Categorias                      │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │  Tablas Analíticas                 │     │
│  │  - Clientes_RFM (Calculada)        │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │  Índices y Optimización            │     │
│  │  - Índices clustered en PKs        │     │
│  │  - Índices no-clustered en FKs     │     │
│  │  - Índices en campos de búsqueda   │     │
│  └────────────────────────────────────┘     │
└──────────────────────────────────────────────┘
```

---

## 🗂️ Modelo de Datos

### Diagrama ER (Entity-Relationship)

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│  Clientes   │◄──────│   Ventas     │──────►│ Vendedores  │
│             │ 1   N │              │ N   1 │             │
│ ClienteID PK│       │ VentaID PK   │       │VendedorID PK│
│ Nombre      │       │ Fecha        │       │ Nombre      │
│ Edad        │       │ ClienteID FK │       └─────────────┘
│ Genero      │       │ VendedorID FK│
│ Ciudad      │       │ Total        │
│ ...         │       │ MetodoPago   │
└─────────────┘       └──────┬───────┘
       │                     │
       │                     │ 1
       │                     │
       │                     ▼ N
       │              ┌─────────────────┐
       │              │ Detalle_Ventas  │
       │              │                 │
       │              │ DetalleID PK    │
       │              │ VentaID FK      │───┐
       │              │ ProductoID FK   │   │
       │              │ Cantidad        │   │
       │              │ PrecioUnitario  │   │
       │              │ Subtotal        │   │
       │              └─────────────────┘   │
       │                                    │
       │                                    │
       │              ┌─────────────┐       │
       │              │  Productos  │◄──────┘
       │              │             │
       │              │ProductoID PK│
       │              │ Nombre      │
       │              │ Precio      │
       │              │CategoriaID  │───┐
       │              └─────────────┘   │
       │                                │
       │              ┌─────────────┐   │
       │              │ Categorias  │◄──┘
       │              │             │
       │              │CategoriaID  │
       │              │ Nombre      │
       │              │ Descripcion │
       │              └─────────────┘
       │
       │ 1
       │
       ▼ 1
┌──────────────────┐
│  Clientes_RFM    │  ◄── Tabla Calculada/Materializada
│                  │
│ ClienteID PK, FK │
│ Recencia         │  ◄── Calculado: DATEDIFF(Fecha, GETDATE())
│ Frecuencia       │  ◄── Calculado: COUNT(Ventas)
│ MontoTotal       │  ◄── Calculado: SUM(Total)
│ TicketPromedio   │  ◄── Calculado: AVG(Total)
│ Tipo_Cliente     │  ◄── Clasificado: CASE WHEN...
└──────────────────┘
```

### Normalización

**Nivel de Normalización**: 3NF (Tercera Forma Normal)

- ✅ **1NF**: Todos los atributos son atómicos
- ✅ **2NF**: No hay dependencias parciales
- ✅ **3NF**: No hay dependencias transitivas

**Excepción Intencional**: `Clientes_RFM` es una tabla desnormalizada para performance (materialización de cálculos).

### Índices

```sql
-- Índices Clustered (Primary Keys)
CREATE CLUSTERED INDEX PK_Clientes ON Clientes(ClienteID);
CREATE CLUSTERED INDEX PK_Ventas ON Ventas(VentaID);
CREATE CLUSTERED INDEX PK_Productos ON Productos(ProductoID);

-- Índices No-Clustered (Foreign Keys)
CREATE NONCLUSTERED INDEX IX_Ventas_ClienteID ON Ventas(ClienteID);
CREATE NONCLUSTERED INDEX IX_Ventas_Fecha ON Ventas(Fecha DESC);
CREATE NONCLUSTERED INDEX IX_DetalleVentas_VentaID ON Detalle_Ventas(VentaID);
CREATE NONCLUSTERED INDEX IX_DetalleVentas_ProductoID ON Detalle_Ventas(ProductoID);

-- Índices Compuestos
CREATE NONCLUSTERED INDEX IX_Ventas_Cliente_Fecha
    ON Ventas(ClienteID, Fecha DESC);

-- Índices de Cobertura (Include)
CREATE NONCLUSTERED INDEX IX_Productos_Categoria_Include
    ON Productos(CategoriaID)
    INCLUDE (Nombre, Precio, Marca);
```

---

## 🧮 Algoritmos Implementados

### 1. Clasificación RFM

#### Pseudocódigo

```
FUNCIÓN clasificar_cliente(recencia, frecuencia, monto):

    // Calcular scores individuales (1-3)
    score_R = CALCULAR_SCORE_RECENCIA(recencia)
    score_F = CALCULAR_SCORE_FRECUENCIA(frecuencia)
    score_M = CALCULAR_SCORE_MONTO(monto)

    score_total = score_R + score_F + score_M

    // Reglas especiales
    SI recencia <= 2 Y frecuencia <= 2 ENTONCES
        RETORNAR "Nuevo"

    SI recencia > 120 Y frecuencia <= 3 ENTONCES
        RETORNAR "Inactivo"

    // Clasificación por score
    SI score_total >= 8 ENTONCES
        RETORNAR "VIP"
    SINO
        RETORNAR "Regular"
    FIN SI

FIN FUNCIÓN

FUNCIÓN CALCULAR_SCORE_RECENCIA(dias):
    SI dias <= 7 ENTONCES RETORNAR 3
    SI dias <= 30 ENTONCES RETORNAR 2
    RETORNAR 1
FIN FUNCIÓN

FUNCIÓN CALCULAR_SCORE_FRECUENCIA(compras):
    SI compras >= 15 ENTONCES RETORNAR 3
    SI compras >= 5 ENTONCES RETORNAR 2
    RETORNAR 1
FIN FUNCIÓN

FUNCIÓN CALCULAR_SCORE_MONTO(total):
    SI total >= 5000 ENTONCES RETORNAR 3
    SI total >= 1500 ENTONCES RETORNAR 2
    RETORNAR 1
FIN FUNCIÓN
```

#### Complejidad
- **Temporal**: O(1) - Tiempo constante
- **Espacial**: O(1) - Memoria constante

---

### 2. Algoritmo Apriori (Simplificado)

#### Objetivo
Encontrar asociaciones entre categorías de productos.

#### Implementación SQL

```sql
-- Paso 1: Identificar itemsets frecuentes (pares de categorías)
WITH ItemSets AS (
    SELECT
        c1.Nombre AS Cat1,
        c2.Nombre AS Cat2,
        COUNT(DISTINCT dv1.VentaID) AS Frecuencia
    FROM Detalle_Ventas dv1
    INNER JOIN Productos p1 ON dv1.ProductoID = p1.ProductoID
    INNER JOIN Categorias c1 ON p1.CategoriaID = c1.CategoriaID
    INNER JOIN Detalle_Ventas dv2 ON dv1.VentaID = dv2.VentaID
                                  AND dv1.ProductoID != dv2.ProductoID
    INNER JOIN Productos p2 ON dv2.ProductoID = p2.ProductoID
    INNER JOIN Categorias c2 ON p2.CategoriaID = c2.CategoriaID
    WHERE c1.Nombre < c2.Nombre  -- Evitar duplicados
    GROUP BY c1.Nombre, c2.Nombre
    HAVING COUNT(DISTINCT dv1.VentaID) >= @soporteMin
),

-- Paso 2: Calcular soporte individual de cada categoría
Cat1Count AS (
    SELECT
        c.Nombre AS CatNombre,
        COUNT(DISTINCT dv.VentaID) AS Total
    FROM Detalle_Ventas dv
    INNER JOIN Productos p ON dv.ProductoID = p.ProductoID
    INNER JOIN Categorias c ON p.CategoriaID = c.CategoriaID
    GROUP BY c.Nombre
)

-- Paso 3: Calcular métricas de asociación
SELECT
    i.Cat1 AS Antecedente,
    i.Cat2 AS Consecuente,

    -- Soporte: P(A ∩ B)
    CAST(i.Frecuencia * 1.0 / @totalVentas AS DECIMAL(6,4)) AS Soporte,

    -- Confianza: P(B|A) = P(A ∩ B) / P(A)
    CAST(i.Frecuencia * 1.0 / c1.Total AS DECIMAL(6,4)) AS Confianza,

    -- Lift: P(A ∩ B) / (P(A) * P(B))
    CAST(
        (i.Frecuencia * 1.0 / @totalVentas) /
        ((c1.Total * 1.0 / @totalVentas) * (c2.Total * 1.0 / @totalVentas))
        AS DECIMAL(6,2)
    ) AS Lift

FROM ItemSets i
INNER JOIN Cat1Count c1 ON i.Cat1 = c1.CatNombre
INNER JOIN Cat1Count c2 ON i.Cat2 = c2.CatNombre
WHERE CAST(i.Frecuencia * 1.0 / c1.Total AS DECIMAL(6,4)) >= @confianzaMin
ORDER BY Lift DESC, Soporte DESC;
```

#### Métricas Explicadas

**Soporte**: Probabilidad de que ocurran A y B juntos
```
Soporte(A → B) = Transacciones(A ∩ B) / Total_Transacciones
```

**Confianza**: Probabilidad de B dado que ocurrió A
```
Confianza(A → B) = Transacciones(A ∩ B) / Transacciones(A)
```

**Lift**: Fuerza de la asociación
```
Lift(A → B) = Confianza(A → B) / Soporte(B)
            = P(A ∩ B) / (P(A) × P(B))
```

- **Lift > 1**: Asociación positiva (A aumenta probabilidad de B)
- **Lift = 1**: Independencia (A no afecta a B)
- **Lift < 1**: Asociación negativa (A disminuye probabilidad de B)

#### Complejidad
- **Temporal**: O(n²) donde n = número de categorías
- **Espacial**: O(m) donde m = número de transacciones

---

### 3. Generación de Combos Anti-Merma

#### Pseudocódigo

```
FUNCIÓN generar_combos_antimerma():

    // Calcular rotación de categorías
    categorias = CALCULAR_ROTACION_CATEGORIAS()

    // Ordenar por soporte (frecuencia de venta)
    categorias_ordenadas = ORDENAR(categorias, 'Soporte', DESC)

    combos = []

    // Combo 1: Anti-Merma (baja + alta rotación)
    baja_rotacion = categorias_ordenadas[ULTIMO]
    alta_rotacion = categorias_ordenadas[PRIMERO]

    combos.AGREGAR({
        nombre: "Combo Anti-Merma",
        categorias: [alta_rotacion, baja_rotacion],
        descuento: 20%,
        estrategia: "Bundling forzado"
    })

    // Combo 2: Cross-Selling (top 2)
    combos.AGREGAR({
        nombre: "Combo Cross-Sell",
        categorias: [categorias[0], categorias[1]],
        descuento: 15%,
        estrategia: "Productos complementarios"
    })

    // Combo 3: Premium (top 3)
    combos.AGREGAR({
        nombre: "Pack Premium",
        categorias: [categorias[0], categorias[1], categorias[2]],
        descuento: 25%,
        estrategia: "Bundle de valor"
    })

    RETORNAR combos

FIN FUNCIÓN

FUNCIÓN CALCULAR_ROTACION_CATEGORIAS():
    RETORNAR SQL(
        "SELECT
            c.Nombre,
            COUNT(DISTINCT dv.VentaID) AS Frecuencia,
            COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Detalle_Ventas) AS Soporte
         FROM Detalle_Ventas dv
         JOIN Productos p ON dv.ProductoID = p.ProductoID
         JOIN Categorias c ON p.CategoriaID = c.CategoriaID
         GROUP BY c.Nombre
         ORDER BY Soporte DESC"
    )
FIN FUNCIÓN
```

---

## 🎯 Decisiones de Diseño

### 1. ¿Por qué Node.js + Express?

**Ventajas**:
- Event-driven, non-blocking I/O → Ideal para APIs
- Ecosistema maduro (npm)
- JSON nativo
- Fácil integración con frontend

**Desventajas**:
- Single-threaded (mitigado con clustering)
- No tipado estático (podría usar TypeScript)

### 2. ¿Por qué SQL Server?

**Ventajas**:
- Excelente para análisis complejo
- Window functions para RFM
- CTEs para Apriori
- Índices optimizados

**Alternativas consideradas**:
- PostgreSQL (similar, open-source)
- MongoDB (descartado: no relacional)

### 3. ¿Por qué tabla materializada (Clientes_RFM)?

**Problema**: Calcular RFM en tiempo real es costoso (O(n) por cliente)

**Solución**: Pre-calcular y almacenar

**Trade-off**:
- ✅ Consultas ultra-rápidas (O(1) con índice)
- ❌ Requiere actualización periódica
- ✅ Ganancia neta positiva para lecturas frecuentes

### 4. ¿Por qué endpoint POST para actualización?

Permite:
- Trigger manual
- Integración con cron jobs
- Auditoría de actualizaciones

```bash
# Ejemplo: Actualizar diariamente a las 2 AM
crontab -e
0 2 * * * curl -X POST http://localhost:3000/api/rfm/actualizar
```

---

## ⚡ Optimización y Performance

### Connection Pooling

```javascript
let pool = null;

async function getPool() {
  if (pool) return pool;  // Reutilizar conexión existente

  pool = await sql.connect(config);
  return pool;
}
```

**Beneficios**:
- Reducir latencia de conexión
- Manejar múltiples requests concurrentes
- Evitar exhaustion de conexiones

### Query Optimization

#### Antes (Lento)
```sql
-- ❌ Full table scan
SELECT * FROM Ventas WHERE YEAR(Fecha) = 2024;
```

#### Después (Rápido)
```sql
-- ✅ Index seek
SELECT * FROM Ventas
WHERE Fecha >= '2024-01-01' AND Fecha < '2025-01-01';
```

### Paginación

```javascript
// Endpoint con límite
app.get('/api/productos', async (req, res) => {
  const { limit = 50 } = req.query;

  const query = `
    SELECT TOP (@limit) *
    FROM Productos
    ORDER BY Nombre
  `;

  // Evita cargar 10,000 productos en memoria
});
```

### Índices de Cobertura

```sql
-- Incluir columnas frecuentemente consultadas
CREATE NONCLUSTERED INDEX IX_Ventas_Cliente_Include
    ON Ventas(ClienteID)
    INCLUDE (Fecha, Total, MetodoPago);
```

**Resultado**: Query puede resolverse completamente desde el índice (no accede a tabla).

---

## 🔒 Seguridad

### 1. SQL Injection Prevention

#### ❌ Vulnerable
```javascript
const query = `SELECT * FROM Clientes WHERE ClienteID = ${req.params.id}`;
// Si id = "1 OR 1=1" → SQLi
```

#### ✅ Protegido
```javascript
const query = `SELECT * FROM Clientes WHERE ClienteID = @id`;
await pool.request()
  .input('id', sql.Int, parseInt(req.params.id))
  .query(query);
```

### 2. CORS Configuration

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.100.8:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));
```

### 3. Input Validation

```javascript
app.post('/api/rfm/clasificar', (req, res) => {
  const { recencia, frecuencia, monto } = req.body;

  // Validar tipos
  if (typeof recencia !== 'number' || recencia < 0) {
    return res.status(400).json({ error: 'Recencia inválida' });
  }

  // ...
});
```

### 4. Sanitización de Salida

```javascript
app.get('/api/productos', async (req, res) => {
  const { buscar } = req.query;

  // Escape wildcards
  const safeBuscar = buscar.replace(/[%_]/g, '\\$&');

  await pool.request()
    .input('buscar', sql.VarChar(100), `%${safeBuscar}%`)
    .query(query);
});
```

---

## 📈 Escalabilidad

### Horizontal Scaling

```
┌────────────┐
│   Nginx    │  Load Balancer
│  (Reverse  │
│   Proxy)   │
└──────┬─────┘
       │
   ┌───┴────┬────────┬────────┐
   │        │        │        │
┌──▼──┐  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐
│Node1│  │Node2│  │Node3│  │Node4│
└──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘
   └────────┴────────┴────────┘
              │
        ┌─────▼─────┐
        │SQL Server │
        │  Cluster  │
        └───────────┘
```

### Clustering (Node.js)

```javascript
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Restart
  });
} else {
  // Worker process
  app.listen(PORT);
}
```

### Caching Layer

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 min

app.get('/api/categorias', async (req, res) => {
  const cacheKey = 'categorias';

  // Try cache first
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  // Query DB
  const result = await pool.request().query('SELECT * FROM Categorias');

  // Store in cache
  cache.set(cacheKey, result.recordset);

  res.json(result.recordset);
});
```

### Database Partitioning

```sql
-- Particionar Ventas por fecha (ejemplo)
CREATE PARTITION FUNCTION pf_Ventas_Fecha (datetime)
AS RANGE RIGHT FOR VALUES
    ('2024-01-01', '2024-02-01', '2024-03-01', ...);

CREATE PARTITION SCHEME ps_Ventas_Fecha
AS PARTITION pf_Ventas_Fecha
ALL TO ([PRIMARY]);

CREATE TABLE Ventas_Partitioned (
    VentaID INT,
    Fecha DATETIME,
    ...
) ON ps_Ventas_Fecha(Fecha);
```

**Beneficio**: Queries solo escanean particiones relevantes.

---

## 🧪 Testing

### Unit Tests (Ejemplo con Jest)

```javascript
// tests/rfm.test.js
describe('Clasificación RFM', () => {
  test('Cliente VIP', () => {
    const resultado = clasificarCliente({
      recencia: 5,
      frecuencia: 20,
      monto: 8500
    });

    expect(resultado.segmento).toBe('VIP');
    expect(resultado.score).toBe(9);
  });

  test('Cliente Nuevo', () => {
    const resultado = clasificarCliente({
      recencia: 0,
      frecuencia: 1,
      monto: 500
    });

    expect(resultado.segmento).toBe('Nuevo');
  });
});
```

### Integration Tests

```javascript
const request = require('supertest');
const app = require('../server');

describe('API Endpoints', () => {
  test('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('POST /api/rfm/clasificar', async () => {
    const res = await request(app)
      .post('/api/rfm/clasificar')
      .send({ recencia: 5, frecuencia: 20, monto: 8500 });

    expect(res.statusCode).toBe(200);
    expect(res.body.segmento).toBe('VIP');
  });
});
```

---

## 📊 Monitoreo

### Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});
```

### Métricas

```javascript
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.url, res.statusCode)
      .observe(duration);
  });

  next();
});
```

---

## 🔮 Futuras Mejoras

### 1. Machine Learning

```python
# Predicción de churn
from sklearn.ensemble import RandomForestClassifier

features = ['Recencia', 'Frecuencia', 'MontoTotal', 'TicketPromedio']
target = 'Churn' # 1 si pasó a Inactivo

model = RandomForestClassifier()
model.fit(X_train, y_train)
```

### 2. Real-time Analytics

```javascript
// WebSockets para métricas en vivo
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  setInterval(() => {
    const kpis = await getKPIs();
    socket.emit('kpis', kpis);
  }, 5000); // Cada 5 segundos
});
```

### 3. GraphQL API

```javascript
const { ApolloServer, gql } = require('apollo-server-express');

const typeDefs = gql`
  type Cliente {
    id: ID!
    nombre: String!
    rfm: RFM
  }

  type RFM {
    recencia: Int!
    frecuencia: Int!
    monto: Float!
    segmento: String!
  }

  type Query {
    clientes(segmento: String): [Cliente]
  }
`;
```

---

**Versión Técnica**: 2.0.0
**Última Actualización**: 14 Abril 2026
