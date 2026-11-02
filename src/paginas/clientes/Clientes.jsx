import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Button, Chip, InputAdornment, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import { api } from '../../api/cliente.js'
import { tienePermiso, useSesion } from '../../auth/sesion.js'
import { ErrorCarga } from '../../componentes/Cargando.jsx'
import { ChipEstado } from '../../componentes/Chips.jsx'
import Encabezado from '../../componentes/Encabezado.jsx'
import Seccion from '../../componentes/Seccion.jsx'
import Vacio from '../../componentes/Vacio.jsx'
import { PAQUETES, TIPOS_CLIENTE } from '../../utilidades/formato.js'

const SOLO_ESCRITORIO = { display: { xs: 'none', md: 'table-cell' } }
const COLOR_PAQUETE = { activo: 'success', suspendido: 'error', vencido: 'default' }

export default function Clientes() {
  const { usuario } = useSesion()
  const navegar = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const { data: clientes, isPending, error } = useQuery({ queryKey: ['clientes'], queryFn: () => api('/clientes') })

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (clientes ?? []).filter((c) => !texto
      || [c.nombre, c.id, c.numero_documento, c.correo, c.ciudad].some((v) => v?.toLowerCase().includes(texto)))
  }, [clientes, busqueda])

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
        <Encabezado titulo="Clientes" subtitulo="Empresas y personas que usan el ERP, con el estado de cada paquete contratado." />
        {tienePermiso(usuario, 'clientes:gestionar') && (
          <Button component={RouterLink} to="/clientes/nuevo" variant="contained" startIcon={<AddIcon />} sx={{ flexShrink: 0 }}>
            Registrar cliente
          </Button>
        )}
      </Stack>

      <Seccion
        titulo={clientes ? `${clientes.length} clientes` : 'Clientes'}
        accion={
          <TextField
            size="small"
            placeholder="Buscar"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
            sx={{ maxWidth: 220 }}
          />
        }
        sinRelleno
      >
        {isPending ? (
          <Box sx={{ p: 2.5 }}><Skeleton variant="rounded" height={200} /></Box>
        ) : error ? (
          <Box sx={{ p: 2.5 }}><ErrorCarga error={error} /></Box>
        ) : filtrados.length === 0 ? (
          <Box sx={{ px: 2.5 }}><Vacio>No hay clientes que coincidan.</Vacio></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 2.5 }}>Cliente</TableCell>
                  <TableCell sx={SOLO_ESCRITORIO}>Contacto</TableCell>
                  <TableCell sx={SOLO_ESCRITORIO}>Paquetes</TableCell>
                  <TableCell sx={{ pr: 2.5 }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtrados.map((c) => (
                  <TableRow
                    key={c.id}
                    hover
                    tabIndex={0}
                    onClick={() => navegar(`/clientes/${c.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navegar(`/clientes/${c.id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ pl: 2.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {c.id} · {TIPOS_CLIENTE[c.tipo_cliente]} · {c.tipo_documento} {c.numero_documento}
                      </Typography>
                      <Typography variant="body2">{c.nombre}</Typography>
                    </TableCell>
                    <TableCell sx={SOLO_ESCRITORIO}>
                      <Typography variant="body2">{c.correo}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{c.telefono} · {c.ciudad}</Typography>
                    </TableCell>
                    <TableCell sx={SOLO_ESCRITORIO}>
                      {c.paquetes.length === 0 ? (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Sin paquetes</Typography>
                      ) : (
                        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          {c.paquetes.map((p) => (
                            <Chip key={p.paquete_id} size="small" variant="outlined" color={COLOR_PAQUETE[p.estado]} label={PAQUETES[p.paquete_id]} />
                          ))}
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell sx={{ pr: 2.5 }}><ChipEstado estado={c.estado} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Seccion>
    </Stack>
  )
}
