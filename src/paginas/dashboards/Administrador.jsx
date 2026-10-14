import { useQuery } from '@tanstack/react-query'
import { Avatar, Box, Divider, Grid, Stack, Typography } from '@mui/material'
import { api } from '../../api/cliente.js'
import { useSesion } from '../../auth/sesion.js'
import { CargandoDashboard, ErrorCarga } from '../../componentes/Cargando.jsx'
import { ChipPaquete } from '../../componentes/Chips.jsx'
import Encabezado from '../../componentes/Encabezado.jsx'
import GraficoBarras from '../../componentes/GraficoBarras.jsx'
import ListaCapacitaciones from '../../componentes/ListaCapacitaciones.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import TablaTickets from '../../componentes/TablaTickets.jsx'
import { IndicadoresTickets } from '../../componentes/TarjetaIndicador.jsx'
import Vacio from '../../componentes/Vacio.jsx'
import { numero, periodo, pesos, primerNombre } from '../../utilidades/formato.js'

function Cifra({ etiqueta, valor, detalle }) {
  return (
    <Box>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{etiqueta}</Typography>
      <Typography variant="h5" component="p">{valor}</Typography>
      {detalle && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{detalle}</Typography>}
    </Box>
  )
}

export default function DashboardAdministrador() {
  const { usuario } = useSesion()
  // Se actualiza solo cada 30 segundos, sin parpadear: mientras llega lo nuevo se ve lo anterior
  const { data, isPending, error } = useQuery({
    queryKey: ['dashboard', 'administrador'],
    queryFn: () => api('/dashboard/administrador'),
    refetchInterval: 30_000,
  })

  if (isPending) return <CargandoDashboard />
  if (error) return <ErrorCarga error={error} />

  const { clientes } = data

  return (
    <Stack spacing={3}>
      <Encabezado titulo={`Hola, ${primerNombre(usuario.nombre)}`} subtitulo="Así está la mesa de ayuda en este momento." />
      <IndicadoresTickets conteo={data.tickets_por_estado} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Seccion titulo="Bandeja sin atender" subtitulo="Tickets que esperan agente, del más antiguo al más reciente" sinRelleno>
            <TablaTickets tickets={data.sin_atender} persona="cliente" vacio="No hay tickets esperando asignación." />
          </Seccion>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Seccion titulo="Carga por agente" subtitulo="Tickets asignados o en proceso">
            {data.carga_agentes.length === 0 ? (
              <Vacio>No hay agentes de soporte activos.</Vacio>
            ) : (
              <Stack divider={<Divider flexItem />} spacing={1.5}>
                {data.carga_agentes.map((agente) => (
                  <Stack key={agente.agente_id} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Avatar sx={{ width: 36, height: 36, fontSize: 14 }}>
                      {agente.nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('')}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{agente.nombre}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {agente.resueltos} resueltos en total
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" component="p" sx={{ lineHeight: 1.1 }}>{agente.abiertos}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>abiertos</Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            )}
          </Seccion>
        </Grid>

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
          <Seccion titulo="Clientes y membresías" subtitulo="Paquetes contratados y su estado de pago">
            <Grid container spacing={3}>
              <Grid size={6}>
                <Cifra etiqueta="Clientes activos" valor={numero(clientes.activos)} detalle={`de ${numero(clientes.total)} registrados`} />
              </Grid>
              <Grid size={6}>
                <Cifra etiqueta="Ingreso mensual" valor={pesos(clientes.ingreso_mensual)} detalle="paquetes activos" />
              </Grid>
              <Grid size={6}>
                <Cifra etiqueta="Paquetes activos" valor={numero(clientes.paquetes_activos)} />
              </Grid>
              <Grid size={6}>
                <Cifra etiqueta="Paquetes suspendidos" valor={numero(clientes.paquetes_suspendidos)} detalle="por pagos rechazados" />
              </Grid>
            </Grid>
          </Seccion>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Seccion titulo="Pagos rechazados" subtitulo="El paquete queda suspendido hasta que se pague">
            {data.pagos_rechazados.length === 0 ? (
              <Vacio>No hay pagos rechazados.</Vacio>
            ) : (
              <Stack divider={<Divider flexItem />} spacing={1.5}>
                {data.pagos_rechazados.map((pago) => (
                  <Stack key={pago.id} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{pago.cliente}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {periodo(pago.periodo)} · {pago.motivo_rechazo}
                      </Typography>
                    </Box>
                    <ChipPaquete paquete={pago.paquete_id} />
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{pesos(pago.valor)}</Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Seccion>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Seccion titulo="Próximas capacitaciones">
            <ListaCapacitaciones capacitaciones={data.proximas_capacitaciones} vacio="No hay capacitaciones programadas." />
          </Seccion>
        </Grid>
      </Grid>
    </Stack>
  )
}
