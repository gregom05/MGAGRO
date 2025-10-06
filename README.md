# 🌾 MG AGRO - Sistema de Gestión

Sistema completo de gestión empresarial para MG AGRO con módulos de recursos humanos e inventario.

![Estado](https://img.shields.io/badge/estado-funcional-brightgreen)
![Versión](https://img.shields.io/badge/versión-1.0.0-blue)
![Backend](https://img.shields.io/badge/backend-Node.js-green)
![Frontend](https://img.shields.io/badge/frontend-Angular%2018-red)

---

## 🚀 Inicio Rápido

### Backend
```bash
cd "backend MG"
npm install
npm start
```
✅ **Backend corriendo en**: `http://localhost:3000`

### Frontend
```bash
cd fronten-MG-ZORRO
npm install
npm start
```
✅ **Frontend corriendo en**: `http://localhost:4200`

---

## 📋 Módulos del Sistema

### 👥 Recursos Humanos
- **Empleados**: Gestión completa de personal (ABM)
- **Actividades**: Registro diario de actividades y horas trabajadas

### 📦 Inventario
- **Artículos**: Gestión de productos e insumos (ABM)
- **Movimientos**: Control de entradas y salidas de stock

---

## 🎯 Características Principales

✅ **ABM Completo** en empleados, actividades y artículos  
✅ **Control de Stock** con entradas/salidas y alertas automáticas  
✅ **Validaciones** en tiempo real  
✅ **UI Moderna** con Ng-Zorro (Ant Design)  
✅ **Responsive** - Funciona en móvil, tablet y desktop  
✅ **Trazabilidad** completa de todas las operaciones  
✅ **Búsqueda y Filtros** en todos los módulos  

---

## 📚 Documentación

| Documento | Descripción | Para Quién |
|-----------|-------------|------------|
| **[INDICE.md](./INDICE.md)** | 📚 Índice general de toda la documentación | Todos |
| **[GUIA_RAPIDA.md](./GUIA_RAPIDA.md)** | ⚡ Manual de uso con ejemplos prácticos | Usuarios |
| **[RESUMEN_EJECUTIVO.md](./RESUMEN_EJECUTIVO.md)** | 📋 Estado del proyecto y estadísticas | Managers |
| **[ESTRUCTURA.md](./ESTRUCTURA.md)** | 📐 Arquitectura y diagramas técnicos | Desarrolladores |
| **[README_FRONTEND.md](./fronten-MG-ZORRO/README_FRONTEND.md)** | 🎨 Documentación técnica del frontend | Desarrolladores |
| **[API_DOCS.md](./backend MG/API_DOCS.md)** | 🔌 Documentación completa de la API | Desarrolladores |

**👉 Empieza con [INDICE.md](./INDICE.md)** para navegar toda la documentación.

---

## 🏗️ Tecnologías

### Backend
- Node.js 18+
- Express.js
- TypeScript
- PostgreSQL (Supabase)

### Frontend
- Angular 18
- TypeScript
- Ng-Zorro (Ant Design)
- RxJS
- Less

---

## 📂 Estructura del Proyecto

```
MG AGRO/
├── backend MG/          ⚙️  API RESTful
│   ├── src/
│   │   ├── controllers/ 🎮  Lógica de negocio
│   │   ├── routes/      🛣️  Endpoints
│   │   └── services/    🔧  Servicios
│   └── API_DOCS.md      📚  Documentación API
│
├── fronten-MG-ZORRO/    🎨  Aplicación Angular
│   ├── src/app/
│   │   ├── pages/       📄  Módulos principales
│   │   ├── services/    🔌  Servicios HTTP
│   │   └── layout/      🎨  Layout y menú
│   └── README_FRONTEND.md 📚 Documentación
│
└── 📄 Documentación/
    ├── INDICE.md         📚  Índice general
    ├── GUIA_RAPIDA.md    ⚡  Guía de uso
    ├── RESUMEN_EJECUTIVO.md 📋 Resumen
    └── ESTRUCTURA.md     📐  Arquitectura
```

---

## 🔄 Flujo de Trabajo Típico

### 1. Gestión de Personal
```
EMPLEADOS → Crear empleado → ACTIVIDADES → Registrar jornada
```

### 2. Control de Inventario
```
ARTÍCULOS → Alta de producto → MOVIMIENTOS → Entrada/Salida
```

---

## 📊 Endpoints API

Base URL: `http://localhost:3000/api`

- `/auth` - Autenticación
- `/empleados` - Gestión de empleados
- `/actividades` - Registro de actividades
- `/articulos` - Gestión de inventario
- `/movimientos` - Entradas/salidas de stock

Ver [API_DOCS.md](./backend%20MG/API_DOCS.md) para detalles completos.

---

## ✅ Estado del Proyecto

| Componente | Estado | Puerto |
|------------|--------|--------|
| Backend API | ✅ Funcional | 3000 |
| Frontend | ✅ Funcional | 4200 |
| Base de Datos | ✅ Conectada | Supabase |
| Documentación | ✅ Completa | - |

---

## 🎓 Requisitos

- Node.js 18 o superior
- npm o yarn
- Navegador moderno (Chrome, Firefox, Edge)

---

## 🔒 Seguridad

- Validación de datos en backend y frontend
- Soft delete (no elimina datos físicamente)
- (Pendiente) Autenticación JWT completa
- (Pendiente) Sistema de permisos por rol

---

## 📈 Próximas Mejoras

- [ ] Dashboard con estadísticas
- [ ] Gráficos y reportes
- [ ] Exportación a Excel/PDF
- [ ] Sistema de notificaciones
- [ ] App móvil

---

## 🐛 Solución de Problemas

### Backend no responde
```bash
# Verificar que esté corriendo
cd "backend MG"
npm start
```

### Frontend no carga
```bash
# Verificar que esté corriendo
cd fronten-MG-ZORRO
npm start
```

### Error de CORS
Verificar que el backend tenga CORS habilitado (ya está configurado).

---

## 👥 Equipo

Desarrollado para MG AGRO - Sistema de Gestión

---

## 📝 Licencia

Uso interno de MG AGRO

---

## 🎉 ¡Listo para Usar!

El sistema está **completamente funcional** y listo para ser usado.

**👉 Siguiente paso:** Lee [GUIA_RAPIDA.md](./GUIA_RAPIDA.md) para aprender a usar el sistema.

---

**MG AGRO v1.0.0** | Octubre 2025
