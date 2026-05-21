# 📊 Sistema RetailOnlineDB - Análisis RFM e Inteligencia de Negocios

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Estructura de la Base de Datos](#estructura-de-la-base-de-datos)
5. [Modelo RFM](#modelo-rfm)
6. [API Endpoints](#api-endpoints)
7. [Casos de Uso](#casos-de-uso)
8. [Instalación y Configuración](#instalación-y-configuración)
9. [Uso del Sistema](#uso-del-sistema)
10. [Ejemplos Prácticos](#ejemplos-prácticos)
11. [Mantenimiento](#mantenimiento)

---

## 🎯 Descripción General

**RetailOnlineDB** es un sistema integral de análisis de ventas y clasificación de clientes que implementa el modelo **RFM (Recencia, Frecuencia, Monetario)** para segmentar clientes y generar estrategias de marketing personalizadas.

### Objetivos del Sistema

- **Clasificar clientes** en segmentos: VIP, Regular, Nuevo, Inactivo
- **Generar recomendaciones** de productos basadas en patrones de compra
- **Crear combos anti-merma** para productos de baja rotación
- **Automatizar campañas** de reactivación para clientes inactivos
- **Analizar patrones** de compra usando el algoritmo Apriori

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐
│   Frontend      │
│   (HTML/JS)     │
└────────┬────────┘
         │ HTTP Requests
         ▼
┌─────────────────┐
│  API Backend    │
│  (Node.js +     │
│   Express)      │
└────────┬────────┘
         │ SQL Queries
         ▼
┌─────────────────┐
│  SQL Server     │
│  RetailOnlineDB │
└─────────────────┘
```

### Capas del Sistema

1. **Capa de Presentación**
   - HTML5 + CSS3
   - JavaScript vanilla para interacción
   - Interfaz responsive

2. **Capa de Lógica de Negocio**
   - Node.js + Express.js
   - API RESTful
   - Algoritmos de clasificación RFM
   - Algoritmo Apriori para asociaciones

3. **Capa de Datos**
   - SQL Server 2019+
   - Stored Procedures
   - Tablas normalizadas

---

## 💻 Tecnologías Utilizadas

### Backend
- **Node.js** v14+
- **Express.js** 4.18.3 - Framework web
- **mssql** 11.0.1 - Driver para SQL Server
- **cors** 2.8.5 - Manejo de CORS
- **dotenv** 16.4.5 - Variables de entorno

### Base de Datos
- **Microsoft SQL Server 2019+**
- **Instancia**: localhost\MSSQLSERVER02
- **Puerto**: 50920
- **Base de datos**: RetailOnlineDB_v2

### Frontend
- HTML5
- CSS3
- JavaScript ES6+
- Fetch API

---

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

#### 1. **Clientes**
Almacena información de los clientes.

```sql
CREATE TABLE Clientes (
    ClienteID INT PRIMARY KEY,
    Nombre NVARCHAR(100),
    Edad INT,
    Genero NVARCHAR(20),
    Ciudad NVARCHAR(50),
    Estado NVARCHAR(50),
    NivelSocioeconomico NVARCHAR(10),
    FechaRegistro DATETIME
);
```

#### 2. **Ventas**
Registra todas las transacciones.

```sql
CREATE TABLE Ventas (
    VentaID INT PRIMARY KEY IDENTITY(1,1),
    Fecha DATETIME,
    ClienteID INT FOREIGN KEY REFERENCES Clientes(ClienteID),
    VendedorID INT,
    Total FLOAT,
    MetodoPago NVARCHAR(20),
    NumProductos INT
);
```

#### 3. **Productos**
Catálogo de productos.

```sql
CREATE TABLE Productos (
    ProductoID INT PRIMARY KEY,
    Nombre NVARCHAR(100),
    Descripcion NVARCHAR(255),
    Precio FLOAT,
    Marca NVARCHAR(50),
    Presentacion NVARCHAR(50),
    CategoriaID INT FOREIGN KEY REFERENCES Categorias(CategoriaID)
);
```

#### 4. **Categorias**
Categorías de productos.

```sql
CREATE TABLE Categorias (
    CategoriaID INT PRIMARY KEY,
    Nombre NVARCHAR(50),
    Descripcion NVARCHAR(255)
);
```

#### 5. **Detalle_Ventas**
Líneas de detalle de cada venta.

```sql
CREATE TABLE Detalle_Ventas (
    DetalleID INT PRIMARY KEY,
    VentaID INT FOREIGN KEY REFERENCES Ventas(VentaID),
    ProductoID INT FOREIGN KEY REFERENCES Productos(ProductoID),
    Cantidad INT,
    PrecioUnitario FLOAT,
    Subtotal FLOAT,
    Descripcion NVARCHAR(255)
);
```

#### 6. **Clientes_RFM** ⭐
Tabla calculada con métricas RFM.

```sql
CREATE TABLE Clientes_RFM (
    ClienteID INT PRIMARY KEY FOREIGN KEY REFERENCES Clientes(ClienteID),
    Recencia INT,           -- Días desde última compra
    Frecuencia INT,         -- Número total de compras
    MontoTotal FLOAT,       -- Suma total gastada
    TicketPromedio FLOAT,   -- Promedio por compra
    Tipo_Cliente VARCHAR(20) -- VIP, Regular, Nuevo, Inactivo
);
```

---

## 📈 Modelo RFM

### ¿Qué es RFM?

El modelo **RFM** es una técnica de segmentación de clientes basada en tres métricas:

- **R (Recency)**: Recencia - ¿Cuándo fue la última compra?
- **F (Frequency)**: Frecuencia - ¿Cuántas veces ha comprado?
- **M (Monetary)**: Monetario - ¿Cuánto ha gastado?

### Cálculo de Scores

Cada dimensión recibe un score de 1 a 3:

#### Recencia (R)
```javascript
if (recencia <= 7)   → Score = 3  // Compró hace 1 semana
if (recencia <= 30)  → Score = 2  // Compró hace 1 mes
if (recencia > 30)   → Score = 1  // Compró hace más de 1 mes
```

#### Frecuencia (F)
```javascript
if (frecuencia >= 15) → Score = 3  // Comprador frecuente
if (frecuencia >= 5)  → Score = 2  // Comprador regular
if (frecuencia < 5)   → Score = 1  // Comprador ocasional
```

#### Monetario (M)
```javascript
if (monto >= 5000)  → Score = 3  // Alto valor
if (monto >= 1500)  → Score = 2  // Valor medio
if (monto < 1500)   → Score = 1  // Valor bajo
```

### Clasificación de Clientes

**Score Total** = R + F + M (rango: 3-9)

```sql
CASE
    -- Cliente que compró hoy/ayer y tiene pocas compras
    WHEN Recencia <= 2 AND Frecuencia <= 2
        THEN 'Nuevo'

    -- Cliente que no compra hace más de 120 días
    WHEN Recencia > 120 AND Frecuencia <= 3
        THEN 'Inactivo'

    -- Cliente con score alto (8-9 puntos)
    WHEN Score >= 8
        THEN 'VIP'

    -- Cliente con score medio (5-7 puntos)
    ELSE 'Regular'
END
```

### Segmentos de Clientes

#### 🌟 VIP
- **Características**: Compran frecuentemente, montos altos, compras recientes
- **Score**: ≥ 8 puntos
- **Oferta**: 5% cashback + envío gratis + acceso anticipado
- **Estrategia**: Retención y fidelización

#### 👤 Regular
- **Características**: Comportamiento intermedio, potencial de mejora
- **Score**: 5-7 puntos
- **Oferta**: 10% descuento + cupón $200 al llegar a $2,000
- **Estrategia**: Convertir a VIP

#### ✨ Nuevo
- **Características**: Primera o segunda compra, reciente
- **Recencia**: ≤ 2 días
- **Frecuencia**: ≤ 2 compras
- **Oferta**: 25% en primera compra + envío gratis primeras 3 compras
- **Estrategia**: Generar segunda compra

#### 😴 Inactivo
- **Características**: Sin compras en mucho tiempo
- **Recencia**: > 120 días
- **Frecuencia**: ≤ 3 compras
- **Oferta**: 30% en categoría favorita + regalo sorpresa
- **Estrategia**: Reactivación

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Health Check

#### `GET /health`
Verifica el estado del servidor.

**Respuesta:**
```json
{
  "status": "ok",
  "time": "2026-04-14T04:30:00.000Z"
}
```

---

### CU-01: Catálogo de Productos

#### `GET /categorias`
Lista todas las categorías con total de productos.

**Respuesta:**
```json
[
  {
    "CategoriaID": 1,
    "Nombre": "Electrónicos",
    "Descripcion": "Productos electrónicos",
    "TotalProductos": 150
  }
]
```

#### `GET /productos?categoria=1&buscar=laptop&limit=50`
Busca productos con filtros.

**Parámetros:**
- `categoria` (opcional): ID de categoría
- `buscar` (opcional): Texto a buscar en nombre/marca
- `limit` (opcional): Límite de resultados (default: 50)

**Respuesta:**
```json
{
  "productos": [
    {
      "ProductoID": 101,
      "Nombre": "Laptop Dell XPS 15",
      "Precio": 25999.99,
      "Marca": "Dell",
      "CategoriaNombre": "Electrónicos"
    }
  ],
  "total": 15
}
```

---

### CU-02: Recomendaciones

#### `GET /recomendaciones?categoriaID=1`
Genera recomendaciones basadas en patrones de compra (Apriori).

**Parámetros:**
- `categoriaID` (requerido): ID de la categoría base

**Respuesta:**
```json
{
  "asociaciones": [
    {
      "CategoriaID": 2,
      "CategoriaNombre": "Accesorios",
      "Frecuencia": 350,
      "Soporte": 75.5
    }
  ],
  "productos": [
    {
      "ProductoID": 201,
      "Nombre": "Mouse Inalámbrico",
      "Precio": 399.99,
      "CategoriaNombre": "Accesorios"
    }
  ]
}
```

---

### CU-03: Ofertas Personalizadas

#### `GET /oferta/:segmento?monto=1500`
Calcula oferta personalizada según segmento.

**Parámetros:**
- `segmento` (URL): VIP | Regular | Nuevo | Inactivo
- `monto` (query): Monto de la compra

**Respuesta:**
```json
{
  "segmento": "VIP",
  "oferta": {
    "tipo": "cashback",
    "pct": 5,
    "descripcion": "5% cashback en todas las compras + envío gratis",
    "extra": "Acceso anticipado a nuevas colecciones"
  },
  "precios": {
    "original": 1500,
    "final": 1500,
    "ahorro": 0,
    "cashback": 75
  }
}
```

---

### CU-04: Combos Anti-Merma

#### `GET /combos`
Genera combos combinando productos de alta y baja rotación.

**Respuesta:**
```json
{
  "combos": [
    {
      "nombre": "🌿 Combo Anti-Merma",
      "mecanica": "Lleva Electrónicos y Jardinería juntos",
      "descuento": 20,
      "categorias": ["Electrónicos", "Jardinería"],
      "tipo": "anti-merma"
    }
  ]
}
```

---

### CU-05: Clasificación RFM

#### `POST /rfm/clasificar`
Clasifica un cliente según métricas RFM.

**Body:**
```json
{
  "recencia": 5,
  "frecuencia": 20,
  "monto": 8500
}
```

**Respuesta:**
```json
{
  "segmento": "VIP",
  "score": 9,
  "scores": {
    "recencia": 3,
    "frecuencia": 3,
    "monto": 3
  },
  "descripcion": "Cliente de alto valor: compra frecuente, monto elevado y compra reciente.",
  "oferta": "5% cashback + envío gratis + acceso anticipado a colecciones"
}
```

#### `GET /rfm/clientes?segmento=VIP&limit=100`
Lista clientes clasificados por segmento.

**Parámetros:**
- `segmento` (opcional): VIP | Regular | Nuevo | Inactivo | todos
- `limit` (opcional): Límite de resultados (default: 200)

**Respuesta:**
```json
{
  "clientes": [
    {
      "ClienteID": 1001,
      "Nombre": "Juan Pérez",
      "Recencia": 3,
      "Frecuencia": 25,
      "Monto": 15250.50,
      "TicketPromedio": 610.02,
      "Segmento": "VIP"
    }
  ],
  "total": 150
}
```

#### `POST /rfm/actualizar` 🔄
Recalcula la tabla Clientes_RFM con datos actuales.

**Respuesta:**
```json
{
  "mensaje": "Tabla RFM actualizada correctamente",
  "fecha": "2026-04-14T04:30:00.000Z",
  "estadisticas": {
    "TotalClientes": 5001,
    "Clientes_VIP": 1200,
    "Clientes_Regular": 3500,
    "Clientes_Nuevo": 150,
    "Clientes_Inactivo": 151
  }
}
```

---

### CU-06: Algoritmo Apriori

#### `POST /apriori/ejecutar`
Ejecuta el algoritmo Apriori para encontrar asociaciones.

**Body:**
```json
{
  "soporte_min": 0.01,
  "confianza_min": 0.3
}
```

**Respuesta:**
```json
{
  "reglas": [
    {
      "Antecedente": "Electrónicos",
      "Consecuente": "Accesorios",
      "Soporte": 0.0850,
      "Confianza": 0.7500,
      "Lift": 2.15
    }
  ],
  "parametros": {
    "soporte_min": 0.01,
    "confianza_min": 0.3,
    "total_transacciones": 5000
  }
}
```

**Interpretación:**
- **Soporte**: % de transacciones que contienen ambos items
- **Confianza**: Probabilidad de comprar B dado que compró A
- **Lift**: Fuerza de la asociación (>1 = positiva, <1 = negativa)

---

### CU-07: Reportes

#### `GET /reporte/resumen`
Resumen ejecutivo por segmento.

**Respuesta:**
```json
{
  "segmentos": [
    {
      "Segmento": "VIP",
      "TotalClientes": 1200,
      "TicketPromedio": 850.25,
      "VentasTotal": 1020300.00,
      "RecenciaPromedio": 5.2,
      "FrecuenciaPromedio": 18.5
    }
  ]
}
```

#### `GET /reporte/kpis`
KPIs generales del sistema.

**Respuesta:**
```json
{
  "TotalClientes": 5000,
  "TotalVentas": 400000,
  "VentasTotales": 185250000.50,
  "TicketPromedio": 463.13,
  "TotalProductos": 8000,
  "TotalLineas": 1500000
}
```

#### `GET /reporte/categorias`
Top categorías por segmento.

**Respuesta:**
```json
{
  "categorias": [
    {
      "Segmento": "VIP",
      "Categoria": "Electrónicos",
      "Frecuencia": 850,
      "VentasCategoria": 5250000
    }
  ]
}
```

---

### CU-08: Reactivación de Clientes

#### `GET /reactivacion/clientes`
Lista clientes inactivos ordenados por valor.

**Respuesta:**
```json
{
  "clientes": [
    {
      "ClienteID": 2050,
      "Nombre": "María González",
      "Recencia": 180,
      "Frecuencia": 3,
      "MontoTotal": 8500.00,
      "TicketPromedio": 2833.33
    }
  ]
}
```

#### `POST /reactivacion/generar`
Genera campañas personalizadas de reactivación.

**Body:**
```json
{
  "clienteIDs": [2050, 2051, 2052]
}
```

**Respuesta:**
```json
{
  "campanas": [
    {
      "ClienteID": 2050,
      "Nombre": "María González",
      "CategoriaFavorita": "Ropa",
      "Oferta": "30% de descuento en Ropa + envío gratis",
      "Cupon": "REACT2050XY7A",
      "Canal": "Email"
    }
  ]
}
```

---

## 📚 Casos de Uso

### CU-01: Exploración de Catálogo
**Actor**: Cliente
**Descripción**: Navegar productos y categorías

**Flujo:**
1. Usuario accede al sistema
2. Sistema muestra categorías disponibles
3. Usuario selecciona categoría
4. Sistema filtra productos
5. Usuario puede buscar por nombre/marca

---

### CU-02: Recomendaciones Personalizadas
**Actor**: Sistema
**Descripción**: Sugerir productos basados en patrones

**Flujo:**
1. Cliente agrega producto al carrito
2. Sistema identifica categoría
3. Sistema ejecuta Apriori para encontrar asociaciones
4. Sistema muestra productos complementarios

---

### CU-05: Clasificación de Cliente
**Actor**: Sistema de Marketing
**Descripción**: Segmentar clientes automáticamente

**Flujo:**
1. Sistema calcula métricas RFM diariamente
2. Sistema asigna scores (1-3) a cada dimensión
3. Sistema clasifica en: VIP, Regular, Nuevo, Inactivo
4. Sistema genera ofertas personalizadas

---

### CU-08: Campaña de Reactivación
**Actor**: Gerente de Marketing
**Descripción**: Recuperar clientes inactivos

**Flujo:**
1. Gerente solicita lista de inactivos
2. Sistema filtra clientes con Recencia > 120 días
3. Sistema identifica categoría favorita de cada uno
4. Sistema genera cupones personalizados
5. Sistema asigna canal (Email/SMS/Push)

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Node.js** v14 o superior
- **SQL Server 2019+**
- **Git** (opcional)

### Paso 1: Clonar/Descargar el Proyecto

```bash
cd "C:\Users\jochi\Desktop\implementacion bd"
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

Esto instalará:
- express
- mssql
- cors
- dotenv

### Paso 3: Configurar Base de Datos

Editar `db.js` con tus credenciales:

```javascript
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

### Paso 4: Crear Variables de Entorno (Opcional)

Crear archivo `.env`:

```env
PORT=3000
DB_SERVER=localhost\\MSSQLSERVER02
DB_PORT=50920
DB_NAME=RetailOnlineDB_v2
DB_USER=rfmuser
DB_PASSWORD=Rfm1234!
```

### Paso 5: Verificar Estructura de BD

Ejecutar script de verificación:

```bash
node verificar_estructura.js
```

---

## 🎮 Uso del Sistema

### Iniciar el Servidor

```bash
# Modo producción
node server.js

# Modo desarrollo (auto-reload)
npm run dev
```

Salida esperada:
```
✅ Conectado a SQL Server — RetailOnlineDB_v2

🚀 RetailRFM API corriendo en:
   Local:   http://localhost:3000
   Red:     http://192.168.100.8:3000

   Endpoints disponibles:
   GET  /api/health
   GET  /api/categorias                    [CU-01]
   GET  /api/productos                     [CU-01]
   ...
```

### Abrir Frontend

```bash
# Windows
start index.html

# O abrir en navegador
http://localhost:3000
```

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Clasificar un Cliente Nuevo

**Escenario**: Jorge acaba de hacer su primera compra de $1,200.50 hoy.

```bash
# 1. Crear cliente
INSERT INTO Clientes (ClienteID, Nombre, FechaRegistro)
VALUES (5001, 'Jorge', GETDATE());

# 2. Crear venta
INSERT INTO Ventas (Fecha, ClienteID, VendedorID, Total, MetodoPago, NumProductos)
VALUES (GETDATE(), 5001, 1, 1200.50, 'TC', 5);

# 3. Actualizar RFM
curl -X POST http://localhost:3000/api/rfm/actualizar

# 4. Consultar clasificación
curl "http://localhost:3000/api/rfm/clientes?segmento=Nuevo"
```

**Resultado esperado:**
```json
{
  "ClienteID": 5001,
  "Nombre": "Jorge",
  "Recencia": 0,
  "Frecuencia": 1,
  "Monto": 1200.50,
  "Segmento": "Nuevo"
}
```

---

### Ejemplo 2: Generar Combos Anti-Merma

```bash
curl http://localhost:3000/api/combos
```

**Resultado:**
```json
{
  "combos": [
    {
      "nombre": "🌿 Combo Anti-Merma",
      "mecanica": "Lleva Electrónicos y Jardinería juntos",
      "descuento": 20,
      "categorias": ["Electrónicos", "Jardinería"],
      "tipo": "anti-merma"
    },
    {
      "nombre": "⚡ Combo Cross-Sell",
      "mecanica": "Los más vendidos: Ropa + Calzado",
      "descuento": 15,
      "tipo": "cross-selling"
    }
  ]
}
```

---

### Ejemplo 3: Reactivar Clientes Inactivos

```bash
# 1. Obtener lista de inactivos
curl http://localhost:3000/api/reactivacion/clientes

# 2. Generar campañas para 3 clientes
curl -X POST http://localhost:3000/api/reactivacion/generar \
  -H "Content-Type: application/json" \
  -d '{"clienteIDs": [2050, 2051, 2052]}'
```

**Resultado:**
```json
{
  "campanas": [
    {
      "ClienteID": 2050,
      "Nombre": "María González",
      "CategoriaFavorita": "Ropa",
      "Oferta": "30% de descuento en Ropa + envío gratis",
      "Cupon": "REACT2050XY7A",
      "Canal": "Email"
    }
  ]
}
```

---

### Ejemplo 4: Ejecutar Apriori

```bash
curl -X POST http://localhost:3000/api/apriori/ejecutar \
  -H "Content-Type: application/json" \
  -d '{
    "soporte_min": 0.01,
    "confianza_min": 0.3
  }'
```

**Interpretación de resultados:**

```json
{
  "Antecedente": "Electrónicos",
  "Consecuente": "Accesorios",
  "Soporte": 0.0850,      // 8.5% de transacciones tienen ambos
  "Confianza": 0.7500,    // 75% de quien compra Electrónicos también compra Accesorios
  "Lift": 2.15            // 2.15x más probable que al azar
}
```

**Acción sugerida**: Promocionar accesorios cuando cliente compra electrónicos.

---

## 🔧 Mantenimiento

### Actualización Diaria de RFM

**Recomendación**: Ejecutar diariamente a las 2:00 AM

#### Opción 1: Endpoint API
```bash
curl -X POST http://localhost:3000/api/rfm/actualizar
```

#### Opción 2: Script directo
```bash
node test_actualizar_rfm.js
```

#### Opción 3: Stored Procedure (crear)
```sql
CREATE PROCEDURE sp_ActualizarRFM_Diario
AS
BEGIN
    TRUNCATE TABLE Clientes_RFM;

    INSERT INTO Clientes_RFM (ClienteID, Recencia, Frecuencia, MontoTotal, TicketPromedio, Tipo_Cliente)
    SELECT
        v.ClienteID,
        DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) AS Recencia,
        COUNT(*) AS Frecuencia,
        SUM(v.Total) AS MontoTotal,
        AVG(v.Total) AS TicketPromedio,
        CASE
            WHEN DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) <= 2 AND COUNT(*) <= 2 THEN 'Nuevo'
            WHEN DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) > 120 AND COUNT(*) <= 3 THEN 'Inactivo'
            WHEN (
                CASE WHEN DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) <= 7 THEN 3
                     WHEN DATEDIFF(DAY, MAX(v.Fecha), GETDATE()) <= 30 THEN 2
                     ELSE 1 END +
                CASE WHEN COUNT(*) >= 15 THEN 3
                     WHEN COUNT(*) >= 5 THEN 2
                     ELSE 1 END +
                CASE WHEN SUM(v.Total) >= 5000 THEN 3
                     WHEN SUM(v.Total) >= 1500 THEN 2
                     ELSE 1 END
            ) >= 8 THEN 'VIP'
            ELSE 'Regular'
        END
    FROM Ventas v
    GROUP BY v.ClienteID
    HAVING COUNT(*) > 0;
END;
```

Programar en SQL Server Agent:
```sql
EXEC sp_ActualizarRFM_Diario;
```

---

### Monitoreo de Performance

#### Verificar KPIs
```bash
curl http://localhost:3000/api/reporte/kpis
```

#### Logs del Servidor
El servidor imprime logs en consola:
```
✅ Conectado a SQL Server — RetailOnlineDB_v2
GET /api/health 200 5ms
POST /api/rfm/actualizar 200 1250ms
GET /api/rfm/clientes?segmento=VIP 200 250ms
```

---

### Troubleshooting

#### Error: "Cannot connect to SQL Server"

**Solución:**
1. Verificar que SQL Server esté corriendo
2. Verificar credenciales en `db.js`
3. Verificar puerto y nombre de instancia
4. Probar conexión:
```bash
node -e "require('./db').getPool()"
```

---

#### Error: "Port 3000 already in use"

**Solución:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID [PID]

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

---

#### No aparecen clientes "Nuevos"

**Solución:**
1. Verificar que el cliente tenga ventas en tabla `Ventas`
2. Verificar que la fecha de venta sea reciente (≤2 días)
3. Ejecutar actualización RFM:
```bash
curl -X POST http://localhost:3000/api/rfm/actualizar
```

---

## 📊 Scripts Útiles

### Verificar Ventas Recientes
```bash
node verificar_ventas_hoy.js
```

### Crear Cliente de Prueba
```bash
node crear_venta_jorge.js
```

### Verificar Estructura BD
```bash
node verificar_estructura.js
```

### Verificar RFM
```bash
node verificar_rfm.js
```

---

## 🎯 Roadmap Futuro

### Features Planeadas

- [ ] Dashboard con gráficas en tiempo real
- [ ] Exportar reportes a Excel/PDF
- [ ] Sistema de notificaciones push
- [ ] Integración con email marketing
- [ ] Predicción de churn con ML
- [ ] A/B testing de ofertas
- [ ] API de webhooks
- [ ] Autenticación JWT
- [ ] Rate limiting

---

## 📞 Soporte

### Archivos Importantes

- `server.js` - Servidor principal
- `db.js` - Configuración de BD
- `index.html` - Frontend
- `package.json` - Dependencias

### Contacto

Para dudas o soporte, revisar:
- Documentación de endpoints
- Logs del servidor
- Estructura de BD

---

## 📄 Licencia

Sistema académico - RetailOnlineDB v2.0

---

**Última actualización**: 14 de Abril, 2026
**Versión**: 2.0.0
**Autor**: Sistema RetailRFM
