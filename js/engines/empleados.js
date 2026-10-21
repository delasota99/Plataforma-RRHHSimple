/*
 * Motor de empleados — funciones puras: validación, filtros e importación/exportación CSV.
 * Modelo: { id, codigo, nombre, departamento, responsable, centro, puesto, fechaContratacion, salario, fechaBaja, vacaciones: {anio: dias} }
 * Pruebas: tests/empleados.test.js
 */
(function (root) {
  const COLUMNAS = ['codigo', 'nombre', 'departamento', 'responsable', 'centro', 'puesto', 'fecha_contratacion', 'salario_anual', 'fecha_baja'];
  const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  /* Fechas: acepta 31/12/2026, 31-12-2026 o 2026-12-31. Devuelve AAAA-MM-DD o '' si está vacía, null si no es válida. */
  function fecha(s) {
    s = String(s ?? '').trim(); if (!s) return '';
    let y, m, d, r;
    if ((r = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) [, y, m, d] = r;
    else if ((r = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/))) [, d, m, y] = r;
    else return null;
    const t = new Date(Date.UTC(+y, +m - 1, +d));
    if (t.getUTCFullYear() !== +y || t.getUTCMonth() !== +m - 1 || t.getUTCDate() !== +d) return null;
    return t.toISOString().slice(0, 10);
  }
  /* Importes: acepta 28.000,50 · 28000,5 · 28000.50 · 28 000 €. Devuelve número, '' si vacío, null si no válido. */
  function importe(s) {
    s = String(s ?? '').replace(/[€\s]/g, '').trim(); if (!s) return '';
    if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    else s = s.replace(/,/g, '');
    const n = Number(s); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
  }

  function validar(e, existentes = []) {
    const err = [];
    if (!String(e.codigo || '').trim()) err.push('Falta el código de empleado');
    else if (existentes.some(x => x.id !== e.id && norm(x.codigo) === norm(e.codigo))) err.push(`El código ${e.codigo} ya existe`);
    if (!String(e.nombre || '').trim()) err.push('Falta el nombre');
    if (!e.fechaContratacion) err.push('Falta la fecha de contratación');
    if (e.fechaBaja && e.fechaContratacion && e.fechaBaja < e.fechaContratacion) err.push('La fecha de baja es anterior a la de contratación');
    if (e.salario !== '' && e.salario != null && !(e.salario >= 0)) err.push('Salario no válido');
    return err;
  }

  const activo = (e, hoy) => !e.fechaBaja || e.fechaBaja >= hoy;
  function filtrar(lista, { q = '', centro = '', departamento = '', responsable = '', estado = 'activos', hoy } = {}) {
    const nq = norm(q);
    return lista.filter(e =>
      (!nq || norm([e.codigo, e.nombre, e.departamento, e.responsable, e.puesto].join(' ')).includes(nq)) &&
      (!centro || e.centro === centro) && (!departamento || e.departamento === departamento) && (!responsable || e.responsable === responsable) &&
      (estado === 'todos' || (estado === 'activos') === activo(e, hoy))
    ).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
  const valores = (lista, campo) => [...new Set(lista.map(e => e[campo]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));

  /* CSV: detecta ; o , como separador; admite comillas. Primera fila = cabeceras (flexibles). */
  function parseCSV(texto) {
    texto = texto.replace(/^﻿/, '');
    const primera = texto.split(/\r?\n/)[0] || '';
    const sep = (primera.match(/;/g) || []).length >= (primera.match(/,/g) || []).length ? ';' : ',';
    const filas = []; let fila = [], campo = '', comillas = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (comillas) { if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else comillas = false; } else campo += c; }
      else if (c === '"') comillas = true;
      else if (c === sep) { fila.push(campo); campo = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && texto[i + 1] === '\n') i++; fila.push(campo); filas.push(fila); fila = []; campo = ''; }
      else campo += c;
    }
    if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }
    return filas.filter(f => f.some(x => x.trim() !== ''));
  }
  const ALIAS = { codigo: ['codigo', 'cod', 'codigo empleado', 'n empleado', 'id'], nombre: ['nombre', 'nombre y apellidos', 'apellidos y nombre', 'empleado'],
    departamento: ['departamento', 'dpto', 'area'], responsable: ['responsable', 'jefe', 'manager'], centro: ['centro', 'centro de trabajo'],
    puesto: ['puesto', 'cargo'], fechaContratacion: ['fecha contratacion', 'fecha_contratacion', 'fecha alta', 'antiguedad', 'fecha de contratacion'],
    salario: ['salario', 'salario anual', 'salario_anual', 'bruto anual', 'salario bruto anual'], fechaBaja: ['fecha baja', 'fecha_baja', 'fecha de baja'] };
  /* Devuelve { empleados, errores:[{fila, mensajes}] } sin guardar nada. */
  function importarCSV(texto, existentes = []) {
    const filas = parseCSV(texto); if (filas.length < 2) return { empleados: [], errores: [{ fila: 1, mensajes: ['El archivo no tiene filas de datos'] }] };
    const cab = filas[0].map(h => norm(h).replace(/[_º.]/g, ' ').replace(/\s+/g, ' '));
    const idx = Object.fromEntries(Object.entries(ALIAS).map(([k, al]) => [k, cab.findIndex(h => al.includes(h))]));
    const empleados = [], errores = [];
    filas.slice(1).forEach((f, i) => {
      const v = k => idx[k] >= 0 ? (f[idx[k]] || '').trim() : '';
      const e = { codigo: v('codigo'), nombre: v('nombre'), departamento: v('departamento'), responsable: v('responsable'), centro: v('centro'), puesto: v('puesto'),
        fechaContratacion: fecha(v('fechaContratacion')), salario: importe(v('salario')), fechaBaja: fecha(v('fechaBaja')), vacaciones: {} };
      const m = [];
      if (e.fechaContratacion === null) m.push(`Fecha de contratación no válida: "${v('fechaContratacion')}"`);
      if (e.fechaBaja === null) m.push(`Fecha de baja no válida: "${v('fechaBaja')}"`);
      if (e.salario === null) m.push(`Salario no válido: "${v('salario')}"`);
      if (!m.length) m.push(...validar(e, [...existentes, ...empleados]));
      if (m.length) errores.push({ fila: i + 2, mensajes: m }); else empleados.push(e);
    });
    return { empleados, errores };
  }
  function exportarCSV(lista) {
    const q = s => { s = String(s ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const f = s => s ? s.split('-').reverse().join('/') : '';
    const n = x => x === '' || x == null ? '' : String(x).replace('.', ',');
    return '﻿' + [COLUMNAS.join(';'), ...lista.map(e => [e.codigo, e.nombre, e.departamento, e.responsable, e.centro, e.puesto, f(e.fechaContratacion), n(e.salario), f(e.fechaBaja)].map(q).join(';'))].join('\r\n') + '\r\n';
  }

  const api = { COLUMNAS, fecha, importe, validar, activo, filtrar, valores, parseCSV, importarCSV, exportarCSV };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MotorEmpleados = api;
})(typeof window !== 'undefined' ? window : globalThis);
