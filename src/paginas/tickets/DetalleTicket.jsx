import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, Link, MenuItem,
  Stack, TextField, Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import EditIcon from '@mui/icons-material/EditOutlined'
import { api } from '../../api/cliente.js'
import { NOMBRE_ROL, useSesion } from '../../auth/sesion.js'
import CampoTexto from '../../componentes/CampoTexto.jsx'
import { CargandoDashboard, ErrorCarga } from '../../componentes/Cargando.jsx'
import { ChipEstadoTicket, ChipPaquete, ChipPrioridad } from '../../componentes/Chips.jsx'
import DialogoConfirmar from '../../componentes/DialogoConfirmar.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import { useAvisos } from '../../utilidades/avisos.js'
import { fechaHora, PRIORIDADES, TIPOS_TICKET } from '../../utilidades/formato.js'
import { aplicarErrores } from '../../utilidades/formularios.js'

/** Guarda en caché el ticket que devuelve el backend y refresca las listas. */
function useGuardarTicket(id) {
  const queryClient = useQueryClient()
  return (ticket) => {
    queryClient.setQueryData(['ticket', id], ticket)
    queryClient.invalidateQueries({ queryKey: ['tickets'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

function Dato({ etiqueta, children }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{etiqueta}</Typography>
      <Typography variant="body2" component="div">{children ?? '-'}</Typography>
    </Box>
  )
}

/** RF-22: el cliente corrige asunto, descripción o prioridad mientras el ticket sigue sin atender. */
function DialogoEditar({ ticket, abierto, onCerrar }) {
  const guardar = useGuardarTicket(ticket.id)
  const avisar = useAvisos()
  const [errorServidor, setErrorServidor] = useState(null)
  const { control, handleSubmit, setError, formState: { isSubmitting } } = useForm({
    values: { asunto: ticket.asunto, descripcion: ticket.descripcion, prioridad: ticket.prioridad },
  })

  const enviar = async (datos) => {
    setErrorServidor(null)
    try {
      guardar(await api(`/tickets/${ticket.id}`, { metodo: 'PUT', cuerpo: datos }))
      avisar('Ticket actualizado')
      onCerrar()
    } catch (e) {
      setErrorServidor(aplicarErrores(e, setError))
    }
  }

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit(enviar)}>
        <DialogTitle>Editar ticket</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errorServidor && <Alert severity="error">{errorServidor}</Alert>}
            <CampoTexto control={control} name="asunto" label="Asunto" rules={{ required: 'Escriba el asunto', maxLength: { value: 150, message: 'Máximo 150 caracteres' } }} />
            <CampoTexto control={control} name="descripcion" label="Descripción" multiline minRows={4} rules={{ required: 'Describa el problema' }} />
            <CampoTexto control={control} name="prioridad" label="Prioridad" select>
              {Object.entries(PRIORIDADES).map(([valor, texto]) => <MenuItem key={valor} value={valor}>{texto}</MenuItem>)}
            </CampoTexto>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>Guardar</Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

/** RF-24: el administrador asigna o reasigna el ticket a un agente activo. */
function DialogoAsignar({ ticket, abierto, onCerrar }) {
  const guardar = useGuardarTicket(ticket.id)
  const avisar = useAvisos()
  const [errorServidor, setErrorServidor] = useState(null)
  const { data: agentes = [] } = useQuery({ queryKey: ['agentes'], queryFn: () => api('/usuarios/agentes'), enabled: abierto })
  const { control, handleSubmit, setError, formState: { isSubmitting } } = useForm({ defaultValues: { agente_id: '', comentario: '' } })

  const enviar = async (datos) => {
    setErrorServidor(null)
    try {
      const actualizado = await api(`/tickets/${ticket.id}/asignacion`, { metodo: 'POST', cuerpo: datos })
      guardar(actualizado)
      avisar(`Ticket asignado a ${actualizado.agente.nombre}`)
      onCerrar()
    } catch (e) {
      setErrorServidor(aplicarErrores(e, setError))
    }
  }

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="xs" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit(enviar)}>
        <DialogTitle>{ticket.agente ? 'Reasignar ticket' : 'Asignar ticket'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errorServidor && <Alert severity="error">{errorServidor}</Alert>}
            <CampoTexto control={control} name="agente_id" label="Agente de soporte" select rules={{ required: 'Seleccione el agente' }}>
              {agentes.map((a) => (
                <MenuItem key={a.agente_id} value={a.agente_id} disabled={a.agente_id === ticket.agente_id}>
                  {a.nombre} · {a.abiertos} {a.abiertos === 1 ? 'abierto' : 'abiertos'}
                </MenuItem>
              ))}
            </CampoTexto>
            <CampoTexto
              control={control}
              name="comentario"
              label="Comentario (opcional)"
              helperText="Queda en el historial. Si lo deja vacío dice «Asignado a …»"
              rules={{ maxLength: { value: 300, message: 'Máximo 300 caracteres' } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>Asignar</Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

/** RF-28: el cliente confirma la solución y el ticket queda cerrado. */
function DialogoCerrar({ ticket, abierto, onCerrar }) {
  const guardar = useGuardarTicket(ticket.id)
  const avisar = useAvisos()
  const [comentario, setComentario] = useState('')
  const cerrar = useMutation({
    mutationFn: () => api(`/tickets/${ticket.id}/cierre`, { metodo: 'POST', cuerpo: { comentario } }),
    onSuccess: (actualizado) => {
      guardar(actualizado)
      avisar('Gracias. El ticket quedó cerrado')
      onCerrar()
    },
  })
  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="sm" fullWidth>
      <DialogTitle>Confirmar la solución</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Al confirmar, el ticket se cierra. Si el problema vuelve, puede abrir un ticket nuevo.
        </Typography>
        <TextField
          fullWidth
          label="Comentario para soporte (opcional)"
          placeholder="Por ejemplo: ya funciona, gracias"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 300 } }}
        />
        {cerrar.error && <Alert severity="error" sx={{ mt: 2 }}>{cerrar.error.message}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar}>Cancelar</Button>
        <Button variant="contained" color="success" loading={cerrar.isPending} onClick={() => cerrar.mutate()}>Confirmar y cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

/**
 * RF-25 y RF-26: el agente toma el ticket, escribe la solución y lo marca
 * como resuelto. La solución es obligatoria para resolverlo.
 */
function PanelAgente({ ticket }) {
  const guardar = useGuardarTicket(ticket.id)
  const avisar = useAvisos()
  const navegar = useNavigate()
  const [errorServidor, setErrorServidor] = useState(null)
  const { control, handleSubmit, setError, getValues, trigger } = useForm({
    values: { solucion: ticket.solucion ?? '', comentario: '' },
  })
  const [accion, setAccion] = useState(null)

  const ejecutar = async (nombre, peticion, mensaje) => {
    setErrorServidor(null)
    setAccion(nombre)
    try {
      guardar(await peticion())
      avisar(mensaje)
    } catch (e) {
      setErrorServidor(aplicarErrores(e, setError))
    } finally {
      setAccion(null)
    }
  }

  const empezar = () => ejecutar('empezar', () => api(`/tickets/${ticket.id}/estado`, {
    metodo: 'POST', cuerpo: { estado: 'en_proceso', comentario: getValues('comentario') },
  }), 'El ticket quedó en proceso')

  const guardarSolucion = async () => {
    if (!(await trigger('solucion'))) return
    ejecutar('solucion', () => api(`/tickets/${ticket.id}/solucion`, {
      metodo: 'PUT', cuerpo: { solucion: getValues('solucion') },
    }), 'Solución guardada')
  }

  const resolver = handleSubmit(({ solucion, comentario }) => ejecutar('resolver', () => api(`/tickets/${ticket.id}/estado`, {
    metodo: 'POST', cuerpo: { estado: 'resuelto', solucion, comentario },
  }), 'Ticket resuelto. El cliente debe confirmar la solución'))

  if (ticket.estado === 'cerrado' || (ticket.estado === 'resuelto' && ticket.articulo_id)) {
    return null
  }

  return (
    <Seccion titulo="Atender el ticket" subtitulo={
      ticket.estado === 'resuelto' ? 'Esperando la confirmación del cliente' : 'Escriba qué hizo para resolverlo; el cliente lo verá'
    }>
      <Stack spacing={2} sx={{ pt: 1 }}>
        {errorServidor && <Alert severity="error">{errorServidor}</Alert>}
        <CampoTexto
          control={control}
          name="solucion"
          label="Solución"
          multiline
          minRows={4}
          rules={{ required: 'Escriba la solución', maxLength: { value: 3000, message: 'Máximo 3000 caracteres' } }}
        />
        {ticket.estado !== 'resuelto' && (
          <CampoTexto
            control={control}
            name="comentario"
            label="Comentario para el historial (opcional)"
            rules={{ maxLength: { value: 300, message: 'Máximo 300 caracteres' } }}
          />
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
          {ticket.estado === 'asignado' && (
            <Button variant="outlined" onClick={empezar} loading={accion === 'empezar'} disabled={Boolean(accion)}>
              Empezar a atender
            </Button>
          )}
          <Button variant="outlined" onClick={guardarSolucion} loading={accion === 'solucion'} disabled={Boolean(accion)}>
            Guardar solución
          </Button>
          {ticket.estado !== 'resuelto' ? (
            <Button variant="contained" color="success" onClick={resolver} loading={accion === 'resolver'} disabled={Boolean(accion)}>
              Marcar como resuelto
            </Button>
          ) : (
            <Button variant="contained" onClick={() => navegar(`/conocimiento/nuevo/${ticket.id}`)}>
              Documentar en la base de conocimiento
            </Button>
          )}
        </Stack>
      </Stack>
    </Seccion>
  )
}

export default function DetalleTicket() {
  const { id } = useParams()
  const { usuario } = useSesion()
  const navegar = useNavigate()
  const avisar = useAvisos()
  const queryClient = useQueryClient()
  const [dialogo, setDialogo] = useState(null)

  const { data: ticket, isPending, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => api(`/tickets/${id}`),
    refetchInterval: 30_000,
  })

  const eliminar = useMutation({
    mutationFn: () => api(`/tickets/${id}`, { metodo: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      avisar(`Ticket ${id} eliminado`)
      navegar('/tickets', { replace: true })
    },
  })

  if (isPending) return <CargandoDashboard />
  if (error) return <ErrorCarga error={error} />

  const rol = usuario.rol
  const etiquetas = Object.fromEntries((ticket.campos ?? []).map((c) => [c.campo, c.etiqueta]))
  const abierto = ['sin_atender', 'asignado', 'en_proceso'].includes(ticket.estado)
  const cerrarDialogo = () => setDialogo(null)

  return (
    <Stack spacing={3}>
      <Box>
        <Button component={RouterLink} to="/tickets" startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1, ml: -1 }}>
          Tickets
        </Button>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{ticket.id}</Typography>
          <ChipEstadoTicket estado={ticket.estado} />
          <ChipPrioridad prioridad={ticket.prioridad} />
          <ChipPaquete paquete={ticket.paquete} />
        </Stack>
        <Typography variant="h4" component="h1" sx={{ mt: 1 }}>{ticket.asunto}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {TIPOS_TICKET[ticket.tipo]} · reportado el {fechaHora(ticket.fecha_creacion)}
          {ticket.fecha_actualizacion && ` · actualizado el ${fechaHora(ticket.fecha_actualizacion)}`}
        </Typography>
      </Box>

      {/* Acciones según el rol y el estado */}
      {rol === 'cliente' && ticket.estado === 'sin_atender' && (
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setDialogo('editar')}>Editar</Button>
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDialogo('eliminar')}>Eliminar</Button>
        </Stack>
      )}
      {rol === 'cliente' && ticket.estado === 'resuelto' && (
        <Alert
          severity="success"
          action={<Button color="inherit" size="small" onClick={() => setDialogo('cerrar')}>Confirmar y cerrar</Button>}
        >
          Soporte marcó este ticket como resuelto. Revise la solución y confírmela para cerrarlo.
        </Alert>
      )}
      {rol === 'administrador' && abierto && (
        <Box>
          <Button variant="contained" onClick={() => setDialogo('asignar')}>
            {ticket.agente ? 'Reasignar a otro agente' : 'Asignar a un agente'}
          </Button>
        </Box>
      )}
      {rol === 'agente_soporte' && ticket.estado === 'cerrado' && !ticket.articulo_id && (
        <Alert
          severity="info"
          action={<Button color="inherit" size="small" component={RouterLink} to={`/conocimiento/nuevo/${ticket.id}`}>Documentar</Button>}
        >
          El cliente confirmó la solución. Documéntela en la base de conocimiento para los próximos casos.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <Seccion titulo="Descripción">
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{ticket.descripcion}</Typography>
            </Seccion>

            <Seccion titulo="Datos técnicos" subtitulo={ticket.paquete_nombre}>
              {Object.keys(ticket.detalle ?? {}).length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Sin datos técnicos.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {Object.entries(ticket.detalle).map(([campo, valor]) => (
                    <Grid key={campo} size={{ xs: 12, sm: String(valor).length > 40 ? 12 : 6 }}>
                      <Dato etiqueta={etiquetas[campo] ?? campo}>
                        <Box component="span" sx={{ wordBreak: 'break-word' }}>{String(valor)}</Box>
                      </Dato>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Seccion>

            {ticket.solucion && (rol !== 'agente_soporte' || ticket.estado === 'cerrado' || ticket.articulo_id) && (
              <Seccion titulo="Solución" subtitulo={ticket.agente ? `Escrita por ${ticket.agente.nombre}` : undefined}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{ticket.solucion}</Typography>
              </Seccion>
            )}

            {rol === 'agente_soporte' && <PanelAgente ticket={ticket} />}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  <Dato etiqueta="Cliente">
                    {ticket.cliente && (rol === 'administrador' || rol === 'auditor') ? (
                      <Link component={RouterLink} to={`/clientes/${ticket.cliente.id}`}>{ticket.cliente.nombre}</Link>
                    ) : ticket.cliente?.nombre}
                  </Dato>
                  {rol !== 'cliente' && ticket.cliente?.telefono && <Dato etiqueta="Teléfono del cliente">{ticket.cliente.telefono}</Dato>}
                  <Dato etiqueta="Reportado por">{ticket.reportado_por_usuario}</Dato>
                  <Dato etiqueta="Agente">{ticket.agente?.nombre ?? 'Sin asignar'}</Dato>
                  {ticket.articulo_id && <Dato etiqueta="Base de conocimiento">Documentado en {ticket.articulo_id}</Dato>}
                </Stack>
              </CardContent>
            </Card>

            <Seccion titulo="Historial" subtitulo="Cada cambio de estado, con fecha y usuario">
              <Stack divider={<Divider flexItem />} spacing={1.5}>
                {[...ticket.historial].reverse().map((evento, i) => (
                  <Box key={`${evento.fecha}-${i}`}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <ChipEstadoTicket estado={evento.estado} />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{fechaHora(evento.fecha)}</Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{evento.nombre ?? evento.usuario_id}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{NOMBRE_ROL[evento.rol] ?? ''}</Typography>
                    {evento.comentario && <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>«{evento.comentario}»</Typography>}
                  </Box>
                ))}
              </Stack>
            </Seccion>
          </Stack>
        </Grid>
      </Grid>

      <DialogoEditar ticket={ticket} abierto={dialogo === 'editar'} onCerrar={cerrarDialogo} />
      <DialogoAsignar key={ticket.agente_id ?? 'sin-agente'} ticket={ticket} abierto={dialogo === 'asignar'} onCerrar={cerrarDialogo} />
      <DialogoCerrar ticket={ticket} abierto={dialogo === 'cerrar'} onCerrar={cerrarDialogo} />
      <DialogoConfirmar
        abierto={dialogo === 'eliminar'}
        titulo="¿Eliminar el ticket?"
        textoAccion="Eliminar"
        color="error"
        cargando={eliminar.isPending}
        error={eliminar.error?.message}
        onConfirmar={() => eliminar.mutate()}
        onCerrar={cerrarDialogo}
      >
        El ticket {ticket.id} se borra por completo. Solo se puede hacer mientras no tenga un agente asignado.
      </DialogoConfirmar>
    </Stack>
  )
}
