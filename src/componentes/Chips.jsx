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

/** Estado de un paquete contratado, de un pago, de un usuario, de un empleado o de una capacitación. */
export function ChipEstado({ estado }) {
  const colores = {
    activo: 'success', aprobado: 'success', suspendido: 'error', rechazado: 'error', vencido: 'default', pendiente: 'warning',
    inactivo: 'default', bloqueado: 'error', retirado: 'default',
    programada: 'info', en_curso: 'primary', finalizada: 'default', cancelada: 'error',
    inscrito: 'info', asistio: 'success', no_asistio: 'default', cancelado: 'default',
  }
  const textos = {
    activo: 'Activo', aprobado: 'Aprobado', suspendido: 'Suspendido', rechazado: 'Rechazado', vencido: 'Vencido', pendiente: 'Pendiente',
    inactivo: 'Inactivo', bloqueado: 'Bloqueado', retirado: 'Retirado',
    programada: 'Programada', en_curso: 'En curso', finalizada: 'Finalizada', cancelada: 'Cancelada',
    inscrito: 'Inscrito', asistio: 'Asistió', no_asistio: 'No asistió', cancelado: 'Cancelado',
  }
  return <Chip size="small" variant="outlined" color={colores[estado] ?? 'default'} label={textos[estado] ?? estado} />
}
