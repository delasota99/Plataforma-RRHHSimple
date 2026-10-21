/*
 * Motor de tareas — funciones puras: repeticiones, agrupación por vencimiento y exportación .ics.
 * Pruebas: tests/tareas.test.js
 */
(function (root) {
  const DAY = 86400000;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const iso = t => new Date(t).toISOString().slice(0, 10);

  /* Estados: pendiente → en proceso → terminado → (vuelve a) pendiente. */
  const ESTADOS = ['pendiente', 'proceso', 'terminado'];
  const siguienteEstado = e => ESTADOS[(ESTADOS.indexOf(e) + 1) % ESTADOS.length];
  /* Tareas antiguas (solo "hecha") pasan a tener estado. */
  const normalizar = t => ({ ...t, fecha: t.fecha || '', estado: ESTADOS.includes(t.estado) ? t.estado : (t.hecha ? 'terminado' : 'pendiente'), hecha: t.estado ? t.estado === 'terminado' : !!t.hecha });

  /* Siguiente fecha de una tarea que se repite. Si el día no existe en el mes (31), usa el último. */
  function siguienteFecha(fecha, repite) {
    if (!fecha) return null;
    const t = parse(fecha), d = new Date(t);
    if (repite === 'semana') return iso(t + 7 * DAY);
    if (repite !== 'mes' && repite !== 'anio') return null;
    const y = d.getUTCFullYear() + (repite === 'anio' ? 1 : 0), m = d.getUTCMonth() + (repite === 'mes' ? 1 : 0);
    const ultimo = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return iso(Date.UTC(y, m, Math.min(d.getUTCDate(), ultimo)));
  }

  /* Agrupa tareas según su fecha respecto a hoy (AAAA-MM-DD). Quien llama decide qué estados incluir. */
  function agrupar(tareas, hoy) {
    const h = parse(hoy), g = { vencidas: [], hoy: [], manana: [], semana: [], despues: [], sinFecha: [] };
    tareas.forEach(t => {
      if (!t.fecha) { g.sinFecha.push(t); return; }
      const dif = Math.round((parse(t.fecha) - h) / DAY);
      (dif < 0 ? g.vencidas : dif === 0 ? g.hoy : dif === 1 ? g.manana : dif <= 7 ? g.semana : g.despues).push(t);
    });
    const ord = { alta: 0, media: 1, baja: 2 };
    Object.values(g).forEach(l => l.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || ord[a.prioridad] - ord[b.prioridad]));
    return g;
  }

  /* Exportación a calendario (Outlook, Google…): eventos de día completo con aviso a las 9:00. */
  function ics(tareas, ahora = new Date()) {
    const e = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    const fold = l => { const out = []; let s = l; while (s.length > 74) { out.push(s.slice(0, 74)); s = ' ' + s.slice(74); } out.push(s); return out.join('\r\n'); };
    const d = f => f.replace(/-/g, '');
    const stamp = ahora.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const FREQ = { semana: 'WEEKLY', mes: 'MONTHLY', anio: 'YEARLY' };
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RRHH Simple//Plataforma RRHH//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    for (const t of tareas.filter(x => x.fecha)) {
      L.push('BEGIN:VEVENT', `UID:${String(t.id).replace(/\W/g, '')}@plataforma-rrhh`, `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${d(t.fecha)}`, `DTEND;VALUE=DATE:${d(iso(parse(t.fecha) + DAY))}`,
        `SUMMARY:${e(t.titulo)}`, `DESCRIPTION:${e(`Importancia: ${t.prioridad}${t.nota ? '\n' + t.nota : ''}`)}`);
      if (FREQ[t.repite]) L.push(`RRULE:FREQ=${FREQ[t.repite]}`);
      L.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${e(t.titulo)}`, 'TRIGGER:PT9H', 'END:VALARM', 'END:VEVENT');
    }
    L.push('END:VCALENDAR');
    return L.map(fold).join('\r\n') + '\r\n';
  }

  const api = { ESTADOS, siguienteEstado, normalizar, siguienteFecha, agrupar, ics };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MotorTareas = api;
})(typeof window !== 'undefined' ? window : globalThis);
