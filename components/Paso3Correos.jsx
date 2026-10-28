'use client'
import { useState } from 'react'
import { fmt, calcularImpuestos } from '../lib/calculos'
import { generarCorreo } from '../lib/correo'

function DesgloseFiscal({ xbruto, regimen }) {
  const imp = calcularImpuestos(xbruto, regimen)
  if (!imp) return null
  const esResico = /resico/i.test(regimen)
  const rows = [
    { label: 'HONORARIOS', value: fmt(xbruto), bold: true },
    { label: `IVA (16%)`, value: fmt(imp.iva) },
    { label: `ISR RETENIDO (${(imp.isr_tasa * 100).toFixed(2)}%)`, value: fmt(imp.isr_ret) },
    { label: 'IVA RETENIDO (10.667%)', value: fmt(imp.iva_ret) },
    { label: 'TOTAL A PAGAR', value: fmt(imp.total_pagar), bold: true, highlight: true },
  ]
  return (
    <div className="mt-3 inline-block rounded-lg border border-gray-200 overflow-hidden text-xs">
      <div className={`px-3 py-1.5 text-white text-xs font-semibold ${esResico ? 'bg-purple-600' : 'bg-indigo-600'}`}>
        {esResico ? 'RESICO' : 'Personas Físicas con Act. Empresarial'}
      </div>
      {rows.map(row => (
        <div key={row.label} className={`flex gap-8 px-3 py-1 justify-between ${row.highlight ? 'bg-green-50 font-bold' : ''}`}>
          <span className={row.bold ? 'font-semibold text-gray-700' : 'text-gray-600'}>{row.label}</span>
          <span className={row.highlight ? 'text-green-700' : 'text-gray-800'}>{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function TarjetaDocente({ r, info, mes }) {
  const [copiado, setCopiado] = useState(false)
  if (!info) return null
  const texto = generarCorreo(r, info.apodo, info.regimen, mes)

  const copiar = () => {
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div>
          <span className="font-semibold text-gray-800 text-sm">{r.docente}</span>
          <span className="ml-2 text-xs text-gray-500">{info.correo}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${/resico/i.test(info.regimen) ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
            {/resico/i.test(info.regimen) ? 'RESICO' : 'PFAEP'}
          </span>
          <button
            onClick={copiar}
            className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${copiado ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
          >
            {copiado ? '✓ Copiado' : 'Copiar texto'}
          </button>
        </div>
      </div>

      {/* Cuerpo del correo */}
      <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Texto */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cuerpo del correo</p>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100 max-h-96 overflow-y-auto">
            {texto}
          </pre>
        </div>

        {/* Desglose fiscal (imagen) */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Desglose de honorarios</p>
          <p className="text-xs text-gray-500 mb-2">Toma captura de pantalla de este bloque para adjuntarlo al correo.</p>
          <DesgloseFiscal xbruto={r.xbruto} regimen={info.regimen} />

          {/* Resumen de conteos */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {[
              ['Lic. inicio mes', r.numL_D1],
              ['Lic. con AA', r.numL_AA],
              ['Mtr. inicio mes', r.numM_D1],
              ['Mtr. con AA', r.numM_AA],
              ['Lic. inicio M' + (mes + 1), r.numL_DC],
              ['Mtr. inicio M' + (mes + 1), r.numM_DC],
            ].map(([lbl, val]) => (
              <div key={lbl} className="bg-gray-50 rounded-lg px-3 py-2 flex justify-between">
                <span className="text-gray-500">{lbl}</span>
                <span className="font-semibold text-gray-800">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Paso3Correos({ resultados, datosMap, mes, onVolver }) {
  const [buscar, setBuscar] = useState('')
  const filtrados = resultados.filter(r =>
    datosMap[r.docente] &&
    r.xbruto != null &&
    r.docente.toLowerCase().includes(buscar.toLowerCase())
  )
  const sinDatos = resultados.filter(r => !datosMap[r.docente] || r.xbruto == null)

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onVolver} className="text-sm text-gray-500 hover:text-gray-700">← Volver a tabla</button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Borradores de correo — Mes {mes}</h2>
          <p className="text-xs text-gray-500">Copia cada texto y pégalo en Gmail. Adjunta la captura de pantalla del desglose.</p>
        </div>
      </div>

      {sinDatos.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          Los siguientes docentes no tienen correo generado (faltan datos o ponderación): {sinDatos.map(r => r.docente).join(', ')}
        </div>
      )}

      <input
        type="text"
        placeholder="Buscar docente…"
        value={buscar}
        onChange={e => setBuscar(e.target.value)}
        className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {filtrados.map(r => (
        <TarjetaDocente key={r.docente} r={r} info={datosMap[r.docente]} mes={mes} />
      ))}

      {filtrados.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">Sin resultados.</p>
      )}
    </div>
  )
}
