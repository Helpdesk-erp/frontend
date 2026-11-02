import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Chip, IconButton, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/EditOutlined'
import PersonOffIcon from '@mui/icons-material/PersonOffOutlined'
import { api } from '../../api/cliente.js'
import { NOMBRE_ROL, useSesion } from '../../auth/sesion.js'
import { ErrorCarga } from '../../componentes/Cargando.jsx'
import { ChipEstado } from '../../componentes/Chips.jsx'
import DialogoConfirmar from '../../componentes/DialogoConfirmar.jsx'
import Encabezado from '../../componentes/Encabezado.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import Vacio from '../../componentes/Vacio.jsx'
import { useAvisos } from '../../utilidades/avisos.js'
import { AREAS, fechaCalendario, TIPOS_CONTRATO } from '../../utilidades/formato.js'

const SOLO_ESCRITORIO = { display: { xs: 'none', md: 'table-cell' } }

export default function Empleados() {
  const { usuario } = useSesion()
  const navegar = useNavigate()
  const avisar = useAvisos()
  const queryClient = useQueryClient()
  const [retirando, setRetirando] = useState(null)

  const { data: empleados, isPending, error } = useQuery({ queryKey: ['empleados'], queryFn: () => api('/empleados') })

  // RF-17: estado retirado y su cuenta inactiva, en una transacción
  const retirar = useMutation({
    mutationFn: (empleado) => api(`/empleados/${empleado.id}/retiro`, { metodo: 'POST' }),
    onSuccess: (empleado) => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      avisar(`${empleado.nombres} ${empleado.apellidos} quedó retirado y su cuenta inactiva`)
      setRetirando(null)
    },
  })

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
        <Encabezado titulo="Empleados" subtitulo="Personal de Sistemas Integrados con su contrato y su cuenta de acceso." />
        <Button component={RouterLink} to="/empleados/nuevo" variant="contained" startIcon={<AddIcon />} sx={{ flexShrink: 0 }}>
          Registrar empleado
        </Button>
      </Stack>

      <Seccion titulo={empleados ? `${empleados.length} empleados` : 'Empleados'} sinRelleno>
        {isPending ? (
          <Box sx={{ p: 2.5 }}><Skeleton variant="rounded" height={200} /></Box>
        ) : error ? (
          <Box sx={{ p: 2.5 }}><ErrorCarga error={error} /></Box>
        ) : empleados.length === 0 ? (
          <Box sx={{ px: 2.5 }}><Vacio>No hay empleados registrados.</Vacio></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 2.5 }}>Empleado</TableCell>
                  <TableCell>Cargo</TableCell>
                  <TableCell sx={SOLO_ESCRITORIO}>Contrato</TableCell>
                  <TableCell sx={SOLO_ESCRITORIO}>Cuenta</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell sx={{ pr: 1.5 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {empleados.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell sx={{ pl: 2.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{e.id} · CC {e.numero_documento}</Typography>
                      <Typography variant="body2">{e.nombres} {e.apellidos}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{e.cargo}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{AREAS[e.area]}</Typography>
                    </TableCell>
                    <TableCell sx={SOLO_ESCRITORIO}>
                      <Typography variant="body2">{TIPOS_CONTRATO[e.tipo_contrato]}</Typography>
                      {e.fecha_fin && <Typography variant="caption" sx={{ color: 'text.secondary' }}>hasta {fechaCalendario(e.fecha_fin)}</Typography>}
                    </TableCell>
                    <TableCell sx={SOLO_ESCRITORIO}>
                      {e.usuario ? (
                        <>
                          <Typography variant="body2">{e.usuario.usuario}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{NOMBRE_ROL[e.usuario.rol]} · {e.usuario.estado}</Typography>
                        </>
                      ) : (
                        <Chip size="small" variant="outlined" label="Sin cuenta" />
                      )}
                    </TableCell>
                    <TableCell><ChipEstado estado={e.estado} /></TableCell>
                    <TableCell align="right" sx={{ pr: 1.5, whiteSpace: 'nowrap' }}>
                      {e.estado !== 'retirado' && (
                        <>
                          <Tooltip title="Editar datos y contrato">
                            <IconButton size="small" onClick={() => navegar(`/empleados/${e.id}`)} aria-label={`Editar a ${e.nombres}`}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {e.id !== usuario.empleado_id && (
                            <Tooltip title="Retirar">
                              <IconButton size="small" onClick={() => { retirar.reset(); setRetirando(e) }} aria-label={`Retirar a ${e.nombres}`}>
                                <PersonOffIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Seccion>

      <DialogoConfirmar
        abierto={Boolean(retirando)}
        titulo="Retirar empleado"
        textoAccion="Retirar"
        color="error"
        cargando={retirar.isPending}
        error={retirar.error?.message}
        onConfirmar={() => retirar.mutate(retirando)}
        onCerrar={() => setRetirando(null)}
      >
        {retirando && (
          <>
            <strong>{retirando.nombres} {retirando.apellidos}</strong> queda en estado retirado
            {retirando.usuario ? ' y su cuenta se cierra de inmediato' : ''}. El registro y su historial se conservan.
          </>
        )}
      </DialogoConfirmar>
    </Stack>
  )
}
