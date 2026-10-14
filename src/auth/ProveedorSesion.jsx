import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, guardarSesion, leerSesionGuardada } from '../api/cliente.js'
import { SesionContext } from './sesion.js'

function sesionInicial() {
  const sesion = leerSesionGuardada()
  // Un token vencido no sirve; se descarta antes de la primera petición
  return sesion && new Date(sesion.expira) > new Date() ? sesion : null
}

export default function ProveedorSesion({ children }) {
  const [sesion, setSesion] = useState(sesionInicial)
  const [aviso, setAviso] = useState(null)
  const [recienRegistrado, setRecienRegistrado] = useState(false)
  const queryClient = useQueryClient()

  const iniciar = useCallback((respuesta) => {
    guardarSesion(respuesta)
    setSesion(respuesta)
    setAviso(null)
  }, [])

  const terminar = useCallback(
    (mensaje) => {
      guardarSesion(null)
      setSesion(null)
      setRecienRegistrado(false)
      queryClient.clear()
      setAviso(mensaje ?? null)
    },
    [queryClient],
  )

  // El cliente HTTP avisa cuando el backend responde 401 (sesión cerrada, cuenta bloqueada...)
  useEffect(() => {
    const alVencer = (evento) => terminar(evento.detail)
    window.addEventListener('helpdesk:sesion-vencida', alVencer)
    return () => window.removeEventListener('helpdesk:sesion-vencida', alVencer)
  }, [terminar])

  const valor = useMemo(
    () => ({
      usuario: sesion?.usuario ?? null,
      aviso,
      limpiarAviso: () => setAviso(null),
      login: async (datos) => iniciar(await api('/auth/login', { metodo: 'POST', cuerpo: datos })),
      // recienRegistrado le dice al dashboard del cliente que muestre la bienvenida
      recienRegistrado,
      cerrarBienvenida: () => setRecienRegistrado(false),
      registrar: async (datos) => {
        iniciar(await api('/auth/registro', { metodo: 'POST', cuerpo: datos }))
        setRecienRegistrado(true)
      },
      logout: async () => {
        try {
          await api('/auth/logout', { metodo: 'POST' })
        } catch {
          // Si el servidor no responde, la sesión local se cierra de todos modos
        }
        terminar()
      },
    }),
    [sesion, aviso, recienRegistrado, iniciar, terminar],
  )

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
}
