import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import RutaProtegida, { SoloInvitado } from './auth/RutaProtegida.jsx'
import { RUTA_POR_ROL, useSesion } from './auth/sesion.js'
import Marco from './componentes/Marco.jsx'
import Login from './paginas/Login.jsx'
import Registro from './paginas/Registro.jsx'

// Los dashboards se descargan cuando se abren; así el login no carga la librería de gráficos
const Conocimiento = lazy(() => import('./paginas/Conocimiento.jsx'))
const DashboardAdministrador = lazy(() => import('./paginas/dashboards/Administrador.jsx'))
const DashboardAgente = lazy(() => import('./paginas/dashboards/Agente.jsx'))
const DashboardAuditor = lazy(() => import('./paginas/dashboards/Auditor.jsx'))
const DashboardCliente = lazy(() => import('./paginas/dashboards/Cliente.jsx'))

function Inicio() {
  const { usuario } = useSesion()
  return <Navigate to={RUTA_POR_ROL[usuario.rol]} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<SoloInvitado><Login /></SoloInvitado>} />
      <Route path="/registro" element={<SoloInvitado><Registro /></SoloInvitado>} />

      {/* Pantallas internas: todas exigen sesión y comparten el marco con el menú */}
      <Route element={<RutaProtegida><Marco /></RutaProtegida>}>
        <Route index element={<Inicio />} />
        <Route path="administrador" element={<RutaProtegida rol="administrador"><DashboardAdministrador /></RutaProtegida>} />
        <Route path="agente" element={<RutaProtegida rol="agente_soporte"><DashboardAgente /></RutaProtegida>} />
        <Route path="cliente" element={<RutaProtegida rol="cliente"><DashboardCliente /></RutaProtegida>} />
        <Route path="auditor" element={<RutaProtegida rol="auditor"><DashboardAuditor /></RutaProtegida>} />
        <Route path="conocimiento" element={<RutaProtegida permiso="conocimiento:buscar"><Conocimiento /></RutaProtegida>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
