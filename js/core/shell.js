/*
 * Estructura común: navegación, rutas, tema, buscador (Ctrl + K), nueva tarea,
 * botón de copia y menú móvil. Arranca la plataforma.
 */
const Shell = (() => {
  const VERSION = '0.8.0 · procesos';
  const NAV = [
    ['', [['inicio', 'Inicio']]],
    ['Personas', [['empleados', 'Empleados'], ['ausencias', 'Ausencias'], ['informes', 'Informes']]],
    ['Procesos', [['reclutamiento', 'Reclutamiento'], ['altas', 'Altas'], ['pruebas', 'Periodos de prueba'], ['promociones', 'Promociones'], ['salidas', 'Bajas y salidas']]],
    ['Trabajo diario', [['tareas', 'Tareas'], ['documentos', 'Documentos'], ['calendario', 'Calendario']]],
    ['Calculadoras', [['salarios', 'Salarios'], ['vacaciones', 'Vacaciones'], ['permisos', 'Permisos'], ['nacimiento', 'Nacimiento'], ['indemnizacion', 'Indemnización'], ['finiquito', 'Finiquito']]],
    ['', [['ajustes', 'Ajustes']]]
  ];
  const ETIQ = Object.fromEntries(NAV.flatMap(g => g[1]));
  const MODULOS = { inicio: ModInicio, empleados: ModEmpleados, altas: ModAltas, ausencias: ModAusencias, informes: ModInformes, reclutamiento: ModReclutamiento, pruebas: ModPruebas, promociones: ModPromociones, salidas: ModSalidas, tareas: ModTareas, calendario: ModCalendario, vacaciones: ModVacaciones, documentos: ModDocumentos, salarios: ModSalarios, permisos: ModPermisos, nacimiento: ModNacimiento, indemnizacion: ModIndemnizacion, finiquito: ModFiniquito, ajustes: ModAjustes };
  const FASE = {};
  const main = $('#main');
  const ruta = () => { const r = location.hash.slice(1); return r in ETIQ ? r : 'inicio'; };

  /* ---------- Navegación ---------- */
  function pintarNav() {
    const venc = Tareas.pendientes().vencidas.length, bloq = Altas.enCurso().filter(a => MotorAltas.estado(a) === 'bloqueada').length;
    const hoyN = Fecha.iso(Fecha.hoy()), sinConf = Ausencias.todas().filter(a => MotorAusencias.estado(a, hoyN) === 'sin-confirmar').length;
    const pruebaSR = Procesos.Pruebas.todas().filter(p => MotorProcesos.estadoPrueba(p, hoyN) === 'sin-resolver').length, salAtr = Procesos.Salidas.todas().filter(x => MotorProcesos.estadoSalida(RRHH_PARAMS.procesos.salida, x, hoyN) === 'atrasada').length;
    $('#nav').innerHTML = '<div class="nav-pill" id="pill" aria-hidden="true"></div>' + NAV.map(([g, items]) =>
      (g ? `<div class="nav-group">${g}</div>` : '') + items.map(([r, l]) =>
        `<a href="#${r}" data-r="${r}">${icon(r)}${l}${r === 'tareas' && venc ? `<span class="badge" aria-label="${venc} vencidas">${venc}</span>` : r === 'altas' && bloq ? `<span class="badge" aria-label="${bloq} bloqueadas">${bloq}</span>` : r === 'ausencias' && sinConf ? `<span class="badge" aria-label="${sinConf} sin confirmar">${sinConf}</span>` : r === 'pruebas' && pruebaSR ? `<span class="badge" aria-label="${pruebaSR} sin resolver">${pruebaSR}</span>` : r === 'salidas' && salAtr ? `<span class="badge" aria-label="${salAtr} atrasadas">${salAtr}</span>` : r === 'empleados' && Empleados.configurado() ? (Empleados.desbloqueado ? '' : '<span class="soon lock" title="Bloqueada"><svg class="i" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>') : (!MODULOS[r] ? '<span class="soon" title="Llega en una próxima fase">·</span>' : '')}</a>`).join('')).join('');
    marcar();
  }
  function marcar() {
    const r = ruta();
    $$('#nav a').forEach(a => a.dataset.r === r ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    const a = $('#nav a[aria-current=page]'), pill = $('#pill'); if (!pill) return;
    if (!a) { pill.style.opacity = 0; return; }
    pill.style.opacity = 1; pill.style.height = a.offsetHeight + 'px'; pill.style.transform = `translateY(${a.offsetTop}px)`;
  }
  /* La animación de entrada solo se ve al cambiar de pantalla, nunca al repintar la misma (sin "reinicio"). */
  let animT;
  function animarEntrada() { main.setAttribute('data-anim', ''); clearTimeout(animT); animT = setTimeout(() => main.removeAttribute('data-anim'), 700); }
  function render() {
    const r = ruta(); marcar(); animarEntrada();
    if (MODULOS[r]) MODULOS[r].render(main);
    else main.innerHTML = `<div class="view empty"><div><div class="ico">${icon(r)}</div><h1 style="font-size:30px;font-weight:600">${esc(ETIQ[r])}</h1>
      <p>Ya está definida y llega en la <b>fase ${FASE[r]}</b>.</p>
      <a class="btn" href="#inicio">Volver al inicio</a></div></div>`;
    document.title = `${ETIQ[r]} · RRHH Simple`;
    window.scrollTo({ top: 0 }); cerrarMenu(); Ficus.ruta(r);
  }
  const ir = () => (document.startViewTransition && !reduceMotion) ? document.startViewTransition(render) : render();

  /* ---------- Tema ---------- */
  const tema = () => document.documentElement.dataset.theme || 'auto';
  function setTema(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('rrhh.theme', t); } catch (e) {}
    const i = ['light', 'dark', 'auto'].indexOf(t);
    $$('.theme button').forEach((b, j) => b.setAttribute('aria-pressed', j === i));
    $('#themeThumb').style.transform = `translateX(${i * 100}%)`;
  }

  /* ---------- Copia ---------- */
  function pintarCopia() {
    const e = Datos.estado, u = e.ultimaCopia, d = u ? Math.floor((Date.now() - u) / DAY) : null;
    $('#saveTxt').textContent = e.estadoArchivo === 'sin-permiso' ? 'Pulsa para reactivar el guardado' : d === null ? 'Aún no hay copias' : d === 0 ? (e.estadoArchivo === 'activo' ? 'Guardado automático activo' : 'Guardada hoy') : `Última hace ${d} día${d > 1 ? 's' : ''}`;
    $('#saveDot').classList.toggle('fresh', d !== null && d < 7 && e.estadoArchivo !== 'sin-permiso');
  }
  async function guardarCopia() {
    try {
      const r = await Datos.guardarCopia();
      toast(r.modo === 'archivo' ? `Copia guardada en ${r.nombre}` : 'Copia descargada');
      Ficus.decir('Copia guardada. Ahora sí puedes derramar el café tranquilo.', 'yay');
      if (ruta() === 'inicio' || ruta() === 'ajustes') render();
    } catch (e) { toast('No se pudo guardar la copia'); }
  }

  /* ---------- Tareas: al crear, editar o borrar se refresca la vista ---------- */
  function abrirTarea() { cerrarMenu(); Tareas.abrir(); }
  Tareas.alCambiar(() => { pintarNav(); if (['inicio', 'tareas', 'calendario'].includes(ruta())) { const y = scrollY; MODULOS[ruta()].render(main); scrollTo(0, y); } });

  /* ---------- Buscador Ctrl + K (sin animación: se abre con teclado) ---------- */
  const cmdk = $('#cmdk'), cIn = $('#cmdIn'), cList = $('#cmdList');
  let items = [], sel = 0;
  const ACCIONES = [
    { l: 'Nueva tarea', h: 'Acción', run: abrirTarea },
    { l: 'Nueva alta', h: 'Acción', run: () => ModAltas.nueva(null) },
    { l: 'Nuevo empleado', h: 'Acción', run: () => { location.hash = '#empleados'; setTimeout(() => $('#nuevo')?.click(), 80); } },
    { l: 'Bloquear empleados', h: 'Acción', run: () => { Empleados.bloquear(); toast('Empleados bloqueados'); } },
    { l: 'Guardar copia de seguridad', h: 'Acción', run: guardarCopia },
    { l: 'Exportar tareas al calendario (.ics)', h: 'Acción', run: () => Tareas.descargarIcs(Tareas.todas().filter(t => !t.hecha), 'tareas-pendientes') },
    { l: 'Añadir festivo de empresa', h: 'Acción', run: () => { location.hash = '#calendario'; setTimeout(() => $('#empF')?.focus(), 80); } },
    { l: 'Modo oscuro', h: 'Acción', run: () => setTema('dark') },
    { l: 'Modo claro', h: 'Acción', run: () => setTema('light') },
    { l: 'Personalizar el panel', h: 'Acción', run: () => { location.hash = '#inicio'; setTimeout(() => $('#editBtn')?.click(), 50); } }
  ];
  function llenar() {
    const q = norm(cIn.value.trim());
    const herramientas = Object.entries(ETIQ).map(([r, l]) => ({ l, h: MODULOS[r] ? 'Herramienta' : `Fase ${FASE[r]}`, r, run: () => location.hash = '#' + r }));
    const f = l => q ? l.filter(x => norm(x.l + ' ' + x.h).includes(q)) : l;
    const emps = Empleados.desbloqueado ? Empleados.todos().map(e => ({ l: e.nombreCompleto, h: `${e.codigo} · ${e.departamento || e.centro || ''}`, r: 'empleados', run: () => { ModEmpleados.abrir(e.id); if (location.hash === '#empleados') render(); else location.hash = '#empleados'; } })) : [];
    const altas = Altas.enCurso().map(a => ({ l: `Alta de ${a.nombre}`, h: `${Math.round(MotorAltas.progreso(a).pct * 100)} % · ${a.centro}`, r: 'altas', run: () => { ModAltas.abrir(a.id); if (location.hash === '#altas') render(); else location.hash = '#altas'; } }));
    const secs = [['Herramientas', f(herramientas).slice(0, q ? 8 : 6)], ['Empleados', q ? f(emps).slice(0, 6) : []], ['Altas en curso', f(altas).slice(0, q ? 6 : 3)], ['Acciones', f(ACCIONES)]];
    items = secs.flatMap(s => s[1]); sel = Math.min(sel, Math.max(0, items.length - 1));
    let i = 0;
    cList.innerHTML = items.length ? secs.filter(s => s[1].length).map(([n, l]) => `<li class="cmd-sec" role="presentation">${n}</li>` + l.map(x => { const k = i++;
      return `<li class="cmd-item" role="option" id="ci${k}" data-k="${k}" aria-selected="${k === sel}">${icon(x.r || 'accion')}${esc(x.l)}<small>${esc(x.h)}</small></li>`; }).join('')).join('')
      : '<li class="cmd-empty">Sin resultados. Prueba con “vac” o “copia”.</li>';
    cIn.setAttribute('aria-activedescendant', items.length ? 'ci' + sel : '');
    cIn.placeholder = Empleados.desbloqueado ? 'Busca una herramienta, un empleado, un alta o una acción…' : 'Busca una herramienta, un alta o una acción…';
  }
  function abrirBuscador() { cerrarMenu(); cIn.value = ''; sel = 0; llenar(); cmdk.showModal(); cIn.focus(); }
  function ejecutar(k) { const it = items[k]; cmdk.close(); it?.run(); }
  cIn.addEventListener('input', () => { sel = 0; llenar(); });
  cIn.addEventListener('keydown', e => {
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length) { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; llenar(); $('#ci' + sel)?.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter') { e.preventDefault(); ejecutar(sel); }
  });
  cList.addEventListener('click', e => { const it = e.target.closest('.cmd-item'); if (it) ejecutar(Number(it.dataset.k)); });
  cmdk.addEventListener('click', e => { if (e.target === cmdk) cmdk.close(); });
  addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); cmdk.open ? cmdk.close() : abrirBuscador(); } });

  /* ---------- Menú móvil ---------- */
  const side = $('#side'), scrim = $('#scrim'), mb = $('#menuBtn');
  function cerrarMenu() { side.classList.remove('open'); scrim.classList.remove('on'); mb.setAttribute('aria-expanded', 'false'); }
  mb.onclick = () => { const o = !side.classList.contains('open'); side.classList.toggle('open', o); scrim.classList.toggle('on', o); mb.setAttribute('aria-expanded', String(o)); if (o) requestAnimationFrame(marcar); };
  scrim.onclick = cerrarMenu;

  /* ---------- Delegación global ---------- */
  document.addEventListener('click', e => {
    if (e.target.closest('[data-new-task]')) abrirTarea();
    else if (e.target.closest('[data-open-search]')) abrirBuscador();
    else if (e.target.closest('[data-save]')) guardarCopia();
  });
  $('#saveBtn').onclick = guardarCopia;
  $$('.theme button').forEach(b => b.onclick = () => setTema(b.dataset.t));
  addEventListener('hashchange', ir);
  addEventListener('resize', marcar);

  async function arrancar() {
    await Datos.init();
    Datos.on(k => { if (k === '_ultimaCopia' || k === '_estado') pintarCopia(); });
    setTema(tema()); Ficus.init(); pintarCopia(); pintarNav(); render(); Ficus.saludar(); Tareas.comprobarAvisos();
    if (Datos.estado.fallo) toast('Este navegador no permite guardar datos: los cambios se perderán al cerrar.');
  }
  Empleados.on(() => { pintarNav(); if (['empleados', 'vacaciones', 'ausencias', 'calendario', 'informes', 'pruebas', 'promociones', 'salidas'].includes(ruta()) && !document.querySelector('dialog[open]')) { const y = scrollY; render(); scrollTo(0, y); } });
  return { VERSION, etiqueta: r => ETIQ[r] || r, pintarNav, tema, setTema, arrancar, refrescar: () => render() };
})();

Shell.arrancar();
