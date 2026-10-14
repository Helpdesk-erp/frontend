import { Navigate, useLocation } from 'react-router'
import { RUTA_POR_ROL, useSesion } from './sesion.js'

/**
 * Exige sesión iniciada. Con `rol` o `permiso`, además exige ese rol o ese
 * permiso; si no lo tiene, manda al usuario a su propio dashboard.
 * El backend vuelve a revisar todo esto: aquí solo se evita mostrar pantallas inútiles.
 */
export default function RutaProtegida({ rol, permiso, children }) {
  const { usuario } = useSesion()
  const ubicacion = useLocation()

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }
  if ((rol && usuario.rol !== rol) || (permiso && !usuario.permisos.includes(permiso))) {
    return <Navigate to={RUTA_POR_ROL[usuario.rol]} replace />
  }
  return children
}

/** Para login y registro: con sesión iniciada lleva a la página que pidió antes o a su dashboard. */
export function SoloInvitado({ children }) {
  const { usuario } = useSesion()
  const ubicacion = useLocation()
  if (!usuario) return children
  return <Navigate to={ubicacion.state?.desde ?? RUTA_POR_ROL[usuario.rol]} replace />
}
