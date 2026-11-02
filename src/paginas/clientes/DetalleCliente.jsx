import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, MenuItem, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/EditOutlined'
import PaymentsIcon from '@mui/icons-material/PaymentsOutlined'
import { api } from '../../api/cliente.js'
import { NOMBRE_ROL, tienePermiso, useSesion } from '../../auth/sesion.js'
import CampoTexto from '../../componentes/CampoTexto.jsx'
import { CargandoDashboard, ErrorCarga } from '../../componentes/Cargando.jsx'
import { ChipEstado } from '../../componentes/Chips.jsx'
import DialogoConfirmar from '../../componentes/DialogoConfirmar.jsx'
import DialogoPago from '../../componentes/DialogoPago.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import TablaTickets from '../../componentes/TablaTickets.jsx'
import Vacio from '../../componentes/Vacio.jsx'
import { useAvisos } from '../../utilidades/avisos.js'
import {
  DEPARTAMENTOS, fecha, fechaCalendario, fechaHora, METODOS_PAGO, NOMBRE_DOCUMENTO, PAQUETES, periodo, pesos, TIPOS_CLIENTE,
} from '../../utilidades/formato.js'
import { aplicarErrores, CELULAR, CORREO, hoy, SOLO_LETRAS } from '../../utilidades/formularios.js'

const NUMERICA = { fontVariantNumeric: 'tabular-nums' }
const SOLO_ESCRITORIO = { display: { xs: 'none', sm: 'table-cell' } }

function Dato({ etiqueta, children }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{etiqueta}</Typography>
      <Typography variant="body2">{children ?? '-'}</Typography>
    </Box>
  )
}

/** RF-12: contacto, dirección y representante. */
function DialogoContacto({ cliente, abierto, onCerrar, onGuardado }) {
  const [errorServidor, setErrorServidor] = useState(null)
  const conRepresentante = cliente.tipo_cliente !== 'persona_natural'
  const { control, handleSubmit, setError, formState: { isSubmitting } } = useForm({
    values: {
      correo: cliente.correo, telefono: cliente.telefono, representante: cliente.representante ?? '',
      direccion: { ...cliente.direccion },
    },
  })

  const enviar = async (datos) => {
    setErrorServidor(null)
    try {
      onGuardado(await api(`/clientes/${cliente.id}`, {
        metodo: 'PUT',
        cuerpo: { ...datos, correo: datos.correo.trim().toLowerCase(), representante: conRepresentante ? datos.representante.trim() : null },
      }))
    } catch (e) {
      setErrorServidor(aplicarErrores(e, setError))
    }
  }

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit(enviar)}>
        <DialogTitle>Datos de contacto</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errorServidor && <Alert severity="error">{errorServidor}</Alert>}
            {conRepresentante && (
              <CampoTexto control={control} name="representante" label={cliente.tipo_cliente === 'empresa' ? 'Propietario' : 'Representante legal'}
                rules={{ required: 'Escriba el nombre', pattern: { value: SOLO_LETRAS, message: 'Solo letras' } }} />
            )}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <CampoTexto control={control} name="correo" label="Correo" type="email" rules={{ required: 'Escriba el correo', pattern: { value: CORREO, message: 'Correo no válido' } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <CampoTexto control={control} name="telefono" label="Celular" rules={{ required: 'Escriba el celular', pattern: { value: CELULAR, message: 'Debe tener 10 dígitos' } }} />
              </Grid>
            </Grid>
            <CampoTexto control={control} name="direccion.direccion" label="Dirección" rules={{ required: 'Escriba la dirección' }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CampoTexto control={control} name="direccion.ciudad" label="Ciudad o municipio" rules={{ required: 'Escriba la ciudad' }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CampoTexto control={control} name="direccion.departamento" label="Departamento" select rules={{ required: 'Seleccione el departamento' }}>
                  {DEPARTAMENTOS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </CampoTexto>
              </Grid>
            </Grid>
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

/** Agrega un paquete del catálogo con su vigencia; el precio se copia del catálogo. */
function DialogoContrato({ cliente, abierto, onCerrar, onContratado }) {
  const [errorServidor, setErrorServidor] = useState(null)
  const { data: catalogo = [] } = useQuery({ queryKey: ['paquetes'], queryFn: () => api('/paquetes'), enabled: abierto })
  const vigentes = new Set((cliente.paquetes_contratados ?? []).filter((p) => p.estado !== 'vencido').map((p) => p.paquete_id))
  const disponibles = catalogo.filter((p) => !vigentes.has(p.id))
  const unAnio = (() => {
    const [a, m, d] = hoy().split('-')
    return `${Number(a) + 1}-${m}-${d}`
  })()
  const { control, handleSubmit, setError, reset, getValues, formState: { isSubmitting } } = useForm({
    defaultValues: { paquete_id: '', fecha_inicio: hoy(), fecha_fin: unAnio },
  })

  const enviar = async (datos) => {
    setErrorServidor(null)
    try {
      onContratado(await api(`/clientes/${cliente.id}/paquetes`, { metodo: 'POST', cuerpo: datos }), datos.paquete_id)
      reset()
    } catch (e) {
      setErrorServidor(aplicarErrores(e, setError))
    }
  }

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="xs" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit(enviar)}>
        <DialogTitle>Contratar paquete</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errorServidor && <Alert severity="error">{errorServidor}</Alert>}
            {abierto && catalogo.length > 0 && disponibles.length === 0 && <Alert severity="info">El cliente ya tiene todos los paquetes.</Alert>}
            <CampoTexto control={control} name="paquete_id" label="Paquete" select rules={{ required: 'Seleccione el paquete' }}>
              {disponibles.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre} · {pesos(p.precio_mensual)} al mes</MenuItem>)}
            </CampoTexto>
            <Grid container spacing={2}>
              <Grid size={6}>
                <CampoTexto control={control} name="fecha_inicio" label="Desde" type="date" slotProps={{ inputLabel: { shrink: true } }}
                  rules={{ required: 'Escriba la fecha' }} />
              </Grid>
              <Grid size={6}>
                <CampoTexto control={control} name="fecha_fin" label="Hasta" type="date" slotProps={{ inputLabel: { shrink: true } }}
                  rules={{ required: 'Escriba la fecha', validate: (v) => v > getValues('fecha_inicio') || 'Debe ser posterior al inicio' }} />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>Contratar</Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

/** RF-13 para el administrador (y el auditor, en solo lectura). */
export default function DetalleCliente() {
  const { id } = useParams()
  const { usuario } = useSesion()
  const avisar = useAvisos()
  const queryClient = useQueryClient()
  const [dialogo, setDialogo] = useState(null)
  const puedeGestionar = tienePermiso(usuario, 'clientes:gestionar')
  const puedePagar = tienePermiso(usuario, 'pagos:registrar')

  const { data, isPending, error } = useQuery({ queryKey: ['cliente', id], queryFn: () => api(`/clientes/${id}`) })

  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ['cliente', id] })
    queryClient.invalidateQueries({ queryKey: ['clientes'] })
    queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    queryClient.invalidateQueries({ queryKey: ['pagos'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  // RF-14: eliminación lógica; el cliente y sus cuentas quedan inactivos
  const cambiarEstado = useMutation({
    mutationFn: (inactivar) => api(inactivar ? `/clientes/${id}` : `/clientes/${id}/reactivacion`, { metodo: inactivar ? 'DELETE' : 'POST' }),
    onSuccess: (cliente) => {
      refrescar()
      avisar(cliente.estado === 'inactivo' ? 'Cliente inactivo. Sus cuentas ya no pueden iniciar sesión' : 'Cliente reactivado')
      setDialogo(null)
    },
  })

  if (isPending) return <CargandoDashboard />
  if (error) return <ErrorCarga error={error} />

  const { cliente, usuarios, tickets, pagos } = data
  const inactivo = cliente.estado === 'inactivo'
  const paquetes = cliente.paquetes_contratados ?? []
  const cerrar = () => setDialogo(null)

  return (
    <Stack spacing={3}>
      <Box>
        <Button component={RouterLink} to="/clientes" startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1, ml: -1 }}>Clientes</Button>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{cliente.id}</Typography>
          <ChipEstado estado={cliente.estado} />
        </Stack>
        <Typography variant="h4" component="h1" sx={{ mt: 1 }}>{cliente.nombre}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {TIPOS_CLIENTE[cliente.tipo_cliente]} · {NOMBRE_DOCUMENTO[cliente.tipo_documento]} {cliente.numero_documento} · cliente desde el {fecha(cliente.fecha_registro)}
        </Typography>
      </Box>

      {puedeGestionar && (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
          {!inactivo && (
            <>
              <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setDialogo('contacto')}>Editar contacto</Button>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialogo('contrato')}>Contratar paquete</Button>
              {puedePagar && paquetes.length > 0 && (
                <Button variant="outlined" startIcon={<PaymentsIcon />} onClick={() => setDialogo('pago')}>Registrar pago</Button>
              )}
            </>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button
            color={inactivo ? 'success' : 'error'}
            onClick={() => { cambiarEstado.reset(); setDialogo('estado') }}
          >
            {inactivo ? 'Reactivar cliente' : 'Inactivar cliente'}
          </Button>
        </Stack>
      )}

      {inactivo && <Alert severity="info">El cliente está inactivo: sus cuentas no pueden iniciar sesión. Sus tickets y pagos se conservan.</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, mb: 1.5 }}>Contacto</Typography>
              <Stack spacing={1.5}>
                {cliente.representante && <Dato etiqueta={cliente.tipo_cliente === 'empresa' ? 'Propietario' : 'Representante legal'}>{cliente.representante}</Dato>}
                <Dato etiqueta="Correo">{cliente.correo}</Dato>
                <Dato etiqueta="Celular">{cliente.telefono}</Dato>
                <Dato etiqueta="Dirección">{cliente.direccion.direccion}, {cliente.direccion.ciudad} ({cliente.direccion.departamento})</Dato>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Seccion titulo="Paquetes contratados" subtitulo="Cada paquete conserva el precio con el que se contrató" sinRelleno>
            {paquetes.length === 0 ? (
              <Box sx={{ px: 2.5 }}><Vacio>Todavía no tiene paquetes. Sin un paquete activo no puede abrir tickets.</Vacio></Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ pl: 2.5 }}>Paquete</TableCell>
                      <TableCell align="right">Precio mensual</TableCell>
                      <TableCell sx={SOLO_ESCRITORIO}>Vigencia</TableCell>
                      <TableCell sx={{ pr: 2.5 }}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paquetes.map((p) => (
                      <TableRow key={p.paquete_id}>
                        <TableCell sx={{ pl: 2.5 }}>{p.nombre}</TableCell>
                        <TableCell align="right" sx={NUMERICA}>{pesos(p.precio_mensual)}</TableCell>
                        <TableCell sx={{ ...SOLO_ESCRITORIO, whiteSpace: 'nowrap' }}>{fechaCalendario(p.fecha_inicio)} a {fechaCalendario(p.fecha_fin)}</TableCell>
                        <TableCell sx={{ pr: 2.5 }}><ChipEstado estado={p.estado} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Seccion>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Seccion titulo="Cuentas de acceso">
            {usuarios.length === 0 ? (
              <Vacio>Sin cuentas.</Vacio>
            ) : (
              <Stack divider={<Divider flexItem />} spacing={1.5}>
                {usuarios.map((u) => (
                  <Stack key={u.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2">{u.usuario}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {NOMBRE_ROL[u.rol]} · último acceso {fechaHora(u.ultimo_acceso)}
                      </Typography>
                    </Box>
                    <ChipEstado estado={u.estado} />
                  </Stack>
                ))}
              </Stack>
            )}
          </Seccion>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Seccion titulo="Tickets" sinRelleno>
            <TablaTickets tickets={tickets} persona="agente" vacio="El cliente no ha reportado tickets." />
          </Seccion>
        </Grid>

        <Grid size={12}>
          <Seccion titulo="Pagos" sinRelleno>
            {pagos.length === 0 ? (
              <Box sx={{ px: 2.5 }}><Vacio>No hay pagos registrados.</Vacio></Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ pl: 2.5 }}>Periodo</TableCell>
                      <TableCell>Paquete</TableCell>
                      <TableCell sx={SOLO_ESCRITORIO}>Método</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell sx={{ pr: 2.5 }}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagos.map((pago) => (
                      <TableRow key={pago.id}>
                        <TableCell sx={{ pl: 2.5 }}>
                          <Typography variant="body2">{periodo(pago.periodo)}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{pago.id} · {fecha(pago.fecha)}</Typography>
                        </TableCell>
                        <TableCell>{PAQUETES[pago.paquete_id]}</TableCell>
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
        </Grid>
      </Grid>

      {puedeGestionar && (
        <>
          <DialogoContacto
            cliente={cliente}
            abierto={dialogo === 'contacto'}
            onCerrar={cerrar}
            onGuardado={() => { refrescar(); avisar('Datos de contacto actualizados'); cerrar() }}
          />
          <DialogoContrato
            cliente={cliente}
            abierto={dialogo === 'contrato'}
            onCerrar={cerrar}
            onContratado={(_c, paquete) => { refrescar(); avisar(`${PAQUETES[paquete]} contratado`); cerrar() }}
          />
          <DialogoPago
            clienteId={cliente.id}
            abierto={dialogo === 'pago'}
            onCerrar={cerrar}
            onRegistrado={(r) => {
              refrescar()
              avisar(r.pago.estado === 'rechazado'
                ? `Pago ${r.pago.id} rechazado. El paquete quedó ${r.estado_paquete}`
                : `Pago ${r.pago.id} aprobado. El paquete está ${r.estado_paquete}`, r.pago.estado === 'rechazado' ? 'warning' : 'success')
              cerrar()
            }}
          />
          <DialogoConfirmar
            abierto={dialogo === 'estado'}
            titulo={inactivo ? 'Reactivar cliente' : 'Inactivar cliente'}
            textoAccion={inactivo ? 'Reactivar' : 'Inactivar'}
            color={inactivo ? 'success' : 'error'}
            cargando={cambiarEstado.isPending}
            error={cambiarEstado.error?.message}
            onConfirmar={() => cambiarEstado.mutate(!inactivo)}
            onCerrar={cerrar}
          >
            {inactivo
              ? 'El cliente vuelve a quedar activo y sus cuentas inactivas pueden iniciar sesión otra vez. Las cuentas bloqueadas siguen bloqueadas.'
              : 'El cliente no se borra: queda inactivo para conservar sus tickets y pagos. Sus cuentas se cierran de inmediato.'}
          </DialogoConfirmar>
        </>
      )}
    </Stack>
  )
}
