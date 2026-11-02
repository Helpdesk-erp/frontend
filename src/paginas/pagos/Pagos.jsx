import { useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Link, MenuItem, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { api } from '../../api/cliente.js'
import { tienePermiso, useSesion } from '../../auth/sesion.js'
import { ErrorCarga } from '../../componentes/Cargando.jsx'
import { ChipEstado } from '../../componentes/Chips.jsx'
import DialogoPago from '../../componentes/DialogoPago.jsx'
import Encabezado from '../../componentes/Encabezado.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import Vacio from '../../componentes/Vacio.jsx'
import { useAvisos } from '../../utilidades/avisos.js'
import { fechaHora, METODOS_PAGO, PAQUETES, periodo, pesos } from '../../utilidades/formato.js'

const NUMERICA = { fontVariantNumeric: 'tabular-nums' }
const SOLO_ESCRITORIO = { display: { xs: 'none', md: 'table-cell' } }

/** Historial de pagos y registro de pagos aprobados o rechazados (RF-34, RF-35). */
export default function Pagos() {
  const { usuario } = useSesion()
  const avisar = useAvisos()
  const queryClient = useQueryClient()
  const [estado, setEstado] = useState('')
  const [registrando, setRegistrando] = useState(false)
  const puedeRegistrar = tienePermiso(usuario, 'pagos:registrar')

  const { data: pagos, isPending, error } = useQuery({
    queryKey: ['pagos', estado],
    queryFn: () => api('/pagos', { consulta: estado ? { estado } : undefined }),
    placeholderData: keepPreviousData,
  })

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
        <Encabezado
          titulo="Pagos"
          subtitulo="Un pago por paquete y por mes. Un rechazo suspende el paquete hasta que se registre el pago aprobado."
        />
        {puedeRegistrar && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setRegistrando(true)} sx={{ flexShrink: 0 }}>
            Registrar pago
          </Button>
        )}
      </Stack>

      <Seccion
        titulo={pagos ? `${pagos.length} pagos` : 'Pagos'}
        accion={
          <TextField select size="small" label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="aprobado">Aprobados</MenuItem>
            <MenuItem value="rechazado">Rechazados</MenuItem>
          </TextField>
        }
        sinRelleno
      >
        {isPending ? (
          <Box sx={{ p: 2.5 }}><Skeleton variant="rounded" height={200} /></Box>
        ) : error ? (
          <Box sx={{ p: 2.5 }}><ErrorCarga error={error} /></Box>
        ) : pagos.length === 0 ? (
          <Box sx={{ px: 2.5 }}><Vacio>No hay pagos.</Vacio></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 2.5 }}>Cliente</TableCell>
                  <TableCell>Paquete y mes</TableCell>
                  <TableCell sx={SOLO_ESCRITORIO}>Método</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell sx={{ pr: 2.5 }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagos.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell sx={{ pl: 2.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{pago.id} · {fechaHora(pago.fecha)}</Typography>
                      <Typography variant="body2">
                        {tienePermiso(usuario, ['clientes:gestionar', 'clientes:ver']) ? (
                          <Link component={RouterLink} to={`/clientes/${pago.cliente_id ?? ''}`} underline="hover" color="inherit">{pago.cliente}</Link>
                        ) : pago.cliente}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{PAQUETES[pago.paquete_id]}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{periodo(pago.periodo)}</Typography>
                    </TableCell>
                    <TableCell sx={SOLO_ESCRITORIO}>{METODOS_PAGO[pago.metodo]}</TableCell>
                    <TableCell align="right" sx={NUMERICA}>{pesos(pago.valor)}</TableCell>
                    <TableCell sx={{ pr: 2.5 }}>
                      <ChipEstado estado={pago.estado} />
                      {pago.motivo_rechazo && <Typography variant="caption" component="p" sx={{ color: 'text.secondary' }}>{pago.motivo_rechazo}</Typography>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Seccion>

      {puedeRegistrar && (
        <DialogoPago
          abierto={registrando}
          onCerrar={() => setRegistrando(false)}
          onRegistrado={(r) => {
            queryClient.invalidateQueries({ queryKey: ['pagos'] })
            queryClient.invalidateQueries({ queryKey: ['cliente', r.pago.cliente_id] })
            queryClient.invalidateQueries({ queryKey: ['clientes'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            avisar(r.pago.estado === 'rechazado'
              ? `Pago ${r.pago.id} rechazado. El paquete quedó ${r.estado_paquete}`
              : `Pago ${r.pago.id} aprobado. El paquete está ${r.estado_paquete}`, r.pago.estado === 'rechazado' ? 'warning' : 'success')
            setRegistrando(false)
          }}
        />
      )}
    </Stack>
  )
}
