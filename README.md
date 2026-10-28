# Honorarios Docentes

Web app para calcular honorarios mensuales a docentes a partir del Reporte de Avance Académico (RAA).

## Uso

1. Selecciona el mes a calcular.
2. Carga el RAA del mes actual (.xlsx) y el archivo de Datos de Docentes (.xlsx).
   - Para el mes 2 o superior, carga también el RAA del mes anterior.
3. Revisa la tabla de resultados. Puedes editar la ponderación de cualquier docente.
4. En el paso 3, copia el texto de cada correo y pégalo en Gmail. Toma captura de pantalla del bloque de desglose fiscal y adjúntala.

## Archivos esperados

### RAA Mes 1
| Hoja | Columnas clave |
|---|---|
| RAA Día 1 Mes 1 | Nombre del curso, Nombre de usuario, Programa, Docente |
| RAA Día de Corte M1 | Nombre del curso, Nombre de usuario, % de avance, Proyecto de Asignatura, Avance Académico (AA), Profesor |
| Hoja3 | Docente, Ponderación |

### RAA Mes 2+
Misma estructura, con hojas "RAA Día de Corte M2" (o M3, M4) y Hoja3.

### Datos de Docentes
| Columna | Descripción |
|---|---|
| Docente | Nombre completo (llave de cruce) |
| Nombre Docente | Apodo para el saludo del correo |
| Régimen Fiscal | RESICO o Personas Físicas con Actividad Empresarial y Profesional |
| Correo electrónico | Destino del correo |

## Deploy en Vercel

```bash
npm install -g vercel
cd honorarios-docentes
vercel
```

O conecta el repositorio en [vercel.com/new](https://vercel.com/new) y despliega automáticamente.

## Desarrollo local

```bash
npm install
npm run dev
# Abre http://localhost:3000
```
