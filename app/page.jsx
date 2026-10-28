'use client'
import { useState } from 'react'
import Paso1Carga from '../components/Paso1Carga'
import Paso2Tabla from '../components/Paso2Tabla'
import Paso3Correos from '../components/Paso3Correos'
import { calcularMes1, calcularMes2Plus } from '../lib/calculos'

export default function Home() {
  const [paso, setPaso] = useState(1)
  const [sesion, setSesion] = useState(null)       // datos crudos de los archivos
  const [resultados, setResultados] = useState([]) // array por docente

  // ── Paso 1 → 2 ──────────────────────────────────────────────────────────────
  const handleCarga = ({ mes, sheetsActual, sheetsPrev, datosMap }) => {
    let res
    if (mes === 1) {
      const findSheet = (sheets, keywords) => {
        const name = Object.keys(sheets).find(k =>
          keywords.every(kw => k.toLowerCase().includes(kw.toLowerCase()))
        )
        return name ? sheets[name] : []
      }
      const dia1 = findSheet(sheetsActual, ['día 1', 'mes 1']) ||
                   findSheet(sheetsActual, ['dia 1', 'mes 1']) ||
                   findSheet(sheetsActual, ['d1', 'mes 1']) || []
      const dc   = findSheet(sheetsActual, ['corte', 'm1']) ||
                   findSheet(sheetsActual, ['corte', 'mes 1']) || []
      const pond = sheetsActual['Hoja3'] || sheetsActual['hoja3'] || []
      res = calcularMes1(dia1, dc, pond)
    } else {
      const findSheet = (sheets, keywords) => {
        const name = Object.keys(sheets).find(k =>
          keywords.every(kw => k.toLowerCase().includes(kw.toLowerCase()))
        )
        return name ? sheets[name] : []
      }
      const mStr = String(mes)
      const mPStr = String(mes - 1)
      const dcPrev = findSheet(sheetsPrev, ['corte', mPStr]) || []
      const dcCurr = findSheet(sheetsActual, ['corte', mStr]) || []
      const pond   = sheetsActual['Hoja3'] || sheetsActual['hoja3'] || []
      res = calcularMes2Plus(dcPrev, dcCurr, pond, mes)
    }
    setSesion({ mes, datosMap })
    setResultados(res)
    setPaso(2)
  }

  // ── Editar ponderación en la tabla ──────────────────────────────────────────
  const handleEditar = (docente, campo, valor) => {
    setResultados(prev => prev.map(r => {
      if (r.docente !== docente) return r
      const updated = { ...r, [campo]: valor }
      if (campo === 'ponderacion') {
        updated.xbruto = !isNaN(valor) ? r.x * valor : null
      }
      return updated
    }))
  }

  return (
    <>
      {paso === 1 && <Paso1Carga onContinuar={handleCarga} />}
      {paso === 2 && sesion && (
        <Paso2Tabla
          resultados={resultados}
          datosMap={sesion.datosMap}
          mes={sesion.mes}
          onEditar={handleEditar}
          onContinuar={() => setPaso(3)}
          onVolver={() => setPaso(1)}
        />
      )}
      {paso === 3 && sesion && (
        <Paso3Correos
          resultados={resultados}
          datosMap={sesion.datosMap}
          mes={sesion.mes}
          onVolver={() => setPaso(2)}
        />
      )}
    </>
  )
}
