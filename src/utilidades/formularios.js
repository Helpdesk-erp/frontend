// Mismas reglas del $jsonSchema (base_datos/01_esquema.js) y de los DTO del backend
export const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/
export const CORREO = /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
export const USUARIO = /^[a-z0-9._]{4,30}$/
export const CELULAR = /^[0-9]{10}$/
export const DOCUMENTO = /^[0-9]{6,10}$/
export const URL_WEB = /^https?:\/\/\S+$/

export const MENSAJE_USUARIO = 'Entre 4 y 30 caracteres: minúsculas, números, punto o guion bajo'

/**
 * Pasa al formulario los errores por campo que devuelve el backend y retorna el
 * mensaje general. El backend nombra los elementos de una lista como
 * "sesiones[0].fecha_inicio"; React Hook Form los llama "sesiones.0.fecha_inicio".
 */
export function aplicarErrores(error, setError) {
  Object.entries(error.errores ?? {}).forEach(([campo, mensaje]) =>
    setError(campo.replace(/\[(\d+)\]/g, '.$1'), { type: 'servidor', message: mensaje }),
  )
  return error.message
}

/** Hora de Colombia (UTC-5, sin horario de verano) para los campos datetime-local. */
export const aFechaHoraBogota = (valor) => (valor ? `${valor}:00-05:00` : null)

/** Mes actual en formato 2026-11, para el periodo de un pago. */
export function mesActual() {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit' })
    .formatToParts(new Date())
  return `${partes.find((p) => p.type === 'year').value}-${partes.find((p) => p.type === 'month').value}`
}

/** Fecha de hoy en formato 2026-11-01 (hora de Colombia), para los campos type="date". */
export function hoy() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}

/** "2027-05-01T00:00:00Z" -> "2027-05-01", para volver a llenar un campo type="date". */
export const aFechaCampo = (valor) => (valor ? String(valor).slice(0, 10) : '')
