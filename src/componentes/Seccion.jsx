import { Box, Card, CardContent, Stack, Typography } from '@mui/material'

/** Tarjeta con título para agrupar un bloque del dashboard. */
export default function Seccion({ titulo, subtitulo, accion, children, sinRelleno = false }) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, px: 2.5, pt: 2, pb: 1 }}>
        <Box>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
            {titulo}
          </Typography>
          {subtitulo && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {subtitulo}
            </Typography>
          )}
        </Box>
        {accion}
      </Stack>
      {sinRelleno ? children : <CardContent sx={{ pt: 1, flexGrow: 1 }}>{children}</CardContent>}
    </Card>
  )
}
