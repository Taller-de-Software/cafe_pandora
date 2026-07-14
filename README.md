# Café Pandora — POS System

Sistema de punto de venta (POS) para Café Pandora Bar.

## Estructura del proyecto

```
cafe_pandora/
├── backend/          # API REST con Express + Prisma
│   ├── src/
│   │   ├── modules/  # Módulos del negocio (auth, caja, facturas, menú, mesas, pedidos, etc.)
│   │   └── utils/    # Utilidades (upload, PDF, etc.)
│   ├── prisma/       # Schema y migraciones de base de datos
│   └── server.js     # Punto de entrada
├── frontend/         # SPA con React + Vite + TypeScript
│   └── src/
│       ├── modules/  # Módulos del frontend (caja-finanzas, menú, mesas, pedidos, etc.)
│       ├── router/   # Configuración de rutas
│       └── services/  # Cliente HTTP compartido
├── uploads/          # Archivos subidos (productos, facturas, cocina)
│   └── productos/
├── images/           # Imágenes estáticas del repositorio
├── docker-compose.yml     # Producción
└── docker-compose.dev.yml # Desarrollo
```

## Requisitos

- Node.js >= 20
- pnpm >= 9 (backend exige pnpm v11.3+)
- Docker y Docker Compose (opcional)

## Desarrollo local

### Backend

```bash
cd backend
pnpm install
pnpm run dev
```

Inicia en `http://localhost:3001` con recarga automática en cambios.

### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

Inicia en `http://localhost:5173`.

### Variables de entorno

| Archivo | Descripción |
|---|---|
| `backend/.env` | Configuración de base de datos, JWT, etc. |
| `frontend/.env` | `VITE_API_URL=/api` (proxy a backend) |

## Docker

### Desarrollo

```bash
docker compose -f docker-compose.dev.yml up --build
```

### Producción

```bash
docker compose up --build
```

## Base de datos

Backend usa **Prisma** con MySQL. Para aplicar migraciones:

```bash
cd backend
pnpm prisma:migrate
pnpm prisma:generate
pnpm run dev        # ejecuta migrate + generate automáticamente
```
