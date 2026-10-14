import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { fecha, PAQUETES } from '../utilidades/formato.js'
import { ChipEstadoTicket, ChipPrioridad } from './Chips.jsx'
import Vacio from './Vacio.jsx'

const SOLO_ESCRITORIO = { display: { xs: 'none', md: 'table-cell' } }

/**
 * @param {'cliente' | 'agente'} persona qué columna mostrar: quién reportó o quién atiende
 */
export default function TablaTickets({ tickets, persona = 'cliente', vacio = 'No hay tickets.' }) {
  if (!tickets?.length) {
    return <Box sx={{ px: 2.5 }}><Vacio>{vacio}</Vacio></Box>
  }
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ pl: 2.5 }}>Ticket</TableCell>
            <TableCell sx={SOLO_ESCRITORIO}>Paquete</TableCell>
            <TableCell>Prioridad</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell sx={SOLO_ESCRITORIO}>{persona === 'cliente' ? 'Cliente' : 'Agente'}</TableCell>
            <TableCell sx={{ ...SOLO_ESCRITORIO, pr: 2.5 }}>Creado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id} hover>
              <TableCell sx={{ pl: 2.5, maxWidth: 320 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                  {ticket.id}
                </Typography>
                <Typography variant="body2">{ticket.asunto}</Typography>
              </TableCell>
              <TableCell sx={SOLO_ESCRITORIO}>{PAQUETES[ticket.paquete]}</TableCell>
              <TableCell><ChipPrioridad prioridad={ticket.prioridad} /></TableCell>
              <TableCell><ChipEstadoTicket estado={ticket.estado} /></TableCell>
              <TableCell sx={SOLO_ESCRITORIO}>
                {persona === 'cliente' ? ticket.cliente : ticket.agente ?? 'Sin asignar'}
              </TableCell>
              <TableCell sx={{ ...SOLO_ESCRITORIO, pr: 2.5, whiteSpace: 'nowrap' }}>{fecha(ticket.fecha_creacion)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
