import { BarChart } from '@mui/x-charts/BarChart'
import { COLORES_GRAFICO } from '../tema.js'
import { useModoOscuro } from '../utilidades/useModoOscuro.js'
import Vacio from './Vacio.jsx'

const ALTO_FILA = 44

/**
 * Barras horizontales de una sola serie: un color para todas las barras, el
 * valor en la punta de cada barra y el detalle en el tooltip.
 *
 * @param {object[]} datos      filas que devuelve el backend
 * @param {string} campoEtiqueta nombre de cada barra (por ejemplo "nombre")
 * @param {string} campoValor    número de cada barra (por ejemplo "total")
 */
export default function GraficoBarras({ datos, campoEtiqueta, campoValor, etiquetaSerie, formato = (v) => String(v), vacio }) {
  const { oscuro } = useModoOscuro()
  const colores = oscuro ? COLORES_GRAFICO.oscuro : COLORES_GRAFICO.claro

  if (!datos?.length) return <Vacio>{vacio}</Vacio>

  return (
    <BarChart
      layout="horizontal"
      height={datos.length * ALTO_FILA + 48}
      dataset={datos}
      yAxis={[{ scaleType: 'band', dataKey: campoEtiqueta, width: 110, categoryGapRatio: 0.5, disableLine: true, disableTicks: true }]}
      // 15 % de aire a la derecha para que el valor de la barra más larga no quede recortado
      xAxis={[{ tickMinStep: 1, valueFormatter: formato, disableLine: true, domainLimit: (_min, max) => ({ min: 0, max: max * 1.15 }) }]}
      series={[{
        dataKey: campoValor,
        label: etiquetaSerie,
        color: colores.serie,
        valueFormatter: (valor) => formato(valor),
        barLabel: (barra) => formato(barra.value),
        barLabelPlacement: 'outside',
      }]}
      borderRadius={4}
      grid={{ vertical: true }}
      hideLegend
      margin={{ left: 0, right: 56, top: 8, bottom: 0 }}
      sx={{ '& .MuiChartsGrid-line': { stroke: colores.rejilla } }}
    />
  )
}
