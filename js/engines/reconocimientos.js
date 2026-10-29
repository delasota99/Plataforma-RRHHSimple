/*
 * Motor de reconocimientos médicos (campaña anual) — funciones puras.
 * La comunicación es masiva: una fecha por campaña (comunicado), que vale para todas las personas.
 * Registro por persona y año (dentro de la ficha cifrada): empleado.reconocimientos[anio] =
 *   { incluido: true (añadida a mano), excluido: true (quitada a mano), comunicado: 'AAAA-MM-DD' (solo si se comunicó aparte), respuesta: 'acepta'|'rechaza'|'', respuestaEl, renunciaFirmada,
 *     cita: { fecha, hora, lugarId }, citaEnviada: 'AAAA-MM-DD', realizado: 'AAAA-MM-DD' }
 * Nunca se guardan resultados ni datos de salud.
 * Base legal: art. 22 de la Ley 31/1995 de PRL (voluntaria; confidencial; la empresa solo conoce la aptitud).
 * Pruebas: tests/reconocimientos.test.js
 */
(function (root) {
  const ESTADOS = ['pendiente', 'comunicado', 'acepta', 'citado', 'realizado', 'rechaza'];
  const NOMBRE = { pendiente: 'Por comunicar', comunicado: 'Sin respuesta', acepta: 'Acepta · por citar', citado: 'Citado', realizado: 'Realizado', rechaza: 'Rechaza' };
  const f = s => s ? s.split('-').reverse().join('/') : '';
  const DAY = 86400000;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };

  /* Estado de una persona en la campaña (a partir de su registro del año y la fecha de comunicación de la campaña). */
  function estado(r, comunicado = '') {
    r = { ...(r || {}) }; if (!r.comunicado && comunicado) r.comunicado = comunicado;
    if (r.realizado) return 'realizado';
    if (r.respuesta === 'rechaza') return 'rechaza';
    if (r.cita && r.cita.fecha) return 'citado';
    if (r.respuesta === 'acepta') return 'acepta';
    if (r.comunicado) return 'comunicado';
    return 'pendiente';
  }

  /* Quién entra en la campaña: personas de los centros elegidos (oficina; quien teletrabaja figura en Oficina) que siguen
     de alta (a la fecha de referencia: hoy, o el 31/12 si la campaña ya terminó). Quien tenga registro ese año se mantiene.
     "incluye" puede ser una lista de centros o una función (empleado → sí/no). */
  function participantes(empleados, anio, incluye, hoy = `${anio}-01-01`) {
    const fin = `${anio}-12-31`, ref = hoy < fin ? (hoy > `${anio}-01-01` ? hoy : `${anio}-01-01`) : fin;
    const enCentro = typeof incluye === 'function' ? incluye : e => incluye.includes(e.centro);
    return empleados.filter(e => {
      const r = e.reconocimientos && e.reconocimientos[anio];
      if (r) return !r.excluido; // añadida a mano o con algo anotado: dentro; quitada a mano: fuera
      return enCentro(e) && (!e.fechaContratacion || e.fechaContratacion <= fin) && (!e.fechaBaja || e.fechaBaja >= ref);
    });
  }
  /* Centro de oficina por defecto: el que contiene "oficina", "remoto" o "teletrabajo" (sin tildes ni mayúsculas). */
  const esOficina = centro => /oficina|remot|teletrab/.test(String(centro || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());

  /* Recuento por estado. */
  function resumen(lista, anio, comunicado = '') {
    const n = Object.fromEntries(ESTADOS.map(k => [k, 0]));
    lista.forEach(e => n[estado(e.reconocimientos?.[anio], comunicado)]++);
    const total = lista.length, cerrados = n.realizado + n.rechaza;
    return { ...n, total, cerrados, pct: total ? cerrados / total : 0 };
  }

  /* Rellena una plantilla {clave}. Las claves que no existan se dejan vacías. */
  const rellenar = (txt, vars) => String(txt || '').replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

  /* Correo de la cita (necesita fecha y lugar). */
  function correoCita({ e, anio, r, lugar, cfg, empresa, nombre }) {
    const fecha = r.cita?.fecha ? new Date(parse(r.cita.fecha)).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
    const vars = { nombre: nombre(e), nombreCompleto: e.nombreCompleto, anio, fecha, hora: r.cita?.hora ? `${r.cita.hora} h` : 'por confirmar',
      lugar: lugar?.nombre || '', direccion: lugar?.direccion || '', indicaciones: lugar?.indicaciones ? `\n${lugar.indicaciones}\n` : '',
      empresa: empresa.nombre, firma: empresa.firmaCorta || empresa.firmante };
    return { para: e.email || '', asunto: rellenar(cfg.correoCita.asunto, vars), texto: rellenar(cfg.correoCita.texto, vars).replace(/\n{3,}/g, '\n\n') };
  }
  /* Correo del anuncio (uno por persona o uno para todos con copia oculta: en ese caso el saludo es genérico). */
  function correoComunicacion({ e = null, anio, cfg, empresa, nombre }) {
    const vars = { nombre: e ? nombre(e) : 'a todos', anio, empresa: empresa.nombre, firma: empresa.firmaCorta || empresa.firmante };
    return { para: e?.email || '', asunto: rellenar(cfg.correoComunicacion.asunto, vars), texto: rellenar(cfg.correoComunicacion.texto, vars) };
  }
  function renuncia({ e, anio, cfg, empresa, hoy }) {
    const ciudad = (empresa.centrosTexto || {})[e.centro] || 'Madrid';
    return rellenar(cfg.renuncia, { nombreCompleto: e.nombreCompleto, codigo: e.codigo || '—', puesto: e.puesto || '—', anio, empresa: empresa.nombre, ciudad,
      hoy: new Date(parse(hoy)).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) });
  }

  /* Enlace de correo: un destinatario o varios en copia oculta. */
  const enc = encodeURIComponent;
  function mailto({ para = '', cco = [], asunto = '', texto = '' }) {
    const q = [cco.length ? `bcc=${enc(cco.join(','))}` : '', `subject=${enc(asunto)}`, `body=${enc(texto)}`].filter(Boolean).join('&');
    return `mailto:${enc(para)}?${q}`;
  }

  /* Pendientes para el seguimiento: sin respuesta pasados "dias" desde la comunicación, aceptados sin cita
     y citas ya pasadas sin marcar como realizadas. */
  function seguimiento(lista, anio, hoy, dias, comunicado = '') {
    const sinResp = [], porCitar = [], porConfirmar = [], proximas = [];
    lista.forEach(e => {
      const r = e.reconocimientos?.[anio] || {}, st = estado(r, comunicado), com = r.comunicado || comunicado;
      if (st === 'comunicado' && (parse(hoy) - parse(com)) / DAY >= dias) sinResp.push(e);
      if (st === 'acepta') porCitar.push(e);
      if (st === 'citado' && r.cita.fecha < hoy) porConfirmar.push(e);
      if (st === 'citado' && r.cita.fecha >= hoy) proximas.push(e);
    });
    proximas.sort((a, b) => (a.reconocimientos[anio].cita.fecha + (a.reconocimientos[anio].cita.hora || '')).localeCompare(b.reconocimientos[anio].cita.fecha + (b.reconocimientos[anio].cita.hora || '')));
    return { sinResp, porCitar, porConfirmar, proximas };
  }

  /* Dos citas a la misma hora en el mismo lugar (aviso, no error). */
  function solapes(lista, anio) {
    const m = new Map(), out = new Set();
    lista.forEach(e => { const c = e.reconocimientos?.[anio]?.cita; if (!c?.fecha || !c.hora) return; const k = `${c.fecha} ${c.hora} ${c.lugarId || ''}`; if (m.has(k)) { out.add(e.id); out.add(m.get(k)); } else m.set(k, e.id); });
    return out;
  }

  const api = { ESTADOS, NOMBRE, estado, participantes, esOficina, resumen, rellenar, correoCita, correoComunicacion, renuncia, mailto, seguimiento, solapes, f };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MotorReconocimientos = api;
})(typeof window !== 'undefined' ? window : globalThis);
