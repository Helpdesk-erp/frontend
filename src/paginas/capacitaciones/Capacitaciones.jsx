import { useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardActions, CardContent, Chip, Divider, Grid, Link, Skeleton, Stack, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { api } from '../../api/cliente.js'
import { tienePermiso, useSesion } from '../../auth/sesion.js'
import { ErrorCarga } from '../../componentes/Cargando.jsx'
import { ChipEstado, ChipPaquete } from '../../componentes/Chips.jsx'
import DialogoConfirmar from '../../componentes/DialogoConfirmar.jsx'
import Encabezado from '../../componentes/Encabezado.jsx'
import Vacio from '../../componentes/Vacio.jsx'
import { useAvisos } from '../../utilidades/avisos.js'
import { dia, fecha, hora, mes } from '../../utilidades/formato.js'

const TEXTOS = {
  administrador: 'Capacitaciones masivas y personalizadas con su cronograma.',
  agente_soporte: 'Las capacitaciones que usted dicta. Ábralas para registrar la asistencia.',
  cliente: 'Capacitaciones para los paquetes que tiene activos. Inscríbase antes de que empiecen.',
}

function Cronograma({ sesiones }) {
  return (
    <Stack spacing={0.5} sx={{ mt: 1.5 }}>
      {sesiones.map((s) => (
        <Typography key={s.fecha_inicio} variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          <strong>{fecha(s.fecha_inicio)}</strong>, {hora(s.fecha_inicio)} a {hora(s.fecha_fin)} · {s.tema}
        </Typography>
      ))}
    </Stack>
  )
}

function TarjetaCapacitacion({ capacitacion: c, acciones }) {
  const { usuario } = useSesion()
  const inscrito = c.mi_inscripcion && c.mi_inscripcion !== 'cancelado'
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 52, textAlign: 'center', borderRadius: 2, py: 0.5, bgcolor: 'action.hover' }}>
            <Typography variant="h6" component="p" sx={{ lineHeight: 1.2 }}>{dia(c.fecha_inicio)}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>{mes(c.fecha_inicio)}</Typography>
          </Box>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="subtitle2" component="h2">{c.titulo}</Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              <ChipPaquete paquete={c.paquete} />
              <ChipEstado estado={c.estado} />
              {usuario.rol === 'cliente' && c.mi_inscripcion && <ChipEstado estado={c.mi_inscripcion} />}
            </Stack>
          </Box>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1.5 }}>{c.descripcion}</Typography>
        <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mt: 1 }}>
          {c.tipo === 'masiva' ? 'Masiva' : `Personalizada para ${c.cliente}`} · {c.modalidad === 'virtual' ? 'Virtual' : `Presencial en ${c.lugar}`}
          {' · '}{c.instructor} · {c.inscritos} de {c.cupo_maximo} cupos
        </Typography>
        {c.modalidad === 'virtual' && (usuario.rol !== 'cliente' || inscrito) && (
          <Typography variant="caption" component="p" sx={{ mt: 0.5 }}>
            <Link href={c.enlace} target="_blank" rel="noopener noreferrer">{c.enlace}</Link>
          </Typography>
        )}
        <Cronograma sesiones={c.sesiones} />
      </CardContent>
      {acciones && (
        <>
          <Divider />
          <CardActions sx={{ px: 2, justifyContent: 'flex-end' }}>{acciones}</CardActions>
        </>
      )}
    </Card>
  )
}

export default function Capacitaciones() {
  const { usuario } = useSesion()
  const avisar = useAvisos()
  const queryClient = useQueryClient()
  const [cancelando, setCancelando] = useState(null)
  const rol = usuario.rol

  const { data: capacitaciones, isPending, error, dataUpdatedAt } = useQuery({ queryKey: ['capacitaciones'], queryFn: () => api('/capacitaciones') })

  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ['capacitaciones'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  // RF-39
  const inscripcion = useMutation({
    mutationFn: ({ id, inscribir }) => api(`/capacitaciones/${id}/inscripcion`, { metodo: inscribir ? 'POST' : 'DELETE' }),
    onSuccess: (_r, { inscribir }) => {
      refrescar()
      avisar(inscribir ? 'Quedó inscrito. Le esperamos en la primera sesión' : 'Inscripción cancelada')
    },
    onError: (e) => avisar(e.message, 'error'),
  })

  const cancelar = useMutation({
    mutationFn: (id) => api(`/capacitaciones/${id}/cancelacion`, { metodo: 'POST' }),
    onSuccess: () => {
      refrescar()
      avisar('Capacitación cancelada')
      setCancelando(null)
    },
  })

  // "Ahora" es el momento en que llegaron los datos, así el render no depende del reloj
  const ahora = dataUpdatedAt
  const acciones = (c) => {
    const futura = new Date(c.fecha_inicio).getTime() > ahora
    if (rol === 'cliente') {
      if (c.mi_inscripcion === 'inscrito' && futura) {
        return <Button color="error" loading={inscripcion.isPending && inscripcion.variables?.id === c.id} onClick={() => inscripcion.mutate({ id: c.id, inscribir: false })}>Cancelar inscripción</Button>
      }
      if ((!c.mi_inscripcion || c.mi_inscripcion === 'cancelado') && c.estado === 'programada' && futura) {
        const lleno = c.inscritos >= c.cupo_maximo
        return (
          <Button variant="contained" disabled={lleno} loading={inscripcion.isPending && inscripcion.variables?.id === c.id} onClick={() => inscripcion.mutate({ id: c.id, inscribir: true })}>
            {lleno ? 'Sin cupos' : 'Inscribirme'}
          </Button>
        )
      }
      return null
    }
    return (
      <>
        {tienePermiso(usuario, 'capacitaciones:gestionar') && ['programada', 'en_curso'].includes(c.estado) && (
          <Button color="error" onClick={() => { cancelar.reset(); setCancelando(c) }}>Cancelar</Button>
        )}
        <Button component={RouterLink} to={`/capacitaciones/${c.id}`}>
          {rol === 'agente_soporte' && !futura && c.estado !== 'cancelada' ? 'Registrar asistencia' : 'Ver inscritos'}
        </Button>
      </>
    )
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
        <Encabezado titulo="Capacitaciones" subtitulo={TEXTOS[rol]} />
        {tienePermiso(usuario, 'capacitaciones:gestionar') && (
          <Button component={RouterLink} to="/capacitaciones/nueva" variant="contained" startIcon={<AddIcon />} sx={{ flexShrink: 0 }}>
            Programar capacitación
          </Button>
        )}
      </Stack>

      {isPending ? (
        <Grid container spacing={2}>
          {[1, 2, 3].map((n) => <Grid key={n} size={{ xs: 12, md: 6, lg: 4 }}><Skeleton variant="rounded" height={240} /></Grid>)}
        </Grid>
      ) : error ? (
        <ErrorCarga error={error} />
      ) : capacitaciones.length === 0 ? (
        <Vacio>{rol === 'cliente' ? 'No hay capacitaciones para sus paquetes activos.' : 'No hay capacitaciones.'}</Vacio>
      ) : (
        <Grid container spacing={2}>
          {capacitaciones.map((c) => (
            <Grid key={c.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <TarjetaCapacitacion capacitacion={c} acciones={acciones(c)} />
            </Grid>
          ))}
        </Grid>
      )}

      {rol === 'cliente' && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip size="small" label="Nota" />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Las capacitaciones masivas solo se ofrecen para los paquetes con el pago al día.
          </Typography>
        </Stack>
      )}

      <DialogoConfirmar
        abierto={Boolean(cancelando)}
        titulo="Cancelar capacitación"
        textoAccion="Cancelar capacitación"
        color="error"
        cargando={cancelar.isPending}
        error={cancelar.error?.message}
        onConfirmar={() => cancelar.mutate(cancelando.id)}
        onCerrar={() => setCancelando(null)}
      >
        «{cancelando?.titulo}» quedará cancelada. Los {cancelando?.inscritos} inscritos la verán como cancelada.
      </DialogoConfirmar>
    </Stack>
  )
}
