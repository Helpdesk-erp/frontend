import { Box, Chip, Divider, Stack, Typography } from '@mui/material'
import { dia, hora, mes, PAQUETES } from '../utilidades/formato.js'
import Vacio from './Vacio.jsx'

const INSCRIPCION = {
  inscrito: { texto: 'Inscrito', color: 'success' },
  asistio: { texto: 'Asistió', color: 'success' },
  no_asistio: { texto: 'No asistió', color: 'default' },
}

/**
 * @param {boolean} conInscripcion muestra si el usuario está inscrito (dashboard del cliente)
 */
export default function ListaCapacitaciones({ capacitaciones, conInscripcion = false, vacio }) {
  if (!capacitaciones?.length) return <Vacio>{vacio}</Vacio>

  return (
    <Stack divider={<Divider flexItem />} spacing={1.5}>
      {capacitaciones.map((c) => {
        const inscripcion = INSCRIPCION[c.mi_inscripcion]
        return (
          <Stack key={c.id} direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Box
              sx={{
                minWidth: 52, textAlign: 'center', borderRadius: 2, py: 0.5,
                bgcolor: 'action.hover', lineHeight: 1,
              }}
            >
              <Typography variant="h6" component="p" sx={{ lineHeight: 1.2 }}>{dia(c.fecha_inicio)}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>{mes(c.fecha_inicio)}</Typography>
            </Box>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.titulo}</Typography>
              <Typography variant="caption" component="p" sx={{ color: 'text.secondary' }}>
                {PAQUETES[c.paquete]} · {c.tipo === 'masiva' ? 'Masiva' : 'Personalizada'} · {c.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
                {' · '}{c.sesiones.length} {c.sesiones.length === 1 ? 'sesión' : 'sesiones'} desde las {hora(c.fecha_inicio)}
              </Typography>
              <Typography variant="caption" component="p" sx={{ color: 'text.secondary' }}>
                {c.instructor} · {c.inscritos} de {c.cupo_maximo} cupos
                {c.lugar && ` · ${c.lugar}`}
              </Typography>
            </Box>
            {conInscripcion && (
              <Chip
                size="small"
                variant="outlined"
                color={inscripcion?.color ?? 'default'}
                label={inscripcion?.texto ?? 'Sin inscripción'}
              />
            )}
          </Stack>
        )
      })}
    </Stack>
  )
}
