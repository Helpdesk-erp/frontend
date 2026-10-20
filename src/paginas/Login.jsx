import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink } from 'react-router'
import {
  Alert, Box, Button, Chip, IconButton, InputAdornment, Link, Stack, Typography,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOffOutlined'
import { useSesion } from '../auth/sesion.js'
import BotonTema from '../componentes/BotonTema.jsx'
import CampoTexto from '../componentes/CampoTexto.jsx'
import PanelMarca from '../componentes/PanelMarca.jsx'

// Solo se muestran con `npm run dev`. La contraseña está en base_datos/README.md
const USUARIOS_PRUEBA = [
  { usuario: 'andres.carrascal', rol: 'Administrador' },
  { usuario: 'laura.pacheco', rol: 'Auditora' },
  { usuario: 'jhon.ascanio', rol: 'Agente' },
  { usuario: 'ferresantaclara', rol: 'Cliente' },
  { usuario: 'camilo.rolon', rol: 'Cliente con paquete suspendido' },
]

export default function Login() {
  const { login, aviso } = useSesion()
  const [verClave, setVerClave] = useState(false)
  const [errorServidor, setErrorServidor] = useState(null)
  const { control, handleSubmit, setValue, setFocus, formState: { isSubmitting } } = useForm({
    defaultValues: { usuario: '', password: '' },
  })

  // Al iniciar sesión, SoloInvitado (en App.jsx) lleva al dashboard del rol
  const enviar = async (datos) => {
    setErrorServidor(null)
    try {
      await login(datos)
    } catch (error) {
      setErrorServidor(error.message)
    }
  }

  const usarUsuarioPrueba = (usuario) => {
    setValue('usuario', usuario, { shouldValidate: true })
    // Se aplaza para que el foco no se quede en el chip que se acaba de pulsar
    setTimeout(() => setFocus('password'))
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
      <PanelMarca />
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 6 }}>
        <BotonTema sx={{ position: 'absolute', top: 12, right: 12 }} />
        <Box component="form" noValidate onSubmit={handleSubmit(enviar)} sx={{ width: '100%', maxWidth: 400 }}>
          <Typography variant="h4" component="h1">Iniciar sesión</Typography>
          <Typography sx={{ color: 'text.secondary', mt: 1, mb: 3 }}>
            Entre con su nombre de usuario o con su correo.
          </Typography>

          <Stack spacing={2}>
            {aviso && <Alert severity="info">{aviso}</Alert>}
            {errorServidor && <Alert severity="error">{errorServidor}</Alert>}

            <CampoTexto
              control={control}
              name="usuario"
              label="Usuario o correo"
              autoComplete="username"
              autoFocus
              rules={{ required: 'Escriba su usuario o correo' }}
            />
            <CampoTexto
              control={control}
              name="password"
              label="Contraseña"
              type={verClave ? 'text' : 'password'}
              autoComplete="current-password"
              rules={{ required: 'Escriba la contraseña' }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setVerClave((v) => !v)}
                        edge="end"
                        aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {verClave ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
              Entrar
            </Button>
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              ¿Su negocio todavía no tiene cuenta?{' '}
              <Link component={RouterLink} to="/registro">Regístrese</Link>
            </Typography>
          </Stack>

          {import.meta.env.DEV && (
            <Box sx={{ mt: 4, p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Usuarios de prueba (solo en desarrollo). La contraseña está en base_datos/README.md
              </Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {USUARIOS_PRUEBA.map((u) => (
                  <Chip key={u.usuario} size="small" label={`${u.usuario} · ${u.rol}`} onClick={() => usarUsuarioPrueba(u.usuario)} />
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
