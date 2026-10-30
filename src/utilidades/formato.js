// Formatos y etiquetas en español. Las fechas se muestran en hora de Colombia.
const ZONA = 'America/Bogota'

const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: ZONA })
const formatoFechaHora = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: ZONA })
const formatoDia = new Intl.DateTimeFormat('es-CO', { day: 'numeric', timeZone: ZONA })
const formatoMes = new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: ZONA })
const formatoHora = new Intl.DateTimeFormat('es-CO', { timeStyle: 'short', timeZone: ZONA })
const formatoPesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const formatoNumero = new Intl.NumberFormat('es-CO')

export const fecha = (valor) => (valor ? formatoFecha.format(new Date(valor)) : '-')
// Fechas sin hora (vigencia de un contrato): se guardan a medianoche UTC y se muestran tal cual,
// sin pasarlas a hora de Colombia, que las correría al día anterior
const formatoCalendario = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' })
export const fechaCalendario = (valor) => (valor ? formatoCalendario.format(new Date(valor)) : '-')
export const fechaHora = (valor) => (valor ? formatoFechaHora.format(new Date(valor)) : '-')
export const hora = (valor) => formatoHora.format(new Date(valor))
export const dia = (valor) => formatoDia.format(new Date(valor))
export const mes = (valor) => formatoMes.format(new Date(valor)).replace('.', '')
export const pesos = (valor) => formatoPesos.format(valor ?? 0)
/** Para etiquetas de gráficos, donde la cifra completa no cabe: 1150000 -> "$ 1,2 M", 570000 -> "$ 570 mil" */
export const pesosCortos = (valor = 0) => {
  if (valor >= 1_000_000) return `$ ${formatoNumero.format(Math.round(valor / 100_000) / 10)} M`
  if (valor >= 1000) return `$ ${formatoNumero.format(Math.round(valor / 1000))} mil`
  return pesos(valor)
}
export const numero = (valor) => formatoNumero.format(valor ?? 0)

/** "Andrés Felipe Carrascal Rincón" -> "Andrés" */
export const primerNombre = (nombre) => nombre?.split(' ')[0] ?? ''

const formatoPeriodo =new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' })
/** "2026-10" -> "octubre de 2026" */
export const periodo = (valor) => {
  const [anio, numeroMes] = valor.split('-').map(Number)
  return formatoPeriodo.format(new Date(Date.UTC(anio, numeroMes - 1, 1)))
}

export const PAQUETES = {
  VENTAS_ONLINE: 'Ventas Online',
  INVENTARIOS: 'Inventarios',
  COMPRAS: 'Compras',
  PRODUCCION: 'Producción',
  POS: 'Sistema POS',
}

export const ESTADOS_TICKET = {
  sin_atender: 'Sin atender',
  asignado: 'Asignado',
  en_proceso: 'En proceso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
}

export const ESTADOS_CAPACITACION = {
  programada: 'Programada',
  en_curso: 'En curso',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
}

export const PRIORIDADES = { alta: 'Alta', media: 'Media', baja: 'Baja' }

export const TIPOS_TICKET = { incidente: 'Incidente', consulta: 'Consulta', mejora: 'Mejora' }

export const TIPOS_CLIENTE = {
  persona_natural: 'Persona natural',
  empresa: 'Empresa',
  persona_juridica: 'Persona jurídica',
}

export const METODOS_PAGO = {
  PSE: 'PSE',
  tarjeta_credito: 'Tarjeta de crédito',
  tarjeta_debito: 'Tarjeta débito',
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
}

export const DEPARTAMENTOS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas',
  'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía',
  'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander',
  'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre',
  'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada',
]
