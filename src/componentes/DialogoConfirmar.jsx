import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'

/**
 * Pide confirmación antes de una acción que no se puede deshacer fácilmente
 * (eliminar un ticket, retirar un empleado, bloquear una cuenta).
 *
 * @param {string} error mensaje del backend si la acción falló
 */
export default function DialogoConfirmar({
  abierto, titulo, children, textoAccion = 'Confirmar', color = 'primary', cargando = false, error, onConfirmar, onCerrar,
}) {
  return (
    <Dialog open={abierto} onClose={cargando ? undefined : onCerrar} maxWidth="xs" fullWidth>
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">{children}</DialogContentText>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar} disabled={cargando}>Cancelar</Button>
        <Button variant="contained" color={color} onClick={onConfirmar} loading={cargando}>{textoAccion}</Button>
      </DialogActions>
    </Dialog>
  )
}
