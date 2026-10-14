import { Chip } from '@mui/material'
import { ESTADOS_TICKET, PAQUETES, PRIORIDADES } from '../utilidades/formato.js'

const COLOR_ESTADO = {
  sin_atender: 'warning',
  asignado: 'info',
  en_proceso: 'primary',
  resuelto: 'success',
  cerrado: 'default',
}

const COLOR_PRIORIDAD = { alta: 'error', media: 'warning', baja: 'default' }

export function ChipEstadoTicket({ estado }) {
  return <Chip size="small" variant="outlined" color={COLOR_ESTADO[estado]} label={ESTADOS_TICKET[estado] ?? estado} />
}

export function ChipPrioridad({ prioridad }) {
  return <Chip size="small" variant="outlined" color={COLOR_PRIORIDAD[prioridad]} label={PRIORIDADES[prioridad] ?? prioridad} />
}

export function ChipPaquete({ paquete }) {
  return <Chip size="small" label={PAQUETES[paquete] ?? paquete} />
}

/** Estado de un paquete contratado o de un pago. */
export function ChipEstado({ estado }) {
  const colores = { activo: 'success', aprobado: 'success', suspendido: 'error', rechazado: 'error', vencido: 'default', pendiente: 'warning' }
  const textos = { activo: 'Activo', aprobado: 'Aprobado', suspendido: 'Suspendido', rechazado: 'Rechazado', vencido: 'Vencido', pendiente: 'Pendiente' }
  return <Chip size="small" variant="outlined" color={colores[estado] ?? 'default'} label={textos[estado] ?? estado} />
}
