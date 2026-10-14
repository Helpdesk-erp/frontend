// Cliente HTTP de la API. En desarrollo, Vite redirige /api al backend (vite.config.js).
const BASE = import.meta.env.VITE_API_URL ?? '/api'
const CLAVE_SESION = 'helpdesk.sesion'

export class ErrorApi extends Error {
  /**
   * @param {number} estado código HTTP (0 si no hubo respuesta)
   * @param {Record<string, string>} errores mensaje por campo del formulario
   */
  constructor(estado, mensaje, errores) {
    super(mensaje)
    this.estado = estado
    this.errores = errores ?? {}
  }
}

/** La sesión ({ token, expira, usuario }) se guarda en el navegador para sobrevivir a una recarga. */
export function leerSesionGuardada() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION))
  } catch {
    return null
  }
}

export function guardarSesion(sesion) {
  try {
    if (sesion) localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
    else localStorage.removeItem(CLAVE_SESION)
  } catch {
    // Navegación privada o almacenamiento bloqueado: la sesión dura lo que dure la pestaña
  }
}

/**
 * @param {string} ruta por ejemplo '/dashboard/cliente'
 * @param {{ metodo?: string, cuerpo?: object, consulta?: Record<string, string> }} opciones
 */
export async function api(ruta, { metodo = 'GET', cuerpo, consulta } = {}) {
  const sesion = leerSesionGuardada()
  const url = BASE + ruta + (consulta ? '?' + new URLSearchParams(consulta) : '')

  let respuesta
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(sesion?.token && { Authorization: `Bearer ${sesion.token}` }),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    })
  } catch {
    throw new ErrorApi(0, 'No hay conexión con el servidor. Verifique que el backend esté corriendo.')
  }

  const datos = respuesta.status === 204 ? null : await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    const error = new ErrorApi(respuesta.status, datos?.mensaje ?? `Error ${respuesta.status}`, datos?.errores)
    // Sesión cerrada o vencida en el servidor: ProveedorSesion escucha este evento y saca al usuario
    if (respuesta.status === 401 && sesion?.token && !ruta.startsWith('/auth/login')) {
      window.dispatchEvent(new CustomEvent('helpdesk:sesion-vencida', { detail: error.message }))
    }
    throw error
  }
  return datos
}
