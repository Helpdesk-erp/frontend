import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link as RouterLink } from 'react-router'
import {
  Alert, Box, Button, Divider, FormControlLabel, Grid, Link, MenuItem, Radio, RadioGroup, Stack, Typography,
} from '@mui/material'
import { useSesion } from '../auth/sesion.js'
import CampoTexto from '../componentes/CampoTexto.jsx'
import PanelMarca from '../componentes/PanelMarca.jsx'
import { DEPARTAMENTOS } from '../utilidades/formato.js'

// Mismas reglas del $jsonSchema de clientes y usuarios (base_datos/01_esquema.js)
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/
const CORREO = /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

const TIPOS = {
  persona_natural: {
    titulo: 'Persona natural',
    detalle: 'Contrata a título propio, con cédula.',
    nombre: 'Nombre completo',
    documentos: ['CC', 'CE'],
  },
  empresa: {
    titulo: 'Empresa',
    detalle: 'Negocio de un comerciante, como una tienda o una panadería.',
    nombre: 'Nombre comercial',
    representante: 'Propietario',
    documentos: ['NIT'],
  },
  persona_juridica: {
    titulo: 'Persona jurídica',
    detalle: 'Sociedad (S.A.S., Ltda.) con representante legal.',
    nombre: 'Razón social',
    representante: 'Representante legal',
    documentos: ['NIT'],
  },
}

const NOMBRE_DOCUMENTO = { CC: 'Cédula de ciudadanía', CE: 'Cédula de extranjería', NIT: 'NIT' }

function TituloSeccion({ children }) {
  return <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>{children}</Typography>
}

export default function Registro() {
  const { registrar } = useSesion()
  const [errorServidor, setErrorServidor] = useState(null)
  const { control, handleSubmit, setValue, setError, getValues, formState: { isSubmitting } } = useForm({
    defaultValues: {
      tipo_cliente: 'empresa',
      tipo_documento: 'NIT',
      numero_documento: '',
      nombre: '',
      representante: '',
      correo: '',
      telefono: '',
      direccion: { direccion: '', ciudad: '', departamento: 'Norte de Santander' },
      usuario: '',
      password: '',
      confirmar: '',
    },
  })

  const tipoCliente = useWatch({ control, name: 'tipo_cliente' })
  const tipo = TIPOS[tipoCliente]

  // Al cambiar el tipo de cliente, el tipo de documento pasa a uno válido para ese tipo
  useEffect(() => {
    if (!TIPOS[tipoCliente].documentos.includes(getValues('tipo_documento'))) {
      setValue('tipo_documento', TIPOS[tipoCliente].documentos[0])
    }
  }, [tipoCliente, getValues, setValue])

  // Al registrarse queda la sesión iniciada y SoloInvitado lleva al dashboard del cliente
  const enviar = async ({ confirmar: _confirmar, representante, ...datos }) => {
    setErrorServidor(null)
    try {
      await registrar({
        ...datos,
        correo: datos.correo.trim().toLowerCase(),
        ...(tipo.representante && { representante: representante.trim() }),
      })
    } catch (error) {
      // El backend devuelve el mensaje de cada campo con el mismo nombre del formulario
      Object.entries(error.errores).forEach(([campo, mensaje]) => setError(campo, { type: 'servidor', message: mensaje }))
      setErrorServidor(error.message)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' } }}>
      <PanelMarca />
      <Box sx={{ display: 'flex', justifyContent: 'center', px: 2, py: { xs: 4, md: 6 } }}>
        <Box component="form" noValidate onSubmit={handleSubmit(enviar)} sx={{ width: '100%', maxWidth: 640 }}>
          <Typography variant="h4" component="h1">Crear cuenta</Typography>
          <Typography sx={{ color: 'text.secondary', mt: 1, mb: 3 }}>
            Registre su negocio para reportar fallas y consultar la base de conocimiento.
            Los paquetes se contratan después con un asesor.
          </Typography>

          <Stack spacing={3}>
            {errorServidor && <Alert severity="error">{errorServidor}</Alert>}

            <Box>
              <TituloSeccion>¿Quién contrata?</TituloSeccion>
              <Controller
                name="tipo_cliente"
                control={control}
                render={({ field }) => (
                  <RadioGroup {...field} sx={{ mt: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
                    {Object.entries(TIPOS).map(([valor, t]) => (
                      <FormControlLabel
                        key={valor}
                        value={valor}
                        control={<Radio size="small" />}
                        label={
                          <Box sx={{ py: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.titulo}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t.detalle}</Typography>
                          </Box>
                        }
                        sx={{
                          m: 0, pr: 1.5, alignItems: 'flex-start', border: 1, borderRadius: 2,
                          borderColor: field.value === valor ? 'primary.main' : 'divider',
                          '& .MuiRadio-root': { mt: 0.5 },
                        }}
                      />
                    ))}
                  </RadioGroup>
                )}
              />
            </Box>

            <Divider />
            <TituloSeccion>Identificación</TituloSeccion>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 5 }}>
                <CampoTexto control={control} name="tipo_documento" label="Tipo de documento" select>
                  {tipo.documentos.map((d) => <MenuItem key={d} value={d}>{NOMBRE_DOCUMENTO[d]}</MenuItem>)}
                </CampoTexto>
              </Grid>
              <Grid size={{ xs: 12, sm: 7 }}>
                <CampoTexto
                  control={control}
                  name="numero_documento"
                  label="Número de documento"
                  helperText={tipoCliente === 'persona_natural' ? 'Solo números' : 'Solo números, sin dígito de verificación'}
                  slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                  rules={{
                    required: 'Escriba el número de documento',
                    pattern: { value: /^[0-9]{6,10}$/, message: 'Solo números, entre 6 y 10 dígitos' },
                  }}
                />
              </Grid>
              <Grid size={12}>
                <CampoTexto
                  control={control}
                  name="nombre"
                  label={tipo.nombre}
                  rules={{ required: 'Escriba el nombre', maxLength: { value: 120, message: 'Máximo 120 caracteres' } }}
                />
              </Grid>
              {tipo.representante && (
                <Grid size={12}>
                  <CampoTexto
                    control={control}
                    name="representante"
                    label={tipo.representante}
                    rules={{
                      required: `Escriba el nombre del ${tipo.representante.toLowerCase()}`,
                      pattern: { value: SOLO_LETRAS, message: 'Solo letras' },
                    }}
                  />
                </Grid>
              )}
            </Grid>

            <Divider />
            <TituloSeccion>Contacto y dirección</TituloSeccion>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <CampoTexto
                  control={control}
                  name="correo"
                  label="Correo"
                  type="email"
                  autoComplete="email"
                  rules={{ required: 'Escriba el correo', pattern: { value: CORREO, message: 'Correo no válido' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <CampoTexto
                  control={control}
                  name="telefono"
                  label="Celular"
                  autoComplete="tel"
                  slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                  rules={{ required: 'Escriba el celular', pattern: { value: /^[0-9]{10}$/, message: 'Debe tener 10 dígitos' } }}
                />
              </Grid>
              <Grid size={12}>
                <CampoTexto
                  control={control}
                  name="direccion.direccion"
                  label="Dirección"
                  placeholder="Calle 10 # 12-45"
                  rules={{ required: 'Escriba la dirección' }}
                />
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

            <Divider />
            <TituloSeccion>Cuenta de acceso</TituloSeccion>
            <Grid container spacing={2}>
              <Grid size={12}>
                <CampoTexto
                  control={control}
                  name="usuario"
                  label="Nombre de usuario"
                  autoComplete="username"
                  helperText="Minúsculas, números, punto o guion bajo. Por ejemplo: panaderia.trigodeoro"
                  rules={{
                    required: 'Escriba el nombre de usuario',
                    pattern: { value: /^[a-z0-9._]{4,30}$/, message: 'Entre 4 y 30 caracteres: minúsculas, números, punto o guion bajo' },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CampoTexto
                  control={control}
                  name="password"
                  label="Contraseña"
                  type="password"
                  autoComplete="new-password"
                  helperText="Mínimo 8 caracteres, con letras y números"
                  rules={{
                    required: 'Escriba la contraseña',
                    minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                    pattern: { value: /^(?=.*[A-Za-z])(?=.*[0-9]).+$/, message: 'Debe tener letras y números' },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CampoTexto
                  control={control}
                  name="confirmar"
                  label="Repita la contraseña"
                  type="password"
                  autoComplete="new-password"
                  rules={{ validate: (valor) => valor === getValues('password') || 'Las contraseñas no coinciden' }}
                />
              </Grid>
            </Grid>

            <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
              Crear cuenta
            </Button>
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              ¿Ya tiene cuenta? <Link component={RouterLink} to="/login">Inicie sesión</Link>
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
