import { IconButton, Tooltip } from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeIcon from '@mui/icons-material/LightModeOutlined'
import { useModoOscuro } from '../utilidades/useModoOscuro.js'

/** Cambia entre modo claro y oscuro. El ícono muestra el modo al que se va a pasar. */
export default function BotonTema({ sx }) {
  const { oscuro, alternar } = useModoOscuro()
  const texto = oscuro ? 'Cambiar a modo claro' : 'cambiar a modo oscuro'
  return (
    <Tooltip title={texto}>
      <IconButton onClick={alternar} aria-label={texto} sx={sx}>
        {oscuro ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  )
}
