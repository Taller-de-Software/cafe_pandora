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

Backend usa **Prisma** con SQLite. Para aplicar migraciones:

```bash
cd backend
pnpm prisma:migrate
pnpm prisma:generate
pnpm run dev        # ejecuta migrate + generate automáticamente
```

## Build / Instalador (desktop)

La app de escritorio (Electron) empaqueta backend + frontend en un instalador
NSIS (Windows) o AppImage (Linux).

### Requisitos

- Node.js >= 20 (se recomienda 22, ver `.nvmrc`)
- pnpm >= 11

### Windows (en una máquina Windows real)

```powershell
cd desktop
pnpm install
pnpm prisma:generate   # genera los engines nativos de Windows (PE)
pnpm dist              # electron-builder --win nsis
# release\Cafe Pandora Setup 1.0.0.exe
```

Asistente automatizado del Gate F: `desktop/scripts/gate-f-windows.ps1`.

- [docs/BUILD.md](docs/BUILD.md) — arquitectura y decisiones del empaquetado.
- [docs/GATE-F.md](docs/GATE-F.md) — checklist de validación final en Windows.

### Linux (AppImage)

```bash
cd desktop
pnpm install
pnpm dist:linux
# release/Cafe Pandora-1.0.0.AppImage
```

### Notas de build

- **Los engines de Prisma son por plataforma.** El instalador debe construirse
  en la misma plataforma donde se va a ejecutar; un build de Linux no sirve
  para Windows. Si los engines salen mal en un `pnpm install` limpio, es un
  bug de la config de Prisma.
- **`desktop/pnpm-lock.yaml` no se versiona**: cada plataforma genera el suyo
  en su `pnpm install`. No copiar `node_modules` entre dispositivos ni entre
  SO. Los lockfiles de `backend/` y `frontend/` sí se versionan (JS puro).
- **El instalador no está firmado**: Windows SmartScreen mostrará un aviso
  («Más información > Ejecutar de todas formas»). Es esperado.
- **Módulo LAN**: el servidor escucha en `0.0.0.0` y el instalador crea una
  regla de firewall «Cafe Pandora» para acceder al POS desde la red local.
- **Addons nativos** (`usb`, `@ssxv/node-printer`, `@plantae-tech/inkpresser`):
  se descargan como prebuilds N-API y solo se cargan al imprimir/leer USB; el
  núcleo del POS no los necesita para arrancar.

