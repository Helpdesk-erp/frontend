import { createTheme } from '@mui/material/styles'

// Modo claro y oscuro. Por defecto sigue al sistema operativo; el botón de BotonTema.jsx
// lo cambia y MUI marca la página con el atributo data-light o data-dark.
export const tema = createTheme({
  cssVariables: { colorSchemeSelector: 'data' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1c5cab' },
        background: { default: '#f5f6f8', paper: '#ffffff' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#5598e7' },
        background: { default: '#0f1115', paper: '#171a20' },
      },
    },
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 650, letterSpacing: '-0.01em' },
    h5: { fontWeight: 650 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 600 } } },
  },
})

// Colores de los gráficos (slot 1 de la paleta categórica, validada para daltonismo)
export const COLORES_GRAFICO = {
  claro: { serie: '#2a78d6', rejilla: '#e1e0d9' },
  oscuro: { serie: '#3987e5', rejilla: '#2c2c2a' },
}
