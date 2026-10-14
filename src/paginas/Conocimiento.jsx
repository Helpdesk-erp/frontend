import { Stack } from '@mui/material'
import BuscadorConocimiento from '../componentes/BuscadorConocimiento.jsx'
import Encabezado from '../componentes/Encabezado.jsx'
import Seccion from '../componentes/Seccion.jsx'

export default function Conocimiento() {
  return (
    <Stack spacing={3}>
      <Encabezado
        titulo="Base de conocimiento"
        subtitulo="Cada artículo cuenta cómo soporte resolvió un caso real, paso a paso."
      />
      <Seccion titulo="Buscar">
        <BuscadorConocimiento conFiltroPaquete />
      </Seccion>
    </Stack>
  )
}
