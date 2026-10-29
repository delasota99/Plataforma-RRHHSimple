// Pruebas del motor de reconocimientos médicos. Ejecutar: node tests/reconocimientos.test.js
global.window = {}; require('../js/params.js'); const P = window.RRHH_PARAMS, C = P.reconocimientos;
const M = require('../js/engines/reconocimientos.js');
let fallos = 0, total = 0;
const ok = (n, c) => { total++; if (!c) fallos++; console.log(`${c ? '✔' : '✘'} ${n}`); };

/* Estados */
ok('Sin registro: por comunicar', M.estado(undefined) === 'pendiente');
ok('Comunicado sin respuesta', M.estado({ comunicado: '2027-02-01' }) === 'comunicado');
ok('Acepta sin cita: por citar', M.estado({ comunicado: '2027-02-01', respuesta: 'acepta' }) === 'acepta');
ok('Con cita: citado', M.estado({ respuesta: 'acepta', cita: { fecha: '2027-03-10' } }) === 'citado');
ok('Realizado manda sobre todo', M.estado({ respuesta: 'acepta', cita: { fecha: '2027-03-10' }, realizado: '2027-03-10' }) === 'realizado');
ok('Rechaza', M.estado({ comunicado: '2027-02-01', respuesta: 'rechaza' }) === 'rechaza');

/* Participantes: oficina, de alta en el año */
const E = [
  { id: 1, codigo: 'E-01', nombre: 'Ana', nombreCompleto: 'Ana Prueba Uno', centro: 'Oficina (Madrid)', fechaContratacion: '2020-01-10', email: 'ana@ejemplo.test' },
  { id: 2, codigo: 'E-02', nombre: 'Luis', nombreCompleto: 'Luis Prueba Dos', centro: 'Fábrica (Talavera)', fechaContratacion: '2019-05-01' },
  { id: 3, codigo: 'E-03', nombre: 'Eva', nombreCompleto: 'Eva Prueba Tres', centro: 'Oficina (Madrid)', fechaContratacion: '2018-01-01', fechaBaja: '2026-06-30' },
  { id: 4, codigo: 'E-04', nombre: 'Juan', nombreCompleto: 'Juan Prueba Cuatro', centro: 'Oficina (Madrid)', fechaContratacion: '2027-11-02' },
  { id: 5, codigo: 'E-05', nombre: 'Rosa', nombreCompleto: 'Rosa Prueba Cinco', centro: 'Fábrica (Talavera)', fechaContratacion: '2015-01-01', reconocimientos: { 2027: { comunicado: '2027-02-01' } } }
];
const ids = l => l.map(e => e.id).join();
ok('Campaña 2027: oficina de alta + quien ya tiene registro', ids(M.participantes(E, 2027, C.centros, '2027-03-01')) === '1,4,5');
ok('Campaña en curso: NO incluye a quien ya ha causado baja', ids(M.participantes(E, 2026, C.centros, '2026-10-29')) === '1');
ok('Campaña pasada: a fecha 31/12', ids(M.participantes(E, 2026, C.centros, '2027-02-01')) === '1');
ok('Baja futura (aún de alta hoy): sí entra', ids(M.participantes([{ ...E[2], fechaBaja: '2026-12-15' }], 2026, C.centros, '2026-10-29')) === '3');
ok('Centro reconocido sin importar cómo se escribió', M.esOficina('OFICINA MADRID') && M.esOficina('Oficina (Madrid)') && !M.esOficina('Fábrica (Talavera)'));
ok('Centros con función (p. ej. "Oficina" a secas)', ids(M.participantes([{ ...E[0], centro: 'Oficina' }], 2026, e => M.esOficina(e.centro), '2026-10-29')) === '1');

/* Resumen y seguimiento */
const L = [
  { id: 1, reconocimientos: { 2027: { comunicado: '2027-02-01' } } },
  { id: 2, reconocimientos: { 2027: { comunicado: '2027-02-08' } } },
  { id: 3, reconocimientos: { 2027: { comunicado: '2027-02-01', respuesta: 'acepta' } } },
  { id: 4, reconocimientos: { 2027: { respuesta: 'acepta', cita: { fecha: '2027-02-09', hora: '09:00', lugarId: 'a' } } } },
  { id: 5, reconocimientos: { 2027: { respuesta: 'acepta', cita: { fecha: '2027-02-20', hora: '09:00', lugarId: 'a' } } } },
  { id: 6, reconocimientos: { 2027: { respuesta: 'acepta', cita: { fecha: '2027-02-20', hora: '09:00', lugarId: 'a' } } } },
  { id: 7, reconocimientos: { 2027: { respuesta: 'rechaza' } } },
  { id: 8, reconocimientos: { 2027: { realizado: '2027-02-05' } } },
  { id: 9 }
];
const r = M.resumen(L, 2027);
ok('Comunicación masiva: la fecha de la campaña vale para todos', M.estado({}, '2027-02-01') === 'comunicado' && M.resumen([{ id: 1 }, { id: 2 }], 2027, '2027-02-01').comunicado === 2);
ok('Sin respuesta tras 7 días con la fecha de la campaña', M.seguimiento([{ id: 1 }], 2027, '2027-02-09', 7, '2027-02-01').sinResp.length === 1);
ok('Resumen por estados', r.pendiente === 1 && r.comunicado === 2 && r.acepta === 1 && r.citado === 3 && r.rechaza === 1 && r.realizado === 1 && r.total === 9);
ok('Cerrados = realizados + rechazos', r.cerrados === 2);
const s = M.seguimiento(L, 2027, '2027-02-10', C.respuestaDias);
ok('Sin respuesta tras 7 días: solo la comunicada el 01/02', ids(s.sinResp) === '1');
ok('Aceptan y faltan por citar', ids(s.porCitar) === '3');
ok('Cita pasada sin marcar como realizada', ids(s.porConfirmar) === '4');
ok('Próximas citas ordenadas', ids(s.proximas) === '5,6');
ok('Aviso de dos citas a la misma hora y lugar', [...M.solapes(L, 2027)].sort().join() === '5,6');

/* Correos */
const nombre = e => e.nombre;
const lugar = { id: 'a', nombre: 'Centro médico de ejemplo', direccion: 'Calle Falsa 123, Madrid', indicaciones: 'Acude en ayunas.' };
const cc = M.correoCita({ e: E[0], anio: 2027, r: { cita: { fecha: '2027-03-10', hora: '08:30', lugarId: 'a' } }, lugar, cfg: C, empresa: P.empresa, nombre });
ok('Correo de cita: destinatario, asunto y datos', cc.para === 'ana@ejemplo.test' && cc.asunto === 'Tu cita para el reconocimiento médico 2027' && cc.texto.includes('miércoles, 10 de marzo de 2027') && cc.texto.includes('08:30 h') && cc.texto.includes('Calle Falsa 123') && cc.texto.includes('Acude en ayunas.') && cc.texto.startsWith('Hola, Ana:'));
const cs = M.correoCita({ e: E[0], anio: 2027, r: { cita: { fecha: '2027-03-10' } }, lugar: null, cfg: C, empresa: P.empresa, nombre });
ok('Sin hora ni indicaciones: sin huecos de más', cs.texto.includes('por confirmar') && !/\n{3,}/.test(cs.texto));
const cm = M.correoComunicacion({ anio: 2027, cfg: C, empresa: P.empresa, nombre });
ok('Comunicación a todos: saludo genérico y voluntariedad', cm.texto.startsWith('Hola, a todos:') && cm.texto.includes('voluntario') && cm.asunto === 'Reconocimiento médico 2027');
const mt = M.mailto({ cco: ['a@x.test', 'b@x.test'], asunto: 'Á b', texto: 'línea 1\nlínea 2' });
ok('Enlace de correo con copia oculta y texto codificado', mt.startsWith('mailto:?bcc=a%40x.test%2Cb%40x.test&subject=') && mt.includes('%0A'));
const rn = M.renuncia({ e: { ...E[0], puesto: 'Administrativa' }, anio: 2027, cfg: C, empresa: P.empresa, hoy: '2027-02-15' });
ok('Escrito de renuncia con datos, año, art. 22 y ciudad', rn.includes('Ana Prueba Uno') && rn.includes('E-01') && rn.includes('artículo 22') && rn.includes('En Madrid, a 15 de febrero de 2027'));
ok('Plantilla: claves desconocidas vacías', M.rellenar('{a}-{b}', { a: 1 }) === '1-');

console.log(fallos ? `\n${fallos} de ${total} pruebas fallidas` : `\nTodas las pruebas correctas (${total})`);
process.exit(fallos ? 1 : 0);
