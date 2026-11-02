import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, ListItemIcon,
  Menu, MenuItem, Skeleton, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import BlockIcon from '@mui/icons-material/BlockOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined'
import EditIcon from '@mui/icons-material/EditOutlined'
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailReadOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PauseCircleIcon from '@mui/icons-material/PauseCircleOutlined'
import SearchIcon from '@mui/icons-material/Search'
import { api } from '../../api/cliente.js'
import { NOMBRE_ROL, useSesion } from '../../auth/sesion.js'
import CampoTexto from '../../componentes/CampoTexto.jsx'
import { ErrorCarga } from '../../componentes/Cargando.jsx'
import { ChipEstado } from '../../componentes/Chips.jsx'
import DialogoClave from '../../componentes/DialogoClave.jsx'
import DialogoConfirmar from '../../componentes/DialogoConfirmar.jsx'
import Encabezado from '../../componentes/Encabezado.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import Vacio from '../../componentes/Vacio.jsx'
import { useAvisos } from '../../utilidades/avisos.js'
import { fechaHora, ROL_POR_AREA } from '../../utilidades/formato.js'
import { aplicarErrores, CORREO, MENSAJE_USUARIO, USUARIO } from '../../utilidades/formularios.js'

const SOLO_ESCRITORIO = { display: { xs: 'none', md: 'table-cell' } }
const ROLES_INTERNOS = ['administrador', 'agente_soporte', 'auditor']

/** "Diego Armando" + "Pacheco Sanjuán" -> "diego.pacheco" */
function sugerirUsuario(empleado) {
  const limpiar = (texto) => texto.split(' ')[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  return `${limpiar(empleado.nombres)}.${limpiar(empleado.apellidos)}`
}

/** RF-06: cuenta para un empleado activo que todavía no tiene usuario. */
function DialogoNuevaCuenta({ abierto, onCerrar, onCreada }) {
  const [errorServidor, setErrorServidor] = useState(null)
  const { data: empleados = [] } = useQuery({ queryKey: ['empleados'], queryFn: () => api('/empleados'), enabled: abierto })
  const sinCuenta = empleados.filter((e) => e.estado === 'activo' && !e.usuario)
  const { control, handleSubmit, setValue, setError, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { empleado_id: '', usuario: '', correo: '', rol: '' },
  })
  const empleadoId = useWatch({ control, name: 'empleado_id' })

  // Al escoger el empleado se sugieren el usuario, el correo corporativo y el rol de su área
  const escogerEmpleado = (id) => {
    const empleado = sinCuenta.find((e) => e.id === id)
    if (!empleado) return
    const usuario = sugerirUsuario(empleado)
    setValue('usuario', usuario, { shouldValidate: true })
    setValue('correo', `${usuario}@sistemasintegrados.test`, { shouldValidate: true })
    setValue('rol', ROL_POR_AREA[empleado.area] ?? '', { shouldValidate: true })
  }

  const cerrar = () => {
    reset()
    setErrorServidor(null)
    onCerrar()
  }

  const enviar = async (datos) => {
    setErrorServidor(null)
    try {
      const cuenta = await api('/usuarios', { metodo: 'POST', cuerpo: { ...datos, correo: datos.correo.trim().toLowerCase() } })
      reset()
      onCreada(cuenta)
    } catch (e) {
      setErrorServidor(aplicarErrores(e, setError))
    }
  }

  return (
    <Dialog open={abierto} onClose={cerrar} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit(enviar)}>
        <DialogTitle>Nueva cuenta de empleado</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errorServidor && <Alert severity="error">{errorServidor}</Alert>}
            {abierto && sinCuenta.length === 0 && (
              <Alert severity="info">Todos los empleados activos ya tienen cuenta. Registre primero el empleado en Empleados.</Alert>
            )}
            <CampoTexto
              control={control}
              name="empleado_id"
              label="Empleado"
              select
              rules={{ required: 'Seleccione el empleado' }}
              onChange={(e) => {
                setValue('empleado_id', e.target.value, { shouldValidate: true })
                escogerEmpleado(e.target.value)
              }}
            >
              {sinCuenta.map((e) => (
                <MenuItem key={e.id} value={e.id}>{e.nombres} {e.apellidos} · {e.cargo}</MenuItem>
              ))}
            </CampoTexto>
            <CampoTexto
              control={control}
              name="usuario"
              label="Nombre de usuario"
              disabled={!empleadoId}
              rules={{ required: 'Escriba el nombre de usuario', pattern: { value: USUARIO, message: MENSAJE_USUARIO } }}
            />
            <CampoTexto
              control={control}
              name="correo"
              label="Correo"
              type="email"
              disabled={!empleadoId}
              helperText="Allí se envían el usuario y la contraseña temporal"
              rules={{ required: 'Escriba el correo', pattern: { value: CORREO, message: 'Correo no válido' } }}
            />
            <CampoTexto control={control} name="rol" label="Rol" select disabled={!empleadoId} rules={{ required: 'Seleccione el rol' }}>
              {ROLES_INTERNOS.map((r) => <MenuItem key={r} value={r}>{NOMBRE_ROL[r]}</MenuItem>)}
            </CampoTexto>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={cerrar}>Cancelar</Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>Crear cuenta</Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

/** RF-07: correo y rol. Una cuenta de cliente solo puede tener el rol cliente. */
function DialogoEditar({ cuenta, onCerrar, onGuardada }) {
  const [errorServidor, setErrorServidor] = useState(null)
  const { control, handleSubmit, setError, formState: { isSubmitting } } = useForm({
    values: { correo: cuenta?.correo ?? '', rol: cuenta?.rol ?? '' },
  })
  const roles = cuenta?.vinculo === 'cliente' ? ['cliente'] : ROLES_INTERNOS

  const enviar = async (datos) => {
    setErrorServidor(null)
    try {
      onGuardada(await api(`/usuarios/${cuenta.id}`, { metodo: 'PUT', cuerpo: { ...datos, correo: datos.correo.trim().toLowerCase() } }),
        datos.rol !== cuenta.rol)
    } catch (e) {
      setErrorServidor(aplicarErrores(e, setError))
    }
  }

  return (
    <Dialog open={Boolean(cuenta)} onClose={onCerrar} maxWidth="xs" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit(enviar)}>
        <DialogTitle>Editar {cuenta?.usuario}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errorServidor && <Alert severity="error">{errorServidor}</Alert>}
            <CampoTexto control={control} name="correo" label="Correo" type="email" rules={{ required: 'Escriba el correo', pattern: { value: CORREO, message: 'Correo no válido' } }} />
            <CampoTexto control={control} name="rol" label="Rol" select helperText="Si cambia el rol, se cierran las sesiones abiertas de la cuenta">
              {roles.map((r) => <MenuItem key={r} value={r}>{NOMBRE_ROL[r]}</MenuItem>)}
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

const CAMBIOS_ESTADO = {
  bloqueado: { titulo: 'Bloquear la cuenta', accion: 'Bloquear', color: 'error', texto: 'no podrá iniciar sesión hasta que la active de nuevo. Sus tickets y su historial se conservan.' },
  inactivo: { titulo: 'Inactivar la cuenta', accion: 'Inactivar', color: 'warning', texto: 'queda inactiva y no puede iniciar sesión. Sus tickets y su historial se conservan.' },
  activo: { titulo: 'Activar la cuenta', accion: 'Activar', color: 'success', texto: 'podrá volver a iniciar sesión.' },
}

export default function Usuarios() {
  const { usuario: yo } = useSesion()
  const avisar = useAvisos()
  const queryClient = useQueryClient()
  const [vinculo, setVinculo] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [menu, setMenu] = useState(null)
  const [nueva, setNueva] = useState(false)
  const [creada, setCreada] = useState(null)
  const [editando, setEditando] = useState(null)
  const [cambioEstado, setCambioEstado] = useState(null)

  const { data: cuentas, isPending, error } = useQuery({ queryKey: ['usuarios'], queryFn: () => api('/usuarios') })

  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    queryClient.invalidateQueries({ queryKey: ['empleados'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'administrador'] })
  }

  const estado = useMutation({
    mutationFn: ({ cuenta, nuevo }) => api(`/usuarios/${cuenta.id}/estado`, { metodo: 'PATCH', cuerpo: { estado: nuevo } }),
    onSuccess: (cuenta) => {
      refrescar()
      avisar(`La cuenta ${cuenta.usuario} quedó ${cuenta.estado}`)
      setCambioEstado(null)
    },
  })

  const credenciales = useMutation({
    mutationFn: (cuenta) => api(`/usuarios/${cuenta.id}/credenciales-enviadas`, { metodo: 'PATCH' }),
    onSuccess: (cuenta) => {
      refrescar()
      avisar(`Credenciales de ${cuenta.usuario} marcadas como enviadas`)
    },
    onError: (e) => avisar(e.message, 'error'),
  })

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (cuentas ?? []).filter((c) =>
      (vinculo === 'todos' || c.vinculo === vinculo)
      && (!texto || [c.usuario, c.correo, c.nombre, c.vinculo_id].some((v) => v?.toLowerCase().includes(texto))))
  }, [cuentas, vinculo, busqueda])

  const pendientes = (cuentas ?? []).filter((c) => !c.credenciales_enviadas).length
  const cuentaMenu = menu?.cuenta

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
        <Encabezado titulo="Usuarios" subtitulo="Cuentas de acceso de empleados y clientes. La contraseña nunca sale de la base." />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNueva(true)} sx={{ flexShrink: 0 }}>
          Cuenta de empleado
        </Button>
      </Stack>

      {pendientes > 0 && (
        <Alert severity="info">
          {pendientes === 1 ? 'Hay 1 cuenta' : `Hay ${pendientes} cuentas`} con las credenciales sin enviar. Después de enviarlas al correo, márquelas como enviadas.
        </Alert>
      )}

      <Seccion
        titulo="Cuentas"
        accion={
          <TextField
            size="small"
            placeholder="Buscar"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
            sx={{ maxWidth: 220 }}
          />
        }
        sinRelleno
      >
        <Tabs value={vinculo} onChange={(_e, v) => setVinculo(v)} sx={{ px: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Tab value="todos" label="Todas" />
          <Tab value="empleado" label="Empleados" />
          <Tab value="cliente" label="Clientes" />
        </Tabs>
        {isPending ? (
          <Box sx={{ p: 2.5 }}><Skeleton variant="rounded" height={200} /></Box>
        ) : error ? (
          <Box sx={{ p: 2.5 }}><ErrorCarga error={error} /></Box>
        ) : filtradas.length === 0 ? (
          <Box sx={{ px: 2.5 }}><Vacio>No hay cuentas que coincidan.</Vacio></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 2.5 }}>Usuario</TableCell>
                  <TableCell sx={SOLO_ESCRITORIO}>Pertenece a</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell sx={SOLO_ESCRITORIO}>Credenciales</TableCell>
                  <TableCell sx={SOLO_ESCRITORIO}>Último acceso</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell sx={{ pr: 1.5 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {filtradas.map((cuenta) => (
                  <TableRow key={cuenta.id}>
                    <TableCell sx={{ pl: 2.5 }}>
                      <Typography variant="body2">{cuenta.usuario}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{cuenta.correo}</Typography>
                    </TableCell>
                    <TableCell sx={SOLO_ESCRITORIO}>
                      <Typography variant="body2">{cuenta.nombre}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {cuenta.vinculo === 'empleado' ? 'Empleado' : 'Cliente'} {cuenta.vinculo_id}
                        {cuenta.estado_vinculo && cuenta.estado_vinculo !== 'activo' && ` · ${cuenta.estado_vinculo}`}
                      </Typography>
                    </TableCell>
                    <TableCell>{NOMBRE_ROL[cuenta.rol] ?? cuenta.rol}</TableCell>
                    <TableCell sx={SOLO_ESCRITORIO}>
                      {cuenta.credenciales_enviadas
                        ? <Chip size="small" variant="outlined" color="success" label="Enviadas" />
                        : <Chip size="small" variant="outlined" color="warning" label="Sin enviar" />}
                    </TableCell>
                    <TableCell sx={{ ...SOLO_ESCRITORIO, whiteSpace: 'nowrap' }}>{fechaHora(cuenta.ultimo_acceso)}</TableCell>
                    <TableCell><ChipEstado estado={cuenta.estado} /></TableCell>
                    <TableCell sx={{ pr: 1.5 }} align="right">
                      <IconButton size="small" onClick={(e) => setMenu({ ancla: e.currentTarget, cuenta })} aria-label={`Acciones de ${cuenta.usuario}`}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Seccion>

      <Menu anchorEl={menu?.ancla} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => { setEditando(cuentaMenu); setMenu(null) }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Editar correo o rol
        </MenuItem>
        {cuentaMenu && !cuentaMenu.credenciales_enviadas && (
          <MenuItem onClick={() => { credenciales.mutate(cuentaMenu); setMenu(null) }}>
            <ListItemIcon><MarkEmailReadIcon fontSize="small" /></ListItemIcon>Marcar credenciales enviadas
          </MenuItem>
        )}
        {cuentaMenu && cuentaMenu.id !== yo.id && ['activo', 'inactivo', 'bloqueado'].filter((e) => e !== cuentaMenu.estado).map((nuevo) => (
          <MenuItem key={nuevo} onClick={() => { estado.reset(); setCambioEstado({ cuenta: cuentaMenu, nuevo }); setMenu(null) }}>
            <ListItemIcon>
              {nuevo === 'activo' ? <CheckCircleIcon fontSize="small" /> : nuevo === 'bloqueado' ? <BlockIcon fontSize="small" /> : <PauseCircleIcon fontSize="small" />}
            </ListItemIcon>
            {CAMBIOS_ESTADO[nuevo].accion}
          </MenuItem>
        ))}
      </Menu>

      <DialogoNuevaCuenta
        abierto={nueva}
        onCerrar={() => setNueva(false)}
        onCreada={(cuenta) => {
          setNueva(false)
          refrescar()
          setCreada(cuenta)
        }}
      />
      <DialogoClave cuenta={creada} onCerrar={() => setCreada(null)} />
      <DialogoEditar
        cuenta={editando}
        onCerrar={() => setEditando(null)}
        onGuardada={(cuenta, cambioRol) => {
          setEditando(null)
          refrescar()
          avisar(cambioRol ? `Cuenta ${cuenta.usuario} actualizada. Sus sesiones abiertas se cerraron` : `Cuenta ${cuenta.usuario} actualizada`)
        }}
      />
      <DialogoConfirmar
        abierto={Boolean(cambioEstado)}
        titulo={cambioEstado ? CAMBIOS_ESTADO[cambioEstado.nuevo].titulo : ''}
        textoAccion={cambioEstado ? CAMBIOS_ESTADO[cambioEstado.nuevo].accion : ''}
        color={cambioEstado ? CAMBIOS_ESTADO[cambioEstado.nuevo].color : 'primary'}
        cargando={estado.isPending}
        error={estado.error?.message}
        onConfirmar={() => estado.mutate(cambioEstado)}
        onCerrar={() => setCambioEstado(null)}
      >
        {cambioEstado && <>La cuenta <strong>{cambioEstado.cuenta.usuario}</strong> {CAMBIOS_ESTADO[cambioEstado.nuevo].texto}</>}
      </DialogoConfirmar>
    </Stack>
  )
}
