import { Suspense, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import {
  AppBar, Avatar, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText,
  Menu, MenuItem, Stack, Toolbar, Tooltip, Typography,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/LogoutOutlined'
import MenuBookIcon from '@mui/icons-material/MenuBookOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboardOutlined'
import SupportAgentIcon from '@mui/icons-material/SupportAgentOutlined'
import { NOMBRE_ROL, RUTA_POR_ROL, useSesion } from '../auth/sesion.js'
import { CargandoDashboard } from './Cargando.jsx'

const ANCHO_MENU = 248

function iniciales(nombre) {
  return nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

/** Estructura de las pantallas internas: barra superior, menú lateral y contenido. */
export default function Marco() {
  const { usuario, logout } = useSesion()
  const [menuMovil, setMenuMovil] = useState(false)
  const [anclaCuenta, setAnclaCuenta] = useState(null)

  // Solo se muestran las opciones que el rol puede usar
  const opciones = [
    { texto: 'Panel principal', icono: <SpaceDashboardIcon />, ruta: RUTA_POR_ROL[usuario.rol] },
    usuario.permisos.includes('conocimiento:buscar') && {
      texto: 'Base de conocimiento', icono: <MenuBookIcon />, ruta: '/conocimiento',
    },
  ].filter(Boolean)

  const menu = (
    <List sx={{ px: 1, py: 1.5 }}>
        {opciones.map((opcion) => (
          <ListItemButton
            key={opcion.ruta}
            component={NavLink}
            to={opcion.ruta}
            onClick={() => setMenuMovil(false)}
            sx={{
              borderRadius: 2, mb: 0.5,
              '&.active': { bgcolor: 'action.selected', '& .MuiListItemIcon-root': { color: 'primary.main' } },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{opcion.icono}</ListItemIcon>
            <ListItemText primary={opcion.texto} />
          </ListItemButton>
        ))}
    </List>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* En escritorio la barra va encima del menú fijo; en celular el menú se abre por encima de la barra */}
      <AppBar position="fixed" sx={{ borderBottom: 1, borderColor: 'divider', zIndex: { md: 1201 } }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" onClick={() => setMenuMovil(true)} sx={{ display: { md: 'none' } }} aria-label="Abrir menú">
            <MenuIcon />
          </IconButton>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', display: { xs: 'none', md: 'flex' } }}>
            <SupportAgentIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Helpdesk ERP</Typography>
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{usuario.nombre}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{NOMBRE_ROL[usuario.rol]}</Typography>
          </Box>
          <Tooltip title="Cuenta">
            <IconButton onClick={(e) => setAnclaCuenta(e.currentTarget)} aria-label="Abrir menú de la cuenta">
              <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: 'primary.main' }}>{iniciales(usuario.nombre)}</Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anclaCuenta}
            open={Boolean(anclaCuenta)}
            onClose={() => setAnclaCuenta(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{usuario.usuario}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{usuario.correo}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={logout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: ANCHO_MENU }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={menuMovil}
          onClose={() => setMenuMovil(false)}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: ANCHO_MENU } }}
        >
          <Toolbar sx={{ gap: 1.5 }}>
            <SupportAgentIcon color="primary" />
            <Box>
              <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>Helpdesk ERP</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Sistemas Integrados S.A.</Typography>
            </Box>
          </Toolbar>
          <Divider />
          {menu}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: ANCHO_MENU, boxSizing: 'border-box' } }}
        >
          <Toolbar />
          {menu}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, px: { xs: 2, sm: 3 }, pb: 4 }}>
        <Toolbar />
        <Box sx={{ maxWidth: 1280, mx: 'auto', pt: 3 }}>
          <Suspense fallback={<CargandoDashboard />}>
            <Outlet />
          </Suspense>
        </Box>
      </Box>
    </Box>
  )
}
