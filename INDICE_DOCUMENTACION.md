# 📚 Índice de Documentación - RetailOnlineDB

Sistema de Análisis RFM e Inteligencia de Negocios

---

## 🗺️ Mapa de Documentación

### Para Usuarios Nuevos

1. **[GUIA_RAPIDA.md](./GUIA_RAPIDA.md)** ⚡
   - Inicio en 3 minutos
   - Comandos esenciales
   - Solución rápida de problemas
   - **Recomendado para**: Empezar rápidamente

2. **[README.md](./README.md)** 📖
   - Instalación paso a paso
   - Configuración inicial
   - Primeros pasos
   - **Recomendado para**: Primera instalación

### Para Desarrolladores

3. **[DOCUMENTACION_SISTEMA.md](./DOCUMENTACION_SISTEMA.md)** 📊
   - Descripción completa del sistema
   - Todos los endpoints de la API
   - Casos de uso detallados
   - Ejemplos prácticos
   - Mantenimiento y operación
   - **Recomendado para**: Entender el sistema completo

4. **[ARQUITECTURA_TECNICA.md](./ARQUITECTURA_TECNICA.md)** 🏗️
   - Arquitectura de software
   - Modelo de datos ER
   - Algoritmos implementados (RFM, Apriori)
   - Decisiones de diseño
   - Optimización y performance
   - Escalabilidad
   - **Recomendado para**: Profundizar técnicamente

### Documentos de Sistema Existentes

5. **[README_SISTEMA.md](./README_SISTEMA.md)** 📄
   - Documentación original del sistema

6. **[CONTEXTO_RetailRFM.md](./CONTEXTO_RetailRFM.md)** 📝
   - Contexto del proyecto RFM

---

## 🎯 ¿Qué Documento Leo?

### Quiero empezar YA
→ [GUIA_RAPIDA.md](./GUIA_RAPIDA.md)

### Es mi primera vez instalando
→ [README.md](./README.md)

### Necesito entender cómo funciona
→ [DOCUMENTACION_SISTEMA.md](./DOCUMENTACION_SISTEMA.md)

### Voy a modificar el código
→ [ARQUITECTURA_TECNICA.md](./ARQUITECTURA_TECNICA.md)

### Necesito la referencia de API
→ [DOCUMENTACION_SISTEMA.md#api-endpoints](./DOCUMENTACION_SISTEMA.md#api-endpoints)

### Quiero optimizar performance
→ [ARQUITECTURA_TECNICA.md#optimización-y-performance](./ARQUITECTURA_TECNICA.md#optimización-y-performance)

### Tengo un problema
→ [GUIA_RAPIDA.md#solución-rápida](./GUIA_RAPIDA.md#solución-rápida)

---

## 📁 Estructura del Proyecto

```
implementacion bd/
│
├── 📚 DOCUMENTACIÓN
│   ├── INDICE_DOCUMENTACION.md     ← EMPEZAR AQUÍ
│   ├── GUIA_RAPIDA.md              ← Inicio rápido
│   ├── README.md                   ← Instalación
│   ├── DOCUMENTACION_SISTEMA.md    ← Sistema completo
│   ├── ARQUITECTURA_TECNICA.md     ← Detalles técnicos
│   ├── README_SISTEMA.md           ← Docs originales
│   └── CONTEXTO_RetailRFM.md       ← Contexto proyecto
│
├── 💻 CÓDIGO PRINCIPAL
│   ├── server.js                   ← API Backend
│   ├── db.js                       ← Configuración BD
│   ├── index.html                  ← Frontend
│   ├── package.json                ← Dependencias
│   └── env                         ← Variables entorno
│
├── 🔧 SCRIPTS ÚTILES
│   ├── verificar_estructura.js     ← Ver estructura BD
│   ├── verificar_ventas_hoy.js     ← Ver ventas recientes
│   ├── verificar_rfm.js            ← Ver datos RFM
│   ├── test_actualizar_rfm.js      ← Actualizar RFM
│   └── crear_venta_jorge.js        ← Ejemplo venta
│
└── 🗄️ SQL (opcional)
    └── actualizar_rfm.sql          ← Stored procedure
```

---

## 🚀 Flujo de Lectura Recomendado

### Nuevo Usuario
```
1. GUIA_RAPIDA.md
   ↓
2. README.md (si necesitas más detalle)
   ↓
3. DOCUMENTACION_SISTEMA.md (referencia)
```

### Desarrollador Nuevo en el Proyecto
```
1. README.md
   ↓
2. DOCUMENTACION_SISTEMA.md
   ↓
3. ARQUITECTURA_TECNICA.md
   ↓
4. Revisar código: server.js, db.js
```

### Mantenimiento/Soporte
```
1. GUIA_RAPIDA.md (solución rápida)
   ↓
2. DOCUMENTACION_SISTEMA.md#mantenimiento
   ↓
3. Ejecutar scripts de verificación
```

---

## 📊 Contenido por Documento

### GUIA_RAPIDA.md (1 página)
- ✅ Instalación express (3 pasos)
- ✅ Comandos más usados
- ✅ Solución rápida de errores
- ✅ Ejemplo completo

### README.md (Original)
- ✅ Instalación detallada
- ✅ Configuración .env
- ✅ Endpoints principales
- ✅ Troubleshooting

### DOCUMENTACION_SISTEMA.md (Completo - 25 páginas)
- ✅ Descripción general
- ✅ Arquitectura
- ✅ Base de datos
- ✅ Modelo RFM explicado
- ✅ 20+ endpoints documentados
- ✅ 8 casos de uso
- ✅ Ejemplos prácticos
- ✅ Guía de mantenimiento

### ARQUITECTURA_TECNICA.md (Avanzado - 20 páginas)
- ✅ Patrón MVC
- ✅ Diagrama ER
- ✅ Algoritmo RFM (pseudocódigo)
- ✅ Algoritmo Apriori (SQL)
- ✅ Decisiones de diseño
- ✅ Optimización y performance
- ✅ Seguridad
- ✅ Escalabilidad

---

## 🔍 Índice de Temas

### A
- Algoritmo Apriori → ARQUITECTURA_TECNICA.md#algoritmo-apriori
- API Endpoints → DOCUMENTACION_SISTEMA.md#api-endpoints
- Arquitectura → ARQUITECTURA_TECNICA.md#arquitectura-de-software

### B
- Base de datos → DOCUMENTACION_SISTEMA.md#estructura-de-la-base-de-datos

### C
- Casos de uso → DOCUMENTACION_SISTEMA.md#casos-de-uso
- Clasificación RFM → DOCUMENTACION_SISTEMA.md#modelo-rfm
- Combos anti-merma → DOCUMENTACION_SISTEMA.md#cu-04
- Configuración → README.md#pasos-para-poner-en-marcha

### E
- Endpoints → DOCUMENTACION_SISTEMA.md#api-endpoints
- Escalabilidad → ARQUITECTURA_TECNICA.md#escalabilidad
- Ejemplos → DOCUMENTACION_SISTEMA.md#ejemplos-prácticos

### I
- Instalación → README.md o GUIA_RAPIDA.md
- Índices BD → ARQUITECTURA_TECNICA.md#índices

### M
- Mantenimiento → DOCUMENTACION_SISTEMA.md#mantenimiento
- Modelo de datos → ARQUITECTURA_TECNICA.md#modelo-de-datos

### O
- Ofertas personalizadas → DOCUMENTACION_SISTEMA.md#cu-03
- Optimización → ARQUITECTURA_TECNICA.md#optimización-y-performance

### R
- Reactivación → DOCUMENTACION_SISTEMA.md#cu-08
- Recomendaciones → DOCUMENTACION_SISTEMA.md#cu-02
- Reportes → DOCUMENTACION_SISTEMA.md#cu-07
- RFM → DOCUMENTACION_SISTEMA.md#modelo-rfm

### S
- Seguridad → ARQUITECTURA_TECNICA.md#seguridad
- Segmentos → DOCUMENTACION_SISTEMA.md#segmentos-de-clientes

### T
- Troubleshooting → GUIA_RAPIDA.md#solución-rápida
- Tecnologías → DOCUMENTACION_SISTEMA.md#tecnologías-utilizadas

---

## ⚡ Comandos Rápidos (Quick Reference)

```bash
# INICIAR SISTEMA
node server.js

# ACTUALIZAR RFM
curl -X POST http://localhost:3000/api/rfm/actualizar

# VER CLIENTES VIP
curl http://localhost:3000/api/rfm/clientes?segmento=VIP

# VER KPIs
curl http://localhost:3000/api/reporte/kpis

# CLASIFICAR CLIENTE
curl -X POST http://localhost:3000/api/rfm/clasificar \
  -H "Content-Type: application/json" \
  -d '{"recencia": 5, "frecuencia": 20, "monto": 8500}'

# VERIFICAR ESTRUCTURA
node verificar_estructura.js

# SOLUCIÓN: Puerto ocupado
netstat -ano | findstr :3000
taskkill /F /PID [PID]
```

---

## 📞 Ayuda Rápida

| Pregunta | Respuesta |
|----------|-----------|
| ¿Cómo instalo? | [GUIA_RAPIDA.md](./GUIA_RAPIDA.md) |
| ¿Qué es RFM? | [DOCUMENTACION_SISTEMA.md#modelo-rfm](./DOCUMENTACION_SISTEMA.md#modelo-rfm) |
| ¿Cómo actualizo RFM? | `curl -X POST http://localhost:3000/api/rfm/actualizar` |
| Error de puerto | [GUIA_RAPIDA.md#solución-rápida](./GUIA_RAPIDA.md#solución-rápida) |
| ¿Cómo funciona Apriori? | [ARQUITECTURA_TECNICA.md#algoritmo-apriori](./ARQUITECTURA_TECNICA.md#algoritmo-apriori) |
| ¿Endpoints disponibles? | [DOCUMENTACION_SISTEMA.md#api-endpoints](./DOCUMENTACION_SISTEMA.md#api-endpoints) |

---

## 🎓 Glosario

- **RFM**: Recency (Recencia), Frequency (Frecuencia), Monetary (Monetario)
- **Apriori**: Algoritmo de asociación para market basket analysis
- **VIP**: Cliente de alto valor (score ≥ 8)
- **Churn**: Pérdida de clientes (conversión a Inactivo)
- **Lift**: Métrica de fuerza de asociación en Apriori
- **Anti-Merma**: Estrategia para reducir inventario de baja rotación
- **Cross-Sell**: Venta cruzada de productos complementarios

---

## 📈 Estadísticas del Sistema

- **5,001** clientes en BD
- **400,000+** transacciones
- **8,000** productos
- **4** segmentos RFM
- **20+** endpoints API
- **9** casos de uso
- **3** algoritmos principales

---

## 🔄 Actualizaciones

### Versión 2.0.0 (Actual)
- ✅ Endpoint de actualización RFM
- ✅ Documentación completa
- ✅ Scripts de verificación
- ✅ Algoritmo Apriori
- ✅ Generación de combos
- ✅ Campañas de reactivación

### Próximas Features
- [ ] Dashboard con gráficas
- [ ] Exportar a Excel/PDF
- [ ] Machine Learning (predicción churn)
- [ ] Notificaciones push
- [ ] Autenticación JWT

---

## 📝 Notas Finales

Este sistema está diseñado para ser:
- ✅ **Fácil de usar** - Inicio en 3 minutos
- ✅ **Bien documentado** - 4 niveles de documentación
- ✅ **Extensible** - Arquitectura modular
- ✅ **Performante** - Índices y connection pooling
- ✅ **Seguro** - Prevención SQLi, validación inputs

---

**Versión**: 2.0.0
**Última Actualización**: 14 de Abril, 2026
**Proyecto**: RetailOnlineDB - Sistema RFM

---

## 🚀 ¡Empieza Ahora!

1. Lee [GUIA_RAPIDA.md](./GUIA_RAPIDA.md)
2. Ejecuta `node server.js`
3. Prueba `curl http://localhost:3000/api/health`
4. ¡Listo para usar!
