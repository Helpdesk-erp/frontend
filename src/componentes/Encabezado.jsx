import { Box, Typography } from '@mui/material'

export default function Encabezado({ titulo, subtitulo }) {
  return (
    <Box>
      <Typography variant="h4" component="h1">{titulo}</Typography>
      {subtitulo && (
        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>{subtitulo}</Typography>
      )}
    </Box>
  )
}
