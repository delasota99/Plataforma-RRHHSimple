/*
 * Datos y copias de seguridad.
 * - Todo se guarda en este navegador (IndexedDB). Nada sale del equipo.
 * - Se pide al navegador almacenamiento persistente para que no lo borre solo.
 * - Copia: archivo vinculado con guardado automático (Chrome) o descarga de un JSON.
 * Claves que empiezan por "_" son internas y no disparan el guardado automático.
 */
const Datos = (() => {
  const APP = 'plataforma-rrhh', VERSION_DATOS = 1;
  let db = null, cache = {}, handle = null, persistente = false, fallo = false;
  const oyentes = new Set();
  let autoT = null;
  let estadoArchivo = 'sin-archivo';     // sin-archivo | activo | sin-permiso

  function abrir() {
    return new Promise((ok, ko) => {
      const req = indexedDB.open(APP, 1);
      req.onupgradeneeded = () => { const d = req.result; d.createObjectStore('kv'); d.createObjectStore('sys'); };
      req.onsuccess = () => ok(req.result);
      req.onerror = () => ko(req.error);
      req.onblocked = () => console.warn('El almacén de datos está bloqueado por otra pestaña de la plataforma');
    });
  }
  const tx = (store, modo, fn) => new Promise((ok, ko) => {
    const t = db.transaction(store, modo), s = t.objectStore(store), r = fn(s);
    t.oncomplete = () => ok(r && r.result); t.onerror = () => ko(t.error);
  });

  /* Ninguna espera del arranque puede bloquear la plataforma: si algo del navegador no responde en unos segundos, se sigue sin ello. */
  const conLimite = (p, ms, valor, que) => Promise.race([p, new Promise(ok => setTimeout(() => { console.warn(`Arranque: ${que} no responde; se continúa sin ello`); ok(valor); }, ms))]);
  async function init() {
    try {
      db = await conLimite(abrir(), 6000, null, 'el almacén de datos');
      if (!db) throw new Error('El almacén de datos no responde');
      await conLimite(new Promise((ok, ko) => {
        const t = db.transaction('kv', 'readonly'), s = t.objectStore('kv'), c = s.openCursor();
        c.onsuccess = () => { const cur = c.result; if (cur) { cache[cur.key] = cur.value; cur.continue(); } else ok(); };
        c.onerror = () => ko(c.error);
      }), 8000, null, 'la lectura de datos');
      handle = await conLimite(tx('sys', 'readonly', s => s.get('archivo')), 3000, null, 'el archivo vinculado') || null;
    } catch (e) { fallo = true; console.warn('IndexedDB no disponible', e); }
    try { persistente = await conLimite((async () => await navigator.storage?.persisted?.() || await navigator.storage?.persist?.() || false)(), 2000, false, 'el almacenamiento protegido'); } catch (e) {}
    if (handle) estadoArchivo = (await conLimite(permiso(false), 2000, false, 'el permiso del archivo vinculado')) ? 'activo' : 'sin-permiso';
  }

  const get = (k, def) => (k in cache ? structuredClone(cache[k]) : def);
  function set(k, v) {
    cache[k] = structuredClone(v);
    if (db) tx('kv', 'readwrite', s => s.put(cache[k], k)).catch(e => console.warn(e));
    oyentes.forEach(fn => fn(k));
    if (!k.startsWith('_')) programarAuto();
  }
  const on = fn => (oyentes.add(fn), () => oyentes.delete(fn));

  function exportar() {
    const datos = Object.fromEntries(Object.entries(cache).filter(([k]) => !k.startsWith('_')));
    return { app: APP, version: VERSION_DATOS, exportadoEl: new Date().toISOString(), datos };
  }
  async function importar(obj) {
    if (!obj || obj.app !== APP || typeof obj.datos !== 'object') throw new Error('El archivo no es una copia de esta plataforma.');
    for (const [k, v] of Object.entries(obj.datos)) set(k, v);
    return Object.keys(obj.datos).length;
  }

  /* ---------- Archivo vinculado (File System Access API, Chrome) ---------- */
  const puedeVincular = () => typeof window.showSaveFilePicker === 'function';
  async function permiso(pedir) {
    if (!handle) return false;
    try {
      const o = { mode: 'readwrite' };
      if (await handle.queryPermission(o) === 'granted') return true;
      return pedir ? (await handle.requestPermission(o)) === 'granted' : false;
    } catch (e) { return false; }
  }
  async function escribir() {
    const w = await handle.createWritable();
    await w.write(JSON.stringify(exportar(), null, 2)); await w.close();
    set('_ultimaCopia', Date.now());
  }
  async function vincular() {
    const h = await window.showSaveFilePicker({ suggestedName: 'plataforma-rrhh-datos.json', types: [{ description: 'Copia de la plataforma', accept: { 'application/json': ['.json'] } }] });
    handle = h; if (db) await tx('sys', 'readwrite', s => s.put(h, 'archivo'));
    await escribir(); estadoArchivo = 'activo'; avisar();
    return h.name;
  }
  async function desvincular() { handle = null; if (db) await tx('sys', 'readwrite', s => s.delete('archivo')); estadoArchivo = 'sin-archivo'; avisar(); }
  function programarAuto() {
    if (!handle) return;
    clearTimeout(autoT);
    autoT = setTimeout(async () => {
      if (await conLimite(permiso(false), 3000, false, 'el permiso del archivo vinculado')) { try { await escribirConLimite(); estadoArchivo = 'activo'; } catch (e) { estadoArchivo = 'sin-permiso'; } }
      else estadoArchivo = 'sin-permiso';
      avisar();
    }, 1500);
  }
  const avisar = () => oyentes.forEach(fn => fn('_estado'));

  /* Escritura en el archivo vinculado con límite de tiempo (si el archivo ya no existe o el navegador no responde, falla). */
  const escribirConLimite = () => Promise.race([escribir(), new Promise((_, ko) => setTimeout(() => ko(new Error('El archivo vinculado no responde')), 8000))]);
  /* Guardar copia (requiere un clic del usuario). Si el archivo vinculado no se puede usar, se descarga la copia igualmente. */
  async function guardarCopia() {
    let aviso = '';
    if (handle) {
      const ok = await conLimite(permiso(true), 20000, false, 'el permiso del archivo vinculado');
      if (ok) {
        try { await escribirConLimite(); estadoArchivo = 'activo'; avisar(); return { modo: 'archivo', nombre: handle.name }; }
        catch (e) { console.warn('No se pudo escribir en el archivo vinculado', e); aviso = 'no-escribe'; }
      } else aviso = 'sin-permiso';
      estadoArchivo = 'sin-permiso'; avisar();
    }
    descargar(); set('_ultimaCopia', Date.now());
    return { modo: 'descarga', aviso };
  }
  function descargar() {
    const blob = new Blob([JSON.stringify(exportar(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `plataforma-rrhh-copia-${Fecha.iso(Fecha.hoy())}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  return {
    init, get, set, on, exportar, importar, guardarCopia, descargar, vincular, desvincular, puedeVincular,
    get estado() { return { persistente, fallo, archivo: handle?.name || null, estadoArchivo, ultimaCopia: cache._ultimaCopia || null }; }
  };
})();
