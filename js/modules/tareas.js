/* Pantalla de Tareas: todas las tareas agrupadas por vencimiento, con filtros. */
const ModTareas = (() => {
  let vista = 'pendientes', prio = '', q = '';
  const GRUPOS = [['vencidas', 'Vencidas', 'late'], ['hoy', 'Hoy', ''], ['manana', 'Mañana', ''], ['semana', 'Próximos 7 días', ''], ['despues', 'Más adelante', '']];

  const ICO = {
    editar: '<svg class="i" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>',
    cal: '<svg class="i" viewBox="0 0 24 24"><path d="M3 5h18v16H3zM3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/></svg>',
    borrar: '<svg class="i" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    campana: '<svg class="i" viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/></svg>'
  };

  function fila(t) {
    const d = Fecha.parse(t.fecha), hoy = Fecha.hoy(), dif = Math.round((d - hoy) / DAY);
    const cuando = dif === 0 ? 'Hoy' : dif === 1 ? 'Mañana' : dif === -1 ? 'Ayer' : `${Fecha.diaSemana(d).slice(0, 3)} ${Fecha.corta(d)}`;
    return `<li class="task task-full${t.hecha ? ' done' : ''}" data-id="${t.id}">
      <button class="chk" aria-label="${t.hecha ? 'Marcar como pendiente' : 'Completar'}: ${esc(t.titulo)}" aria-pressed="${!!t.hecha}"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></button>
      <i class="prio ${t.prioridad}" title="Importancia ${t.prioridad}"></i>
      <button class="tt tt-btn" data-edit>${esc(t.titulo)}${t.nota ? `<span class="nota">${esc(t.nota)}</span>` : ''}
        <small>${cuando}${t.repite ? ' · ' + Tareas.REPITE[t.repite].toLowerCase() : ''}${t.hecha && t.hechaEl ? ' · hecha el ' + new Date(t.hechaEl).toLocaleDateString('es-ES') : ''}</small></button>
      <span class="row-acts">
        <button class="icon-act" data-edit aria-label="Editar ${esc(t.titulo)}" title="Editar">${ICO.editar}</button>
        ${t.hecha ? '' : `<button class="icon-act" data-ics aria-label="Añadir ${esc(t.titulo)} a mi calendario" title="Añadir a mi calendario (.ics)">${ICO.cal}</button>`}
        <button class="icon-act" data-del aria-label="Eliminar ${esc(t.titulo)}" title="Eliminar">${ICO.borrar}</button>
      </span></li>`;
  }

  function lista() {
    const todas = Tareas.todas();
    const filtrar = l => l.filter(t => (!prio || t.prioridad === prio) && (!q || norm(t.titulo + ' ' + (t.nota || '')).includes(norm(q))));
    const g = MotorTareas.agrupar(filtrar(todas), Fecha.iso(Fecha.hoy()));
    const hechas = filtrar(todas.filter(t => t.hecha)).sort((a, b) => (b.hechaEl || 0) - (a.hechaEl || 0));
    let cuerpo = '';
    if (vista !== 'hechas') cuerpo += GRUPOS.map(([k, n, c]) => g[k].length ? `<section class="tsec"><h2 class="tgroup ${c}">${n} <span>${g[k].length}</span></h2><ul class="tasks">${g[k].map(fila).join('')}</ul></section>` : '').join('');
    if (vista !== 'pendientes' && hechas.length) cuerpo += `<section class="tsec"><h2 class="tgroup">Completadas <span>${hechas.length}</span><button class="linkbtn" id="limpiar" style="margin-left:auto">Borrar completadas</button></h2><ul class="tasks">${hechas.slice(0, 60).map(fila).join('')}</ul></section>`;
    return cuerpo || `<div class="card empty-card"><p><b>${q || prio ? 'Ninguna tarea coincide con el filtro.' : vista === 'hechas' ? 'Aún no has completado ninguna tarea.' : 'No tienes tareas pendientes.'}</b></p><p class="muted">Usa el botón amarillo <b>+</b> o pulsa “Nueva tarea”.</p></div>`;
  }

  function render(main) {
    const todas = Tareas.todas();
    const nPend = todas.filter(t => !t.hecha).length, nHechas = todas.length - nPend;
    const resumen = MotorTareas.agrupar(todas, Fecha.iso(Fecha.hoy()));
    const avisos = Tareas.avisosActivos;

    main.innerHTML = `<div class="view">
      <div class="page-h page-h-row">
        <div><a class="crumb" href="#inicio">← Inicio</a><h1>Tareas</h1><p>Tu trabajo pendiente en un solo sitio. Las tareas que se repiten crean la siguiente al completarlas.</p></div>
        <div class="page-acts">
          <button class="btn ghost" id="avisosBtn" aria-pressed="${avisos}">${ICO.campana}${avisos ? 'Avisos activos' : 'Activar avisos'}</button>
          <button class="btn ghost" id="icsAll">${ICO.cal}Exportar al calendario</button>
          <button class="btn" data-new-task><svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Nueva tarea</button>
        </div>
      </div>
      <div class="kpis">
        <div class="kpi ${resumen.vencidas.length ? 'bad' : ''}"><b>${resumen.vencidas.length}</b><span>vencidas</span></div>
        <div class="kpi"><b>${resumen.hoy.length}</b><span>para hoy</span></div>
        <div class="kpi"><b>${resumen.manana.length + resumen.semana.length}</b><span>próximos 7 días</span></div>
        <div class="kpi"><b>${nHechas}</b><span>completadas</span></div>
      </div>
      <div class="toolbar">
        <div class="seg3" role="group" aria-label="Mostrar">${[['pendientes', `Pendientes (${nPend})`], ['hechas', 'Completadas'], ['todas', 'Todas']].map(([k, l]) => `<button data-vista="${k}" aria-pressed="${vista === k}">${l}</button>`).join('')}</div>
        <div class="seg3" role="group" aria-label="Importancia">${[['', 'Todas'], ['alta', 'Alta'], ['media', 'Media'], ['baja', 'Baja']].map(([k, l]) => `<button data-prio="${k}" aria-pressed="${prio === k}">${k ? `<i class="prio ${k}"></i>` : ''}${l}</button>`).join('')}</div>
        <label class="search-in"><svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span class="sr">Buscar en tareas</span><input id="tq" type="search" placeholder="Buscar en tareas…" value="${esc(q)}"></label>
      </div>
      <div class="tlist">${lista()}</div>
      ${avisos ? '' : '<p class="muted small" style="margin-top:18px">Los avisos de Windows solo aparecen con la plataforma abierta (puedes dejarla en una pestaña fijada). Para recibirlos aunque esté cerrada, exporta las tareas a tu calendario.</p>'}
    </div>`;
    enlazar(main);
  }

  function enlazar(main) {
    $$('[data-vista]', main).forEach(b => b.onclick = () => { vista = b.dataset.vista; render(main); });
    $$('[data-prio]', main).forEach(b => b.onclick = () => { prio = b.dataset.prio; render(main); });
    $('#tq').oninput = e => { q = e.target.value; $('.tlist', main).innerHTML = lista(); enlazarLimpiar(main); };
    $('#avisosBtn').onclick = async () => { if (Tareas.avisosActivos) Tareas.desactivarAvisos(); else await Tareas.activarAvisos(); render(main); };
    $('#icsAll').onclick = () => Tareas.descargarIcs(Tareas.todas().filter(t => !t.hecha), 'tareas-pendientes');
    enlazarLimpiar(main);
    $('.tlist', main).addEventListener('click', e => {
      const li = e.target.closest('.task'); if (!li) return;
      const id = Number(li.dataset.id), t = Tareas.todas().find(x => x.id === id); if (!t) return;
      if (e.target.closest('.chk')) {
        const r = Tareas.alternar(id); Shell.pintarNav();
        li.classList.toggle('done', r.hecha);
        if (r.hecha) {
          Ficus.decir(r.siguiente ? `¡Hecha! La próxima queda para el ${Fecha.corta(Fecha.parse(r.siguiente))}.` : '¡Hecha! Una menos.', 'yay');
          setTimeout(() => render(main), reduceMotion ? 0 : 450);
        } else render(main);
      }
      else if (e.target.closest('[data-del]')) Tareas.borrarConDeshacer(id);
      else if (e.target.closest('[data-ics]')) Tareas.descargarIcs([t], 'tarea-' + norm(t.titulo).replace(/[^a-z0-9]+/g, '-').slice(0, 40));
      else if (e.target.closest('[data-edit]')) Tareas.abrir({ tarea: t });
    });
  }
  function enlazarLimpiar(main) {
    const b = $('#limpiar', main); if (!b) return;
    b.onclick = () => {
      const quitadas = Tareas.todas().filter(t => t.hecha);
      Datos.set('tareas', Tareas.todas().filter(t => !t.hecha)); render(main); Shell.pintarNav();
      toast(`${quitadas.length} tareas completadas borradas`, { texto: 'Deshacer', fn: () => { Datos.set('tareas', [...Tareas.todas(), ...quitadas]); render(main); } });
    };
  }
  return { render };
})();
