import { fmt, calcularImpuestos } from './calculos'

/**
 * Genera el cuerpo del correo para un docente.
 * @param {Object} r        - Resultado de calcularMes1 / calcularMes2Plus para un docente
 * @param {string} apodo    - Nombre corto del docente
 * @param {string} regimen  - Régimen fiscal
 * @param {number} mesNum   - Número del mes (1, 2, 3, 4)
 */
export function generarCorreo(r, apodo, regimen, mesNum) {
  const imp = calcularImpuestos(r.xbruto, regimen)

  const mesTexto = ['primer', 'segundo', 'tercer', 'cuarto'][mesNum - 1] ?? `mes ${mesNum}`
  const mesProx  = mesNum + 1

  const numL = r.numL_D1
  const numM = r.numM_D1
  const numL_AA = r.numL_AA
  const numM_AA = r.numM_AA
  const totalLic = r.a + r.b
  const totalMae = r.c + r.d
  const pctLogro = r.ponderacion != null ? `${(r.ponderacion * 100).toFixed(0)}%` : '—'

  const bloqueImpuestos = imp ? `
HONORARIOS: ${fmt(r.xbruto)}
IVA (16%): ${fmt(imp.iva)}
ISR RETENIDO (${(imp.isr_tasa * 100).toFixed(2)}%): ${fmt(imp.isr_ret)}
IVA RETENIDO (10.667%): ${fmt(imp.iva_ret)}
TOTAL A PAGAR: ${fmt(imp.total_pagar)}` : '(Sin datos de impuestos)'

  return `Apreciable docente ${apodo}:

Espero que se encuentre bien.

Le comparto la información correspondiente al ${mesTexto} mes.

Alumnos de licenciatura al inicio del mes: ${numL}
${numL} × $42 = ${fmt(r.a)}

Alumnos de licenciatura con avance académico: ${numL_AA}
${numL_AA} × $45 = ${fmt(r.b)}

Total de licenciatura: ${fmt(r.a)} + ${fmt(r.b)} = ${fmt(totalLic)}

Alumnos de maestría al inicio del mes: ${numM}
${numM} × $45 = ${fmt(r.c)}

Alumnos de maestría con avance académico: ${numM_AA}
${numM_AA} × $50 = ${fmt(r.d)}

Total de maestría: ${fmt(r.c)} + ${fmt(r.d)} = ${fmt(totalMae)}

Total: ${fmt(r.a)} + ${fmt(r.b)} + ${fmt(r.c)} + ${fmt(r.d)} = ${fmt(r.x)}

Ponderación: ${pctLogro}
Honorarios: ${fmt(r.x)} × ${pctLogro} = ${fmt(r.xbruto)}
${bloqueImpuestos}

Alumnos de licenciatura al inicio del ${mesProx === 2 ? 'segundo' : mesProx === 3 ? 'tercer' : mesProx === 4 ? 'cuarto' : `mes ${mesProx}`} mes: ${r.numL_DC}
Alumnos de maestría al inicio del ${mesProx === 2 ? 'segundo' : mesProx === 3 ? 'tercer' : mesProx === 4 ? 'cuarto' : `mes ${mesProx}`} mes: ${r.numM_DC}

Por favor, envíe los archivos PDF y XML de su recibo lo antes posible para que se realice el pago el último día hábil del mes.

Cualquier duda o comentario estoy al pendiente.

Saludos`
}
