# RetailRFM — Backend Node.js + Frontend

Sistema de clasificación RFM conectado a RetailOnlineDB (SQL Server local).

## Estructura del proyecto

```
retailrfm-backend/
├── server.js        ← API Express (endpoints RFM, ofertas, reporte)
├── db.js            ← Conexión a SQL Server con mssql
├── .env             ← Configuración de tu BD (EDITAR ESTO)
├── package.json     ← Dependencias
└── index.html       ← Frontend (abrir en el navegador)
```

---

## Pasos para poner en marcha

### 1. Edita el archivo `.env`

Abre `.env` y pon los datos de tu SQL Server:

```env
DB_SERVER=localhost          # o el nombre de tu instancia, ej: DESKTOP-ABC\SQLEXPRESS
DB_DATABASE=RetailOnlineDB
DB_USER=sa                   # tu usuario de SQL Server
DB_PASSWORD=TuPasswordAqui   # tu contraseña
DB_PORT=1433
```

> Si usas **Windows Authentication** (sin usuario/contraseña):
> ```env
> DB_TRUSTED_CONNECTION=true
> ```

---

### 2. Instala las dependencias

Abre una terminal en la carpeta `retailrfm-backend/` y ejecuta:

```bash
npm install
```

Esto instalará: express, mssql, cors, dotenv.

---

### 3. Inicia el servidor

```bash
node server.js
```

Deberías ver:
```
✅ Conectado a SQL Server — RetailOnlineDB
🚀 RetailRFM API corriendo en http://localhost:3000
```

---

### 4. Abre el frontend

Abre el archivo `index.html` directamente en tu navegador (doble clic).

El semáforo en la esquina superior derecha mostrará **"API conectada"** en verde.

---

## Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/health` | Verifica que el servidor esté activo |
| POST | `/api/rfm/clasificar` | Clasifica un cliente (body: recencia, frecuencia, monto) |
| GET  | `/api/rfm/clientes` | Lista clientes clasificados desde la BD |
| GET  | `/api/reporte/resumen` | KPIs por segmento desde Ventas |
| GET  | `/api/reporte/kpis` | Totales generales de la BD |
| GET  | `/api/oferta/:segmento` | Oferta y precio calculado por segmento |

### Ejemplo de prueba (en terminal):

```bash
# Clasificar cliente
curl -X POST http://localhost:3000/api/rfm/clasificar \
  -H "Content-Type: application/json" \
  -d "{\"recencia\": 5, \"frecuencia\": 20, \"monto\": 9000}"

# Ver oferta VIP para $1500
curl http://localhost:3000/api/oferta/VIP?monto=1500

# Ver reporte
curl http://localhost:3000/api/reporte/resumen
```

---

## Solución de problemas

| Error | Solución |
|-------|----------|
| `Login failed for user 'sa'` | Revisa DB_USER y DB_PASSWORD en .env |
| `Cannot connect to localhost` | Verifica que SQL Server esté activo en el puerto 1433 |
| `ECONNREFUSED` | Habilita TCP/IP en SQL Server Configuration Manager |
| `Database 'RetailOnlineDB' not found` | Revisa DB_DATABASE en .env |
| Instancia nombrada (ej: `SQLEXPRESS`) | Usa `DB_SERVER=localhost\\SQLEXPRESS` |
