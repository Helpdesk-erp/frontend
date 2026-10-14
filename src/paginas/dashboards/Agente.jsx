import { useQuery } from '@tanstack/react-query'
import { Grid, Stack } from '@mui/material'
import { api } from '../../api/cliente.js'
import { useSesion } from '../../auth/sesion.js'
import BuscadorConocimiento from '../../componentes/BuscadorConocimiento.jsx'
import { CargandoDashboard, ErrorCarga } from '../../componentes/Cargando.jsx'
import Encabezado from '../../componentes/Encabezado.jsx'
import ListaCapacitaciones from '../../componentes/ListaCapacitaciones.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import TablaTickets from '../../componentes/TablaTickets.jsx'
import TarjetaIndicador from '../../componentes/TarjetaIndicador.jsx'
import { primerNombre } from '../../utilidades/formato.js'

export default function DashboardAgente() {
  const { usuario } = useSesion()
  const { data, isPending, error } = useQuery({
    queryKey: ['dashboard', 'agente'],
    queryFn: () => api('/dashboard/agente'),
    refetchInterval: 30_000,
  })

  if (isPending) return <CargandoDashboard />
  if (error) return <ErrorCarga error={error} />

  const conteo = data.tickets_por_estado

  return (
    <Stack spacing={3}>
      <Encabezado titulo={`Hola, ${primerNombre(usuario.nombre)}`} subtitulo="Sus tickets, de mayor a menor prioridad." />

      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}><TarjetaIndicador etiqueta="Asignados" valor={conteo.asignado} detalle="por empezar" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><TarjetaIndicador etiqueta="En proceso" valor={conteo.en_proceso} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><TarjetaIndicador etiqueta="Resueltos" valor={conteo.resuelto + conteo.cerrado} detalle="incluye cerrados" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><TarjetaIndicador etiqueta="Artículos escritos" valor={data.articulos_escritos} detalle="en la base de conocimiento" /></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Seccion titulo="Mis tickets abiertos" subtitulo="Asignados o en proceso" sinRelleno>
            <TablaTickets tickets={data.mis_tickets} persona="cliente" vacio="No tiene tickets pendientes." />
          </Seccion>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Seccion titulo="Capacitaciones que dicto">
            <ListaCapacitaciones capacitaciones={data.mis_capacitaciones} vacio="No tiene capacitaciones programadas." />
          </Seccion>
        </Grid>
        <Grid size={12}>
          <Seccion titulo="Buscar en la base de conocimiento" subtitulo="Soluciones de casos que ya se resolvieron">
            <BuscadorConocimiento conFiltroPaquete />
          </Seccion>
        </Grid>
      </Grid>
    </Stack>
  )
}
