import { useColorScheme } from '@mui/material/styles'

/**
 * Modo de color actual y una función para cambiarlo.
 * Mientras el usuario no elija, sigue el modo del sistema operativo. MUI guarda
 * la elección en el navegador, así que se mantiene al recargar.
 */
export function useModoOscuro() {
  const { mode, systemMode, setMode } = useColorScheme()
  const actual = mode === 'system' ? systemMode : mode
  const oscuro = actual === 'dark'
  return {
    oscuro,
    alternar: () => setMode(oscuro ? 'light' : 'dark'),
  }
}
