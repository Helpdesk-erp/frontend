import { useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Box, Button, LinearProgress, MenuItem, Skeleton, Stack, TextField } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { api } from '../../api/cliente.js'
import { tienePermiso, useSesion } from '../../auth/sesion.js'
import { ErrorCarga } from '../../componentes/Cargando.jsx'
import Encabezado from '../../componentes/Encabezado.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import TablaTickets from '../../componentes/TablaTickets.jsx'
import { ESTADOS_TICKET, PAQUETES } from '../../utilidades/formato.js'

const TEXTOS = {
  cliente: ['Mis tickets', 'Todos los casos que ha reportado, del más reciente al más antiguo.'],
  agente_soporte: ['Mis tickets', 'Los tickets que le asignaron, del más reciente al más antiguo.'],
  administrador: ['Tickets', 'Todos los tickets de la mesa de ayuda. Abra uno para asignarlo a un agente.'],
  auditor: ['Tickets', 'Todos los tickets con su historial. Esta vista es de solo lectura.'],
}

/** RF-21 para el cliente; para los demás roles, la bandeja completa con filtros. */
export default function Tickets() {
  const { usuario } = useSesion()
  const [estado, setEstado] = useState('')
  const [paquete, setPaquete] = useState('')
  const { data: tickets, isPending, isFetching, error } = useQuery({
    queryKey: ['tickets', estado, paquete],
    queryFn: () => api('/tickets', { consulta: { ...(estado && { estado }), ...(paquete && { paquete }) } }),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })

  const [titulo, subtitulo] = TEXTOS[usuario.rol]

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
        <Encabezado titulo={titulo} subtitulo={subtitulo} />
        {tienePermiso(usuario, 'tickets:crear') && (
          <Button component={RouterLink} to="/tickets/nuevo" variant="contained" startIcon={<AddIcon />} sx={{ flexShrink: 0 }}>
            Nuevo ticket
          </Button>
        )}
      </Stack>

      <Seccion
        titulo={tickets ? `${tickets.length} ${tickets.length === 1 ? 'ticket' : 'tickets'}` : 'Tickets'}
        accion={
          <Stack direction="row" spacing={1.5}>
            <TextField select size="small" label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(ESTADOS_TICKET).map(([valor, texto]) => <MenuItem key={valor} value={valor}>{texto}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Paquete" value={paquete} onChange={(e) => setPaquete(e.target.value)} sx={{ minWidth: 150, display: { xs: 'none', sm: 'flex' } }}>
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(PAQUETES).map(([valor, texto]) => <MenuItem key={valor} value={valor}>{texto}</MenuItem>)}
            </TextField>
          </Stack>
        }
        sinRelleno
      >
        <Box sx={{ minHeight: 4 }}>{isFetching && !isPending && <LinearProgress />}</Box>
        {isPending ? (
          <Box sx={{ p: 2.5 }}><Skeleton variant="rounded" height={160} /></Box>
        ) : error ? (
          <Box sx={{ p: 2.5 }}><ErrorCarga error={error} /></Box>
        ) : (
          <TablaTickets
            tickets={tickets}
            persona={usuario.rol === 'cliente' ? 'agente' : 'cliente'}
            vacio={estado || paquete ? 'No hay tickets con esos filtros.' : 'No hay tickets.'}
          />
        )}
      </Seccion>
    </Stack>
  )
}
