// ─── Utilidades ───────────────────────────────────────────────────────────────

/** Extrae la clave de materia quitando el periodo entre paréntesis.
 *  "LAE126 (2027-1) Liderazgo" → "LAE126"
 */
export function claveMateria(nombreCurso) {
  if (!nombreCurso) return ''
  return String(nombreCurso).split(' ')[0].trim()
}

/** Determina si una inscripción pertenece a Licenciatura o Maestría. */
export function grupo(nombreCurso, programa) {
  const clave = claveMateria(nombreCurso)
  if (clave.startsWith('L')) return 'L'
  if (clave.startsWith('M')) return 'M'
  // fallback por Programa
  if (programa === 'Licenciatura') return 'L'
  if (programa === 'Maestría') return 'M'
  return null
}

// ─── Parseo de hojas ───────────────────────────────────────────────────────────

/**
 * Convierte un array de arrays (filas del xlsx) en array de objetos
 * usando la primera fila como headers.
 */
export function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return []
  const headers = rows[0].map(h => (h ? String(h).trim() : ''))
  return rows.slice(1).filter(r => r.some(v => v !== null && v !== undefined && v !== '')).map(r => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = r[i] ?? null })
    return obj
  })
}

/**
 * Construye la clave única alumno-materia para cruce entre meses.
 * key = matrícula + "|" + claveMateriaBase
 */
function keyAlumno(nombreCurso, matricula) {
  return `${String(matricula || '').toLowerCase()}|${claveMateria(nombreCurso)}`
}

// ─── Mes 1 ────────────────────────────────────────────────────────────────────

/**
 * Calcula honorarios del mes 1.
 * @param {Object[]} dia1 - Filas de "RAA Día 1 Mes 1"
 * @param {Object[]} dc   - Filas de "RAA Día de Corte M1"
 * @param {Object[]} pond - Filas de "Hoja3" (Docente, Ponderación)
 * @returns {Object[]} resultados por docente
 */
export function calcularMes1(dia1, dc, pond) {
  const ponderacion = Object.fromEntries(
    pond.map(r => [String(r['Docente'] || '').trim(), Number(r['Ponderación'] ?? r['Ponderacion'] ?? 1)])
  )

  // Conteos Día 1
  const cntD1 = {}  // docente → { L: n, M: n }
  for (const r of dia1) {
    const doc = String(r['Docente'] || '').trim()
    const g = grupo(r['Nombre del curso'], r['Programa'])
    if (!g || !doc) continue
    if (!cntD1[doc]) cntD1[doc] = { L: 0, M: 0 }
    cntD1[doc][g]++
  }

  // Conteos AA en día de corte (por docente)
  const cntAA = {}  // docente → { L: n, M: n }
  // También conteos para "inicio de mes 2" (todos en DC, con o sin AA)
  const cntDC = {}  // docente → { L: set de matriculas+materia, M: set }
  for (const r of dc) {
    const doc = String(r['Profesor'] || '').trim()
    const g = grupo(r['Nombre del curso'], null)
    const aa = Number(r['Avance Académico (AA)'] ?? 0)
    const mat = r['Nombre de usuario']
    if (!g || !doc) continue

    if (!cntAA[doc]) cntAA[doc] = { L: 0, M: 0 }
    if (!cntDC[doc]) cntDC[doc] = { L: new Set(), M: new Set() }

    const k = keyAlumno(r['Nombre del curso'], mat)
    cntDC[doc][g].add(k)
    if (aa > 0) cntAA[doc][g]++
  }

  // Todos los docentes conocidos
  const docentes = new Set([
    ...Object.keys(cntD1),
    ...Object.keys(cntAA),
    ...Object.keys(ponderacion)
  ])

  return Array.from(docentes).sort().map(doc => {
    const d1 = cntD1[doc] || { L: 0, M: 0 }
    const aa = cntAA[doc] || { L: 0, M: 0 }
    const dc_ = cntDC[doc] || { L: new Set(), M: new Set() }
    const pond_ = ponderacion[doc]

    const numL_D1 = d1.L
    const numM_D1 = d1.M
    const numL_AA = aa.L
    const numM_AA = aa.M
    const numL_DC = dc_.L.size  // inicio mes siguiente
    const numM_DC = dc_.M.size

    const a = numL_D1 * 42
    const b = numL_AA * 45
    const c = numM_D1 * 45
    const d = numM_AA * 50
    const x = a + b + c + d
    const xbruto = pond_ != null ? x * pond_ : null

    return {
      docente: doc,
      mes: 1,
      numL_D1, numM_D1, numL_AA, numM_AA,
      numL_DC, numM_DC,
      a, b, c, d, x,
      ponderacion: pond_ ?? null,
      xbruto,
      errores: [
        ...(pond_ == null ? ['Sin ponderación'] : []),
      ]
    }
  })
}

// ─── Mes 2+ ──────────────────────────────────────────────────────────────────

/**
 * Calcula honorarios del mes m (≥ 2).
 * @param {Object[]} dcPrev - Día de corte del mes anterior
 * @param {Object[]} dcCurr - Día de corte del mes actual
 * @param {Object[]} pond   - Ponderación mes actual
 * @param {number}   mesNum - Número del mes (2, 3, 4…)
 */
export function calcularMes2Plus(dcPrev, dcCurr, pond, mesNum) {
  const ponderacion = Object.fromEntries(
    pond.map(r => [String(r['Docente'] || '').trim(), Number(r['Ponderación'] ?? r['Ponderacion'] ?? 1)])
  )

  // Índice del mes anterior: key → AA
  const aaPrev = {}  // key → AA
  for (const r of dcPrev) {
    const k = keyAlumno(r['Nombre del curso'], r['Nombre de usuario'])
    aaPrev[k] = Number(r['Avance Académico (AA)'] ?? 0)
  }

  // a y c: alumnos en DC del mes anterior, por docente
  // Necesitamos el profesor del mes anterior también (columna "Profesor")
  const cntPrev = {}  // docente → { L: set<key>, M: set<key> }
  for (const r of dcPrev) {
    const doc = String(r['Profesor'] || '').trim()
    const g = grupo(r['Nombre del curso'], null)
    if (!g || !doc) continue
    if (!cntPrev[doc]) cntPrev[doc] = { L: new Set(), M: new Set() }
    cntPrev[doc][g].add(keyAlumno(r['Nombre del curso'], r['Nombre de usuario']))
  }

  // Condición de AA del mes actual
  const tieneAA = (r) => {
    const k = keyAlumno(r['Nombre del curso'], r['Nombre de usuario'])
    const aaCurr = Number(r['Avance Académico (AA)'] ?? 0)
    const prev = aaPrev[k] ?? 0   // Si es alumno nuevo, prev = 0
    if (aaCurr !== prev) return true
    // Mismo AA: sólo si 100% avance Y Proyecto = "Sí"
    const pct = Number(r['% de avance'] ?? 0)
    const proy = String(r['Proyecto de Asignatura'] ?? '').toLowerCase()
    return pct >= 1 && proy === 'sí'
  }

  // AA del mes actual, por docente
  const cntAA = {}
  // DC del mes actual (para "inicio del siguiente mes")
  const cntDCCurr = {}
  for (const r of dcCurr) {
    const doc = String(r['Profesor'] || '').trim()
    const g = grupo(r['Nombre del curso'], null)
    if (!g || !doc) continue
    if (!cntAA[doc]) cntAA[doc] = { L: 0, M: 0 }
    if (!cntDCCurr[doc]) cntDCCurr[doc] = { L: new Set(), M: new Set() }
    const k = keyAlumno(r['Nombre del curso'], r['Nombre de usuario'])
    cntDCCurr[doc][g].add(k)
    if (tieneAA(r)) cntAA[doc][g]++
  }

  const docentes = new Set([
    ...Object.keys(cntPrev),
    ...Object.keys(cntAA),
    ...Object.keys(ponderacion)
  ])

  return Array.from(docentes).sort().map(doc => {
    const prev = cntPrev[doc] || { L: new Set(), M: new Set() }
    const aa   = cntAA[doc]   || { L: 0, M: 0 }
    const curr = cntDCCurr[doc] || { L: new Set(), M: new Set() }
    const pond_ = ponderacion[doc]

    const numL_D1 = prev.L.size  // "inicio del mes" = DC del mes anterior
    const numM_D1 = prev.M.size
    const numL_AA = aa.L
    const numM_AA = aa.M
    const numL_DC = curr.L.size
    const numM_DC = curr.M.size

    const a = numL_D1 * 42
    const b = numL_AA * 45
    const c = numM_D1 * 45
    const d = numM_AA * 50
    const x = a + b + c + d
    const xbruto = pond_ != null ? x * pond_ : null

    return {
      docente: doc,
      mes: mesNum,
      numL_D1, numM_D1, numL_AA, numM_AA,
      numL_DC, numM_DC,
      a, b, c, d, x,
      ponderacion: pond_ ?? null,
      xbruto,
      errores: [...(pond_ == null ? ['Sin ponderación'] : [])]
    }
  })
}

// ─── Impuestos ────────────────────────────────────────────────────────────────

const TASAS = {
  RESICO: { isr: 0.0125 },
  PFAEP:  { isr: 0.10   }
}
const IVA_TASA       = 0.16
const IVA_RET_TASA   = 0.1066667

export function calcularImpuestos(xbruto, regimen) {
  if (xbruto == null) return null
  const esResico = /resico/i.test(regimen)
  const isr_tasa = esResico ? TASAS.RESICO.isr : TASAS.PFAEP.isr
  const iva         = xbruto * IVA_TASA
  const isr_ret     = xbruto * isr_tasa
  const iva_ret     = xbruto * IVA_RET_TASA
  const total_pagar = xbruto + iva - isr_ret - iva_ret
  return { iva, isr_ret, iva_ret, total_pagar, isr_tasa }
}

// ─── Formato moneda ───────────────────────────────────────────────────────────
export const fmt = (n) =>
  n == null ? '—' : Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })
