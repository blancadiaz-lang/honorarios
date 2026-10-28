'use client'
import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { rowsToObjects } from '../lib/calculos'

const MESES = [
  { label: 'Mes 1  (Día 1: 8/09/2026 — Corte: 24/09/2026)', value: 1 },
  { label: 'Mes 2  (Día 1: 24/09/2026 — Corte: 22/10/2026)', value: 2 },
  { label: 'Mes 3  (Día 1: 22/10/2026 — Corte: 23/11/2026)', value: 3 },
  { label: 'Mes 4  (Día 1: 23/11/2026 — Corte: 23/12/2026)', value: 4 },
]

function FileInput({ label, hint, onChange, accept = '.xlsx,.xls' }) {
  const ref = useRef()
  const [name, setName] = useState('')
  const handle = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setName(file.name)
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf)
    onChange(wb)
  }
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <div
        onClick={() => ref.current.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors text-center"
      >
        {name
          ? <span className="text-sm text-green-700 font-medium">✓ {name}</span>
          : <span className="text-sm text-gray-400">Haz clic para seleccionar archivo</span>}
      </div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={handle} />
    </div>
  )
}

export default function Paso1Carga({ onContinuar }) {
  const [mes, setMes] = useState(1)
  const [raaActual, setRaaActual] = useState(null)
  const [raaPrev, setRaaPrev] = useState(null)
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')

  const continuar = () => {
    setError('')
    try {
      // Parsear RAA actual
      const sheetsActual = {}
      raaActual.SheetNames.forEach(name => {
        sheetsActual[name] = rowsToObjects(
          XLSX.utils.sheet_to_json(raaActual.Sheets[name], { header: 1, defval: null })
        )
      })

      // Parsear RAA anterior (solo si mes > 1)
      let sheetsPrev = null
      if (mes > 1) {
        if (!raaPrev) { setError('Para el mes 2 o superior debes cargar también el RAA del mes anterior.'); return }
        sheetsPrev = {}
        raaPrev.SheetNames.forEach(name => {
          sheetsPrev[name] = rowsToObjects(
            XLSX.utils.sheet_to_json(raaPrev.Sheets[name], { header: 1, defval: null })
          )
        })
      }

      // Parsear Datos Docentes
      if (!datos) { setError('Debes cargar el archivo de Datos de Docentes.'); return }
      const datosRows = rowsToObjects(
        XLSX.utils.sheet_to_json(datos.Sheets[datos.SheetNames[0]], { header: 1, defval: null })
      )
      const datosMap = Object.fromEntries(
        datosRows.map(r => [String(r['Docente'] || '').trim(), {
          apodo: String(r['Nombre Docente'] || '').trim(),
          regimen: String(r['Régimen Fiscal'] || r['Regimen Fiscal'] || '').trim(),
          correo: String(r['Correo electrónico'] || r['Correo electronico'] || '').trim()
        }])
      )

      onContinuar({ mes, sheetsActual, sheetsPrev, datosMap })
    } catch (e) {
      setError('Error al leer los archivos: ' + e.message)
    }
  }

  const listo = raaActual && datos && (mes === 1 || raaPrev)

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Honorarios Docentes</h1>
      <p className="text-gray-500 mb-8 text-sm">Carga los archivos para calcular los honorarios del mes.</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Selector de mes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mes a calcular</label>
          <select
            value={mes}
            onChange={e => setMes(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {/* RAA actual */}
        <FileInput
          label={mes === 1 ? 'RAA Mes 1 (.xlsx)' : `RAA Mes ${mes} (.xlsx)`}
          hint={mes === 1
            ? 'Debe contener las hojas "RAA Día 1 Mes 1", "RAA Día de Corte M1" y "Hoja3".'
            : `Debe contener las hojas "RAA Día de Corte M${mes}" y "Hoja3".`}
          onChange={setRaaActual}
        />

        {/* RAA anterior (solo mes > 1) */}
        {mes > 1 && (
          <FileInput
            label={`RAA Mes ${mes - 1} (mes anterior) (.xlsx)`}
            hint={`Necesario para comparar el avance académico. Debe contener "RAA Día de Corte M${mes - 1}".`}
            onChange={setRaaPrev}
          />
        )}

        {/* Datos docentes */}
        <FileInput
          label="Datos de Docentes (.xlsx)"
          hint="Columnas: Docente, Nombre Docente, Régimen Fiscal, Correo electrónico."
          onChange={setDatos}
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={continuar}
          disabled={!listo}
          className="w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors
            disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
            enabled:bg-blue-600 enabled:text-white enabled:hover:bg-blue-700"
        >
          Calcular honorarios →
        </button>
      </div>
    </div>
  )
}
