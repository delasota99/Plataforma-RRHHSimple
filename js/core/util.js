/* Utilidades comunes (sin dependencias). */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const DAY = 86400000;
const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const Fecha = {
  hoy() { const d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); },
  iso(t) { return new Date(t).toISOString().slice(0, 10); },
  parse(s) { if (!s) return null; const [y, m, d] = String(s).split('-').map(Number); return (y && m && d) ? Date.UTC(y, m - 1, d) : null; },
  larga(t) { return new Date(t).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }); },
  corta(t) { return new Date(t).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', ''); },
  diaSemana(t) { return new Date(t).toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' }); },
  mesCorto(t) { return new Date(t).toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' }).replace('.', ''); },
  sumar(t, unidad, n = 1) {             // unidad: 'semana' | 'mes' | 'anio'
    const d = new Date(t);
    if (unidad === 'semana') return t + 7 * n * DAY;
    const y = d.getUTCFullYear() + (unidad === 'anio' ? n : 0), m = d.getUTCMonth() + (unidad === 'mes' ? n : 0);
    const ultimo = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return Date.UTC(y, m, Math.min(d.getUTCDate(), ultimo));
  }
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dec = n => Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
const euros = n => Number(n).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' });
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* Número que cuenta hasta su nuevo valor (decorativo; respeta "reducir movimiento"). */
function countTo(el, to) {
  const from = Number(el.dataset.v ?? 0); el.dataset.v = to;
  if (reduceMotion || from === to) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 420; cancelAnimationFrame(el._raf);
  const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(from + (to - from) * e); if (p < 1) el._raf = requestAnimationFrame(step); };
  el._raf = requestAnimationFrame(step);
}

let _toastT;
/* Aviso breve. Opcionalmente con una acción, p. ej. { texto: 'Deshacer', fn }. */
function toast(msg, accion = null) {
  const t = $('#toast'), b = $('#toastBtn');
  $('#toastTxt').textContent = msg; t.hidden = false;
  b.hidden = !accion;
  if (accion) { b.textContent = accion.texto; b.onclick = () => { t.hidden = true; accion.fn(); }; }
  clearTimeout(_toastT); _toastT = setTimeout(() => t.hidden = true, accion ? 6000 : 2800);
}

/* Iconos (trazos 24×24). */
const ICON = {
  inicio: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z',
  empleados: 'M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  altas: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
  tareas: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
  documentos: 'M3 5h18v14H3zM4 6l8 6 8-6',
  calendario: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',
  salarios: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  vacaciones: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  permisos: 'M4 3h16v18H4zM8 8h8M8 12h8M8 16h5',
  nacimiento: 'M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z',
  indemnizacion: 'M3 7h18v12H3zM3 11h18M7 15h3',
  finiquito: 'M6 3h9l3 3v15H6zM9 10h6M9 14h6M9 18h3',
  ajustes: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 15H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.7 4.4V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z',
  accion: 'M13 2L4 14h7l-1 8 9-12h-7z',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v5M12 16h.01'
};
const icon = (k, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[k] || ICON.info}"/></svg>`;
