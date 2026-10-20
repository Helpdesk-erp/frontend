import { Box, Stack, Typography } from '@mui/material'
import SupportAgentIcon from '@mui/icons-material/SupportAgentOutlined'

/** Panel de color con el nombre del sistema; se oculta en pantallas pequeñas. */
export default function PanelMarca() {
  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between',
        p: 6, bgcolor: 'primary.main', color: 'primary.contrastText',
        position: 'sticky', top: 0, height: '100vh',
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <SupportAgentIcon />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Sistemas Integrados S.A.</Typography>
      </Stack>
      <Box sx={{ maxWidth: 440 }}>
        <Typography variant="h4" component="p" sx={{ mb: 2 }}>Mesa de ayuda del ERP/POS</Typography>
        <Typography sx={{ opacity: 0.9 }}>
          Los clientes reportan fallas de Ventas Online, Inventarios, Compras, Producción y del POS.
          Soporte las atiende y deja escrito cómo las resolvió, para que el siguiente caso se cierre más rápido.
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ opacity: 0.8 }}>
       
      </Typography>
    </Box>
  )
}
