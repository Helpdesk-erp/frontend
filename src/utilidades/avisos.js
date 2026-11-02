import { createContext, useContext } from 'react'

export const AvisosContext = createContext(() => {})

/**
 * Devuelve avisar(mensaje, severidad): muestra un mensaje corto abajo de la
 * pantalla, por ejemplo "Ticket creado". severidad: success (por defecto), info, warning o error.
 */
export function useAvisos() {
  return useContext(AvisosContext)
}
