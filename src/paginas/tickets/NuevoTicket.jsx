import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Box, Button, Divider, Grid, MenuItem, Skeleton, Stack, Typography } from '@mui/material'
import { api } from '../../api/cliente.js'
import { CargandoDashboard, ErrorCarga } from '../../componentes/Cargando.jsx'
import CampoTexto from '../../componentes/CampoTexto.jsx'
import Encabezado from '../../componentes/Encabezado.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import { useAvisos } from '../../utilidades/avisos.js'
import { PRIORIDADES, TIPOS_TICKET } from '../../utilidades/formato.js'
import { aplicarErrores, URL_WEB } from '../../utilidades/formularios.js'

// Formatos del oneOf de tickets en 01_esquema.js que campos_ticket no describe (los mismos de TicketService.java)
const REGLAS_DETALLE = {
  codigo_barras: { value: /^[0-9]{8,14}$/, message: 'Entre 8 y 14 dígitos' },
  orden_compra: { value: /^OC-[0-9]+$/, message: 'Formato OC-004512' },
  nit_proveedor: { value: /^[0-9]{6,10}$/, message: 'Solo números, entre 6 y 10 dígitos' },
}
const NO_NEGATIVOS = ['cantidad_sistema', 'cantidad_fisica']
const NUMERO = /^-?[0-9]+([.,][0-9]+)?$/

/** Reglas de React Hook Form para un campo de paquetes.campos_ticket. */
function reglas(campo) {
  const r = {}
  if (campo.requerido) r.required = 'Este campo es obligatorio'
  if (campo.tipo === 'url') r.pattern = { value: URL_WEB, message: 'Debe empezar por http:// o https://' }
  if (campo.tipo === 'numero') {
    r.validate = (valor) => {
      if (!valor) return true
      if (!NUMERO.test(valor)) return 'Escriba un número'
      if (NO_NEGATIVOS.includes(campo.campo) && Number(valor.replace(',', '.')) < 0) return 'No puede ser negativo'
      return true
    }
  }
  if (REGLAS_DETALLE[campo.campo]) r.pattern = REGLAS_DETALLE[campo.campo]
  return r
}

/**
 * Campos técnicos del paquete escogido (RF-19). Se arman con
 * GET /api/paquetes/{id}: agregar un campo en la base lo muestra aquí sin
 * cambiar código.
 */
function CamposPaquete({ control, paquete }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['paquete', paquete],
    queryFn: () => api(`/paquetes/${paquete}`),
    staleTime: 5 * 60_000,
  })

  if (isPending) return <Skeleton variant="rounded" height={120} />
  if (error) return <ErrorCarga error={error} />

  return (
    <Grid container spacing={2}>
      {data.campos_ticket.map((campo) => {
        const comunes = {
          control,
          name: `detalle.${campo.campo}`,
          label: campo.etiqueta + (campo.requerido ? '' : ' (opcional)'),
          helperText: campo.ayuda,
          rules: reglas(campo),
        }
        const ancho = campo.tipo === 'texto_largo' ? 12 : { xs: 12, sm: 6 }
        return (
          <Grid key={campo.campo} size={ancho}>
            {campo.tipo === 'lista' ? (
              <CampoTexto {...comunes} select>
                {!campo.requerido && <MenuItem value="">Sin especificar</MenuItem>}
                {campo.opciones.map((opcion) => <MenuItem key={opcion} value={opcion}>{opcion}</MenuItem>)}
              </CampoTexto>
            ) : campo.tipo === 'texto_largo' ? (
              <CampoTexto {...comunes} multiline minRows={3} />
            ) : (
              <CampoTexto
                {...comunes}
                type={campo.tipo === 'url' ? 'url' : 'text'}
                slotProps={campo.tipo === 'numero' ? { htmlInput: { inputMode: 'decimal' } } : undefined}
                placeholder={campo.tipo === 'url' ? 'https://' : undefined}
              />
            )}
          </Grid>
        )
      })}
    </Grid>
  )
}

/** RF-20. Solo se ofrecen los paquetes que el cliente tiene activos. */
export default function NuevoTicket() {
  const navegar = useNavigate()
  const avisar = useAvisos()
  const queryClient = useQueryClient()
  const [parametros] = useSearchParams()
  const [errorServidor, setErrorServidor] = useState(null)

  const { data: cliente, isPending, error } = useQuery({ queryKey: ['cliente', 'mio'], queryFn: () => api('/clientes/mio') })

  const { control, handleSubmit, setError, formState: { isSubmitting } } = useForm({
    // Al cambiar de paquete, los campos técnicos del anterior se quitan del formulario
    shouldUnregister: true,
    defaultValues: { paquete: parametros.get('paquete') ?? '', tipo: 'incidente', prioridad: 'media', asunto: '', descripcion: '' },
  })
  const paquete = useWatch({ control, name: 'paquete' })

  if (isPending) return <CargandoDashboard />
  if (error) return <ErrorCarga error={error} />

  const contratados = cliente.paquetes_contratados ?? []
  const activos = contratados.filter((p) => p.estado === 'activo')

  const enviar = async (datos) => {
    setErrorServidor(null)
    try {
      const ticket = await api('/tickets', { metodo: 'POST', cuerpo: datos })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      avisar(`Ticket ${ticket.id} creado. Un administrador lo asignará a un agente`)
      navegar(`/tickets/${ticket.id}`, { replace: true })
    } catch (e) {
      setErrorServidor(aplicarErrores(e, setError))
    }
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 860 }}>
      <Encabezado titulo="Nuevo ticket" subtitulo="Cuéntenos qué falla. Los datos técnicos cambian según el paquete." />

      {activos.length === 0 ? (
        <Alert severity="warning">
          No tiene paquetes activos, así que por ahora no puede abrir tickets.
          {contratados.length > 0 ? ' Sus paquetes están suspendidos por pagos pendientes.' : ' Comuníquese con un asesor para contratar uno.'}
        </Alert>
      ) : (
        <Box component="form" noValidate onSubmit={handleSubmit(enviar)}>
          <Stack spacing={3}>
            {errorServidor && <Alert severity="error">{errorServidor}</Alert>}

            <Seccion titulo="El problema">
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CampoTexto control={control} name="paquete" label="Paquete afectado" select rules={{ required: 'Seleccione el paquete' }}>
                    {contratados.map((p) => (
                      <MenuItem key={p.paquete_id} value={p.paquete_id} disabled={p.estado !== 'activo'}>
                        {p.nombre}{p.estado !== 'activo' && ` (${p.estado})`}
                      </MenuItem>
                    ))}
                  </CampoTexto>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <CampoTexto control={control} name="tipo" label="Tipo" select>
                    {Object.entries(TIPOS_TICKET).map(([valor, texto]) => <MenuItem key={valor} value={valor}>{texto}</MenuItem>)}
                  </CampoTexto>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <CampoTexto control={control} name="prioridad" label="Prioridad" select>
                    {Object.entries(PRIORIDADES).map(([valor, texto]) => <MenuItem key={valor} value={valor}>{texto}</MenuItem>)}
                  </CampoTexto>
                </Grid>
                <Grid size={12}>
                  <CampoTexto
                    control={control}
                    name="asunto"
                    label="Asunto"
                    placeholder="Por ejemplo: la impresora de la caja no imprime la factura"
                    rules={{ required: 'Escriba el asunto', maxLength: { value: 150, message: 'Máximo 150 caracteres' } }}
                  />
                </Grid>
                <Grid size={12}>
                  <CampoTexto
                    control={control}
                    name="descripcion"
                    label="Descripción"
                    multiline
                    minRows={4}
                    helperText="Qué estaba haciendo, qué esperaba que pasara y qué pasó"
                    rules={{ required: 'Describa el problema', maxLength: { value: 3000, message: 'Máximo 3000 caracteres' } }}
                  />
                </Grid>
              </Grid>
            </Seccion>

            <Seccion titulo="Datos técnicos" subtitulo="Ayudan a soporte a encontrar la causa sin tener que llamarlo">
              <Box sx={{ pt: 1 }}>
                {paquete ? (
                  <CamposPaquete key={paquete} control={control} paquete={paquete} />
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Seleccione primero el paquete afectado.</Typography>
                )}
              </Box>
            </Seccion>

            <Divider />
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
              <Button component={RouterLink} to="/tickets">Cancelar</Button>
              <Button type="submit" variant="contained" loading={isSubmitting}>Crear ticket</Button>
            </Stack>
          </Stack>
        </Box>
      )}
    </Stack>
  )
}
