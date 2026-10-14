import { Typography } from '@mui/material'

/** Mensaje para una lista sin elementos. */
export default function Vacio({ children }) {
  return (
    <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
      {children}
    </Typography>
  )
}
