import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Stack, Typography,
} from '@mui/material'
import { api } from '../api/cliente.js'
import { aplicarErrores, mesActual } from '../utilidades/formularios.js'
import { METODOS_PAGO, pesos } from '../utilidades/formato.js'
import CampoTexto from './CampoTexto.jsx'

/**
 * RF-34 y RF-35. Un pago rechazado suspende el paquete en la misma transacción;
 * uno aprobado sobre un paquete suspendido lo reactiva. El valor es el precio
 * con el que el cliente contrató el paquete.
 *
 * @param {string} clienteId si viene, el cliente queda fijo (detalle del cliente)
 * @param {(respuesta) => void} onRegistrado recibe { pago, estado_paquete, estado_cliente }
 */
export default function DialogoPago({ abierto, clienteId, onCerrar, onRegistrado }) {
  const [errorServidor, setErrorServidor] = useState(null)
  const { control, handleSubmit, setError, setValue, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      cliente_id: clienteId ?? '', paquete_id: '', periodo: mesActual(), metodo: 'PSE', estado: 'aprobado', referencia: '', motivo_rechazo: '',
    },
  })
  const [clienteEscogido, paqueteId, estado] = useWatch({ control, name: ['cliente_id', 'paquete_id', 'estado'] })

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => api('/clientes'),
    enabled: abierto && !clienteId,
  })
  const { data: detalle } = useQuery({
    queryKey: ['cliente', clienteEscogido],
    queryFn: () => api(`/clientes/${clienteEscogido}`),
    enabled: abierto && Boolean(clienteEscogido),
  })
  const paquetes = (detalle?.cliente.paquetes_contratados ?? []).filter((p) => p.estado !== 'vencido')
  const paquete = paquetes.find((p) => p.paquete_id === paqueteId)

  const cerrar = () => {
    reset()
    setErrorServidor(null)
    onCerrar()
  }

  const enviar = async ({ motivo_rechazo: motivo, ...datos }) => {
    setErrorServidor(null)
    try {
      const respuesta = await api('/pagos', {
        metodo: 'POST',
        cuerpo: { ...datos, ...(datos.estado === 'rechazado' && { motivo_rechazo: motivo }) },
      })
      reset()
      onRegistrado(respuesta)
    } catch (e) {
      setErrorServidor(aplicarErrores(e, setError))
    }
  }

  return (
    <Dialog open={abierto} onClose={cerrar} maxWidth="sm" fullWidth>
      <Box component="form" noValidate onSubmit={handleSubmit(enviar)}>
        <DialogTitle>Registrar pago</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errorServidor && <Alert severity="error">{errorServidor}</Alert>}
            <Grid container spacing={2}>
              {!clienteId && (
                <Grid size={12}>
                  <CampoTexto
                    control={control}
                    name="cliente_id"
                    label="Cliente"
                    select
                    rules={{ required: 'Seleccione el cliente' }}
                    onChange={(e) => {
                      setValue('cliente_id', e.target.value, { shouldValidate: true })
                      setValue('paquete_id', '')
                    }}
                  >
                    {clientes.filter((c) => c.estado !== 'inactivo' && c.paquetes.length > 0).map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.nombre} · {c.id}</MenuItem>
                    ))}
                  </CampoTexto>
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 7 }}>
                <CampoTexto control={control} name="paquete_id" label="Paquete" select disabled={!clienteEscogido} rules={{ required: 'Seleccione el paquete' }}>
                  {paquetes.map((p) => (
                    <MenuItem key={p.paquete_id} value={p.paquete_id}>
                      {p.nombre}{p.estado === 'suspendido' && ' (suspendido)'}
                    </MenuItem>
                  ))}
                </CampoTexto>
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <CampoTexto
                  control={control}
                  name="periodo"
                  label="Mes que paga"
                  type="month"
                  slotProps={{ inputLabel: { shrink: true } }}
                  rules={{ required: 'Seleccione el mes', pattern: { value: /^[0-9]{4}-(0[1-9]|1[0-2])$/, message: 'Formato 2026-10' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CampoTexto control={control} name="metodo" label="Método de pago" select>
                  {Object.entries(METODOS_PAGO).map(([valor, texto]) => <MenuItem key={valor} value={valor}>{texto}</MenuItem>)}
                </CampoTexto>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CampoTexto control={control} name="estado" label="Resultado" select>
                  <MenuItem value="aprobado">Aprobado</MenuItem>
                  <MenuItem value="rechazado">Rechazado</MenuItem>
                </CampoTexto>
              </Grid>
              <Grid size={12}>
                <CampoTexto
                  control={control}
                  name="referencia"
                  label="Referencia (opcional)"
                  helperText="Código que devolvió la pasarela o el banco"
                  rules={{ maxLength: { value: 60, message: 'Máximo 60 caracteres' } }}
                />
              </Grid>
              {estado === 'rechazado' && (
                <Grid size={12}>
                  <CampoTexto
                    control={control}
                    name="motivo_rechazo"
                    label="Motivo del rechazo"
                    placeholder="Por ejemplo: fondos insuficientes"
                    rules={{ required: 'Escriba por qué se rechazó el pago', maxLength: { value: 200, message: 'Máximo 200 caracteres' } }}
                  />
                </Grid>
              )}
            </Grid>

            {paquete && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Valor: <strong>{pesos(paquete.precio_mensual)}</strong>, el precio mensual con el que contrató {paquete.nombre}.
              </Typography>
            )}
            {paquete && estado === 'rechazado' && paquete.estado === 'activo' && (
              <Alert severity="warning">El paquete {paquete.nombre} quedará suspendido y el cliente no podrá abrir tickets de ese paquete.</Alert>
            )}
            {paquete && estado === 'aprobado' && paquete.estado === 'suspendido' && (
              <Alert severity="success">El paquete {paquete.nombre} está suspendido. Con este pago se reactiva.</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={cerrar}>Cancelar</Button>
          <Button type="submit" variant="contained" color={estado === 'rechazado' ? 'error' : 'primary'} loading={isSubmitting}>
            {estado === 'rechazado' ? 'Registrar rechazo' : 'Registrar pago'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
