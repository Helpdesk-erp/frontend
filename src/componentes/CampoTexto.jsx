import { TextField } from '@mui/material'
import { Controller } from 'react-hook-form'

/**
 * TextField de MUI conectado a React Hook Form. Muestra el error del campo
 * (de la validación local o el que devuelve el backend con setError).
 * Con `select` funciona como lista desplegable; las opciones van como hijos.
 */
export default function CampoTexto({ control, name, rules, helperText, children, ...props }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { ref, ...field }, fieldState }) => (
        <TextField
          {...field}
          {...props}
          inputRef={ref}
          fullWidth
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
        >
          {children}
        </TextField>
      )}
    />
  )
}
