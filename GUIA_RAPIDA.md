# 🚀 Guía Rápida - RetailOnlineDB RFM

## ⚡ Inicio en 3 Minutos

### 1️⃣ Instalar
```bash
npm install
```

### 2️⃣ Ejecutar
```bash
node server.js
```

### 3️⃣ Probar
```bash
curl http://localhost:3000/api/health
```

¡Listo! El servidor está corriendo en `http://localhost:3000`

---

## 📊 Endpoints Esenciales

### Clasificar Cliente
```bash
curl -X POST http://localhost:3000/api/rfm/clasificar \
  -H "Content-Type: application/json" \
  -d '{"recencia": 5, "frecuencia": 20, "monto": 8500}'
```

### Ver Clientes VIP
```bash
curl http://localhost:3000/api/rfm/clientes?segmento=VIP
```

### Actualizar RFM
```bash
curl -X POST http://localhost:3000/api/rfm/actualizar
```

### Ver KPIs
```bash
curl http://localhost:3000/api/reporte/kpis
```

---

## 🎯 Segmentos de Clientes

| Tipo | Recencia | Frecuencia | Monto | Oferta |
|------|----------|------------|-------|--------|
| **VIP** | ≤7 días | ≥15 | ≥5000 | 5% cashback |
| **Regular** | ≤30 días | ≥5 | ≥1500 | 10% descuento |
| **Nuevo** | ≤2 días | ≤2 | - | 25% primera compra |
| **Inactivo** | >120 días | ≤3 | - | 30% reactivación |

---

## 🔧 Configuración BD

Editar `db.js`:
```javascript
const config = {
  server: 'localhost\\MSSQLSERVER02',
  database: 'RetailOnlineDB_v2',
  port: 50920,
  user: 'rfmuser',
  password: 'Rfm1234!',
};
```

---

## 🛠️ Scripts Útiles

```bash
# Verificar estructura
node verificar_estructura.js

# Ver ventas de hoy
node verificar_ventas_hoy.js

# Actualizar RFM
node test_actualizar_rfm.js

# Crear cliente de prueba
node crear_venta_jorge.js
```

---

## 🐛 Solución Rápida

```bash
# Puerto ocupado
netstat -ano | findstr :3000
taskkill /F /PID [PID]

# Verificar conexión BD
node -e "require('./db').getPool()"

# Ver logs del servidor
# (Los logs aparecen en la consola donde ejecutaste node server.js)
```

---

## 📚 Documentación Completa

- [README.md](./README.md) - Guía de inicio completa
- [DOCUMENTACION_SISTEMA.md](./DOCUMENTACION_SISTEMA.md) - Documentación detallada
- [ARQUITECTURA_TECNICA.md](./ARQUITECTURA_TECNICA.md) - Detalles técnicos

---

## 🎯 Ejemplo Completo

```sql
-- 1. Crear cliente
INSERT INTO Clientes (ClienteID, Nombre, FechaRegistro)
VALUES (5001, 'Jorge', GETDATE());

-- 2. Crear venta
INSERT INTO Ventas (Fecha, ClienteID, VendedorID, Total, MetodoPago, NumProductos)
VALUES (GETDATE(), 5001, 1, 1200.50, 'TC', 5);
```

```bash
# 3. Actualizar RFM
curl -X POST http://localhost:3000/api/rfm/actualizar

# 4. Verificar
curl "http://localhost:3000/api/rfm/clientes?segmento=Nuevo"
```

---

**Versión**: 2.0.0 | **Puerto**: 3000 | **BD**: RetailOnlineDB_v2
