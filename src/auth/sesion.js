import { createContext, useContext } from 'react'

export const SesionContext = createContext(null)

/** { usuario, login, registrar, logout, aviso, limpiarAviso, recienRegistrado, cerrarBienvenida } */
export function useSesion() {
  return useContext(SesionContext)
}

export const RUTA_POR_ROL = {
  administrador: '/administrador',
  agente_soporte: '/agente',
  cliente: '/cliente',
  auditor: '/auditor',
}

export const NOMBRE_ROL = {
  administrador: 'Administrador',
  agente_soporte: 'Agente de soporte',
  cliente: 'Cliente',
  auditor: 'Auditor',
}
