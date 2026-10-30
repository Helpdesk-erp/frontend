import { useQuery } from '@tanstack/react-query'
import {
  Grid, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material'
import { api } from '../../api/cliente.js'
import { useSesion } from '../../auth/sesion.js'
import { CargandoDashboard, ErrorCarga } from '../../componentes/Cargando.jsx'
import { ChipEstadoTicket } from '../../componentes/Chips.jsx'
import Encabezado from '../../componentes/Encabezado.jsx'
import GraficoBarras from '../../componentes/GraficoBarras.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import { IndicadoresTickets } from '../../componentes/TarjetaIndicador.jsx'
import {
  ESTADOS_CAPACITACION, fechaHora, METODOS_PAGO, numero, PAQUETES, pesos, pesosCortos, primerNombre,
} from '../../utilidades/formato.js'

const NUMERICA = { fontVariantNumeric: 'tabular-nums' }
const SOLO_ESCRITORIO = { display: { xs: 'none', md: 'table-cell' } }

export default function DashboardAuditor() {
  const { usuario } = useSesion()
  const { data, isPending, error } = useQuery({
    queryKey: ['dashboard', 'auditor'],
    queryFn: () => api('/dashboard/auditor'),
    refetchInterval: 30_000,
  })

  if (isPending) return <CargandoDashboard />
  if (error) return <ErrorCarga error={error} />

  const recaudoPorMetodo = data.recaudo_por_metodo.map((fila) => ({ ...fila, nombre: METODOS_PAGO[fila.metodo] ?? fila.metodo }))

  return (
    <Stack spacing={3}>
      <Encabezado titulo={`Hola, ${primerNombre(usuario.nombre)}`} subtitulo="Indicadores de control de la mesa de ayuda. Esta vista es de solo lectura." />
      <IndicadoresTickets conteo={data.tickets_por_estado} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Seccion titulo="Incidentes por paquete" subtitulo="Qué módulo del ERP falla más">
            <GraficoBarras
              datos={data.incidentes_por_paquete}
              campoEtiqueta="nombre"
              campoValor="total"
              etiquetaSerie="Incidentes"
              formato={numero}
              vacio="Todavía no hay incidentes reportados."
            />
          </Seccion>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Seccion titulo="Tiempo promedio de resolución" subtitulo="Horas entre la creación del ticket y su paso a resuelto">
            <GraficoBarras
              datos={data.tiempo_resolucion}
              campoEtiqueta="nombre"
              campoValor="horas_promedio"
              etiquetaSerie="Horas promedio"
              formato={(v) => `${numero(v)} h`}
              vacio="Todavía no hay tickets resueltos."
            />
          </Seccion>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Seccion titulo="Recaudo por paquete" subtitulo="Pagos aprobados y rechazados" sinRelleno>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ pl: 2.5 }}>Paquete</TableCell>
                    <TableCell align="right">Recaudado</TableCell>
                    <TableCell align="right">Aprobados</TableCell>
                    <TableCell align="right" sx={{ pr: 2.5 }}>Rechazados</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.ingresos_por_paquete.map((fila) => (
                    <TableRow key={fila.paquete_id}>
                      <TableCell sx={{ pl: 2.5 }}>{fila.nombre}</TableCell>
                      <TableCell align="right" sx={NUMERICA}>{pesos(fila.recaudado)}</TableCell>
                      <TableCell align="right" sx={NUMERICA}>{fila.aprobados}</TableCell>
                      <TableCell align="right" sx={{ ...NUMERICA, pr: 2.5 }}>{fila.rechazados}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Seccion>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Seccion titulo="Asistencia a capacitaciones" sinRelleno>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ pl: 2.5 }}>Capacitación</TableCell>
                    <TableCell align="right">Inscritos</TableCell>
                    <TableCell align="right">Asistieron</TableCell>
                    <TableCell align="right" sx={{ pr: 2.5 }}>Calificación</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.asistencia_capacitaciones.map((fila) => (
                    <TableRow key={fila.capacitacion_id}>
                      <TableCell sx={{ pl: 2.5 }}>
                        <Typography variant="body2">{fila.titulo}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {PAQUETES[fila.paquete]} · {ESTADOS_CAPACITACION[fila.estado]}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={NUMERICA}>{fila.inscritos}</TableCell>
                      <TableCell align="right" sx={NUMERICA}>{fila.estado === 'finalizada' ? fila.asistieron : '-'}</TableCell>
                      <TableCell align="right" sx={{ ...NUMERICA, pr: 2.5 }}>{fila.calificacion != null ? `${numero(fila.calificacion)} / 5` : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Seccion>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Seccion titulo="Recaudo por método de pago" subtitulo="Pagos aprobados según el medio que usó el cliente">
            <GraficoBarras
              datos={recaudoPorMetodo}
              campoEtiqueta="nombre"
              campoValor="recaudado"
              etiquetaSerie="Recaudado"
              formato={pesosCortos}
              holgura={1.4}
              vacio="Todavía no hay pagos registrados."
            />
          </Seccion>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Seccion titulo="Trazabilidad de la base de conocimiento" subtitulo="Cada artículo con el ticket que le dio origen" sinRelleno>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ pl: 2.5 }}>Artículo</TableCell>
                    <TableCell>Ticket de origen</TableCell>
                    <TableCell sx={{ pr: 2.5 }}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.trazabilidad_conocimiento.map((articulo) => {
                    const ticket = articulo.ticket[0]
                    return (
                      <TableRow key={articulo.id}>
                        <TableCell sx={{ pl: 2.5 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{articulo.id}</Typography>
                          <Typography variant="body2">{articulo.titulo}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{articulo.ticket_id}</Typography>
                          <Typography variant="body2">{ticket?.asunto ?? 'El ticket ya no existe'}</Typography>
                        </TableCell>
                        <TableCell sx={{ pr: 2.5 }}>{ticket ? <ChipEstadoTicket estado={ticket.estado} /> : '-'}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Seccion>
        </Grid>

        <Grid size={12}>
          <Seccion titulo="Actividad reciente" subtitulo="Últimos cambios de estado, tomados del historial de cada ticket" sinRelleno>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ pl: 2.5 }}>Fecha</TableCell>
                    <TableCell>Ticket</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell sx={SOLO_ESCRITORIO}>Usuario</TableCell>
                    <TableCell sx={{ ...SOLO_ESCRITORIO, pr: 2.5 }}>Comentario</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.actividad_reciente.map((evento) => (
                    <TableRow key={`${evento.ticket_id}-${evento.fecha}`}>
                      <TableCell sx={{ pl: 2.5, whiteSpace: 'nowrap' }}>{fechaHora(evento.fecha)}</TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{evento.ticket_id}</Typography>
                        <Typography variant="body2">{evento.asunto}</Typography>
                      </TableCell>
                      <TableCell><ChipEstadoTicket estado={evento.estado} /></TableCell>
                      <TableCell sx={SOLO_ESCRITORIO}>{evento.usuario}</TableCell>
                      <TableCell sx={{ ...SOLO_ESCRITORIO, pr: 2.5, color: 'text.secondary' }}>{evento.comentario ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Seccion>
        </Grid>
      </Grid>
    </Stack>
  )
}
