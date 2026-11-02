import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link as RouterLink, useNavigate, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Box, Button, Divider, Grid, MenuItem, Stack } from '@mui/material'
import { api } from '../../api/cliente.js'
import CampoTexto from '../../componentes/CampoTexto.jsx'
import { CargandoDashboard, ErrorCarga } from '../../componentes/Cargando.jsx'
import Encabezado from '../../componentes/Encabezado.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import { useAvisos } from '../../utilidades/avisos.js'
import {
  AREAS, DEPARTAMENTOS, ESTADOS_CIVILES, JORNADAS, MODALIDADES_TRABAJO, SEXOS, TIPOS_CONTRATO,
} from '../../utilidades/formato.js'
import { aFechaCampo, aplicarErrores, CELULAR, CORREO, DOCUMENTO, hoy, SOLO_LETRAS } from '../../utilidades/formularios.js'

const VACIO = {
  numero_documento: '', nombres: '', apellidos: '', sexo: '', estado_civil: '', profesion: '', correo_personal: '', telefono_movil: '',
  direccion: { direccion: '', barrio: '', ciudad: '', departamento: 'Norte de Santander', codigo_postal: '' },
  contrato: { cargo: '', area: '', tipo_contrato: 'indefinido', fecha_inicio: hoy(), fecha_fin: '', salario: '', jornada: 'tiempo_completo', modalidad: 'presencial' },
  seguridad_social: { eps: '', fondo_pensiones: '', arl: '', caja_compensacion: '', fondo_cesantias: '' },
  informacion_bancaria: { banco: '', tipo_cuenta: '', numero_cuenta: '' },
}

/** El documento que devuelve el backend, con los opcionales en '' para el formulario. */
function aFormulario(e) {
  return {
    ...VACIO,
    ...e,
    direccion: { ...VACIO.direccion, ...e.direccion },
    contrato: {
      ...VACIO.contrato,
      ...e.contrato,
      fecha_inicio: aFechaCampo(e.contrato.fecha_inicio),
      fecha_fin: aFechaCampo(e.contrato.fecha_fin),
      salario: String(e.contrato.salario),
    },
    seguridad_social: { ...VACIO.seguridad_social, ...e.seguridad_social },
    informacion_bancaria: { ...VACIO.informacion_bancaria, ...e.informacion_bancaria },
  }
}

function opciones(mapa) {
  return Object.entries(mapa).map(([valor, texto]) => <MenuItem key={valor} value={valor}>{texto}</MenuItem>)
}

function Campos({ valores, id }) {
  const navegar = useNavigate()
  const avisar = useAvisos()
  const queryClient = useQueryClient()
  const [errorServidor, setErrorServidor] = useState(null)
  const { control, handleSubmit, setError, getValues, formState: { isSubmitting } } = useForm({ defaultValues: valores })
  const tipoContrato = useWatch({ control, name: 'contrato.tipo_contrato' })

  const enviar = async ({ id: _id, estado: _estado, fecha_creacion: _c, fecha_actualizacion: _a, ...datos }) => {
    setErrorServidor(null)
    const cuerpo = {
      ...datos,
      correo_personal: datos.correo_personal.trim().toLowerCase(),
      contrato: {
        ...datos.contrato,
        salario: Number(datos.contrato.salario),
        fecha_fin: datos.contrato.tipo_contrato === 'indefinido' || !datos.contrato.fecha_fin ? null : datos.contrato.fecha_fin,
      },
    }
    try {
      const empleado = await api(id ? `/empleados/${id}` : '/empleados', { metodo: id ? 'PUT' : 'POST', cuerpo })
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
      queryClient.invalidateQueries({ queryKey: ['empleado', empleado.id] })
      avisar(id ? 'Datos del empleado actualizados' : `Empleado ${empleado.id} registrado. Ahora puede crearle la cuenta en Usuarios`)
      navegar('/empleados')
    } catch (e) {
      setErrorServidor(aplicarErrores(e, setError))
    }
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(enviar)}>
      <Stack spacing={3}>
        {errorServidor && <Alert severity="error">{errorServidor}</Alert>}

        <Seccion titulo="Datos personales">
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <CampoTexto control={control} name="numero_documento" label="Cédula" slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                rules={{ required: 'Escriba el número de documento', pattern: { value: DOCUMENTO, message: 'Solo números, entre 6 y 10 dígitos' } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <CampoTexto control={control} name="nombres" label="Nombres" rules={{ required: 'Escriba los nombres', pattern: { value: SOLO_LETRAS, message: 'Solo letras' } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <CampoTexto control={control} name="apellidos" label="Apellidos" rules={{ required: 'Escriba los apellidos', pattern: { value: SOLO_LETRAS, message: 'Solo letras' } }} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <CampoTexto control={control} name="sexo" label="Sexo" select rules={{ required: 'Seleccione el sexo' }}>{opciones(SEXOS)}</CampoTexto>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <CampoTexto control={control} name="estado_civil" label="Estado civil" select rules={{ required: 'Seleccione el estado civil' }}>{opciones(ESTADOS_CIVILES)}</CampoTexto>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <CampoTexto control={control} name="profesion" label="Profesión" rules={{ required: 'Escriba la profesión' }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <CampoTexto control={control} name="correo_personal" label="Correo personal" type="email" rules={{ required: 'Escriba el correo', pattern: { value: CORREO, message: 'Correo no válido' } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <CampoTexto control={control} name="telefono_movil" label="Celular" slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                rules={{ required: 'Escriba el celular', pattern: { value: CELULAR, message: 'Debe tener 10 dígitos' } }} />
            </Grid>
          </Grid>
        </Seccion>

        <Seccion titulo="Dirección">
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <CampoTexto control={control} name="direccion.direccion" label="Dirección" rules={{ required: 'Escriba la dirección' }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <CampoTexto control={control} name="direccion.barrio" label="Barrio (opcional)" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <CampoTexto control={control} name="direccion.ciudad" label="Ciudad o municipio" rules={{ required: 'Escriba la ciudad' }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <CampoTexto control={control} name="direccion.departamento" label="Departamento" select rules={{ required: 'Seleccione el departamento' }}>
                {DEPARTAMENTOS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </CampoTexto>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <CampoTexto control={control} name="direccion.codigo_postal" label="Código postal (opcional)" slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                rules={{ pattern: { value: /^([0-9]{6})?$/, message: 'Tiene 6 dígitos' } }} />
            </Grid>
          </Grid>
        </Seccion>

        <Seccion titulo="Contrato">
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CampoTexto control={control} name="contrato.cargo" label="Cargo" rules={{ required: 'Escriba el cargo' }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CampoTexto control={control} name="contrato.area" label="Área" select rules={{ required: 'Seleccione el área' }}>{opciones(AREAS)}</CampoTexto>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <CampoTexto control={control} name="contrato.tipo_contrato" label="Tipo de contrato" select>{opciones(TIPOS_CONTRATO)}</CampoTexto>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <CampoTexto control={control} name="contrato.fecha_inicio" label="Fecha de inicio" type="date" slotProps={{ inputLabel: { shrink: true } }}
                rules={{ required: 'Escriba la fecha de inicio' }} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <CampoTexto
                control={control}
                name="contrato.fecha_fin"
                label="Fecha de terminación"
                type="date"
                disabled={tipoContrato === 'indefinido'}
                helperText={tipoContrato === 'indefinido' ? 'No aplica a un contrato indefinido' : undefined}
                slotProps={{ inputLabel: { shrink: true } }}
                rules={{
                  validate: (valor) => {
                    if (getValues('contrato.tipo_contrato') === 'indefinido') return true
                    if (!valor) return 'Un contrato que no es indefinido debe tener fecha de terminación'
                    return valor > getValues('contrato.fecha_inicio') || 'Debe ser posterior a la fecha de inicio'
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <CampoTexto control={control} name="contrato.salario" label="Salario mensual" slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                rules={{ required: 'Escriba el salario', pattern: { value: /^[0-9]+$/, message: 'Solo números, sin puntos' } }} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <CampoTexto control={control} name="contrato.jornada" label="Jornada" select>{opciones(JORNADAS)}</CampoTexto>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <CampoTexto control={control} name="contrato.modalidad" label="Modalidad" select>{opciones(MODALIDADES_TRABAJO)}</CampoTexto>
            </Grid>
          </Grid>
        </Seccion>

        <Seccion titulo="Seguridad social">
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 4 }}><CampoTexto control={control} name="seguridad_social.eps" label="EPS" rules={{ required: 'Escriba la EPS' }} /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><CampoTexto control={control} name="seguridad_social.fondo_pensiones" label="Fondo de pensiones" rules={{ required: 'Escriba el fondo de pensiones' }} /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><CampoTexto control={control} name="seguridad_social.arl" label="ARL" rules={{ required: 'Escriba la ARL' }} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><CampoTexto control={control} name="seguridad_social.caja_compensacion" label="Caja de compensación (opcional)" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><CampoTexto control={control} name="seguridad_social.fondo_cesantias" label="Fondo de cesantías (opcional)" /></Grid>
          </Grid>
        </Seccion>

        <Seccion titulo="Información bancaria" subtitulo="Opcional. Si la llena, complete los tres campos">
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 5 }}><CampoTexto control={control} name="informacion_bancaria.banco" label="Banco" /></Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <CampoTexto control={control} name="informacion_bancaria.tipo_cuenta" label="Tipo de cuenta" select>
                <MenuItem value="">Sin especificar</MenuItem>
                <MenuItem value="ahorros">Ahorros</MenuItem>
                <MenuItem value="corriente">Corriente</MenuItem>
              </CampoTexto>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <CampoTexto control={control} name="informacion_bancaria.numero_cuenta" label="Número de cuenta" slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                rules={{ pattern: { value: /^([0-9]{6,20})?$/, message: 'Solo números, entre 6 y 20 dígitos' } }} />
            </Grid>
          </Grid>
        </Seccion>

        <Divider />
        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
          <Button component={RouterLink} to="/empleados">Cancelar</Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>{id ? 'Guardar cambios' : 'Registrar empleado'}</Button>
        </Stack>
      </Stack>
    </Box>
  )
}

/** RF-15 (/empleados/nuevo) y RF-16 (/empleados/:id). */
export default function FormularioEmpleado() {
  const { id } = useParams()
  const { data: empleado, isPending, error } = useQuery({
    queryKey: ['empleado', id],
    queryFn: () => api(`/empleados/${id}`),
    enabled: Boolean(id),
  })

  if (id && isPending) return <CargandoDashboard />
  if (error) return <ErrorCarga error={error} />

  return (
    <Stack spacing={3} sx={{ maxWidth: 960 }}>
      <Encabezado
        titulo={id ? `${empleado.nombres} ${empleado.apellidos}` : 'Registrar empleado'}
        subtitulo={id ? `${empleado.id} · actualice sus datos personales y el contrato` : 'Datos personales, contrato y seguridad social. La cuenta de acceso se crea después en Usuarios.'}
      />
      {empleado?.estado === 'retirado' ? (
        <Alert severity="info">El empleado está retirado y ya no se puede editar.</Alert>
      ) : (
        <Campos key={id ?? 'nuevo'} id={id} valores={id ? aFormulario(empleado) : VACIO} />
      )}
    </Stack>
  )
}
