import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Box, Button, Divider, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import { api } from '../../api/cliente.js'
import CampoTexto from '../../componentes/CampoTexto.jsx'
import { CargandoDashboard, ErrorCarga } from '../../componentes/Cargando.jsx'
import { ChipPaquete } from '../../componentes/Chips.jsx'
import Encabezado from '../../componentes/Encabezado.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import { useAvisos } from '../../utilidades/avisos.js'
import { aplicarErrores } from '../../utilidades/formularios.js'

/**
 * RF-31. Parte de un ticket resuelto: el título, el problema y la solución
 * llegan llenos con lo que escribieron el cliente y el agente, para editarlos.
 */
function Formulario({ ticket }) {
  const navegar = useNavigate()
  const avisar = useAvisos()
  const queryClient = useQueryClient()
  const [errorServidor, setErrorServidor] = useState(null)
  const { control, handleSubmit, setError, formState: { isSubmitting } } = useForm({
    defaultValues: {
      titulo: ticket.asunto,
      problema: ticket.descripcion,
      pasos: [{ texto: '' }, { texto: '' }],
      solucion: ticket.solucion ?? '',
      palabras_clave: '',
      contacto: '',
    },
  })
  const pasos = useFieldArray({ control, name: 'pasos' })

  const enviar = async ({ pasos: listaPasos, palabras_clave: palabras, ...datos }) => {
    setErrorServidor(null)
    try {
      const articulo = await api('/conocimiento', {
        metodo: 'POST',
        cuerpo: {
          ...datos,
          ticket_id: ticket.id,
          pasos: listaPasos.map((p) => p.texto),
          palabras_clave: palabras.split(',').map((p) => p.trim()).filter(Boolean),
        },
      })
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      avisar(`Artículo ${articulo.id} publicado en la base de conocimiento`)
      navegar(`/tickets/${ticket.id}`, { replace: true })
    } catch (e) {
      // "pasos[1]" del backend corresponde al campo "pasos.1.texto" del formulario
      const errores = Object.fromEntries(Object.entries(e.errores).map(([c, m]) => [c.replace(/^pasos\[(\d+)\]$/, 'pasos.$1.texto'), m]))
      setErrorServidor(aplicarErrores({ ...e, message: e.message, errores }, setError))
    }
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(enviar)}>
      <Stack spacing={3}>
        {errorServidor && <Alert severity="error">{errorServidor}</Alert>}

        <Seccion titulo="El caso">
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={12}>
              <CampoTexto
                control={control}
                name="titulo"
                label="Título"
                helperText="Como lo buscaría otra persona con el mismo problema"
                rules={{ required: 'Escriba el título', maxLength: { value: 150, message: 'Máximo 150 caracteres' } }}
              />
            </Grid>
            <Grid size={12}>
              <CampoTexto control={control} name="problema" label="Problema" multiline minRows={3} rules={{ required: 'Describa el problema' }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CampoTexto
                control={control}
                name="contacto"
                label="Persona que reportó (opcional)"
                placeholder={ticket.cliente?.representante ?? ticket.cliente?.nombre}
                helperText="Si lo deja vacío se usa el representante del cliente"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CampoTexto
                control={control}
                name="palabras_clave"
                label="Palabras clave"
                placeholder="cookies, navegador, inicio de sesión"
                helperText="Separadas por comas"
              />
            </Grid>
          </Grid>
        </Seccion>

        <Seccion titulo="Pasos" subtitulo="Lo que hizo soporte, en orden">
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            {pasos.fields.map((paso, i) => (
              <Stack key={paso.id} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 20, pt: 2 }}>{i + 1}.</Typography>
                <CampoTexto control={control} name={`pasos.${i}.texto`} label={`Paso ${i + 1}`} rules={{ required: 'Escriba el paso o quítelo' }} />
                <Tooltip title="Quitar paso">
                  <span>
                    <IconButton onClick={() => pasos.remove(i)} disabled={pasos.fields.length === 1} aria-label={`Quitar paso ${i + 1}`} sx={{ mt: 1 }}>
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            ))}
            <Box>
              <Button startIcon={<AddIcon />} onClick={() => pasos.append({ texto: '' })} disabled={pasos.fields.length >= 30}>
                Agregar paso
              </Button>
            </Box>
          </Stack>
        </Seccion>

        <Seccion titulo="Solución">
          <Box sx={{ pt: 1 }}>
            <CampoTexto control={control} name="solucion" label="Resultado" multiline minRows={3} rules={{ required: 'Escriba la solución' }} />
          </Box>
        </Seccion>

        <Divider />
        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
          <Button component={RouterLink} to={`/tickets/${ticket.id}`}>Cancelar</Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>Publicar artículo</Button>
        </Stack>
      </Stack>
    </Box>
  )
}

export default function NuevoArticulo() {
  const { ticketId } = useParams()
  const { data: ticket, isPending, error } = useQuery({ queryKey: ['ticket', ticketId], queryFn: () => api(`/tickets/${ticketId}`) })

  if (isPending) return <CargandoDashboard />
  if (error) return <ErrorCarga error={error} />

  return (
    <Stack spacing={3} sx={{ maxWidth: 860 }}>
      <Encabezado titulo="Nuevo artículo" subtitulo="Documente la solución para que el próximo caso se resuelva más rápido." />
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>A partir del ticket {ticket.id}</Typography>
        <ChipPaquete paquete={ticket.paquete} />
      </Stack>
      {ticket.articulo_id ? (
        <Alert severity="info">Este ticket ya está documentado en el artículo {ticket.articulo_id}.</Alert>
      ) : !['resuelto', 'cerrado'].includes(ticket.estado) ? (
        <Alert severity="warning">Solo se documentan tickets resueltos o cerrados.</Alert>
      ) : (
        <Formulario ticket={ticket} />
      )}
    </Stack>
  )
}
