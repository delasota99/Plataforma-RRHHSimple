/* Panel de inicio con bloques personalizables. */
const ModInicio = (() => {
  const P = window.RRHH_PARAMS;
  const BLOQUES = {
    saludo:   { nombre: 'Saludo', span: 12 },
    tareas:   { nombre: 'Tareas', span: 7 },
    festivos: { nombre: 'Próximos festivos', span: 5 },
    anio:     { nombre: 'El año en vacaciones', span: 4 },
    copia:    { nombre: 'Copia de seguridad', span: 4 },
    accesos:  { nombre: 'Herramientas', span: 12 }
    // 'altas' se añade en la fase 3
  };
  const POR_DEFECTO = ['saludo', 'tareas', 'festivos', 'accesos'];
  let editando = false;
  const layout = () => Datos.get('panel', POR_DEFECTO).filter(k => k in BLOQUES);
  const setLayout = l => Datos.set('panel', l);

  function proxFestivos() {
    const hoy = Fecha.hoy();
    return Object.values(P.festivos).flatMap(a => a.nacionales).map(([f, n]) => ({ t: Fecha.parse(f), n })).filter(x => x.t >= hoy).sort((a, b) => a.t - b.t);
  }

  function bSaludo() {
    const now = new Date(), h = now.getHours(), p = Tareas.pendientes(), f = proxFestivos()[0];
    return `<div class="hello">
      <div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div>
      <div style="position:relative">
        <div class="kicker">${now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h1>${h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches'}, <span>Fer</span></h1>
      </div>
      <div class="sum">
        <a class="pillstat" href="#tareas"><b>${p.hoy.length}</b><span>tareas<br>para hoy</span></a>
        <a class="pillstat" href="#tareas"><b>${p.vencidas.length}</b><span>tareas<br>vencidas</span></a>
        <a class="pillstat" href="#calendario"><b>${f ? Fecha.corta(f.t) : '—'}</b><span>próximo<br>festivo</span></a>
      </div></div>`;
  }
  function filaTarea(t) {
    const d = Fecha.parse(t.fecha), hoy = Fecha.hoy();
    return `<li class="task${t.hecha ? ' done' : ''}" data-id="${t.id}">
      <button class="chk" aria-label="Completar: ${esc(t.titulo)}" aria-pressed="${!!t.hecha}"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></button>
      <i class="prio ${t.prioridad}" title="Importancia ${t.prioridad}"></i>
      <span class="tt">${esc(t.titulo)}<small>${d === hoy ? 'Hoy' : Fecha.corta(d)}${t.repite ? ' · ' + Tareas.REPITE[t.repite].toLowerCase() : ''}</small></span></li>`;
  }
  function bTareas() {
    const p = Tareas.pendientes();
    const g = [['Vencidas', p.vencidas, 'late'], ['Hoy', p.hoy, ''], ['Próximas', p.proximas.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 4), '']]
      .filter(x => x[1].length).map(([n, l, c]) => `<div class="tgroup ${c}">${n}</div><ul class="tasks">${l.map(filaTarea).join('')}</ul>`).join('');
    return `<div class="card"><div class="card-h"><h3>Tareas</h3><button class="linkbtn" data-new-task>+ Nueva</button></div>
      ${g || '<p class="muted" style="margin:0">Todo al día. Apunta tareas con el botón amarillo <b>+</b>.</p>'}</div>`;
  }
  function bFestivos() {
    const l = proxFestivos().slice(0, 4);
    return `<div class="card"><div class="card-h"><h3>Próximos festivos</h3><span class="ex">nacionales</span></div><ul class="fest">` +
      l.map(x => `<li><div class="cal"><small>${Fecha.mesCorto(x.t)}</small><b>${new Date(x.t).getUTCDate()}</b></div><div class="t">${esc(x.n)}<span>${Fecha.diaSemana(x.t)}</span></div></li>`).join('') +
      `</ul>${l.length ? '' : '<p class="muted">Sin datos. Añade el calendario del año en parámetros.</p>'}</div>`;
  }
  function bAnio() {
    const y = new Date().getFullYear(), hoy = Fecha.hoy(), pct = (hoy - Date.UTC(y, 0, 1) + DAY) / (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1));
    const gen = MotorVacaciones.calcular({ inicio: `${y}-01-01`, anio: y, hoy: Fecha.iso(hoy) }).genHoy;
    return `<div class="card"><div class="card-h"><h3>El año en vacaciones</h3></div><div class="yr">
      <div class="ring"><svg viewBox="0 0 120 120"><circle class="track" cx="60" cy="60" r="52" fill="none" stroke-width="11"/><circle class="bar" data-pct="${pct}" cx="60" cy="60" r="52" fill="none" stroke-width="11" stroke-dasharray="326.7" stroke-dashoffset="326.7"/></svg><div class="center"><div><b>${Math.round(pct * 100)}%</b><small>de ${y}</small></div></div></div>
      <p>Con contrato todo el año, hoy se llevan <b class="strong">${gen} de ${P.vacaciones.diasLaborables}</b> días generados.</p></div></div>`;
  }
  function bCopia() {
    const e = Datos.estado, d = e.ultimaCopia ? Math.floor((Date.now() - e.ultimaCopia) / DAY) : null;
    return `<div class="card"><div class="card-h"><h3>Copia de seguridad</h3></div>
      <p class="muted" style="margin:0;font-size:14px">${d === null ? 'Aún no hay ninguna copia guardada.' : d === 0 ? 'Copia al día.' : `Última copia hace <b class="strong">${d} día${d > 1 ? 's' : ''}</b>. Se recomienda una por semana.`}
      ${e.archivo ? `<br>Guardado automático en <b class="strong">${esc(e.archivo)}</b>.` : ''}</p>
      <div class="meter"><i style="transform:scaleX(${d === null ? 1 : Math.min(1, d / 14)})"></i></div><button class="btn sm" data-save>Guardar copia ahora</button></div>`;
  }
  function bAccesos() {
    const l = ['empleados', 'altas', 'tareas', 'documentos', 'calendario', 'salarios', 'vacaciones', 'permisos', 'nacimiento', 'indemnizacion', 'finiquito'];
    return `<div class="card"><div class="card-h"><h3>Herramientas</h3></div><div class="tools">` +
      l.map((r, i) => `<a class="tool" href="#${r}" style="--i:${i}"><span class="ico">${icon(r, '')}</span><b>${Shell.etiqueta(r)}</b></a>`).join('') + '</div></div>';
  }
  const PINTAR = { saludo: bSaludo, tareas: bTareas, festivos: bFestivos, anio: bAnio, copia: bCopia, accesos: bAccesos };

  function render(main) {
    const L = layout(), ocultos = Object.keys(BLOQUES).filter(k => !L.includes(k));
    main.innerHTML = `<div class="view ${editando ? 'editing' : ''}" id="home">
      <div class="ph"><h2 class="sr">Panel de inicio</h2><span></span><div class="actions"><button class="btn ${editando ? '' : 'ghost'} sm" id="editBtn" aria-pressed="${editando}"><svg class="i" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M4 6h10M4 12h16M4 18h7M18 4v4M15 6h6"/></svg>${editando ? 'Listo' : 'Personalizar'}</button></div></div>
      <div class="edit-bar"><p>Arrastra los bloques para ordenarlos o quítalos con ×.</p>${ocultos.length ? ocultos.map(k => `<button class="add-w" data-add="${k}">+ ${BLOQUES[k].nombre}</button>`).join('') : '<span class="ex">Todos los bloques están en el panel</span>'}</div>
      <div class="widgets">${L.map((k, i) => `<section class="w" data-w="${k}" style="--span:${BLOQUES[k].span}" ${editando ? 'draggable="true"' : ''} aria-label="${BLOQUES[k].nombre}">
        <div class="w-tools"><button data-move="-1" aria-label="Subir ${BLOQUES[k].nombre}" ${i === 0 ? 'disabled' : ''}><svg class="i" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button><button data-move="1" aria-label="Bajar ${BLOQUES[k].nombre}" ${i === L.length - 1 ? 'disabled' : ''}><svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></button><button data-remove aria-label="Quitar ${BLOQUES[k].nombre}"><svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
        ${PINTAR[k]()}</section>`).join('')}</div></div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => $$('.ring .bar', main).forEach(b => b.style.strokeDashoffset = 326.7 * (1 - Number(b.dataset.pct)))));
    enlazar(main);
  }

  function enlazar(main) {
    const home = $('#home', main), L = layout();
    $('#editBtn').onclick = () => { editando = !editando; render(main); if (!editando) Ficus.decir('Panel guardado a tu gusto. Como yo con mi maceta.', 'yay'); };
    home.addEventListener('click', e => {
      const add = e.target.closest('[data-add]'); if (add) { setLayout([...L, add.dataset.add]); render(main); return; }
      const chk = e.target.closest('.chk'); if (chk) { completar(Number(chk.closest('.task').dataset.id), chk.closest('.task')); return; }
      const w = e.target.closest('.w'); if (!w) return;
      if (e.target.closest('[data-remove]')) { setLayout(L.filter(k => k !== w.dataset.w)); render(main); return; }
      const mv = e.target.closest('[data-move]');
      if (mv) { const l = [...L], i = l.indexOf(w.dataset.w), j = i + Number(mv.dataset.move); [l[i], l[j]] = [l[j], l[i]]; setLayout(l); render(main); $(`.w[data-w="${w.dataset.w}"] [data-move="${mv.dataset.move}"]`)?.focus(); }
    });
    let arr = null;
    $$('.w', home).forEach(w => {
      w.addEventListener('dragstart', e => { arr = w.dataset.w; w.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
      w.addEventListener('dragend', () => { w.classList.remove('dragging'); $$('.w.over').forEach(x => x.classList.remove('over')); });
      w.addEventListener('dragover', e => { if (!editando || !arr) return; e.preventDefault(); w.classList.add('over'); });
      w.addEventListener('dragleave', () => w.classList.remove('over'));
      w.addEventListener('drop', e => {
        e.preventDefault(); const dest = w.dataset.w;
        if (arr && dest !== arr) { const l = L.filter(k => k !== arr); l.splice(l.indexOf(dest) + (L.indexOf(arr) < L.indexOf(dest) ? 1 : 0), 0, arr); setLayout(l); render(main); }
        arr = null;
      });
    });
  }

  function completar(id, li) {
    const t = Tareas.alternar(id); if (!t) return;
    li.classList.toggle('done', t.hecha); li.querySelector('.chk').setAttribute('aria-pressed', t.hecha);
    Shell.pintarNav();
    if (t.hecha) {
      const p = Tareas.pendientes(), quedan = p.hoy.length + p.vencidas.length;
      Ficus.decir(quedan ? `¡Hecha! Te quedan ${quedan} para hoy.` : '¡Todo lo de hoy, listo! Me voy a hacer la fotosíntesis tranquilo.', 'yay');
      if (t.repite) toast(`Siguiente repetición creada: ${Fecha.corta(Fecha.sumar(Fecha.parse(t.fecha), t.repite))}`);
    }
  }

  return { render, reset: () => setLayout(POR_DEFECTO) };
})();
