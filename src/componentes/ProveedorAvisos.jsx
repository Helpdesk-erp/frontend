import { useCallback, useState } from 'react'
import { Alert, Snackbar } from '@mui/material'
import { AvisosContext } from '../utilidades/avisos.js'

/** Muestra los avisos de useAvisos() de uno en uno. */
export default function ProveedorAvisos({ children }) {
  const [aviso, setAviso] = useState(null)

  const avisar = useCallback((mensaje, severidad = 'success') => {
    setAviso({ mensaje, severidad, clave: Date.now() })
  }, [])

  return (
    <AvisosContext.Provider value={avisar}>
      {children}
      <Snackbar
        key={aviso?.clave}
        open={Boolean(aviso)}
        autoHideDuration={5000}
        onClose={(_e, razon) => razon !== 'clickaway' && setAviso(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {aviso ? (
          <Alert severity={aviso.severidad} variant="filled" onClose={() => setAviso(null)} sx={{ width: '100%' }}>
            {aviso.mensaje}
          </Alert>
        ) : undefined}
      </Snackbar>
    </AvisosContext.Provider>
  )
}
