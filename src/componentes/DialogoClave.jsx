import { useState } from 'react'
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Tooltip, Typography,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopyOutlined'

/**
 * Muestra el usuario y la contraseña temporal de una cuenta recién creada. El
 * backend la entrega una sola vez; después solo queda el hash en la base.
 *
 * @param {{ usuario: string, clave_temporal: string, correo?: string }} cuenta
 */
export default function DialogoClave({ cuenta, onCerrar }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`Usuario: ${cuenta.usuario}\nContraseña temporal: ${cuenta.clave_temporal}`)
      setCopiado(true)
    } catch {
      // Sin permiso para el portapapeles: el usuario puede copiarla a mano
    }
  }

  return (
    <Dialog open={Boolean(cuenta)} onClose={onCerrar} maxWidth="xs" fullWidth>
      <DialogTitle>Cuenta creada</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Esta contraseña solo se muestra ahora. Envíela al correo del usuario y marque las credenciales como enviadas.
        </Alert>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1, p: 2, borderRadius: 2, bgcolor: 'action.hover', fontFamily: 'monospace' }}>
            <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>Usuario: {cuenta?.usuario}</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>Contraseña: {cuenta?.clave_temporal}</Typography>
          </Box>
          <Tooltip title={copiado ? 'Copiado' : 'Copiar'}>
            <IconButton onClick={copiar} aria-label="Copiar usuario y contraseña">
              {copiado ? <CheckIcon color="success" /> : <ContentCopyIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onCerrar}>Listo</Button>
      </DialogActions>
    </Dialog>
  )
}
