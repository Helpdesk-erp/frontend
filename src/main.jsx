import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CssBaseline, ThemeProvider } from '@mui/material'
import App from './App.jsx'
import ProveedorSesion from './auth/ProveedorSesion.jsx'
import { tema } from './tema.js'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Un 401 o 403 no se arregla reintentando
      retry: (intentos, error) => error.estado >= 500 && intentos < 2,
      refetchOnWindowFocus: true,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* noSsr: la aplicación corre solo en el navegador, así el modo se conoce desde el primer render */}
    <ThemeProvider theme={tema} defaultMode="system" noSsr disableTransitionOnChange>
      <CssBaseline enableColorScheme />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ProveedorSesion>
            <App />
          </ProveedorSesion>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
