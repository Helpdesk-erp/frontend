import { useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Link as RouterLink, useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Box, Button, Divider, Grid, IconButton, MenuItem, Stack, Tooltip, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import { api } from '../../api/cliente.js'
import CampoTexto from '../../componentes/CampoTexto.jsx'
import Encabezado from '../../componentes/Encabezado.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import { useAvisos } from '../../utilidades/avisos.js'
import { PAQUETES } from '../../utilidades/formato.js'
import { aFechaHoraBogota, aplicarErrores, URL_WEB } from '../../utilidades/formularios.js'

const SESION_VACIA = { tema: '', fecha_inicio: '', fecha_fin: '' }

/**
 * RF-38. Las fechas se escriben en hora de Colombia. La capacitación empieza
 * con la primera sesión y termina con la última.
 */
export default function NuevaCapacitacion() {
  const navegar = useNavigate()
  const avisar = useAvisos()
  const queryClient = useQueryClient()
  const [errorServidor, setErrorServidor] = useState(null)
  const { data: agentes = [] } = useQuery({ queryKey: ['agentes'], queryFn: () => api('/usuarios/agentes') })
  const { data: clientes = [] } = useQuery({ queryKey: ['clientes'], queryFn: () => api('/clientes') })

  const { control, handleSubmit, setError, getValues, formState: { isSubmitting } } = useForm({
    defaultValues: {
      titulo: '', descripcion: '', paquete: '', tipo: 'masiva', cliente_id: '', modalidad: 'virtual', enlace: '', lugar: '',
      instructor_id: '', cupo_maximo: '30', sesiones: [SESION_VACIA],
    },
  })
  const sesiones = useFieldArray({ control, name: 'sesiones' })
  const [tipo, modalidad, paquete] = useWatch({ control, name: ['tipo', 'modalidad', 'paquete'] })
  // Una personalizada es para un cliente que tenga contratado el paquete
  const clientesDelPaquete = clientes.filter((c) => c.estado !== 'inactivo' && c.paquetes.some((p) => p.paquete_id === paquete))

  const enviar = async (datos) => {
    setErrorServidor(null)
    const cuerpo = {
      ...datos,
      cupo_maximo: Number(datos.cupo_maximo),
      cliente_id: datos.tipo === 'personalizada' ? datos.cliente_id : null,
      enlace: datos.modalidad === 'virtual' ? datos.enlace : null,
      lugar: datos.modalidad === 'presencial' ? datos.lugar : null,
      sesiones: datos.sesiones.map((s) => ({ tema: s.tema, fecha_inicio: aFechaHoraBogota(s.fecha_inicio), fecha_fin: aFechaHoraBogota(s.fecha_fin) })),
    }
    try {
      const capacitacion = await api('/capacitaciones', { metodo: 'POST', cuerpo })
      queryClient.invalidateQueries({ queryKey: ['capacitaciones'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      avisar(`Capacitación ${capacitacion.id} programada`)
      navegar('/capacitaciones')
    } catch (e) {
      setErrorServidor(aplicarErrores(e, setError))
    }
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 900 }}>
      <Encabezado titulo="Programar capacitación" subtitulo="Masiva para todos los clientes del paquete, o personalizada para un cliente." />

      <Box component="form" noValidate onSubmit={handleSubmit(enviar)}>
        <Stack spacing={3}>
          {errorServidor && <Alert severity="error">{errorServidor}</Alert>}

          <Seccion titulo="Contenido">
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <CampoTexto control={control} name="titulo" label="Título" rules={{ required: 'Escriba el título', maxLength: { value: 150, message: 'Máximo 150 caracteres' } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <CampoTexto control={control} name="paquete" label="Paquete" select rules={{ required: 'Seleccione el paquete' }}>
                  {Object.entries(PAQUETES).map(([valor, texto]) => <MenuItem key={valor} value={valor}>{texto}</MenuItem>)}
                </CampoTexto>
              </Grid>
              <Grid size={12}>
                <CampoTexto control={control} name="descripcion" label="Descripción" multiline minRows={2} rules={{ required: 'Escriba la descripción' }} />
              </Grid>
            </Grid>
          </Seccion>

          <Seccion titulo="Organización">
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <CampoTexto control={control} name="tipo" label="Tipo" select>
                  <MenuItem value="masiva">Masiva</MenuItem>
                  <MenuItem value="personalizada">Personalizada</MenuItem>
                </CampoTexto>
              </Grid>
              {tipo === 'personalizada' && (
                <Grid size={{ xs: 12, sm: 8 }}>
                  <CampoTexto
                    control={control}
                    name="cliente_id"
                    label="Cliente"
                    select
                    disabled={!paquete}
                    helperText={paquete ? 'Clientes que tienen contratado el paquete' : 'Seleccione primero el paquete'}
                    rules={{ validate: (v) => getValues('tipo') !== 'personalizada' || Boolean(v) || 'Seleccione el cliente' }}
                  >
                    {clientesDelPaquete.map((c) => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
                  </CampoTexto>
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 4 }}>
                <CampoTexto control={control} name="modalidad" label="Modalidad" select>
                  <MenuItem value="virtual">Virtual</MenuItem>
                  <MenuItem value="presencial">Presencial</MenuItem>
                </CampoTexto>
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                {modalidad === 'virtual' ? (
                  <CampoTexto control={control} name="enlace" label="Enlace de la reunión" placeholder="https://"
                    rules={{ validate: (v) => getValues('modalidad') !== 'virtual' || URL_WEB.test(v) || 'Escriba el enlace, empezando por https://' }} />
                ) : (
                  <CampoTexto control={control} name="lugar" label="Lugar"
                    rules={{ validate: (v) => getValues('modalidad') !== 'presencial' || Boolean(v.trim()) || 'Escriba el lugar' }} />
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <CampoTexto control={control} name="instructor_id" label="Instructor" select rules={{ required: 'Seleccione el instructor' }}>
                  {agentes.map((a) => <MenuItem key={a.agente_id} value={a.agente_id}>{a.nombre}</MenuItem>)}
                </CampoTexto>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <CampoTexto control={control} name="cupo_maximo" label="Cupo máximo" slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                  rules={{ required: 'Escriba el cupo', validate: (v) => (/^[0-9]+$/.test(v) && Number(v) >= 1 && Number(v) <= 500) || 'Entre 1 y 500' }} />
              </Grid>
            </Grid>
          </Seccion>

          <Seccion titulo="Cronograma" subtitulo="Fechas y horas en hora de Colombia">
            <Stack spacing={2} sx={{ pt: 1 }}>
              {sesiones.fields.map((sesion, i) => (
                <Stack key={sesion.id} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'flex-start' } }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 20, pt: { sm: 2 } }}>{i + 1}.</Typography>
                  <CampoTexto control={control} name={`sesiones.${i}.tema`} label="Tema" rules={{ required: 'Escriba el tema' }} />
                  <CampoTexto control={control} name={`sesiones.${i}.fecha_inicio`} label="Inicio" type="datetime-local" slotProps={{ inputLabel: { shrink: true } }}
                    rules={{ required: 'Escriba el inicio', validate: (v) => new Date(aFechaHoraBogota(v)) > new Date() || 'Debe ser en el futuro' }} />
                  <CampoTexto control={control} name={`sesiones.${i}.fecha_fin`} label="Fin" type="datetime-local" slotProps={{ inputLabel: { shrink: true } }}
                    rules={{ required: 'Escriba el fin', validate: (v) => v > getValues(`sesiones.${i}.fecha_inicio`) || 'Debe terminar después de empezar' }} />
                  <Tooltip title="Quitar sesión">
                    <span>
                      <IconButton onClick={() => sesiones.remove(i)} disabled={sesiones.fields.length === 1} aria-label={`Quitar sesión ${i + 1}`} sx={{ mt: { sm: 1 } }}>
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              ))}
              <Box>
                <Button startIcon={<AddIcon />} onClick={() => sesiones.append(SESION_VACIA)} disabled={sesiones.fields.length >= 20}>Agregar sesión</Button>
              </Box>
            </Stack>
          </Seccion>

          <Divider />
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
            <Button component={RouterLink} to="/capacitaciones">Cancelar</Button>
            <Button type="submit" variant="contained" loading={isSubmitting}>Programar</Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  )
}
