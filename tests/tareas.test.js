// Pruebas del motor de tareas. Ejecutar: node tests/tareas.test.js
const { siguienteFecha, agrupar, ics, siguienteEstado, normalizar } = require('../js/engines/tareas.js');

let fallos = 0, total = 0;
const ok = (nombre, cond) => { total++; if (!cond) fallos++; console.log(`${cond ? '✔' : '✘'} ${nombre}`); };

ok('Semanal: +7 días', siguienteFecha('2026-10-20', 'semana') === '2026-10-27');
ok('Mensual: mismo día del mes siguiente', siguienteFecha('2026-10-20', 'mes') === '2026-11-20');
ok('Mensual desde el 31: último día del mes siguiente', siguienteFecha('2026-01-31', 'mes') === '2026-02-28');
ok('Mensual en diciembre pasa de año', siguienteFecha('2026-12-15', 'mes') === '2027-01-15');
ok('Anual desde 29/02 en bisiesto: 28/02', siguienteFecha('2028-02-29', 'anio') === '2029-02-28');
ok('Sin repetición: null', siguienteFecha('2026-10-20', '') === null);
ok('Sin fecha no se repite: null', siguienteFecha('', 'mes') === null);

const T = [
  { id: 1, titulo: 'A', fecha: '2026-10-18', prioridad: 'media' },
  { id: 2, titulo: 'B', fecha: '2026-10-20', prioridad: 'baja' },
  { id: 3, titulo: 'C', fecha: '2026-10-20', prioridad: 'alta' },
  { id: 4, titulo: 'D', fecha: '2026-10-21', prioridad: 'media' },
  { id: 5, titulo: 'E', fecha: '2026-10-27', prioridad: 'media' },
  { id: 6, titulo: 'F', fecha: '2026-10-28', prioridad: 'media' },
  { id: 7, titulo: 'G', fecha: '2026-10-10', prioridad: 'alta', hecha: true },
  { id: 8, titulo: 'H', fecha: '', prioridad: 'baja' },
];
const g = agrupar(T.filter(t => !t.hecha), '2026-10-20');
ok('Vencidas: solo la pendiente del 18', g.vencidas.map(t => t.id).join() === '1');
ok('Hoy: ordenadas por importancia (alta primero)', g.hoy.map(t => t.id).join() === '3,2');
ok('Mañana', g.manana.map(t => t.id).join() === '4');
ok('Esta semana (hasta 7 días)', g.semana.map(t => t.id).join() === '5');
ok('Más adelante', g.despues.map(t => t.id).join() === '6');
ok('Sin fecha: grupo propio', g.sinFecha.map(t => t.id).join() === '8');

ok('Estado: pendiente → en proceso', siguienteEstado('pendiente') === 'proceso');
ok('Estado: en proceso → terminado', siguienteEstado('proceso') === 'terminado');
ok('Estado: terminado → pendiente', siguienteEstado('terminado') === 'pendiente');
ok('Migración: hecha antigua → terminado', normalizar({ id: 1, hecha: true, fecha: '2026-01-01' }).estado === 'terminado');
ok('Migración: no hecha → pendiente', normalizar({ id: 1, fecha: '2026-01-01' }).estado === 'pendiente');
ok('Normalizar: estado manda sobre "hecha"', normalizar({ id: 1, estado: 'proceso', hecha: true }).hecha === false);

const cal = ics([{ id: 10, titulo: 'Sin día', fecha: '', prioridad: 'baja' }, { id: 9.5, titulo: 'Enviar TC, gestoría; urgente', fecha: '2026-10-20', prioridad: 'alta', repite: 'mes', nota: 'Línea 1\nLínea 2' }], new Date('2026-10-20T10:00:00Z'));
ok('ICS: cabecera y cierre', cal.startsWith('BEGIN:VCALENDAR') && cal.trim().endsWith('END:VCALENDAR'));
ok('ICS: evento de día completo', cal.includes('DTSTART;VALUE=DATE:20261020') && cal.includes('DTEND;VALUE=DATE:20261021'));
ok('ICS: repetición mensual', cal.includes('RRULE:FREQ=MONTHLY'));
ok('ICS: comas y punto y coma escapados', cal.includes('SUMMARY:Enviar TC\\, gestoría\\; urgente'));
ok('ICS: saltos de línea CRLF', cal.includes('\r\n'));
ok('ICS: las tareas sin fecha no se exportan', (cal.match(/BEGIN:VEVENT/g) || []).length === 1);

console.log(fallos ? `\n${fallos} de ${total} pruebas fallidas` : `\nTodas las pruebas correctas (${total})`);
process.exit(fallos ? 1 : 0);
