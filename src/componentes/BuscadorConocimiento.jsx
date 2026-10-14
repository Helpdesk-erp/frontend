import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, InputAdornment, LinearProgress,
  MenuItem, Stack, TextField, Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SearchIcon from '@mui/icons-material/Search'
import { api } from '../api/cliente.js'
import { PAQUETES } from '../utilidades/formato.js'
import { useRetraso } from '../utilidades/useRetraso.js'
import { ChipPaquete } from './Chips.jsx'
import Vacio from './Vacio.jsx'

/**
 * Búsqueda en lenguaje natural sobre la base de conocimiento. Consulta el
 * backend 300 ms después de la última tecla; el backend usa el índice de texto.
 *
 * @param {boolean} conFiltroPaquete muestra el selector de paquete
 */
export default function BuscadorConocimiento({ conFiltroPaquete = false }) {
  const [texto, setTexto] = useState('')
  const [paquete, setPaquete] = useState('')
  const termino = useRetraso(texto.trim(), 300)

  const { data: articulos = [], isFetching, error } = useQuery({
    queryKey: ['conocimiento', termino, paquete],
    queryFn: () => api('/conocimiento/buscar', { consulta: { q: termino, ...(paquete && { paquete }) } }),
    enabled: termino.length >= 2,
    placeholderData: keepPreviousData,
  })

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          fullWidth
          size="small"
          label="Describa el problema"
          placeholder="Por ejemplo: no puedo ingresar al POS"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> },
          }}
        />
        {conFiltroPaquete && (
          <TextField
            select
            size="small"
            label="Paquete"
            value={paquete}
            onChange={(e) => setPaquete(e.target.value)}
            sx={{ minWidth: { sm: 200 } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(PAQUETES).map(([codigo, nombre]) => (
              <MenuItem key={codigo} value={codigo}>{nombre}</MenuItem>
            ))}
          </TextField>
        )}
      </Stack>

      <Box sx={{ minHeight: 4 }}>{isFetching && <LinearProgress />}</Box>

      {error && <Alert severity="error">{error.message}</Alert>}

      {termino.length < 2 ? (
        <Vacio>Escriba el problema con sus palabras. La búsqueda ignora tildes y palabras como «el», «de» o «no».</Vacio>
      ) : articulos.length === 0 && !isFetching ? (
        <Vacio>No hay artículos que coincidan con «{termino}». Pruebe con otras palabras.</Vacio>
      ) : (
        <Box>
          {articulos.map((articulo) => (
            <Accordion key={articulo.id} disableGutters variant="outlined" sx={{ '&:not(:last-of-type)': { borderBottom: 0 } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' }, pr: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{articulo.titulo}</Typography>
                  <Box><ChipPaquete paquete={articulo.paquete} /></Box>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>{articulo.problema}</Typography>
                <Typography variant="subtitle2">Pasos</Typography>
                <Box component="ol" sx={{ mt: 0.5, mb: 1.5, pl: 2.5 }}>
                  {articulo.pasos.map((paso) => (
                    <Typography key={paso} component="li" variant="body2" sx={{ mb: 0.5 }}>{paso}</Typography>
                  ))}
                </Box>
                <Typography variant="subtitle2">Solución</Typography>
                <Typography variant="body2">{articulo.solucion}</Typography>
                <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mt: 1.5 }}>
                  {articulo.id} · sale del ticket {articulo.ticket_id}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Stack>
  )
}
