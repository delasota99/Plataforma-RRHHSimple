// Pruebas de los motores de altas y empleados. Ejecutar: node tests/altas_empleados.test.js
const A = require('../js/engines/altas.js');
const E = require('../js/engines/empleados.js');

let fallos = 0, total = 0;
const ok = (nombre, cond) => { total++; if (!cond) fallos++; console.log(`${cond ? '✔' : '✘'} ${nombre}`); };

/* ---------- Altas ---------- */
const nF = A.pasosDe('Fábrica (Talavera)').length, nO = A.pasosDe('Oficina (Madrid)').length;
ok('Fábrica tiene 3 pasos más que oficina (talla, correo personal, aviso PRL y Calidad)', nF - nO === 3);
ok('Oficina no incluye la talla de uniforme', !A.pasosDe('Oficina (Madrid)').some(p => p.id === 'talla'));
ok('No existe el paso duplicado "Acdo. confidenc."', !A.pasosDe('Fábrica (Talavera)').some(p => /acuerdo de confid/i.test(p.nombre)));
const vacia = { centro: 'Oficina (Madrid)', check: {} };
ok('Alta sin pasos: sin iniciar', A.estado(vacia) === 'sin-iniciar');
const algunos = { centro: 'Oficina (Madrid)', check: { ofertaEnviada: true, ofertaAceptada: true } };
ok('Menos de la mitad: pendiente de documentación', A.estado(algunos) === 'pendiente-docs');
const casi = { centro: 'Oficina (Madrid)', check: Object.fromEntries(A.pasosDe('Oficina (Madrid)').slice(0, -2).map(p => [p.id, true])) };
ok('Más de la mitad: en proceso', A.estado(casi) === 'en-proceso');
const todo = { centro: 'Oficina (Madrid)', check: Object.fromEntries(A.pasosDe('Oficina (Madrid)').map(p => [p.id, true])) };
ok('Todo marcado: completada (100 %)', A.estado(todo) === 'completada' && A.progreso(todo).pct === 1);
ok('Con bloqueante escrito: bloqueada', A.estado({ ...algunos, bloqueante: 'Falta Nº SS' }) === 'bloqueada');
ok('Bloqueante en blanco no bloquea', A.estado({ ...algunos, bloqueante: '   ' }) === 'pendiente-docs');
ok('Cerrada manda sobre todo', A.estado({ ...todo, cerrada: true }) === 'cerrada');
ok('Los pasos de fábrica cuentan para fábrica', A.progreso({ centro: 'Fábrica (Talavera)', check: todo.check }).pct < 1);
ok('Documentos pendientes (oficina: 7)', A.docsPendientes(vacia).length === 7);
ok('Documentos pendientes (fábrica: 8)', A.docsPendientes({ centro: 'Fábrica (Talavera)', check: {} }).length === 8);
ok('Días desde la oferta', A.diasDesdeOferta({ fechaOferta: '2026-10-11' }, '2026-10-21') === 10);
ok('Sin oferta enviada: null', A.diasDesdeOferta({}, '2026-10-21') === null);

/* ---------- Empleados ---------- */
ok('Fecha dd/mm/aaaa', E.fecha('01/03/2019') === '2019-03-01');
ok('Fecha aaaa-mm-dd', E.fecha('2019-03-01') === '2019-03-01');
ok('Fecha imposible (31/02)', E.fecha('31/02/2026') === null);
ok('Fecha vacía', E.fecha('') === '');
ok('Importe 28.000,50', E.importe('28.000,50') === 28000.5);
ok('Importe 28000', E.importe('28000') === 28000);
ok('Importe 28.000 (miles)', E.importe('28.000') === 28000);
ok('Importe 28000.75', E.importe('28000.75') === 28000.75);
ok('Importe con € y espacios', E.importe('25 780,64 €') === 25780.64);
ok('Importe no válido', E.importe('abc') === null);

const base = [{ id: 1, codigo: 'E-001', nombre: 'Ana Pérez', departamento: 'Calidad', responsable: 'Luis', centro: 'Fábrica (Talavera)', fechaContratacion: '2020-01-01', fechaBaja: '' },
  { id: 2, codigo: 'E-002', nombre: 'Bruno Díaz', departamento: 'Comercial', responsable: 'Marta', centro: 'Oficina (Madrid)', fechaContratacion: '2021-01-01', fechaBaja: '2026-06-30' }];
ok('Código duplicado (sin distinguir mayúsculas)', E.validar({ codigo: 'e-001', nombre: 'X', fechaContratacion: '2026-01-01' }, base).some(m => /ya existe/.test(m)));
ok('Faltan datos obligatorios', E.validar({}, []).length === 3);
ok('Baja anterior a contratación', E.validar({ codigo: 'Z', nombre: 'Z', fechaContratacion: '2026-05-01', fechaBaja: '2026-01-01' }).some(m => /anterior/.test(m)));
ok('Filtro activos excluye bajas', E.filtrar(base, { hoy: '2026-10-21' }).length === 1);
ok('Filtro bajas', E.filtrar(base, { estado: 'bajas', hoy: '2026-10-21' })[0].codigo === 'E-002');
ok('Búsqueda sin tildes', E.filtrar(base, { q: 'diaz', estado: 'todos', hoy: '2026-10-21' }).length === 1);
ok('Filtro por centro', E.filtrar(base, { centro: 'Fábrica (Talavera)', estado: 'todos', hoy: '2026-10-21' }).length === 1);

const csv = '﻿Código;Nombre y apellidos;Departamento;Responsable;Centro;Puesto;Fecha contratación;Salario anual;Fecha baja\r\n' +
  'E-010;"García; Lucía";Producción;Andrés;Fábrica (Talavera);Producción;15/04/2023;21.243,00;\r\n' +
  'E-011;Pablo Gil;Logística;Sergio;Fábrica (Talavera);Técnico/a de logística;2021-11-02;23318.24;\r\n' +
  'E-001;Duplicado;;;;;01/01/2020;;\r\n' +
  'E-012;Fecha mala;;;;;32/01/2020;;\r\n';
const r = E.importarCSV(csv, base);
ok('CSV: 2 filas válidas importadas', r.empleados.length === 2);
ok('CSV: comillas con punto y coma', r.empleados[0].nombre === 'García; Lucía');
ok('CSV: importe español convertido', r.empleados[0].salario === 21243);
ok('CSV: errores con número de fila (duplicado y fecha)', r.errores.map(e => e.fila).join() === '4,5');
const vuelta = E.importarCSV(E.exportarCSV(r.empleados), []);
ok('CSV: exportar e importar conserva los datos', vuelta.empleados.length === 2 && vuelta.empleados[1].fechaContratacion === '2021-11-02' && vuelta.empleados[0].nombre === 'García; Lucía');
ok('CSV con comas como separador', E.importarCSV('codigo,nombre,fecha_contratacion\nX1,Ana,01/02/2024\n').empleados.length === 1);

console.log(fallos ? `\n${fallos} de ${total} pruebas fallidas` : `\nTodas las pruebas correctas (${total})`);
process.exit(fallos ? 1 : 0);
