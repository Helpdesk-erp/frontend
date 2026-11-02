import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import RutaProtegida, { SoloInvitado } from './auth/RutaProtegida.jsx'
import { RUTA_POR_ROL, useSesion } from './auth/sesion.js'
import Marco from './componentes/Marco.jsx'
import Login from './paginas/Login.jsx'
import Registro from './paginas/Registro.jsx'

// Las pantallas internas se descargan cuando se abren; así el login no carga la librería de gráficos
const Conocimiento = lazy(() => import('./paginas/Conocimiento.jsx'))
const DashboardAdministrador = lazy(() => import('./paginas/dashboards/Administrador.jsx'))
const DashboardAgente = lazy(() => import('./paginas/dashboards/Agente.jsx'))
const DashboardAuditor = lazy(() => import('./paginas/dashboards/Auditor.jsx'))
const DashboardCliente = lazy(() => import('./paginas/dashboards/Cliente.jsx'))
const Tickets = lazy(() => import('./paginas/tickets/Tickets.jsx'))
const NuevoTicket = lazy(() => import('./paginas/tickets/NuevoTicket.jsx'))
const DetalleTicket = lazy(() => import('./paginas/tickets/DetalleTicket.jsx'))
const NuevoArticulo = lazy(() => import('./paginas/conocimiento/NuevoArticulo.jsx'))
const Usuarios = lazy(() => import('./paginas/usuarios/Usuarios.jsx'))
const Empleados = lazy(() => import('./paginas/empleados/Empleados.jsx'))
const FormularioEmpleado = lazy(() => import('./paginas/empleados/FormularioEmpleado.jsx'))
const Clientes = lazy(() => import('./paginas/clientes/Clientes.jsx'))
const NuevoCliente = lazy(() => import('./paginas/clientes/NuevoCliente.jsx'))
const DetalleCliente = lazy(() => import('./paginas/clientes/DetalleCliente.jsx'))
const Pagos = lazy(() => import('./paginas/pagos/Pagos.jsx'))
const Capacitaciones = lazy(() => import('./paginas/capacitaciones/Capacitaciones.jsx'))
const NuevaCapacitacion = lazy(() => import('./paginas/capacitaciones/NuevaCapacitacion.jsx'))
const DetalleCapacitacion = lazy(() => import('./paginas/capacitaciones/DetalleCapacitacion.jsx'))

const VER_TICKETS = ['tickets:ver_todos', 'tickets:ver_asignados', 'tickets:ver_propios']
const VER_CLIENTES = ['clientes:gestionar', 'clientes:ver']
const CAPACITACIONES = ['capacitaciones:gestionar', 'capacitaciones:dictar', 'capacitaciones:inscribirse']

function Inicio() {
  const { usuario } = useSesion()
  return <Navigate to={RUTA_POR_ROL[usuario.rol]} replace />
}

/** Atajo para no repetir <RutaProtegida> en cada ruta interna. */
function Con({ permiso, rol, children }) {
  return <RutaProtegida permiso={permiso} rol={rol}>{children}</RutaProtegida>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<SoloInvitado><Login /></SoloInvitado>} />
      <Route path="/registro" element={<SoloInvitado><Registro /></SoloInvitado>} />

      {/* Pantallas internas: todas exigen sesión y comparten el marco con el menú */}
      <Route element={<RutaProtegida><Marco /></RutaProtegida>}>
        <Route index element={<Inicio />} />
        <Route path="administrador" element={<Con rol="administrador"><DashboardAdministrador /></Con>} />
        <Route path="agente" element={<Con rol="agente_soporte"><DashboardAgente /></Con>} />
        <Route path="cliente" element={<Con rol="cliente"><DashboardCliente /></Con>} />
        <Route path="auditor" element={<Con rol="auditor"><DashboardAuditor /></Con>} />

        <Route path="tickets" element={<Con permiso={VER_TICKETS}><Tickets /></Con>} />
        <Route path="tickets/nuevo" element={<Con permiso="tickets:crear"><NuevoTicket /></Con>} />
        <Route path="tickets/:id" element={<Con permiso={VER_TICKETS}><DetalleTicket /></Con>} />

        <Route path="conocimiento" element={<Con permiso="conocimiento:buscar"><Conocimiento /></Con>} />
        <Route path="conocimiento/nuevo/:ticketId" element={<Con permiso="conocimiento:crear"><NuevoArticulo /></Con>} />

        <Route path="usuarios" element={<Con permiso="usuarios:gestionar"><Usuarios /></Con>} />
        <Route path="empleados" element={<Con permiso="empleados:gestionar"><Empleados /></Con>} />
        <Route path="empleados/nuevo" element={<Con permiso="empleados:gestionar"><FormularioEmpleado /></Con>} />
        <Route path="empleados/:id" element={<Con permiso="empleados:gestionar"><FormularioEmpleado /></Con>} />

        <Route path="clientes" element={<Con permiso={VER_CLIENTES}><Clientes /></Con>} />
        <Route path="clientes/nuevo" element={<Con permiso="clientes:gestionar"><NuevoCliente /></Con>} />
        <Route path="clientes/:id" element={<Con permiso={VER_CLIENTES}><DetalleCliente /></Con>} />

        <Route path="pagos" element={<Con permiso={['pagos:registrar', 'pagos:ver']}><Pagos /></Con>} />

        <Route path="capacitaciones" element={<Con permiso={CAPACITACIONES}><Capacitaciones /></Con>} />
        <Route path="capacitaciones/nueva" element={<Con permiso="capacitaciones:gestionar"><NuevaCapacitacion /></Con>} />
        <Route path="capacitaciones/:id" element={<Con permiso={['capacitaciones:gestionar', 'capacitaciones:dictar']}><DetalleCapacitacion /></Con>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
