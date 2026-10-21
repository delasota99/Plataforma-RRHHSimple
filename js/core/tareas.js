/*
 * Tareas: datos, diálogo de crear/editar, avisos y exportación al calendario.
 * Modelo: { id, titulo, nota, prioridad: 'alta'|'media'|'baja', fecha: 'AAAA-MM-DD', repite: ''|'semana'|'mes'|'anio', hecha, hechaEl }
 * La lógica pura (repeticiones, agrupación, .ics) está en js/engines/tareas.js.
 */
const Tareas = (() => {
  const REPITE = { '': 'No se repite', semana: 'Cada semana', mes: 'Cada mes', anio: 'Cada año' };
  const PRIO = { alta: 'Alta', media: 'Media', baja: 'Baja' };
  const todas = () => Datos.get('tareas', []);
  const guardar = l => Datos.set('tareas', l);
  const nuevoId = () => Date.now() + Math.random();
  let alCambiar = () => {};

  function crear({ titulo, nota = '', prioridad = 'media', fecha, repite = '' }) {
    const l = todas(); l.push({ id: nuevoId(), titulo, nota, prioridad, fecha, repite, hecha: false }); guardar(l);
  }
  function editar(id, cambios) { const l = todas(), t = l.find(x => x.id === id); if (t) { Object.assign(t, cambios); guardar(l); } }
  function eliminar(id) { const l = todas(), i = l.findIndex(x => x.id === id); if (i < 0) return null; const [t] = l.splice(i, 1); guardar(l); return t; }
  function restaurar(t) { const l = todas(); l.push(t); guardar(l); }
  function alternar(id) {
    const l = todas(), t = l.find(x => x.id === id); if (!t) return null;
    t.hecha = !t.hecha; t.hechaEl = t.hecha ? Date.now() : null;
    let siguiente = null;
    if (t.hecha && t.repite && !t.siguienteCreada) {
      siguiente = MotorTareas.siguienteFecha(t.fecha, t.repite);
      l.push({ ...t, id: nuevoId(), fecha: siguiente, hecha: false, hechaEl: null, siguienteCreada: false });
      t.siguienteCreada = true;
    }
    guardar(l); return { ...t, siguiente };
  }
  function pendientes() {
    const g = MotorTareas.agrupar(todas(), Fecha.iso(Fecha.hoy()));
    return { vencidas: g.vencidas, hoy: g.hoy, proximas: [...g.manana, ...g.semana, ...g.despues] };
  }

  /* ---------- Diálogo crear / editar ---------- */
  const dlg = $('#taskDlg');
  let editando = null;
  function abrir({ tarea = null, fecha = null } = {}) {
    editando = tarea;
    $('#taskForm').reset();
    $('#tdT').textContent = tarea ? 'Editar tarea' : 'Nueva tarea';
    $('#tOk').textContent = tarea ? 'Guardar cambios' : 'Añadir tarea';
    $('#tDel').hidden = !tarea;
    $('#tTitle').value = tarea?.titulo || '';
    $('#tNota').value = tarea?.nota || '';
    $('#tDate').value = tarea?.fecha || fecha || Fecha.iso(Fecha.hoy());
    $('#tRep').value = tarea?.repite || '';
    $(`input[name=p][value=${tarea?.prioridad || 'media'}]`).checked = true;
    dlg.showModal(); $('#tTitle').focus();
  }
  dlg.addEventListener('close', () => {
    const v = dlg.returnValue;
    if (v === 'del' && editando) { borrarConDeshacer(editando.id); return; }
    if (v !== 'ok') return;
    const titulo = $('#tTitle').value.trim(); if (!titulo) return;
    const datos = { titulo, nota: $('#tNota').value.trim(), prioridad: $('input[name=p]:checked').value, fecha: $('#tDate').value || Fecha.iso(Fecha.hoy()), repite: $('#tRep').value };
    if (editando) { editar(editando.id, datos); toast('Tarea actualizada'); }
    else { crear(datos); toast('Tarea añadida'); Ficus.decir('Apuntado. Yo no tengo memoria, pero tú ya tienes la tarea.', 'yay'); }
    alCambiar();
  });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close('cancel'); });

  function borrarConDeshacer(id) {
    const t = eliminar(id); if (!t) return;
    alCambiar();
    toast('Tarea eliminada', { texto: 'Deshacer', fn: () => { restaurar(t); alCambiar(); } });
  }

  /* ---------- Exportar al calendario (.ics) ---------- */
  function descargarIcs(lista, nombre = 'tareas') {
    if (!lista.length) { toast('No hay tareas pendientes para exportar'); return; }
    const blob = new Blob([MotorTareas.ics(lista)], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${nombre}.ics`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Archivo de calendario descargado: ábrelo para añadirlo a Outlook o Google');
  }

  /* ---------- Avisos del sistema (solo con la plataforma abierta) ---------- */
  const avisosOn = () => Datos.get('avisosTareas', false) && 'Notification' in window && Notification.permission === 'granted';
  async function activarAvisos() {
    if (!('Notification' in window)) { toast('Este navegador no permite avisos'); return false; }
    const p = await Notification.requestPermission();
    Datos.set('avisosTareas', p === 'granted');
    toast(p === 'granted' ? 'Avisos activados' : 'El navegador no ha dado permiso para avisos');
    if (p === 'granted') comprobarAvisos(true);
    return p === 'granted';
  }
  function desactivarAvisos() { Datos.set('avisosTareas', false); toast('Avisos desactivados'); }
  function comprobarAvisos(forzar = false) {
    if (!avisosOn()) return;
    const hoy = Fecha.iso(Fecha.hoy());
    if (!forzar && Datos.get('_avisoDia') === hoy) return;
    const p = pendientes(), n = p.hoy.length + p.vencidas.length;
    if (!n) return;
    try {
      const notif = new Notification('Plataforma RRHH', { body: `${p.hoy.length} para hoy · ${p.vencidas.length} vencida${p.vencidas.length === 1 ? '' : 's'}`, tag: 'tareas-' + hoy });
      notif.onclick = () => { window.focus(); location.hash = '#tareas'; };
      Datos.set('_avisoDia', hoy);
    } catch (e) {}
  }
  setInterval(() => comprobarAvisos(), 30 * 60 * 1000);

  return {
    REPITE, PRIO, todas, crear, editar, eliminar, restaurar, alternar, pendientes, abrir, borrarConDeshacer,
    descargarIcs, activarAvisos, desactivarAvisos, comprobarAvisos,
    get avisosActivos() { return avisosOn(); },
    alCambiar(fn) { alCambiar = fn; }
  };
})();
