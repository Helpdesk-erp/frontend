import { Card, CardContent, Grid, Typography } from '@mui/material'
import { ESTADOS_TICKET, numero } from '../utilidades/formato.js'

/** Un número con su etiqueta (stat tile). */
export default function TarjetaIndicador({ etiqueta, valor, detalle }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {etiqueta}
        </Typography>
        <Typography variant="h4" component="p" sx={{ mt: 0.5 }}>
          {typeof valor === 'number' ? numero(valor) : valor}
        </Typography>
        {detalle && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {detalle}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

/** Una tarjeta por estado de ticket, a partir de { sin_atender: 2, asignado: 1, ... }. */
export function IndicadoresTickets({ conteo }) {
  return (
    <Grid container spacing={2}>
      {Object.entries(ESTADOS_TICKET).map(([estado, etiqueta]) => (
        <Grid key={estado} size={{ xs: 6, sm: 4, md: 'grow' }}>
          <TarjetaIndicador etiqueta={etiqueta} valor={conteo?.[estado] ?? 0} />
        </Grid>
      ))}
    </Grid>
  )
}
