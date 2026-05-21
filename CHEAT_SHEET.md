# 📋 Cheat Sheet - RetailOnlineDB RFM

Referencia rápida de comandos y endpoints más usados.

---

## 🚀 Comandos Básicos

```bash
# Instalar
npm install

# Iniciar servidor
node server.js

# Verificar salud
curl http://localhost:3000/api/health
```

---

## 📊 Endpoints API

### RFM

```bash
# Clasificar cliente
curl -X POST http://localhost:3000/api/rfm/clasificar \
  -H "Content-Type: application/json" \
  -d '{"recencia": 5, "frecuencia": 20, "monto": 8500}'

# Listar por segmento
curl http://localhost:3000/api/rfm/clientes?segmento=VIP
curl http://localhost:3000/api/rfm/clientes?segmento=Regular
curl http://localhost:3000/api/rfm/clientes?segmento=Nuevo
curl http://localhost:3000/api/rfm/clientes?segmento=Inactivo

# Actualizar RFM (DIARIO)
curl -X POST http://localhost:3000/api/rfm/actualizar
```

### Productos

```bash
# Categorías
curl http://localhost:3000/api/categorias

# Buscar productos
curl "http://localhost:3000/api/productos?buscar=laptop&limit=20"

# Por categoría
curl "http://localhost:3000/api/productos?categoria=1&limit=50"
```

### Recomendaciones

```bash
# Productos recomendados
curl "http://localhost:3000/api/recomendaciones?categoriaID=1"

# Combos anti-merma
curl http://localhost:3000/api/combos
```

### Ofertas

```bash
# Oferta VIP
curl "http://localhost:3000/api/oferta/VIP?monto=1500"

# Oferta Regular
curl "http://localhost:3000/api/oferta/Regular?monto=1500"

# Oferta Nuevo
curl "http://localhost:3000/api/oferta/Nuevo?monto=1500"

# Oferta Inactivo
curl "http://localhost:3000/api/oferta/Inactivo?monto=1500"
```

### Reportes

```bash
# KPIs generales
curl http://localhost:3000/api/reporte/kpis

# Resumen por segmento
curl http://localhost:3000/api/reporte/resumen

# Top categorías
curl http://localhost:3000/api/reporte/categorias
```

### Reactivación

```bash
# Clientes inactivos
curl http://localhost:3000/api/reactivacion/clientes

# Generar campaña
curl -X POST http://localhost:3000/api/reactivacion/generar \
  -H "Content-Type: application/json" \
  -d '{"clienteIDs": [2050, 2051, 2052]}'
```

### Apriori

```bash
# Ejecutar algoritmo
curl -X POST http://localhost:3000/api/apriori/ejecutar \
  -H "Content-Type: application/json" \
  -d '{"soporte_min": 0.01, "confianza_min": 0.3}'
```

---

## 🗄️ SQL Útiles

```sql
-- Crear cliente
INSERT INTO Clientes (ClienteID, Nombre, FechaRegistro)
VALUES (5001, 'Jorge', GETDATE());

-- Crear venta
INSERT INTO Ventas (Fecha, ClienteID, VendedorID, Total, MetodoPago, NumProductos)
VALUES (GETDATE(), 5001, 1, 1200.50, 'TC', 5);

-- Ver ventas de hoy
SELECT * FROM Ventas
WHERE CAST(Fecha AS DATE) = CAST(GETDATE() AS DATE);

-- Ver clientes sin ventas
SELECT c.* FROM Clientes c
LEFT JOIN Ventas v ON c.ClienteID = v.ClienteID
WHERE v.VentaID IS NULL;

-- Ver RFM
SELECT TOP 10 * FROM Clientes_RFM
ORDER BY MontoTotal DESC;

-- Actualizar RFM manualmente
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
GROUP BY v.ClienteID;
```

---

## 🔧 Scripts Node.js

```bash
# Verificar estructura BD
node verificar_estructura.js

# Ver ventas recientes
node verificar_ventas_hoy.js

# Ver datos RFM
node verificar_rfm.js

# Actualizar RFM
node test_actualizar_rfm.js

# Crear venta de prueba
node crear_venta_jorge.js
```

---

## 🐛 Troubleshooting

```bash
# Puerto ocupado
netstat -ano | findstr :3000
taskkill /F /PID [PID]

# O matar todos los Node
taskkill /F /IM node.exe

# Verificar conexión BD
node -e "require('./db').getPool().then(() => console.log('Conectado OK'))"

# Ver procesos Node activos
tasklist | findstr node
```

---

## 🎯 Scores RFM

| Métrica | Score 3 | Score 2 | Score 1 |
|---------|---------|---------|---------|
| **Recencia** | ≤7 días | ≤30 días | >30 días |
| **Frecuencia** | ≥15 | ≥5 | <5 |
| **Monto** | ≥5000 | ≥1500 | <1500 |

**Score Total = R + F + M** (rango: 3-9)

---

## 👥 Segmentos

| Segmento | Criterio | Oferta | Score |
|----------|----------|--------|-------|
| **VIP** | Score ≥ 8 | 5% cashback | 8-9 |
| **Regular** | Score 5-7 | 10% descuento | 5-7 |
| **Nuevo** | Recencia ≤2, Freq ≤2 | 25% primera compra | - |
| **Inactivo** | Recencia >120, Freq ≤3 | 30% reactivación | - |

---

## 📁 Archivos Importantes

```
server.js           → API Backend
db.js              → Configuración BD
index.html         → Frontend
package.json       → Dependencias
```

---

## 🔑 Variables de Entorno

```javascript
// db.js
const config = {
  server: 'localhost\\MSSQLSERVER02',
  database: 'RetailOnlineDB_v2',
  port: 50920,
  user: 'rfmuser',
  password: 'Rfm1234!',
};
```

---

## 📊 Tablas BD

```
Clientes          → Información de clientes
Ventas            → Transacciones
Detalle_Ventas    → Líneas de venta
Productos         → Catálogo
Categorias        → Categorías de productos
Clientes_RFM      → Tabla calculada (actualizar diariamente)
```

---

## 🌐 URLs

```
API Base:     http://localhost:3000/api
Frontend:     file:///C:/Users/.../index.html
Health Check: http://localhost:3000/api/health
```

---

## ⚙️ Configuración

```javascript
// Puerto del servidor
const PORT = process.env.PORT || 3000;

// CORS permitidos
app.use(cors());

// Body parser
app.use(express.json());
```

---

## 📈 Métricas Apriori

```
Soporte     = Transacciones(A ∩ B) / Total_Transacciones
Confianza   = Transacciones(A ∩ B) / Transacciones(A)
Lift        = Confianza(A → B) / Soporte(B)

Lift > 1  → Asociación positiva
Lift = 1  → Independencia
Lift < 1  → Asociación negativa
```

---

## 🔄 Mantenimiento Diario

```bash
# 1. Actualizar RFM (ejecutar a las 2 AM)
curl -X POST http://localhost:3000/api/rfm/actualizar

# 2. Verificar KPIs
curl http://localhost:3000/api/reporte/kpis

# 3. Backup BD (opcional)
# Usar SQL Server Management Studio
```

---

## 🚨 Errores Comunes

| Error | Solución |
|-------|----------|
| `ECONNREFUSED` | Verificar que SQL Server esté corriendo |
| `Port 3000 in use` | `taskkill /F /PID [PID]` |
| `Login failed` | Revisar credenciales en `db.js` |
| `Database not found` | Verificar nombre de BD |
| Cliente no aparece | Ejecutar actualización RFM |

---

## 📞 Links Documentación

- [INDICE_DOCUMENTACION.md](./INDICE_DOCUMENTACION.md) - Índice general
- [GUIA_RAPIDA.md](./GUIA_RAPIDA.md) - Inicio rápido
- [DOCUMENTACION_SISTEMA.md](./DOCUMENTACION_SISTEMA.md) - Completo
- [ARQUITECTURA_TECNICA.md](./ARQUITECTURA_TECNICA.md) - Técnico

---

**Versión**: 2.0.0 | **Puerto**: 3000 | **BD**: RetailOnlineDB_v2

💡 **Tip**: Guarda este archivo para consulta rápida
