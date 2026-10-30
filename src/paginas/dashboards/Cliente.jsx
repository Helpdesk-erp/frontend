import { useQuery } from '@tanstack/react-query'
import {
  Alert, Box, Divider, Grid, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material'
import { api } from '../../api/cliente.js'
import { useSesion } from '../../auth/sesion.js'
import BuscadorConocimiento from '../../componentes/BuscadorConocimiento.jsx'
import { CargandoDashboard, ErrorCarga } from '../../componentes/Cargando.jsx'
import { ChipEstado, ChipPaquete } from '../../componentes/Chips.jsx'
import Encabezado from '../../componentes/Encabezado.jsx'
import ListaCapacitaciones from '../../componentes/ListaCapacitaciones.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import TablaTickets from '../../componentes/TablaTickets.jsx'
import TarjetaIndicador from '../../componentes/TarjetaIndicador.jsx'
import Vacio from '../../componentes/Vacio.jsx'
import { fechaCalendario, METODOS_PAGO, PAQUETES, periodo, pesos, TIPOS_CLIENTE } from '../../utilidades/formato.js'

/** Explica por qué está suspendido un paquete, con el último pago rechazado de ese paquete. */
function AvisoSuspension({ paquete, pagos, hayOtrosActivos }) {
  const rechazo = pagos.find((p) => p.paquete_id === paquete.paquete_id && p.estado === 'rechazado')
  return (
    <Alert severity="warning">
      El paquete {paquete.nombre} está suspendido
      {rechazo ? ` porque el pago de ${periodo(rechazo.periodo)} fue rechazado (${rechazo.motivo_rechazo.toLowerCase()})` : ''}.
      Mientras tanto no puede abrir tickets de ese paquete.{hayOtrosActivos && ' Los demás paquetes siguen funcionando.'}
    </Alert>
  )
}

export default function DashboardCliente() {
  const { recienRegistrado, cerrarBienvenida } = useSesion()
  const { data, isPending, error } = useQuery({
    queryKey: ['dashboard', 'cliente'],
    queryFn: () => api('/dashboard/cliente'),
  })

  if (isPending) return <CargandoDashboard />
  if (error) return <ErrorCarga error={error} />

  const { cliente, tickets_por_estado: conteo } = data
  const paquetes = cliente.paquetes_contratados ?? []
  const suspendidos = paquetes.filter((p) => p.estado === 'suspendido')
  const contratados = new Set(paquetes.map((p) => p.paquete_id))

  return (
    <Stack spacing={3}>
      {recienRegistrado && (
        <Alert severity="success" onClose={cerrarBienvenida}>
          Su cuenta quedó creada con el código {cliente.id}. Un asesor lo contactará para activar los paquetes.
        </Alert>
      )}

      <Encabezado
        titulo={cliente.nombre}
        subtitulo={`${TIPOS_CLIENTE[cliente.tipo_cliente]} · ${cliente.tipo_documento} ${cliente.numero_documento} · ${cliente.direccion.ciudad}`}
      />

      {suspendidos.map((paquete) => (
        <AvisoSuspension
          key={paquete.paquete_id}
          paquete={paquete}
          pagos={data.pagos_recientes}
          hayOtrosActivos={paquetes.some((p) => p.estado === 'activo')}
        />
      ))}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TarjetaIndicador etiqueta="Tickets abiertos" valor={conteo.sin_atender + conteo.asignado + conteo.en_proceso} detalle={`${conteo.sin_atender} esperan agente`} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}><TarjetaIndicador etiqueta="Resueltos" valor={conteo.resuelto} detalle="pendientes de su confirmación" /></Grid>
        <Grid size={{ xs: 6, sm: 4 }}><TarjetaIndicador etiqueta="Cerrados" valor={conteo.cerrado} /></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Seccion titulo="Mis paquetes" subtitulo="Módulos del ERP que tiene contratados">
            {paquetes.length === 0 ? (
              <Vacio>Todavía no tiene paquetes contratados. Cuando contrate uno podrá reportar fallas de ese módulo.</Vacio>
            ) : (
              <Stack divider={<Divider flexItem />} spacing={1.5}>
                {paquetes.map((p) => (
                  <Stack key={p.paquete_id} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.nombre}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {pesos(p.precio_mensual)} al mes · vigente hasta {fechaCalendario(p.fecha_fin)}
                      </Typography>
                    </Box>
                    <ChipEstado estado={p.estado} />
                  </Stack>
                ))}
              </Stack>
            )}
          </Seccion>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Seccion titulo="Mis tickets recientes" sinRelleno>
            <TablaTickets tickets={data.tickets_recientes} persona="agente" vacio="No ha reportado tickets." />
          </Seccion>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Seccion titulo="Buscar soluciones" subtitulo="Antes de abrir un ticket, revise si su problema ya tiene solución">
            <BuscadorConocimiento />
          </Seccion>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Seccion titulo="Capacitaciones" subtitulo="Para los paquetes que tiene activos">
            <ListaCapacitaciones capacitaciones={data.capacitaciones} conInscripcion vacio="No hay capacitaciones próximas para sus paquetes." />
          </Seccion>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Seccion titulo="Soluciones por confirmar" subtitulo="Soporte marcó estos tickets como resueltos. Revise la solución antes de cerrarlos">
            {data.por_confirmar.length === 0 ? (
              <Vacio>No tiene tickets esperando su confirmación.</Vacio>
            ) : (
              <Stack divider={<Divider flexItem />} spacing={1.5}>
                {data.por_confirmar.map((ticket) => (
                  <Box key={ticket.id}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{ticket.id}</Typography>
                      <ChipPaquete paquete={ticket.paquete} />
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{ticket.asunto}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{ticket.solucion}</Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Seccion>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Seccion titulo="Catálogo de paquetes" subtitulo="Módulos del ERP, del de mayor al de menor precio">
            <Stack divider={<Divider flexItem />} spacing={1.5}>
              {data.catalogo_paquetes.map((p) => (
                <Stack key={p.id} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.nombre}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{p.descripcion}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{pesos(p.precio_mensual)}</Typography>
                    {contratados.has(p.id) && (
                      <Typography variant="caption" sx={{ display: 'block', color: 'success.main' }}>Contratado</Typography>
                    )}
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Seccion>
        </Grid>

        <Grid size={12}>
          <Seccion titulo="Pagos recientes" sinRelleno>
            {data.pagos_recientes.length === 0 ? (
              <Box sx={{ px: 2.5 }}><Vacio>No hay pagos registrados.</Vacio></Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ pl: 2.5 }}>Periodo</TableCell>
                      <TableCell>Paquete</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Método</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell sx={{ pr: 2.5 }}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.pagos_recientes.map((pago) => (
                      <TableRow key={pago.id}>
                        <TableCell sx={{ pl: 2.5 }}>{periodo(pago.periodo)}</TableCell>
                        <TableCell>{PAQUETES[pago.paquete_id]}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{METODOS_PAGO[pago.metodo]}</TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{pesos(pago.valor)}</TableCell>
                        <TableCell sx={{ pr: 2.5 }}><ChipEstado estado={pago.estado} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Seccion>
        </Grid>
      </Grid>
    </Stack>
  )
}
