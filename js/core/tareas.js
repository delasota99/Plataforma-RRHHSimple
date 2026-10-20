/*
 * Tareas (base). La lista completa con filtros y calendario llega en la fase 2.
 * Modelo: { id, titulo, prioridad: 'alta'|'media'|'baja', fecha: 'AAAA-MM-DD', repite: ''|'semana'|'mes'|'anio', hecha, hechaEl }
 * Al completar una tarea que se repite, se crea automáticamente la siguiente.
 */
const Tareas = (() => {
  const REPITE = { '': 'No', semana: 'Cada semana', mes: 'Cada mes', anio: 'Cada año' };
  const todas = () => Datos.get('tareas', []);
  const guardar = l => Datos.set('tareas', l);
  function crear({ titulo, prioridad = 'media', fecha, repite = '' }) {
    const l = todas();
    l.push({ id: Date.now() + Math.random(), titulo, prioridad, fecha, repite, hecha: false });
    guardar(l);
  }
  function alternar(id) {
    const l = todas(), t = l.find(x => x.id === id); if (!t) return null;
    t.hecha = !t.hecha; t.hechaEl = t.hecha ? Date.now() : null;
    if (t.hecha && t.repite && !t.siguienteCreada) {
      l.push({ ...t, id: Date.now() + Math.random(), fecha: Fecha.iso(Fecha.sumar(Fecha.parse(t.fecha), t.repite)), hecha: false, hechaEl: null, siguienteCreada: false });
      t.siguienteCreada = true;
    }
    guardar(l); return t;
  }
  function pendientes() {
    const hoy = Fecha.hoy();
    const l = todas().filter(t => !t.hecha);
    return { vencidas: l.filter(t => Fecha.parse(t.fecha) < hoy), hoy: l.filter(t => Fecha.parse(t.fecha) === hoy), proximas: l.filter(t => Fecha.parse(t.fecha) > hoy) };
  }
  return { REPITE, todas, crear, alternar, pendientes };
})();
