import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link as RouterLink, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Alert, Box, Button, Divider, Grid, MenuItem, Stack } from '@mui/material'
import { api } from '../../api/cliente.js'
import CampoTexto from '../../componentes/CampoTexto.jsx'
import DialogoClave from '../../componentes/DialogoClave.jsx'
import Encabezado from '../../componentes/Encabezado.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import { DEPARTAMENTOS, NOMBRE_DOCUMENTO, TIPOS_CLIENTE } from '../../utilidades/formato.js'
import { aplicarErrores, CELULAR, CORREO, DOCUMENTO, MENSAJE_USUARIO, SOLO_LETRAS, USUARIO } from '../../utilidades/formularios.js'

// Mismas reglas del anyOf de clientes: persona natural con CC o CE; empresa o persona jurídica con NIT y representante
const DOCUMENTOS = { persona_natural: ['CC', 'CE'], empresa: ['NIT'], persona_juridica: ['NIT'] }
const NOMBRE = { persona_natural: 'Nombre completo', empresa: 'Nombre comercial', persona_juridica: 'Razón social' }
const REPRESENTANTE = { empresa: 'Propietario', persona_juridica: 'Representante legal' }

/**
 * RF-11. El administrador registra el cliente y su cuenta en una transacción;
 * la contraseña la genera el sistema y se muestra una sola vez.
 */
export default function NuevoCliente() {
  const navegar = useNavigate()
  const queryClient = useQueryClient()
  const [errorServidor, setErrorServidor] = useState(null)
  const [creado, setCreado] = useState(null)
  const { control, handleSubmit, setValue, setError, getValues, formState: { isSubmitting } } = useForm({
    defaultValues: {
      tipo_cliente: 'empresa', tipo_documento: 'NIT', numero_documento: '', nombre: '', representante: '', correo: '', telefono: '',
      direccion: { direccion: '', ciudad: '', departamento: 'Norte de Santander' }, usuario: '',
    },
  })
  const tipoCliente = useWatch({ control, name: 'tipo_cliente' })

  useEffect(() => {
    if (!DOCUMENTOS[tipoCliente].includes(getValues('tipo_documento'))) {
      setValue('tipo_documento', DOCUMENTOS[tipoCliente][0])
    }
  }, [tipoCliente, getValues, setValue])

  const enviar = async ({ representante, ...datos }) => {
    setErrorServidor(null)
    try {
      const cuenta = await api('/clientes', {
        metodo: 'POST',
        cuerpo: { ...datos, correo: datos.correo.trim().toLowerCase(), ...(REPRESENTANTE[datos.tipo_cliente] && { representante: representante.trim() }) },
      })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'administrador'] })
      setCreado(cuenta)
    } catch (e) {
      setErrorServidor(aplicarErrores(e, setError))
    }
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 860 }}>
      <Encabezado titulo="Registrar cliente" subtitulo="Crea el cliente y su cuenta de acceso. Los paquetes se contratan después, desde el detalle del cliente." />

      <Box component="form" noValidate onSubmit={handleSubmit(enviar)}>
        <Stack spacing={3}>
          {errorServidor && <Alert severity="error">{errorServidor}</Alert>}

          <Seccion titulo="Identificación">
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <CampoTexto control={control} name="tipo_cliente" label="Tipo de cliente" select>
                  {Object.entries(TIPOS_CLIENTE).map(([valor, texto]) => <MenuItem key={valor} value={valor}>{texto}</MenuItem>)}
                </CampoTexto>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <CampoTexto control={control} name="tipo_documento" label="Tipo de documento" select>
                  {DOCUMENTOS[tipoCliente].map((d) => <MenuItem key={d} value={d}>{NOMBRE_DOCUMENTO[d]}</MenuItem>)}
                </CampoTexto>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <CampoTexto control={control} name="numero_documento" label="Número de documento" slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                  rules={{ required: 'Escriba el número de documento', pattern: { value: DOCUMENTO, message: 'Solo números, entre 6 y 10 dígitos' } }} />
              </Grid>
              <Grid size={12}>
                <CampoTexto control={control} name="nombre" label={NOMBRE[tipoCliente]}
                  rules={{ required: 'Escriba el nombre', maxLength: { value: 120, message: 'Máximo 120 caracteres' } }} />
              </Grid>
              {REPRESENTANTE[tipoCliente] && (
                <Grid size={12}>
                  <CampoTexto control={control} name="representante" label={REPRESENTANTE[tipoCliente]}
                    rules={{ required: `Escriba el nombre del ${REPRESENTANTE[tipoCliente].toLowerCase()}`, pattern: { value: SOLO_LETRAS, message: 'Solo letras' } }} />
                </Grid>
              )}
            </Grid>
          </Seccion>

          <Seccion titulo="Contacto y dirección">
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <CampoTexto control={control} name="correo" label="Correo" type="email"
                  rules={{ required: 'Escriba el correo', pattern: { value: CORREO, message: 'Correo no válido' } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <CampoTexto control={control} name="telefono" label="Celular" slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                  rules={{ required: 'Escriba el celular', pattern: { value: CELULAR, message: 'Debe tener 10 dígitos' } }} />
              </Grid>
              <Grid size={12}>
                <CampoTexto control={control} name="direccion.direccion" label="Dirección" rules={{ required: 'Escriba la dirección' }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CampoTexto control={control} name="direccion.ciudad" label="Ciudad o municipio" rules={{ required: 'Escriba la ciudad' }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CampoTexto control={control} name="direccion.departamento" label="Departamento" select rules={{ required: 'Seleccione el departamento' }}>
                  {DEPARTAMENTOS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </CampoTexto>
              </Grid>
            </Grid>
          </Seccion>

          <Seccion titulo="Cuenta de acceso" subtitulo="El correo de la cuenta es el mismo del cliente. La contraseña temporal la genera el sistema">
            <Box sx={{ pt: 1 }}>
              <CampoTexto control={control} name="usuario" label="Nombre de usuario" helperText="Por ejemplo: panaderia.trigodeoro"
                rules={{ required: 'Escriba el nombre de usuario', pattern: { value: USUARIO, message: MENSAJE_USUARIO } }} />
            </Box>
          </Seccion>

          <Divider />
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
            <Button component={RouterLink} to="/clientes">Cancelar</Button>
            <Button type="submit" variant="contained" loading={isSubmitting}>Registrar cliente</Button>
          </Stack>
        </Stack>
      </Box>

      <DialogoClave cuenta={creado} onCerrar={() => navegar(`/clientes/${creado.registro.id}`, { replace: true })} />
    </Stack>
  )
}
