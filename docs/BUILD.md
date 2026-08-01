# Café Pandora Desktop — Arquitectura y Build (Windows / Linux)

Este documento explica **cómo funciona** el empaquetado de escritorio de Café Pandora, **por qué** está construido así (incluyendo los problemas reales que se resolvieron durante el desarrollo), y **cómo** generar los instaladores desde cero en una máquina limpia.

Está pensado para vivir en el repo (`docs/BUILD.md`) y ser el punto de referencia cuando alguien nuevo clone el proyecto. Para la validación final en una máquina Windows real, ver `docs/GATE-F.md`.

---

## 1. Qué es esto

`desktop/` empaqueta el backend (Express + Prisma + SQLite) y el frontend (React/Vite) del POS Café Pandora dentro de una app de Electron, generando:

- **Windows**: un instalador NSIS (`Cafe Pandora Setup X.X.X.exe`).
- **Linux**: un `AppImage` (`Cafe Pandora-X.X.X.AppImage`).

Cada uno es un artefacto **independiente y autocontenido** — no requieren tener Node instalado en la máquina del usuario final.

## 2. Decisiones de arquitectura (el "por qué")

### 2.1 Backend in-process, no como proceso hijo separado

El proceso principal de Electron **ya es Node.js**. En vez de lanzar el backend como un proceso hijo (`spawn`) y esperar a que responda por HTTP, `main.cjs` importa directamente el backend con `await import()` y llama a una función exportada `startServer()`.

Ventajas: sin polling de salud, sin gestión de procesos hijos para el servidor, menos RAM, menos superficie de fallo. El backend muere junto con el proceso principal automáticamente.

**Excepción**: `prisma migrate deploy` sí sigue siendo un **proceso hijo efímero** (`runNodeScript`, `main.cjs:159-191`) — es una herramienta de línea de comandos que hace `process.exit()` internamente, no se puede invocar in-process.

**El seed NO es un proceso hijo.** `runSeed()` (`main.cjs:207-215`) importa `backend/prisma/seed.js` in-process con `await import()` y llama a su función `seed()` exportada. Si alguien busca un `spawn` de seed, no existe: es una importación ESM normal desde el proceso principal.

### 2.2 Todo el código va dentro del `asar`, salvo los binarios nativos

Node lee de forma transparente dentro de `app.asar` (incluido `express.static`). Solo los binarios nativos compilados (`.node`, `.exe`, `.dll.node`) necesitan salir del asar comprimido, porque **un ejecutable no se puede lanzar (`spawn`) ni cargar dinámicamente desde dentro de un archivo comprimido**.

Esto se controla con `asarUnpack` en `desktop/package.json`, apuntando específicamente a:

```json
"asarUnpack": [
  "node_modules/@prisma/**",
  "node_modules/prisma/**",
  "node_modules/usb/**",
  "node_modules/@ssxv/node-printer/**",
  "node_modules/@plantae-tech/inkpresser/**"
]
```

**El schema de Prisma NO va en `asarUnpack`** (es un archivo de texto, no un binario). El primer arranque lo copia a los datos del usuario: `stageMigrations()` (`main.cjs:150-157`) copia `schema.prisma` y `migrations/` a `<userData>/prisma/`, y `migrate deploy` recibe esa ruta absoluta con `--schema`.

### 2.3 `desktop/` tiene sus propias dependencias (duplicadas, no un monorepo)

Se evaluó migrar a un monorepo `pnpm-workspace` para compartir dependencias entre `backend/` y `desktop/`, pero se descartó: obligaría a tocar cómo el backend resuelve sus dependencias en producción activa, solo para resolver una necesidad de *empaquetado*.

En su lugar, `desktop/` declara como propias las dependencias runtime que el backend necesita (Express, Prisma, etc.), con **`nodeLinker: hoisted`** en `desktop/pnpm-workspace.yaml`. Esto es clave: pnpm normal usa symlinks (`.pnpm/` virtual store), que **se rompen** si `electron-builder` los copia tal cual al empaquetar. Con `hoisted`, el `node_modules` queda plano y es empaquetable sin sorpresas.

**Costo aceptado**: ~15 dependencias duplicadas entre `backend/package.json` y `desktop/package.json`. Se mitiga fijando las mismas versiones exactas en ambos.

### 2.4 El cliente de Prisma se genera dentro del proyecto, no en `node_modules`

Este fue uno de los bugs más difíciles de esta arquitectura. Por defecto, `prisma generate` escribe el cliente en `node_modules/.prisma/client` — pero `electron-builder` decide qué empaquetar analizando el árbol de **dependencias declaradas** (`package.json`), y `.prisma/client` no es una dependencia declarada, es un artefacto generado. Resultado: el cliente nunca se empaquetaba, y la app fallaba con `MODULE_NOT_FOUND` al intentar `require('.prisma/client/default')` — pero solo al llegar al paso de arrancar el servidor in-process, no en los pasos previos (migrate/seed), lo que hizo más difícil detectarlo.

**Solución**: en `backend/prisma/schema.prisma`, el generador tiene `output = "../generated/prisma"` — dentro del proyecto, en una carpeta que sí cubre el patrón `files` de `electron-builder`. Esta carpeta está en `.gitignore`: se regenera en cada máquina/plataforma con `prisma generate`.

### 2.5 Dos mecanismos independientes para los engines de Prisma — no confundirlos

Hay dos binarios de Prisma distintos, con propósitos y ubicaciones distintas:

| Mecanismo | Qué resuelve | Dónde vive | Cómo se fuerza |
|---|---|---|---|
| **Query engine** (motor de consultas) | Las queries que hace `@prisma/client` en runtime | `node_modules/@prisma/engines/` (unpacked) | Variable de entorno `PRISMA_QUERY_ENGINE_LIBRARY` apuntando a `app.asar.unpacked/...` |
| **Schema engine** (CLI de migraciones) | `prisma migrate deploy` | `node_modules/@prisma/engines/` (unpacked) | Variable de entorno `PRISMA_SCHEMA_ENGINE_BINARY` apuntando a `app.asar.unpacked/...` (resuelta por un helper `resolveSchemaEngine()` en `main.cjs`) |

Ambos son binarios **descargados** por plataforma durante `prisma generate`/`postinstall` — no se compilan.

**Cómo contar bien los errores reales de esta capa** (importante para no despistar a quien lea esto después):

- (a) **`MODULE_NOT_FOUND` de `.prisma/client`** — el bug real del empaquetado, resuelto en §2.4.
- (b) **`Error: Schema engine error` al arrancar en Windows un build hecho en Linux** — los engines descargados son de la plataforma de *build* (ELF en un build Linux), no de la de *destino* (Windows). Un build de Windows debe hacerse en Windows (o con `pnpm install` limpio nativo). Ver §4 y `docs/GATE-F.md`.
- El `ENOENT` en rutas dentro del asar comprimido apareció como **síntoma** durante el diagnóstico del query engine, no como causa raíz recurrente. De todos modos, forzar ambas variables de entorno explícitamente antes de lanzar cualquier proceso de Prisma es lo que garantiza que los binarios unpacked se resuelvan siempre.

### 2.6 ESM/CJS interop con `@prisma/client`

`@prisma/client` es un módulo CommonJS. Importarlo con sintaxis de named export (`import { PrismaClient } from '@prisma/client'`) depende de un análisis estático que puede fallar según el entorno de ejecución exacto (fue inconsistente entre `pnpm dev` normal y el proceso principal de Electron). El patrón seguro es importar el *default* y destructurar:

```js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
```

En los tres puntos de entrada que intervienen en el empaquetado (`backend/src/config/db.config.js`, `backend/prisma/seed.js`, `backend/scripts/actualizarImagenesProductos.js`) se importa directamente desde el cliente generado en el proyecto:

```js
import pkg from '<dir>/generated/prisma/default.js';
const { PrismaClient } = pkg;
```

En ambos casos la regla es la misma: nunca named export directo.

### 2.7 El backend es ESM, el entrypoint de Electron es CJS

`backend/package.json` tiene `"type": "module"`. El main de Electron (`main.cjs`) es CommonJS por convención de Electron. La forma de cargar un módulo ESM desde un archivo CJS es el `import()` dinámico (`await import('../backend/server.js')`), que sí funciona en ese sentido — nunca al revés (`require()` de ESM no funciona).

El backend exporta una función `startServer()` con un guard `isDirectRun` (compara `import.meta.url` contra `pathToFileURL(process.argv[1]).href`) para que `pnpm dev` siga auto-arrancando el servidor normalmente, mientras que Electron solo importa la función sin que se autoarranque.

### 2.8 El servidor escucha en `0.0.0.0`, no en `127.0.0.1` — a propósito

Hay un módulo de red en el producto que genera QR/URLs para que otros dispositivos (tablets, otras cajas) se conecten al POS por la LAN. Esto **requiere** escuchar en todas las interfaces, no solo loopback. Por eso la regla de firewall de Windows (ver 2.9) es necesaria — no es un descuido, es la contraparte obligatoria de esta funcionalidad.

### 2.9 Firewall de Windows vía script NSIS

Como el servidor escucha en `0.0.0.0`, Windows Firewall bloquearía las conexiones LAN entrantes por defecto. El instalador NSIS incluye un script (`installer/firewall.nsh`) que agrega la excepción de firewall durante la instalación — que por eso requiere permisos de administrador (`perMachine: true`, no `oneClick` simple).

### 2.10 Manejo de instancia única y de "app ya corriendo" durante instalación/desinstalación

El instalador necesita detectar si la app está corriendo antes de instalar/actualizar/desinstalar, para no dejar archivos bloqueados. La implementación oficial de electron-builder para esto usa PowerShell (`Get-CimInstance`), pero el proyecto usa una variante directa con `tasklist` + `findstr`:

```
tasklist /FO CSV /NH | findstr /B /I /C:"\"Cafe Pandora.exe\""
taskkill /F /IM "Cafe Pandora.exe"
```

**Por qué `findstr /B` sobre CSV y no el filtro nativo `tasklist /FI "IMAGENAME eq ..."`**: el filtro `/FI` de `tasklist` no funciona con nombres que contienen espacios bajo Wine (dio falsos negativos durante el desarrollo). El `findstr /B` anclado al inicio de línea filtra por nombre exacto del ejecutable, sin riesgo de afectar otros procesos. Nota: en Windows real el `findstr /B` es estricto; conviene reverificarlo puntualmente en la máquina destino (`docs/GATE-F.md`, fase F9).

### 2.11 Runtime hardening en `main.cjs`

Como el backend corre in-process, un error no controlado ya no queda aislado en un proceso hijo — puede tirar toda la ventana. Por eso `main.cjs` tiene:

```js
process.on('uncaughtException', (err) => { logToFile(err); dialog.showErrorBox(...); app.exit(1); });
process.on('unhandledRejection', (err) => logToFile(err));
```

y un reintento de puerto (3001 → 3002 → 3003) si el puerto principal está ocupado, con el puerto elegido inyectado al frontend vía `additionalArguments` + `preload.cjs` (el frontend ya tenía un mecanismo para esto, `ServerConfigModal`).

### 2.12 Datos del usuario, no del código

Todo lo que el POS genera en producción (base de datos SQLite, imágenes subidas, logs, secretos JWT) vive en `app.getPath('userData')`:

- Windows: `%APPDATA%\cafe-pandora-desktop` — el nombre lo da el `name` del `package.json` del runtime, **no** el `productName` ("Cafe Pandora").
- Linux: `~/.config/cafe-pandora-desktop`.

`Program Files` es de solo lectura, por eso no puede vivir ahí. El desinstalador tiene `deleteAppDataOnUninstall: false` explícito — desinstalar **no borra** la base de datos ni las facturas (decisión de producto: son registros contables).

### 2.13 Sin firmar (por ahora)

El instalador de Windows no está firmado con certificado de código (~$70-400/año). Esto dispara SmartScreen ("Windows protegió tu PC") en el primer uso — es esperado, se documenta el paso de "Más información → Ejecutar de todas formas". La config tiene `signExecutable: false` explícito para que el build sea determinista y no dependa de si la máquina de build tiene, por accidente, algún certificado de desarrollo instalado en su almacén de Windows.

## 3. Errores reales que se resolvieron (para no repetirlos)

Esta sección documenta bugs concretos encontrados durante el desarrollo, porque las causas no son obvias y es fácil reintroducirlos:

1. **Node-gyp sin Python** — `usb`, `@plantae-tech/inkpresser` y `@ssxv/node-printer` son **N-API** y se instalan como prebuilds (por eso `npmRebuild: false` es seguro). Pero si para la combinación exacta Node/arch no existiera prebuild, pnpm intentaría compilar desde fuente, y ahí sí se necesita Python + Visual Studio Build Tools (workload C++) en la máquina de Windows. En el caso actual no hicieron falta: es un seguro, no un requisito del flujo normal.

2. **Lockfile / `node_modules` compartido entre plataformas** — nunca reusar `node_modules` o un `pnpm-lock.yaml` generado en una plataforma distinta a la de build. pnpm resuelve dependencias opcionales por plataforma al momento de instalar/generar el lockfile; si se reusa, arrastra binarios de la plataforma equivocada (se vio con los engines de Prisma: binarios `debian` apareciendo en un intento de build de Windows). **Regla dura**: `pnpm-lock.yaml` de `desktop/` está en `.gitignore` — cada máquina genera el suyo desde cero.

3. **`asarUnpack` no recursivo** — un patrón como `@prisma/*` no baja a subcarpetas (`engines/`). Hay que usar `@prisma/**`.

4. **Prisma sigue buscando en rutas relativas por defecto** — aunque el binario ya esté en `app.asar.unpacked`, Prisma no lo encuentra solo por eso: hay que fijar `PRISMA_QUERY_ENGINE_LIBRARY` y `PRISMA_SCHEMA_ENGINE_BINARY` explícitamente antes de cualquier llamada.

5. **`.prisma/client` generado no se empaqueta por defecto** — ver sección 2.4. Se resolvió cambiando el `output` del generador a una carpeta del proyecto.

6. **ABI de módulos nativos vs. Electron** — para módulos **N-API** (todos los que usa este proyecto), la compatibilidad se mide por versión de N-API, no por `NODE_MODULE_VERSION`. Esto se confirmó con evidencia en 3 capas: metadata del paquete, símbolos exportados en el binario (`node_api_module_get_api_version_v1`), y una prueba de carga real bajo `ELECTRON_RUN_AS_NODE`. Por eso `npmRebuild: false` es seguro en este proyecto — pero si se agregan módulos nativos nuevos en el futuro, hay que reconfirmar que también sean N-API antes de asumir lo mismo.

## 4. Cómo probar sin la plataforma destino (con matices importantes)

Durante el desarrollo se usó **Wine** en Linux para adelantar pruebas del instalador de Windows sin tener la máquina real a mano. Es útil, pero con límites que hay que respetar — y conviene ser exacto sobre qué se completó y qué no:

**Lo que sí se validó en Wine**: que el instalador NSIS corre, las rutas de instalación, el arranque de Electron, `schema-engine-windows.exe --version`, y la lógica de detección de instancia única (`tasklist`/`findstr`/`taskkill`).

**Lo que NO se pudo validar en Wine** (aunque se intentó): el flujo completo de Prisma. Con engines ELF (build de Linux) la app muere al arrancar con `Error: Schema engine error`; con engines PE inyectados a mano llegó hasta el datasource SQLite y se cortó, sin completar migrate + seed + servidor. Por lo tanto, login/UI en runtime **jamás se validó bajo Wine**.

**No es confiable en Wine** (requiere la máquina Windows real): detección real de impresora/USB (no hay stack de hardware real detrás), la regla de firewall (`netsh`), SmartScreen, y el anclado exacto de `findstr /B` (Wine lo ignora con un warning, pero el match sigue funcionando por la estructura del CSV — en Windows real es más estricto).

**Moraleja**: un resultado a medias bajo Wine no prueba ni desprueba Windows real. Wine adelantó el instalador y el diagnóstico; la validación definitiva es `docs/GATE-F.md` en una máquina Windows real.

Un **AppImage de Linux** (target nativo, no Wine) tampoco valida el build de Windows — son binarios completamente independientes (ELF vs. PE). Sirve para confirmar que la lógica JS de la app (Electron + Express + Prisma + migraciones) no tiene ninguna dependencia oculta de plataforma, acelerando el diagnóstico cuando algo falla en Windows (si el AppImage funciona, el bug está en algo específico de Windows, no en la lógica compartida).

## 5. Cómo generar el build — paso a paso

### 5.1 Requisitos previos

**Para build de Windows** (debe hacerse en una máquina Windows real):
- Node.js 20 LTS o superior (ver `.nvmrc`).
- pnpm ≥ 11.3.0 (`corepack enable` o `npm install -g pnpm`).
- Visual Studio Build Tools 2022 (workload "Desktop development with C++") y Python 3.x: **solo como fallback** por si algún prebuild N-API no está disponible para tu combinación Node/arch. En el flujo normal no hacen falta (`npmRebuild: false` + prebuilds).

**Para build de Linux**:
- Node.js 20 LTS o superior.
- pnpm ≥ 11.3.0.

### 5.2 Clonar y preparar

```bash
git clone <repo>
cd cafe_pandora

cd frontend
pnpm install
cd ..

cd desktop
pnpm install
```

> Nota: `desktop/pnpm-lock.yaml` no está versionado — cada máquina genera el suyo. Si alguna vez cambias de plataforma en la misma máquina (por ejemplo, WSL a Windows nativo), borra `node_modules` y `pnpm-lock.yaml` por completo antes de reinstalar. Un install "a medias" sobre binarios de otra plataforma es la causa más común de errores confusos en este proyecto.

### 5.3 Generar el cliente de Prisma y verificar los engines

```bash
cd desktop
pnpm prisma:generate
```

Verificación (importante, no saltarla):

```bash
# En Windows (PowerShell)
dir backend\generated\prisma        # debe mostrar query_engine-windows.dll.node
dir node_modules\@prisma\engines    # debe mostrar schema-engine-windows.exe

# En Linux
ls backend/generated/prisma          # debe mostrar libquery_engine-debian-*.so.node (o el que corresponda a tu distro)
ls node_modules/@prisma/engines
```

Si ves binarios de otra plataforma (`.so.node` en Windows, o `.dll.node` en Linux), el `node_modules`/lockfile no se generó limpio para esta plataforma — vuelve a 5.2. Es un bug real de la configuración, no algo que haya que parchear.

### 5.4 (Opcional) Verificar módulos nativos antes de empaquetar

```bash
# Windows (PowerShell)
$env:ELECTRON_RUN_AS_NODE=1; .\node_modules\electron\dist\electron.exe -e "require('@ssxv/node-printer');require('usb');require('@plantae-tech/inkpresser');console.log('OK')"

# Linux
ELECTRON_RUN_AS_NODE=1 ./node_modules/electron/dist/electron -e "require('@ssxv/node-printer');require('usb');require('@plantae-tech/inkpresser');console.log('OK')"
```

Si esto imprime `OK` sin error, los 3 módulos cargan correctamente bajo el runtime de Electron. Si alguno falla, no bloquea el arranque del POS (se cargan bajo demanda), pero conviene resolverlo antes de distribuir.

### 5.5 Generar el instalador

```bash
# Windows → genera desktop/release/Cafe Pandora Setup X.X.X.exe
pnpm dist

# Linux → genera desktop/release/Cafe Pandora-X.X.X.AppImage
pnpm dist:linux
```

Cada script limpia `release/` antes de compilar, corre el build del frontend, genera el cliente de Prisma, y empaqueta con `electron-builder`.

### 5.6 Probar el instalador

**Windows** — instalar el `.exe`, y verificar en orden:
1. SmartScreen aparece (esperado, sin firma) → "Más información" → "Ejecutar de todas formas".
2. Pide permisos de administrador (regla de firewall).
3. Primer arranque: revisar `%APPDATA%\cafe-pandora-desktop\logs\main.log` — debe mostrar migraciones aplicadas, seed corrido, y `listo en http://127.0.0.1:3001` (o el puerto que haya tomado si el 3001 estaba ocupado).
4. Login/registro de usuario, catálogo con imágenes, alta de producto.
5. Cerrar y reabrir — los datos deben persistir.
6. Desde otro dispositivo en la misma red, probar la conexión LAN vía QR.
7. **Impresora/USB** — conectar el hardware real y confirmar detección (esta es la única prueba que no se puede adelantar en ningún entorno que no sea la máquina Windows real con el hardware conectado).
8. Desinstalar — confirmar que `%APPDATA%\cafe-pandora-desktop` sigue existiendo.

El checklist completo, fase por fase, está en `docs/GATE-F.md`.

**Linux** — ejecutar el AppImage directamente:

```bash
chmod +x "Cafe Pandora-X.X.X.AppImage"
./"Cafe Pandora-X.X.X.AppImage"
```

Revisar `~/.config/cafe-pandora-desktop/logs/main.log` con los mismos criterios de arriba (salvo firewall/SmartScreen, que no aplican).

## 6. Qué queda fuera de este documento (decisiones de negocio, no técnicas)

- **Firma de código**: evaluar si se compra un certificado (~$70-400/año) si el producto se distribuye a más de un cliente.
- **Actualizaciones**: no hay mecanismo de auto-update. Cada versión nueva requiere generar un instalador y reinstalar manualmente.
- **Regla de firewall**: cubre explícitamente el puerto 3001. Si el fallback usa 3002/3003 (puerto ocupado), esa conexión específica no tiene regla de firewall — decisión aceptada, ya que es un caso de excepción, no el flujo normal.
