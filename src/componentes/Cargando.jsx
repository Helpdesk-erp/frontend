import { Alert, Grid, Skeleton, Stack } from '@mui/material'

/** Esqueleto del dashboard mientras llega la primera respuesta. */
export function CargandoDashboard() {
  return (
    <Stack spacing={2}>
      <Skeleton variant="text" width={280} height={44} />
      <Grid container spacing={2}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Grid key={n} size={{ xs: 6, sm: 4, md: 'grow' }}>
            <Skeleton variant="rounded" height={96} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}><Skeleton variant="rounded" height={280} /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><Skeleton variant="rounded" height={280} /></Grid>
      </Grid>
    </Stack>
  )
}

export function ErrorCarga({ error }) {
  return <Alert severity="error">No se pudo cargar la información: {error.message}</Alert>
}
