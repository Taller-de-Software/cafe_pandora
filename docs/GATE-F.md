# Gate F — Validación final en Windows

Checklist para validar que el build de Café Pandora POS funciona de punta a
punta en una máquina **Windows real**. El repositorio está preparado para
producir en Windows los engines nativos de Prisma (PE) sin ninguna capa
intermedia: cualquier fallo aquí es un bug real del flujo, no un artefacto.

Flujo que valida este gate (el mismo que corre cualquier persona que clone el
repo):

```
pnpm install  ->  pnpm prisma:generate  ->  pnpm dist
```

---

## F0 — Requisitos previos en la máquina Windows

| Herramienta | Versión mínima | Cómo instalarla |
|---|---|---|
| Node.js | 20 LTS (se recomienda 22) | https://nodejs.org |
| pnpm | 11 | `corepack enable` o `npm install -g pnpm@11` |
| git (opcional) | — | https://git-scm.com |

Verificar:

```powershell
node -v
pnpm -v
git --version
```

## F1 — Clonar y limpiar

```powershell
git clone <url-del-repo> cafe_pandora
cd cafe_pandora
```

Nota: `node_modules` y `desktop\pnpm-lock.yaml` nunca se copian entre
dispositivos ni se versionan (lockfile por plataforma). Los lockfiles de
`backend\` y `frontend\` sí se versionan.

## F2 — Instalación

```powershell
cd desktop
pnpm install
cd ..\frontend
pnpm install
cd ..
```

## F3 — Guardrail de engines Prisma (debe ser PE nativo)

```powershell
cd desktop
pnpm prisma:generate
```

Verificar que existen (nombres nativos de Windows):

```powershell
dir backend\generated\prisma\query_engine-windows.dll.node
dir node_modules\@prisma\engines\schema-engine-windows.exe
```

- [ ] `query_engine-windows.dll.node` existe
- [ ] `schema-engine-windows.exe` existe

Si aparecen engines de otra plataforma (ej. `debian`, `libquery_engine-*.so`),
es un bug real de la config de Prisma: reportarlo, no parchearlo.

## F4 — Load-test de addons nativos (informativo)

Los 3 addons se cargan bajo demanda (solo al imprimir), pero conviene
confirmar que sus prebuilds N-API cargan en el runtime de Electron:

```powershell
cd desktop
$env:ELECTRON_RUN_AS_NODE = '1'
node_modules\.bin\electron.cmd -e "require('usb'); require('@ssxv/node-printer'); require('@plantae-tech/inkpresser'); console.log('addons OK')"
$env:ELECTRON_RUN_AS_NODE = $null
```

- [ ] `usb` carga
- [ ] `@ssxv/node-printer` carga
- [ ] `@plantae-tech/inkpresser` carga

## F5 — Build del instalador

```powershell
cd desktop
pnpm dist
```

Debe producir:

- [ ] `release\Cafe Pandora Setup 1.0.0.exe`

## F6 — Instalación y arranque

1. Ejecutar `release\Cafe Pandora Setup 1.0.0.exe` (asistente NSIS: elegir
   carpeta; requiere permisos de administrador).
2. SmartScreen: «Más información > Ejecutar de todas formas» (el instalador
   **no está firmado**, es esperado).
3. Abrir **Cafe Pandora**.
4. Ver el log de arranque:

```powershell
notepad $env:APPDATA\cafe-pandora-desktop\logs\main.log
```

- [ ] Contiene `[migrate] migraciones aplicadas`
- [ ] Contiene `[seed] catálogo listo`
- [ ] Contiene `[backend] listo en http://127.0.0.1:3001`

5. Verificar la API:

```powershell
curl http://127.0.0.1:3001/api/health
```

- [ ] Responde `{"status":"ok"}` (o similar)

## F7 — Funcionalidad

- [ ] Crear usuario admin y entrar al POS
- [ ] El catálogo muestra las 137 imágenes de productos
- [ ] Se puede abrir una mesa, añadir pedidos y registrar una venta
- [ ] Impresora: probar ticket (USB o spooler de Windows)
- [ ] Lector USB: registrar un producto escaneando

## F8 — Red y firewall

El servidor escucha en `0.0.0.0` y el instalador crea una regla de firewall
«Cafe Pandora» para el módulo LAN.

```powershell
netsh advfirewall firewall show rule name="Cafe Pandora"
```

- [ ] La regla existe y está habilitada
- [ ] Desde otro equipo de la misma red: `http://IP-de-la-PC:3001` abre el POS

## F9 — Instancia única (hook NSIS)

El instalador cierra instancias previas antes de actualizar:

```powershell
tasklist /FO CSV /NH | findstr /B /I /C:"\"Cafe Pandora.exe\""
```

- [ ] Encontró el proceso en ejecución

## F10 — Actualización y desinstalación (opcional)

- [ ] Reinstalar el setup sobre la instalación existente funciona y conserva
      la base de datos (`deleteAppDataOnUninstall: false`)
- [ ] Desinstalar desde «Agregar o quitar programas» elimina la app y deja
      `%APPDATA%\cafe-pandora-desktop` intacto (datos del negocio)

---

## Referencia rápida — build Linux (AppImage)

```bash
cd desktop
pnpm install
pnpm dist:linux
# release/Cafe Pandora-1.0.0.AppImage
```

## Notas

- **Por qué Windows real**: `prisma generate` produce binarios de la
  plataforma donde corre. Un build de Linux contiene engines Linux y **no**
  sirve para Windows; una VM/Wine no valida drivers, impresora, SmartScreen ni
  firewall.
- **Script asistente**: `desktop/scripts/gate-f-windows.ps1` automatiza
  F0–F5 (pre-checks, instalación, guardrail, load-test y build) y deja los
  pasos manuales indicados.
