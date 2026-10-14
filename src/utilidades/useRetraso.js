import { useEffect, useState } from 'react'

/** Devuelve el valor solo cuando deja de cambiar durante `ms` milisegundos. */
export function useRetraso(valor, ms = 300) {
  const [retrasado, setRetrasado] = useState(valor)
  useEffect(() => {
    const temporizador = setTimeout(() => setRetrasado(valor), ms)
    return () => clearTimeout(temporizador)
  }, [valor, ms])
  return retrasado
}
