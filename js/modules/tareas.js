/*
 * Pantalla de Tareas.
 * - Lista filtrada por estado (pendiente, en proceso, terminado, todas), agrupada por vencimiento.
 * - Tablero tipo Trello: columnas por estado, bloques con título e importancia; se arrastran entre columnas.
 */
const ModTareas = (() => {
  let vista = null, sub = '', q = '', recien = null;
  const VISTAS = [['todas', 'Todas'], ['estado', 'Estado'], ['importancia', 'Importancia'], ['tablero', 'Tablero']];
  const SUB = {
    estado: [['', 'Agrupadas'], ['pendiente', 'Pendiente'], ['proceso', 'En proceso'], ['terminado', 'Terminado']],
    importancia: [['', 'Agrupadas'], ['alta', 'Alta'], ['media', 'Media'], ['baja', 'Baja']]
  };
  const GRUPOS = [['vencidas', 'Vencidas', 'late'], ['hoy', 'Hoy', ''], ['manana', 'Mañana', ''], ['semana', 'Próximos 7 días', ''], ['despues', 'Más adelante', ''], ['sinFecha', 'Sin fecha · recordatorios', '']];
  const tactil = matchMedia('(pointer:coarse)').matches;
  const ICO = {
    editar: '<svg class="i" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>',
    cal: '<svg class="i" viewBox="0 0 24 24"><path d="M3 5h18v16H3zM3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/></svg>',
    borrar: '<svg class="i" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    campana: '<svg class="i" viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/></svg>',
    repite: '<svg class="i" viewBox="0 0 24 24"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/></svg>'
  };
  const filtrar = l => l.filter(t => !q || norm(t.titulo + ' ' + (t.nota || '')).includes(norm(q)));
  const porFecha = (a, b) => (a.fecha || '9999').localeCompare(b.fecha || '9999') || ({ alta: 0, media: 1, baja: 2 }[a.prioridad] - { alta: 0, media: 1, baja: 2 }[b.prioridad]);
  const cuando = f => {
    if (!f) return 'Sin fecha';
    const d = Fecha.parse(f), dif = Math.round((d - Fecha.hoy()) / DAY);
    return dif === 0 ? 'Hoy' : dif === 1 ? 'Mañana' : dif === -1 ? 'Ayer' : `${Fecha.diaSemana(d).slice(0, 3)} ${Fecha.corta(d)}`;
  };
  const vencida = t => t.fecha && !t.hecha && Fecha.parse(t.fecha) < Fecha.hoy();
  const botonEstado = t => `<button class="st st-${t.estado}" data-st aria-label="Estado: ${Tareas.ESTADO[t.estado]}. Pulsa para cambiarlo" title="Pulsa para pasar a ${Tareas.ESTADO[MotorTareas.siguienteEstado(t.estado)].toLowerCase()}"><i></i><span>${Tareas.ESTADO[t.estado]}</span></button>`;

  /* ---------- Lista ---------- */
  function fila(t) {
    return `<li class="task task-full p-${t.prioridad} est-${t.estado}${t.hecha ? ' done' : ''}${recien === t.id ? ' just' : ''}" data-id="${t.id}">
      ${botonEstado(t)}
      <i class="prio ${t.prioridad}" title="Importancia ${t.prioridad}"></i>
      <button class="tt tt-btn" data-edit>${esc(t.titulo)}${t.nota ? `<span class="nota">${esc(t.nota)}</span>` : ''}
        <small class="${vencida(t) ? 'late-txt' : ''}">${t.altaId ? '<span class="tag">alta</span> ' : ''}${cuando(t.fecha)}${t.repite ? ' · ' + Tareas.REPITE[t.repite].toLowerCase() : ''}${t.hecha && t.hechaEl ? ' · terminada el ' + new Date(t.hechaEl).toLocaleDateString('es-ES') : ''}</small></button>
      <span class="row-acts">
        ${t.altaId ? `<button class="icon-act" data-alta="${t.altaId}" aria-label="Ver el alta" title="Ver el alta">${icon('altas')}</button>` : ''}
        <button class="icon-act" data-edit aria-label="Editar ${esc(t.titulo)}" title="Editar">${ICO.editar}</button>
        ${t.hecha || !t.fecha ? '' : `<button class="icon-act" data-ics aria-label="Añadir ${esc(t.titulo)} a mi calendario" title="Añadir a mi calendario (.ics)">${ICO.cal}</button>`}
        <button class="icon-act" data-del aria-label="Eliminar ${esc(t.titulo)}" title="Eliminar">${ICO.borrar}</button>
      </span></li>`;
  }
  const seccion = (titulo, l, cls = '', extra = '') => l.length ? `<section class="tsec"><h2 class="tgroup ${cls}">${titulo} <span>${l.length}</span>${extra}</h2><ul class="tasks">${l.map(fila).join('')}</ul></section>` : '';
  function lista() {
    const todas = filtrar(Tareas.todas()), hoy = Fecha.iso(Fecha.hoy());
    const terminadas = todas.filter(t => t.estado === 'terminado').sort((a, b) => (b.hechaEl || 0) - (a.hechaEl || 0));
    const limpiar = '<button class="linkbtn" id="limpiar" style="margin-left:auto">Borrar terminadas</button>';
    const activas = todas.filter(t => t.estado !== 'terminado');
    const porVencimiento = l => { const g = MotorTareas.agrupar(l, hoy); return GRUPOS.map(([k, n, c]) => seccion(n, g[k], c)).join(''); };
    let html = '';
    if (vista === 'todas') html = porVencimiento(activas) + seccion('Terminadas', terminadas.slice(0, 40), '', limpiar);
    else if (vista === 'estado') {
      if (!sub) html = MotorTareas.ESTADOS.map(e => seccion(`<i class="est ${e}"></i>${Tareas.ESTADO[e]}`, e === 'terminado' ? terminadas.slice(0, 40) : todas.filter(t => t.estado === e).sort(porFecha), '', e === 'terminado' ? limpiar : '')).join('');
      else if (sub === 'terminado') html = seccion('Terminadas', terminadas.slice(0, 80), '', limpiar);
      else html = porVencimiento(todas.filter(t => t.estado === sub));
    } else if (vista === 'importancia') {
      if (!sub) html = ['alta', 'media', 'baja'].map(k => seccion(`<i class="prio ${k}"></i>Importancia ${k}`, activas.filter(t => t.prioridad === k).sort(porFecha))).join('');
      else html = porVencimiento(activas.filter(t => t.prioridad === sub));
    }
    const vacio = q ? 'Ninguna tarea coincide con la búsqueda.' : vista === 'estado' && sub === 'terminado' ? 'Aún no has terminado ninguna tarea.' : 'No hay tareas aquí.';
    return html || `<div class="card empty-card"><p><b>${vacio}</b></p><p class="muted">Usa el botón amarillo <b>+</b> o pulsa “Nueva tarea”.</p></div>`;
  }

  /* ---------- Tablero ---------- */
  function tarjeta(t) {
    return `<div class="kcard p-${t.prioridad}${recien === t.id ? ' just' : ''}" draggable="true" tabindex="0" data-id="${t.id}" aria-label="${esc(t.titulo)}. Importancia ${t.prioridad}. ${tactil ? 'Pulsa para cambiar de estado.' : 'Arrastra para cambiar de estado, doble clic para editar.'}">
      <span class="kt">${esc(t.titulo)}</span>
      <span class="kf"><i class="prio ${t.prioridad}" title="Importancia ${t.prioridad}"></i>${vencida(t) ? `<span class="late-txt">${Fecha.corta(Fecha.parse(t.fecha))}</span>` : ''}${t.repite ? `<span class="krep" title="${Tareas.REPITE[t.repite]}">${ICO.repite}</span>` : ''}</span>
    </div>`;
  }
  function tablero() {
    const todas = filtrar(Tareas.todas()), ord = { alta: 0, media: 1, baja: 2 };
    const orden = (a, b) => (a.fecha || '9999').localeCompare(b.fecha || '9999') || ord[a.prioridad] - ord[b.prioridad];
    return `<div class="board">${MotorTareas.ESTADOS.map(e => {
      let l = todas.filter(t => t.estado === e);
      l = e === 'terminado' ? l.sort((a, b) => (b.hechaEl || 0) - (a.hechaEl || 0)).slice(0, 30) : l.sort(orden);
      return `<section class="kcol st-${e}" data-col="${e}" aria-label="${Tareas.ESTADO[e]}">
        <h2 class="kcol-h"><i></i>${Tareas.ESTADO[e]}<span>${todas.filter(t => t.estado === e).length}</span>${e === 'pendiente' ? '<button class="kadd" data-new-task aria-label="Nueva tarea" title="Nueva tarea"><svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>' : ''}</h2>
        <div class="kcards">${l.map(tarjeta).join('') || `<p class="kempty">${tactil ? 'Sin tareas' : 'Arrastra aquí'}</p>`}</div>
      </section>`;
    }).join('')}</div>
    <p class="muted small" style="margin-top:12px">${tactil ? 'Pulsa un bloque para pasarlo a la siguiente columna; mantenlo pulsado para editarlo.' : 'Arrastra los bloques entre columnas. Doble clic para editar. Con el teclado: flechas ← → para moverlo e Intro para editarlo.'}</p>`;
  }

  /* ---------- Página ---------- */
  function render(main) {
    vista = vista || Datos.get('_vistaTareas', 'todas'); if (!VISTAS.some(v => v[0] === vista)) vista = 'todas';
    if (sub && !(SUB[vista] || []).some(x => x[0] === sub)) sub = '';
    const todas = Tareas.todas(), n = e => todas.filter(t => t.estado === e).length;
    const venc = todas.filter(vencida).length, avisos = Tareas.avisosActivos;
    main.innerHTML = `<div class="view">
      <div class="page-h page-h-row">
        <div><a class="crumb" href="#inicio">← Inicio</a><h1>Tareas</h1><p>Tu trabajo en un solo sitio. Pulsa el estado de una tarea para avanzarla; las que se repiten crean la siguiente al terminarlas.</p></div>
        <div class="page-acts">
          <button class="btn ghost" id="avisosBtn" aria-pressed="${avisos}">${ICO.campana}${avisos ? 'Avisos activos' : 'Activar avisos'}</button>
          <button class="btn ghost" id="icsAll">${ICO.cal}Exportar al calendario</button>
          <button class="btn" data-new-task><svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Nueva tarea</button>
        </div>
      </div>
      <div class="kpis">
        <div class="kpi st-pendiente"><b>${n('pendiente')}</b><span><i class="est pendiente"></i>pendientes</span></div>
        <div class="kpi st-proceso"><b>${n('proceso')}</b><span><i class="est proceso"></i>en proceso</span></div>
        <div class="kpi st-terminado"><b>${n('terminado')}</b><span><i class="est terminado"></i>terminadas</span></div>
        <div class="kpi ${venc ? 'bad' : ''}"><b>${venc}</b><span>vencidas</span></div>
      </div>
      <div class="toolbar">
        <div class="seg3 vistas" role="group" aria-label="Ver">${VISTAS.map(([k, l]) => `<button data-vista="${k}" aria-pressed="${vista === k}">${k === 'tablero' ? '<svg class="i" viewBox="0 0 24 24"><path d="M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z"/></svg>' : ''}${l}</button>`).join('')}</div>
        ${SUB[vista] ? `<div class="subfiltro" role="group" aria-label="Filtrar por ${vista}">${SUB[vista].map(([k, l]) => `<button data-sub="${k}" aria-pressed="${sub === k}">${k ? (vista === 'estado' ? `<i class="est ${k}"></i>` : `<i class="prio ${k}"></i>`) : ''}${l}</button>`).join('')}</div>` : ''}
        <label class="search-in"><svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span class="sr">Buscar en tareas</span><input id="tq" type="search" placeholder="Buscar en tareas…" value="${esc(q)}"></label>
      </div>
      <div class="tlist">${vista === 'tablero' ? tablero() : lista()}</div>
      ${avisos ? '' : '<p class="muted small" style="margin-top:18px">Los avisos de Windows solo aparecen con la plataforma abierta. Para recibirlos aunque esté cerrada, exporta las tareas a tu calendario.</p>'}
    </div>`;
    recien = null;
    enlazar(main);
  }

  function cambiar(main, id, estado) {
    const r = estado ? Tareas.setEstado(id, estado) : Tareas.avanzar(id);
    if (!r) return;
    recien = id; Shell.pintarNav(); Tareas.celebrar(r);
    if (r.siguiente) toast(`Siguiente repetición creada: ${Fecha.corta(Fecha.parse(r.siguiente))}`);
    pintarLista(main);
  }
  function pintarLista(main) { $('.tlist', main).innerHTML = vista === 'tablero' ? tablero() : lista(); recien = null; enlazarLista(main); }

  function enlazar(main) {
    $$('[data-vista]', main).forEach(b => b.onclick = () => { vista = b.dataset.vista; sub = ''; Datos.set('_vistaTareas', vista); render(main); });
    $$('[data-sub]', main).forEach(b => b.onclick = () => { sub = b.dataset.sub; render(main); });
    $('#tq').oninput = e => { q = e.target.value; pintarLista(main); };
    $('#avisosBtn').onclick = async () => { if (Tareas.avisosActivos) Tareas.desactivarAvisos(); else await Tareas.activarAvisos(); render(main); };
    $('#icsAll').onclick = () => Tareas.descargarIcs(Tareas.todas().filter(t => !t.hecha && t.fecha), 'tareas-pendientes');
    enlazarLista(main);
  }

  function enlazarLista(main) {
    const cont = $('.tlist', main);
    const limpiar = $('#limpiar', main);
    if (limpiar) limpiar.onclick = () => {
      const quitadas = Tareas.todas().filter(t => t.hecha);
      Datos.set('tareas', Tareas.todas().filter(t => !t.hecha)); render(main); Shell.pintarNav();
      toast(`${quitadas.length} tareas terminadas borradas`, { texto: 'Deshacer', fn: () => { Datos.set('tareas', [...Tareas.todas(), ...quitadas]); render(main); } });
    };
    const buscar = id => Tareas.todas().find(x => x.id === id);

    if (vista !== 'tablero') {
      cont.onclick = e => {
        const li = e.target.closest('.task'); if (!li) return;
        const id = Number(li.dataset.id), t = buscar(id); if (!t) return;
        if (e.target.closest('[data-st]')) cambiar(main, id);
        else if (e.target.closest('[data-alta]')) { ModAltas.abrir(t.altaId); location.hash = '#altas'; }
        else if (e.target.closest('[data-del]')) { li.classList.add('saliendo'); setTimeout(() => Tareas.borrarConDeshacer(id), reduceMotion ? 0 : 200); }
        else if (e.target.closest('[data-ics]')) Tareas.descargarIcs([t], 'tarea-' + norm(t.titulo).replace(/[^a-z0-9]+/g, '-').slice(0, 40));
        else if (e.target.closest('[data-edit]')) Tareas.abrir({ tarea: t });
      };
      return;
    }

    /* Tablero: arrastrar, tocar, doble clic y teclado. */
    cont.onclick = e => { const c = e.target.closest('.kcard'); if (c && tactil) cambiar(main, Number(c.dataset.id)); };
    cont.ondblclick = e => { const c = e.target.closest('.kcard'); if (c && !tactil) { const t = buscar(Number(c.dataset.id)); if (t) Tareas.abrir({ tarea: t }); } };
    let pulsacion = null;
    cont.onpointerdown = e => { const c = e.target.closest('.kcard'); if (!c || !tactil) return; pulsacion = setTimeout(() => { pulsacion = 'hecho'; const t = buscar(Number(c.dataset.id)); if (t) Tareas.abrir({ tarea: t }); }, 550); };
    cont.onpointerup = cont.onpointercancel = e => { if (pulsacion === 'hecho') { e.preventDefault(); cont.addEventListener('click', ev => ev.stopPropagation(), { capture: true, once: true }); } else clearTimeout(pulsacion); pulsacion = null; };
    cont.onkeydown = e => {
      const c = e.target.closest('.kcard'); if (!c) return;
      const id = Number(c.dataset.id), t = buscar(id); if (!t) return;
      const i = MotorTareas.ESTADOS.indexOf(t.estado);
      if (e.key === 'Enter') { e.preventDefault(); Tareas.abrir({ tarea: t }); }
      else if ((e.key === 'ArrowRight' && i < 2) || (e.key === 'ArrowLeft' && i > 0)) {
        e.preventDefault(); cambiar(main, id, MotorTareas.ESTADOS[i + (e.key === 'ArrowRight' ? 1 : -1)]);
        $(`.kcard[data-id="${id}"]`, main)?.focus();
      }
    };
    let arrastrado = null;
    $$('.kcard', cont).forEach(c => {
      c.addEventListener('dragstart', e => { arrastrado = Number(c.dataset.id); c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', c.dataset.id); });
      c.addEventListener('dragend', () => { c.classList.remove('dragging'); $$('.kcol.over', cont).forEach(x => x.classList.remove('over')); });
    });
    $$('.kcol', cont).forEach(col => {
      col.addEventListener('dragover', e => { if (arrastrado === null) return; e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
      col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('over'); if (arrastrado !== null) cambiar(main, arrastrado, col.dataset.col); arrastrado = null; });
    });
  }
  return { render };
})();
