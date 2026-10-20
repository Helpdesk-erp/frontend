# Frontend del Helpdesk ERP

Aplicación web del sistema de soporte para el ERP/POS de "Sistemas Integrados S.A.", hecha en React 19 (JavaScript) con Vite 8 y Material UI 9. Proyecto de aula de Bases de Datos No Relacionales, UFPS Ocaña.

Necesita los otros dos repositorios de la organización funcionando: la base de datos cargada con [base-de-datos](https://github.com/Helpdesk-erp/base-de-datos) y la API corriendo con [backend](https://github.com/Helpdesk-erp/backend).

## Requisitos

- Node.js 22 o superior.
- pnpm 10 o superior. El proyecto usa pnpm, no npm. Si no lo tiene instalado:

```bash
npm install -g pnpm
```

## Ejecutar

```bash
pnpm install
```

```bash
pnpm run dev
```

Con el backend corriendo en el puerto 8080, la aplicación queda en `http://localhost:5173`. Vite pasa las llamadas a `/api` al backend (ver `vite.config.js`). Para servir el build desde otro lugar, defina `VITE_API_URL` con la dirección completa de la API.

Los usuarios de prueba y su contraseña están en el [README de base-de-datos](https://github.com/Helpdesk-erp/base-de-datos#usuarios-de-prueba). En modo desarrollo, la pantalla de login los muestra para llenarlos con un clic.

## Dependencias y seguridad

`pnpm-workspace.yaml` tiene `minimumReleaseAge: 1440`: pnpm solo instala versiones publicadas hace más de un día. La mayoría de los paquetes maliciosos que llegan al registro se detectan y se retiran en pocas horas, así que esa espera los deja por fuera. Por eso, si una librería sacó versión hoy, `pnpm add` instala la anterior. Es lo esperado.

pnpm tampoco ejecuta los scripts de instalación de las dependencias a menos que se autoricen. Por ese tipo de scripts se propagaron los ataques recientes al registro de npm.

No suba un `package-lock.json`. Si alguien corre `npm install` por error, el `.gitignore` lo deja por fuera.

## Carpetas de `src`

| Carpeta | Contenido |
|---|---|
| `api/` | `cliente.js`: hace las peticiones, agrega el token y convierte los errores del backend en `ErrorApi` |
| `auth/` | Sesión del usuario (contexto de React) y las rutas protegidas por rol o permiso |
| `componentes/` | Piezas que comparten las pantallas: marco con el menú, tablas de tickets, gráfico de barras, buscador de la base de conocimiento |
| `paginas/` | Login, registro, base de conocimiento y un dashboard por rol en `dashboards/` |
| `utilidades/` | Formato de fechas y pesos en español, etiquetas de los estados |

## Librerías

| Librería | Para qué |
|---|---|
| React Router 7 | Rutas: `/login`, `/registro`, `/administrador`, `/agente`, `/cliente`, `/auditor`, `/conocimiento` |
| TanStack Query | Peticiones con caché. Los dashboards se actualizan solos cada 30 segundos |
| React Hook Form | Formularios con validación por campo. Los errores del backend llegan al campo con `setError` |
| Material UI y MUI X Charts | Componentes adaptables a celular y gráficos de barras |

El tema arranca en el modo claro u oscuro del sistema operativo. El botón de sol y luna de la barra superior (y del login y el registro) lo cambia, y el navegador recuerda la elección.
