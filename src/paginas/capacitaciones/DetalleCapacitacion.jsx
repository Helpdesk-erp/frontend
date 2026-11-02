import { useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, MenuItem, Rating, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { api } from '../../api/cliente.js'
import { useSesion } from '../../auth/sesion.js'
import { CargandoDashboard, ErrorCarga } from '../../componentes/Cargando.jsx'
import { ChipEstado, ChipPaquete } from '../../componentes/Chips.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import Vacio from '../../componentes/Vacio.jsx'
import { useAvisos } from '../../utilidades/avisos.js'
import { fecha, fechaHora, hora } from '../../utilidades/formato.js'

const SOLO_ESCRITORIO = { display: { xs: 'none', md: 'table-cell' } }

/**
 * RF-40. El instructor marca quién asistió y la calificación (1 a 5) que dio
 * cada asistente. Quien no asistió no califica.
 */
function ListaAsistencia({ capacitacion, asistentes }) {
  const avisar = useAvisos()
  const queryClient = useQueryClient()
  const [filas, setFilas] = useState(() => asistentes.map((a) => ({
    usuario_id: a.usuario_id,
    estado: ['asistio', 'no_asistio'].includes(a.estado) ? a.estado : '',
    calificacion: a.calificacion ?? null,
    comentario: a.comentario ?? '',
  })))

  const cambiar = (i, cambios) => setFilas((actuales) => actuales.map((f, j) => (j === i ? { ...f, ...cambios } : f)))

  const guardar = useMutation({
    mutationFn: () => api(`/capacitaciones/${capacitacion.id}/asistencia`, {
      metodo: 'PUT',
      cuerpo: {
        asistencias: filas.map((f) => ({
          usuario_id: f.usuario_id,
          estado: f.estado,
          calificacion: f.estado === 'asistio' ? f.calificacion : null,
          comentario: f.comentario,
        })),
      },
    }),
    onSuccess: (datos) => {
      queryClient.setQueryData(['capacitacion', capacitacion.id], datos)
      queryClient.invalidateQueries({ queryKey: ['capacitaciones'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      avisar(`Asistencia guardada. La capacitación quedó ${datos.capacitacion.estado === 'finalizada' ? 'finalizada' : 'en curso'}`)
    },
  })

  const faltan = filas.filter((f) => !f.estado).length

  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 2.5 }}>Asistente</TableCell>
              <TableCell>¿Asistió?</TableCell>
              <TableCell>Calificación</TableCell>
              <TableCell sx={{ ...SOLO_ESCRITORIO, pr: 2.5 }}>Comentario</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {asistentes.map((a, i) => (
              <TableRow key={a.usuario_id}>
                <TableCell sx={{ pl: 2.5 }}>
                  <Typography variant="body2">{a.cliente}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{a.usuario}</Typography>
                </TableCell>
                <TableCell>
                  <TextField
                    select
                    size="small"
                    value={filas[i].estado}
                    onChange={(e) => cambiar(i, { estado: e.target.value, ...(e.target.value !== 'asistio' && { calificacion: null }) })}
                    sx={{ minWidth: 130 }}
                    slotProps={{ htmlInput: { 'aria-label': `Asistencia de ${a.usuario}` } }}
                  >
                    <MenuItem value="asistio">Asistió</MenuItem>
                    <MenuItem value="no_asistio">No asistió</MenuItem>
                  </TextField>
                </TableCell>
                <TableCell>
                  <Rating
                    value={filas[i].calificacion}
                    onChange={(_e, valor) => cambiar(i, { calificacion: valor })}
                    disabled={filas[i].estado !== 'asistio'}
                    aria-label={`Calificación de ${a.usuario}`}
                  />
                </TableCell>
                <TableCell sx={{ ...SOLO_ESCRITORIO, pr: 2.5 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Opcional"
                    value={filas[i].comentario}
                    onChange={(e) => cambiar(i, { comentario: e.target.value })}
                    slotProps={{ htmlInput: { maxLength: 300 } }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack spacing={1.5} sx={{ p: 2.5 }}>
        {guardar.error && <Alert severity="error">{guardar.error.message}</Alert>}
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
          {faltan > 0 && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Falta marcar {faltan} {faltan === 1 ? 'asistente' : 'asistentes'}
            </Typography>
          )}
          <Button variant="contained" disabled={faltan > 0} loading={guardar.isPending} onClick={() => guardar.mutate()}>
            Guardar asistencia
          </Button>
        </Stack>
      </Stack>
    </>
  )
}

export default function DetalleCapacitacion() {
  const { id } = useParams()
  const { usuario } = useSesion()
  const { data, isPending, error, dataUpdatedAt } = useQuery({ queryKey: ['capacitacion', id], queryFn: () => api(`/capacitaciones/${id}`) })

  if (isPending) return <CargandoDashboard />
  if (error) return <ErrorCarga error={error} />

  const { capacitacion: c, asistentes } = data
  const inscritos = asistentes.filter((a) => a.estado !== 'cancelado')
  const empezo = new Date(c.fecha_inicio).getTime() <= dataUpdatedAt
  const esInstructor = usuario.rol === 'agente_soporte' && c.instructor_id === usuario.id
  const puedeRegistrar = esInstructor && empezo && c.estado !== 'cancelada'

  return (
    <Stack spacing={3}>
      <Box>
        <Button component={RouterLink} to="/capacitaciones" startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1, ml: -1 }}>Capacitaciones</Button>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{c.id}</Typography>
          <ChipPaquete paquete={c.paquete} />
          <ChipEstado estado={c.estado} />
        </Stack>
        <Typography variant="h4" component="h1" sx={{ mt: 1 }}>{c.titulo}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {c.tipo === 'masiva' ? 'Masiva' : `Personalizada para ${c.cliente}`} · {c.modalidad === 'virtual' ? 'Virtual' : `Presencial en ${c.lugar}`} · {c.instructor}
        </Typography>
      </Box>

      <Seccion titulo="Cronograma">
        <Stack spacing={1}>
          {c.sesiones.map((s) => (
            <Typography key={s.fecha_inicio} variant="body2">
              <strong>{fecha(s.fecha_inicio)}</strong>, {hora(s.fecha_inicio)} a {hora(s.fecha_fin)} · {s.tema}
            </Typography>
          ))}
        </Stack>
      </Seccion>

      <Seccion
        titulo={`Inscritos: ${inscritos.length} de ${c.cupo_maximo}`}
        subtitulo={puedeRegistrar ? 'Marque quién asistió y la calificación que dio cada asistente' : undefined}
        sinRelleno
      >
        {esInstructor && !empezo && (
          <Box sx={{ px: 2.5, pb: 1 }}>
            <Alert severity="info">La asistencia se registra cuando empiece la capacitación, el {fechaHora(c.fecha_inicio)}.</Alert>
          </Box>
        )}
        {inscritos.length === 0 ? (
          <Box sx={{ px: 2.5 }}><Vacio>Todavía no hay inscritos.</Vacio></Box>
        ) : puedeRegistrar ? (
          <ListaAsistencia key={dataUpdatedAt} capacitacion={c} asistentes={inscritos} />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 2.5 }}>Asistente</TableCell>
                  <TableCell sx={SOLO_ESCRITORIO}>Inscrito el</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell sx={{ pr: 2.5 }}>Calificación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inscritos.map((a) => (
                  <TableRow key={a.usuario_id}>
                    <TableCell sx={{ pl: 2.5 }}>
                      <Typography variant="body2">{a.cliente}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{a.usuario}</Typography>
                    </TableCell>
                    <TableCell sx={SOLO_ESCRITORIO}>{fechaHora(a.fecha_inscripcion)}</TableCell>
                    <TableCell><ChipEstado estado={a.estado} /></TableCell>
                    <TableCell sx={{ pr: 2.5 }}>
                      {a.calificacion ? <Rating value={a.calificacion} readOnly size="small" /> : '-'}
                      {a.comentario && <Typography variant="caption" component="p" sx={{ color: 'text.secondary' }}>«{a.comentario}»</Typography>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Seccion>
    </Stack>
  )
}
