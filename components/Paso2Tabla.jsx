'use client'
import { fmt, calcularImpuestos } from '../lib/calculos'

const badge = (txt, color) =>
  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{txt}</span>

export default function Paso2Tabla({ resultados, datosMap, mes, onEditar, onContinuar, onVolver }) {
  const errores = resultados.filter(r => r.errores.length > 0 || !datosMap[r.docente])

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onVolver} className="text-sm text-gray-500 hover:text-gray-700">← Volver</button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Resultados — Mes {mes}</h2>
          <p className="text-xs text-gray-500">Revisa los montos antes de generar los borradores.</p>
        </div>
      </div>

      {errores.length > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
          <strong>Advertencias ({errores.length}):</strong>{' '}
          {errores.map(r => (
            <span key={r.docente} className="mr-3">
              {r.docente}: {!datosMap[r.docente] ? 'No encontrado en Datos de Docentes' : r.errores.join(', ')}
            </span>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide">
            <tr>
              <th className="px-3 py-3 font-semibold">Docente</th>
              <th className="px-3 py-3 text-right">L inicio</th>
              <th className="px-3 py-3 text-right">L AA</th>
              <th className="px-3 py-3 text-right">M inicio</th>
              <th className="px-3 py-3 text-right">M AA</th>
              <th className="px-3 py-3 text-right font-semibold">a ($42)</th>
              <th className="px-3 py-3 text-right font-semibold">b ($45)</th>
              <th className="px-3 py-3 text-right font-semibold">c ($45)</th>
              <th className="px-3 py-3 text-right font-semibold">d ($50)</th>
              <th className="px-3 py-3 text-right">x</th>
              <th className="px-3 py-3 text-right">Pond.</th>
              <th className="px-3 py-3 text-right font-semibold">xbruto</th>
              <th className="px-3 py-3 text-right">IVA</th>
              <th className="px-3 py-3 text-right">ISR ret.</th>
              <th className="px-3 py-3 text-right">IVA ret.</th>
              <th className="px-3 py-3 text-right font-semibold">Total a pagar</th>
              <th className="px-3 py-3">Régimen</th>
              <th className="px-3 py-3 text-right">L M2</th>
              <th className="px-3 py-3 text-right">M M2</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {resultados.map(r => {
              const info = datosMap[r.docente]
              const imp  = info ? calcularImpuestos(r.xbruto, info.regimen) : null
              const hayError = r.errores.length > 0 || !info

              return (
                <tr key={r.docente} className={hayError ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">
                    {r.docente}
                    {hayError && <span className="ml-1 text-red-500">⚠</span>}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">{r.numL_D1}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{r.numL_AA}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{r.numM_D1}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{r.numM_AA}</td>
                  <td className="px-3 py-2 text-right">{fmt(r.a)}</td>
                  <td className="px-3 py-2 text-right">{fmt(r.b)}</td>
                  <td className="px-3 py-2 text-right">{fmt(r.c)}</td>
                  <td className="px-3 py-2 text-right">{fmt(r.d)}</td>
                  <td className="px-3 py-2 text-right font-medium">{fmt(r.x)}</td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      step="0.01" min="0" max="1"
                      value={r.ponderacion ?? ''}
                      onChange={e => onEditar(r.docente, 'ponderacion', parseFloat(e.target.value))}
                      className="w-16 text-right border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-blue-700">
                    {r.xbruto != null ? fmt(r.xbruto) : badge('Sin pond.', 'bg-red-100 text-red-700')}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">{imp ? fmt(imp.iva) : '—'}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{imp ? fmt(imp.isr_ret) : '—'}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{imp ? fmt(imp.iva_ret) : '—'}</td>
                  <td className="px-3 py-2 text-right font-semibold text-green-700">{imp ? fmt(imp.total_pagar) : '—'}</td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                    {info
                      ? badge(/resico/i.test(info.regimen) ? 'RESICO' : 'PFAEP',
                          /resico/i.test(info.regimen) ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700')
                      : badge('Sin datos', 'bg-red-100 text-red-600')}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">{r.numL_DC}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{r.numM_DC}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="mt-3 text-right text-xs text-gray-500">
        {resultados.length} docentes &nbsp;·&nbsp;
        Total xbruto: <strong className="text-blue-700">
          {fmt(resultados.reduce((s, r) => s + (r.xbruto ?? 0), 0))}
        </strong>
        &nbsp;·&nbsp;
        Total a pagar: <strong className="text-green-700">
          {fmt(resultados.reduce((s, r) => {
            const info = datosMap[r.docente]
            const imp = info ? calcularImpuestos(r.xbruto, info.regimen) : null
            return s + (imp?.total_pagar ?? 0)
          }, 0))}
        </strong>
      </div>

      <div className="mt-6 flex gap-3 justify-end">
        <button
          onClick={onContinuar}
          className="py-2 px-6 rounded-lg font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Ver borradores de correo →
        </button>
      </div>
    </div>
  )
}
