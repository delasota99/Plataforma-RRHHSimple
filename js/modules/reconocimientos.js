/*
 * PRL → Reconocimientos médicos: campaña anual para el personal de oficina (quien teletrabaja figura en Oficina).
 * La comunicación es masiva: una fecha por campaña (Datos 'rmCampanas'), que vale para todo el personal.
 * Flujo por persona: Por comunicar → Sin respuesta → Acepta / Rechaza → Citado (fecha, hora, lugar) → Realizado.
 * Centros incluidos: por defecto los que contienen «Oficina»; se pueden elegir en la página (Datos 'rmCentros').
 * Datos: dentro de la ficha cifrada (empleado.reconocimientos[año]); solo estado y fechas, nunca datos de salud.
 * Lugares y textos de los correos: editables en la página (Datos 'rmLugares' y 'rmTextos').
 * Motor: js/engines/reconocimientos.js
 */
const ModReconocimientos = (() => {
  const P = window.RRHH_PARAMS, M = () => MotorReconocimientos;
  let anio = new Date().getFullYear(), filtro = '', q = '';
  const hoyISO = () => Fecha.iso(Fecha.hoy());
  const f = s => s ? Fecha.larga(Fecha.parse(s)) : '';
  const abierta = () => Empleados.configurado() && Empleados.desbloqueado;
  const COLOR = { pendiente: 'var(--muted)', comunicado: 'var(--st-espera)', acepta: 'var(--st-proceso)', citado: 'var(--c-cv, #2f6a86)', realizado: 'var(--ok)', rechaza: 'var(--danger)' };
  const nombreDe = e => e.nombre || e.nombreCompleto.split(' ')[0];

  /* ---------- Configuración: lugares y textos ---------- */
  const lugares = () => Datos.get('rmLugares', P.reconocimientos.lugares || []);
  const lugar = id => lugares().find(l => l.id === id) || null;
  const cfg = () => ({ ...P.reconocimientos, ...Datos.get('rmTextos', {}) });

  /* ---------- Datos de la campaña ---------- */
  const campana = (a = anio) => Datos.get('rmCampanas', {})[a] || {};
  const setCampana = (cambios, a = anio) => { const c = Datos.get('rmCampanas', {}); c[a] = { ...(c[a] || {}), ...cambios }; Datos.set('rmCampanas', c); };
  const centrosElegidos = () => Datos.get('rmCentros', null);
  const incluye = e => { const s = centrosElegidos(); return s ? s.includes(e.centro) : (M().esOficina(e.centro) || P.reconocimientos.centros.includes(e.centro)); };
  const participantesDe = a => M().participantes(Empleados.todos(), a, incluye, hoyISO());
  const lista = () => abierta() ? participantesDe(anio).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es')) : [];
  /* Registro de la persona con la fecha de comunicación de la campaña si no tiene una propia. */
  const reg = e => { const r = (e.reconocimientos || {})[anio] || {}; return { ...r, comunicado: r.comunicado || campana().comunicado || '' }; };
  async function guardar(id, cambios, a = anio) {
    const e = Empleados.buscar(id); if (!e) return;
    const todos = { ...(e.reconocimientos || {}) }; todos[a] = { ...(todos[a] || {}), ...cambios };
    await Empleados.editarEmpleado(id, { reconocimientos: todos });
    sincronizar();
  }

  /* ---------- Ticket automático (uno por campaña, categoría PRL) ---------- */
  function sincronizar() {
    if (!abierta() || typeof Tareas === 'undefined') return;
    const y = new Date().getFullYear();
    [y - 1, y, y + 1].forEach(a => {
      const l = participantesDe(a), s = M().seguimiento(l, a, hoyISO(), P.reconocimientos.respuestaDias, campana(a).comunicado || '');
      const t = Tareas.todas().find(x => x.auto === 'rm' && x.rmAnio === a);
      const partes = [s.sinResp.length && `${s.sinResp.length} sin responder`, s.porCitar.length && `${s.porCitar.length} por citar`, s.porConfirmar.length && `${s.porConfirmar.length} por confirmar si ha ido`].filter(Boolean);
      if (partes.length) {
        const titulo = `Reconocimientos médicos ${a}: ${partes.join(' · ')}`;
        if (!t) { const ts = Tareas.todas(); ts.push({ id: Date.now() + Math.random(), titulo, nota: 'Ticket automático de la campaña de reconocimientos médicos (PRL → Reconocimientos médicos). Sin datos de salud.', prioridad: 'media', categoria: 'prl', fecha: hoyISO(), repite: '', estado: 'pendiente', hecha: false, auto: 'rm', rmAnio: a }); Datos.set('tareas', ts); }
        else if (t.titulo !== titulo || t.estado === 'terminado') Tareas.editar(t.id, { titulo, ...(t.estado === 'terminado' ? { estado: 'pendiente', hecha: false, hechaEl: null, fecha: hoyISO() } : {}) });
      } else if (t && t.estado !== 'terminado') Tareas.setEstado(t.id, 'terminado');
    });
  }
  /* Avisos para la barra lateral (campaña del año en curso). */
  function avisos() {
    if (!abierta()) return 0;
    const y = new Date().getFullYear(), s = M().seguimiento(participantesDe(y), y, hoyISO(), P.reconocimientos.respuestaDias, campana(y).comunicado || '');
    return s.sinResp.length + s.porCitar.length + s.porConfirmar.length;
  }
  Empleados.on(() => { if (abierta()) sincronizar(); });

  /* ---------- Correo ---------- */
  const abrirCorreo = c => { const a = document.createElement('a'); a.href = M().mailto(c); a.click(); };
  async function copiar(t, msg) { try { await navigator.clipboard.writeText(t); } catch (e) { const x = document.createElement('textarea'); x.value = t; document.body.append(x); x.select(); document.execCommand('copy'); x.remove(); } toast(msg); }

  /* ---------- Página ---------- */
  function render(main) {
    if (!abierta()) return pantallaBloqueo(main, 'Reconocimientos médicos', 'Campaña anual de reconocimientos del personal de oficina: comunicación, respuesta, cita y seguimiento.', () => render(main));
    sincronizar();
    const com = campana().comunicado || '', l = lista(), r = M().resumen(l, anio, com), s = M().seguimiento(l, anio, hoyISO(), P.reconocimientos.respuestaDias, com), sol = M().solapes(l, anio);
    const todosCentros = MotorEmpleados.valores(Empleados.todos().filter(e => !e.fechaBaja || e.fechaBaja >= hoyISO()), 'centro');
    const nCentro = c => Empleados.todos().filter(e => e.centro === c && (!e.fechaBaja || e.fechaBaja >= hoyISO())).length;
    const F = [['', 'Todos', r.total], ...M().ESTADOS.map(k => [k, M().NOMBRE[k], r[k]])];
    const vis = l.filter(e => (!filtro || M().estado(reg(e)) === filtro) && (!q || norm(`${e.codigo} ${e.nombreCompleto} ${e.departamento || ''} ${e.puesto || ''}`).includes(norm(q))));
    main.innerHTML = `<div class="view">
      <div class="page-h page-h-row"><div><a class="crumb" href="#prl">← PRL</a><h1>Reconocimientos médicos</h1><p>Campaña anual del personal de oficina (también quien teletrabaja): comunicar, recoger la respuesta, citar y confirmar que se ha hecho.</p></div>
        <div class="page-acts"><button class="btn ${com ? 'ghost' : ''}" id="rmCom" ${l.length ? '' : 'disabled'}><svg class="i" viewBox="0 0 24 24"><path d="M3 5h18v14H3zM4 6l8 6 8-6"/></svg>${com ? `Comunicada el ${Fecha.corta(Fecha.parse(com))}` : 'Comunicar la campaña'}</button></div></div>
      <div class="nom-bar"><div class="nom-mes"><button class="icon-btn" data-y="-1" aria-label="Año anterior"><svg class="i" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button><h2>Campaña ${anio}</h2><button class="icon-btn" data-y="1" aria-label="Año siguiente"><svg class="i" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></div>
        <div class="rm-centros" role="group" aria-label="Centros incluidos"><span class="muted small">Personal de:</span>${todosCentros.map(c => `<button class="chip-f" data-centro="${esc(c)}" aria-pressed="${incluye({ centro: c })}">${esc(c)} <b>${nCentro(c)}</b></button>`).join('') || '<span class="muted small">No hay centros en la base de empleados</span>'}</div></div>
      ${l.length ? `<div class="card rm-res">
        <div class="rm-bar" role="img" aria-label="${r.cerrados} de ${r.total} cerrados">${M().ESTADOS.filter(k => r[k]).map(k => `<i style="flex:${r[k]};--rc:${COLOR[k]}" title="${M().NOMBRE[k]}: ${r[k]}"></i>`).join('')}</div>
        <div class="rm-ley">${M().ESTADOS.map(k => `<span style="--rc:${COLOR[k]}"><i></i>${M().NOMBRE[k]} <b>${r[k]}</b></span>`).join('')}<span class="rm-tot"><b>${r.cerrados}</b> de ${r.total} cerrados</span></div>
        ${s.sinResp.length || s.porCitar.length || s.porConfirmar.length ? `<div class="rm-avisos">${s.sinResp.length ? `<button class="at-chip" data-f="comunicado">${s.sinResp.length} sin responder hace más de ${P.reconocimientos.respuestaDias} días</button>` : ''}${s.porCitar.length ? `<button class="at-chip" data-f="acepta">${s.porCitar.length} por citar</button>` : ''}${s.porConfirmar.length ? `<button class="at-chip" data-f="citado">${s.porConfirmar.length} con la cita pasada: ¿ha ido?</button>` : ''}</div>` : ''}
      </div>` : ''}
      ${s.proximas.length ? `<div class="card rm-agenda"><div class="card-h"><h3>Próximas citas</h3><span class="ex">${s.proximas.length}</span></div><ul>${s.proximas.slice(0, 6).map(e => { const c = reg(e).cita; return `<li><span class="rc-d"><b>${Number(c.fecha.slice(8))}</b><small>${Fecha.mesCorto(Fecha.parse(c.fecha))}</small></span><span><b>${esc(e.nombreCompleto)}</b><small>${c.hora ? c.hora + ' h · ' : ''}${esc(lugar(c.lugarId)?.nombre || 'Lugar sin indicar')}${sol.has(e.id) ? ' · <em class="late-txt">misma hora que otra cita</em>' : ''}</small></span></li>`; }).join('')}</ul></div>` : ''}
      <div class="toolbar"><div class="subfiltro rm-filtros" role="group" aria-label="Filtrar por estado">${F.map(([k, n, c]) => `<button data-fil="${k}" aria-pressed="${filtro === k}">${k ? `<i class="rm-dot" style="--rc:${COLOR[k]}"></i>` : ''}${n}<b>${c}</b></button>`).join('')}</div>
        <label class="search-in"><svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span class="sr">Buscar</span><input id="rmQ" type="search" placeholder="Código, nombre, departamento…" value="${esc(q)}"></label></div>
      <div id="rmLista">${!l.length ? `<div class="card empty-card"><p><b>No hay personas en la campaña ${anio}.</b></p><p class="muted">Entran solas las personas de alta en los centros marcados arriba («Personal de»). Marca el centro de oficina tal como figura en tu base de empleados.</p></div>`
        : vis.length ? `<ul class="rm-list">${vis.map(fila).join('')}</ul>` : '<p class="muted">Nadie en este estado.</p>'}</div>
      <details class="card rm-cfg"><summary><b>Lugares y textos de los correos</b><span class="muted small">${lugares().length ? `${lugares().length} lugar${lugares().length === 1 ? '' : 'es'}` : 'Aún no hay lugares'}</span></summary><div id="rmCfg"></div></details>
      ${Calc.legal('Base legal y privacidad', `<p><b>Art. 22 de la Ley 31/1995 de PRL:</b> la vigilancia de la salud es voluntaria (salvo los supuestos del art. 22.1, que conviene revisar con el servicio de prevención), confidencial y la empresa solo conoce la conclusión de aptitud. Si alguien la rechaza, es recomendable que lo deje por escrito: la plataforma genera el escrito de renuncia.</p>
        <p style="margin:0">Aquí solo se guarda el estado y las fechas de cada persona, cifrados con la base de empleados. Nunca resultados, diagnósticos ni motivos.</p>`)}
    </div>`;
    enlazar(main); pintarCfg(main);
  }

  function fila(e) {
    const r = reg(e), st = M().estado(r), c = r.cita || {}, lg = lugar(c.lugarId);
    const info = st === 'pendiente' ? 'Campaña sin comunicar' : st === 'comunicado' ? `Comunicado el ${Fecha.corta(Fecha.parse(r.comunicado))} · esperando respuesta` : st === 'acepta' ? `Acepta${r.respuestaEl ? ' el ' + Fecha.corta(Fecha.parse(r.respuestaEl)) : ''} · falta la cita`
      : st === 'citado' ? `${Fecha.diaSemana(Fecha.parse(c.fecha)).slice(0, 3)} ${Fecha.corta(Fecha.parse(c.fecha))}${c.hora ? ' · ' + c.hora + ' h' : ''}${lg ? ' · ' + esc(lg.nombre) : ''}${r.citaEnviada ? ' · cita enviada' : ' · <em class="late-txt">cita sin enviar</em>'}`
      : st === 'realizado' ? `Realizado el ${Fecha.corta(Fecha.parse(r.realizado))}` : `Rechaza${r.renunciaFirmada ? ' · renuncia firmada' : ' · <em class="late-txt">falta la renuncia firmada</em>'}`;
    const A = { pendiente: [['acepta', 'Acepta'], ['rechaza', 'Rechaza']], comunicado: [['acepta', 'Acepta'], ['rechaza', 'Rechaza']], acepta: [['citar', 'Citar']],
      citado: [['enviar', r.citaEnviada ? 'Reenviar cita' : 'Enviar cita'], ['realizado', 'Realizado']], rechaza: [['renuncia', 'Renuncia']], realizado: [] }[st];
    return `<li class="rm-row" data-e="${e.id}" style="--rc:${COLOR[st]}">
      <button class="rm-main" data-det><span class="avatar">${esc(((e.nombre || '?')[0] + (e.apellido1 || '')[0]).toUpperCase())}</span>
        <span class="rm-t"><b><em>${esc(e.codigo || '')}</em>${esc(e.nombreCompleto)}</b><small>${esc([e.puesto, e.departamento].filter(Boolean).join(' · ') || 'Sin puesto')}${e.email ? '' : ' · <em class="late-txt">sin correo</em>'}</small></span></button>
      <span class="rm-st"><span class="rm-chip">${M().NOMBRE[st]}</span><small>${info}</small></span>
      <span class="rm-acts">${A.map(([k, n], i) => `<button class="btn sm ${i === 0 && k !== 'rechaza' ? '' : 'ghost'}" data-a="${k}">${n}</button>`).join('')}</span></li>`;
  }

  function enlazar(main) {
    $$('[data-y]', main).forEach(b => b.onclick = () => { anio += Number(b.dataset.y); filtro = ''; render(main); });
    $$('[data-fil]', main).forEach(b => b.onclick = () => { filtro = b.dataset.fil; render(main); });
    $$('.rm-avisos [data-f]', main).forEach(b => b.onclick = () => { filtro = b.dataset.f; render(main); });
    $('#rmQ', main).oninput = ev => { q = ev.target.value; const l = lista(), vis = l.filter(e => (!filtro || M().estado(reg(e)) === filtro) && (!q || norm(`${e.codigo} ${e.nombreCompleto} ${e.departamento || ''} ${e.puesto || ''}`).includes(norm(q)))); $('#rmLista', main).innerHTML = vis.length ? `<ul class="rm-list">${vis.map(fila).join('')}</ul>` : '<p class="muted">Nadie coincide.</p>'; };
    $('#rmCom', main).onclick = () => comunicar(main);
    $$('[data-centro]', main).forEach(b => b.onclick = () => {
      const todos = MotorEmpleados.valores(Empleados.todos(), 'centro'), sel = new Set(todos.filter(c => incluye({ centro: c })));
      sel.has(b.dataset.centro) ? sel.delete(b.dataset.centro) : sel.add(b.dataset.centro);
      Datos.set('rmCentros', [...sel]); sincronizar(); render(main);
    });
    $('#rmLista', main).onclick = async ev => {
      const li = ev.target.closest('[data-e]'); if (!li) return;
      const e = Empleados.buscar(Number(li.dataset.e)); if (!e) return;
      if (ev.target.closest('[data-det]')) { detalle(main, e); return; }
      const a = ev.target.closest('[data-a]')?.dataset.a; if (!a) return;
      if (a === 'acepta' || a === 'rechaza') { await guardar(e.id, { respuesta: a, respuestaEl: hoyISO() }); toast(a === 'acepta' ? 'Acepta: ahora, cítale' : 'Rechaza: genera el escrito de renuncia para que lo firme'); render(main); }
      else if (a === 'citar') citar(main, e);
      else if (a === 'enviar') enviarCita(main, e);
      else if (a === 'realizado') { await guardar(e.id, { realizado: reg(e).cita?.fecha && reg(e).cita.fecha <= hoyISO() ? reg(e).cita.fecha : hoyISO() }); Ficus.decir('Uno más con su reconocimiento hecho.', 'yay'); render(main); }
      else if (a === 'renuncia') renunciaDlg(main, e);
    };
  }

  /* Comunicación masiva de la campaña: un correo con todo el personal en copia oculta y una única fecha para todos. */
  function comunicar(main) {
    const l = lista(), con = l.filter(e => e.email), sin = l.filter(e => !e.email), com = campana().comunicado || '';
    const c = M().correoComunicacion({ anio, cfg: cfg(), empresa: P.empresa, nombre: nombreDe });
    const d = abrirModal(`<div class="dlg-b"><h2 style="font-size:20px;font-weight:600;margin:0">Comunicar la campaña ${anio}</h2>
      <p class="muted" style="margin:0">Un solo correo a las ${l.length} personas de la campaña, en copia oculta.${sin.length ? ` <b class="late-txt">${sin.length} sin correo</b> (${sin.map(e => esc(e.nombreCompleto)).join(', ')}): añádelo en su ficha o reenvíaselo a mano.` : ''}</p>
      <div class="mail-body" style="max-height:34vh">${esc(c.texto)}</div>
      <div class="doc-acts"><button class="btn" id="rcTodos" ${con.length ? '' : 'disabled'}>${icon('documentos')}Abrir el correo con ${con.length} en copia oculta</button><button class="btn ghost" id="rcDir" ${con.length ? '' : 'disabled'}>Copiar direcciones</button><button class="btn ghost" id="rcTxt">Copiar texto</button></div>
      <div class="field" style="margin:0"><label for="rcF">Fecha de comunicación (para todas las personas)</label><input type="date" id="rcF" value="${com || hoyISO()}"></div>
    </div><div class="dlg-f">${com ? '<button class="btn ghost danger" id="rcQ" style="margin-right:auto">Quitar la fecha</button>' : ''}<button class="btn ghost" id="rcX">Cerrar</button><button class="btn" id="rcOk">Guardar la fecha</button></div>`, { ancho: 640 });
    $('#rcTodos', d).onclick = () => abrirCorreo({ cco: con.map(e => e.email), asunto: c.asunto, texto: c.texto });
    $('#rcDir', d).onclick = () => copiar(con.map(e => e.email).join('; '), 'Direcciones copiadas: pégalas en «CCO» de Outlook');
    $('#rcTxt', d).onclick = () => copiar(c.texto, 'Texto copiado');
    $('#rcX', d).onclick = () => d.close('cancel');
    $('#rcQ', d) && ($('#rcQ', d).onclick = () => { setCampana({ comunicado: '' }); sincronizar(); d.close('ok'); render(main); toast('Fecha de comunicación quitada'); });
    $('#rcOk', d).onclick = () => {
      const fch = $('#rcF', d).value; if (!fch) { toast('Indica la fecha'); return; }
      setCampana({ comunicado: fch }); sincronizar(); d.close('ok'); toast(`Campaña ${anio} comunicada el ${Fecha.corta(Fecha.parse(fch))}`); render(main);
    };
  }

  /* Cita: fecha, hora y lugar; guardar y, si se quiere, abrir el correo. */
  function citar(main, e) {
    const r = reg(e), c = r.cita || {}, L = lugares();
    const d = abrirModal(`<form id="ciF" novalidate><div class="dlg-b"><h2 style="font-size:20px;font-weight:600;margin:0">Cita de ${esc(e.nombreCompleto)}</h2>
      <div class="row2"><div class="field"><label for="ciD">Fecha</label><input type="date" id="ciD" value="${c.fecha || ''}" required></div><div class="field"><label for="ciH">Hora</label><input type="time" id="ciH" value="${c.hora || ''}" step="300"></div></div>
      <div class="field"><label for="ciL">Lugar</label><select id="ciL"><option value="">${L.length ? '— Elige —' : 'Aún no hay lugares: añádelos abajo, en «Lugares y textos»'}</option>${L.map(x => `<option value="${x.id}" ${x.id === c.lugarId ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select></div>
      <span class="flabel">Correo que recibirá ${e.email ? `<span class="muted" style="font-weight:400">· ${esc(e.email)}</span>` : '<span class="late-txt" style="font-weight:400">· no tiene correo en su ficha</span>'}</span>
      <div class="mail-body" id="ciM" style="max-height:30vh"></div>
      <p class="form-err" id="ciE" role="alert"></p>
    </div><div class="dlg-f"><button type="button" class="btn ghost" id="ciX">Cancelar</button><button type="submit" class="btn ghost" data-solo="1">Guardar</button><button class="btn" ${e.email ? '' : 'disabled title="Sin correo en su ficha"'}>Guardar y enviar</button></div></form>`, { ancho: 620 });
    const leer = () => ({ fecha: $('#ciD', d).value, hora: $('#ciH', d).value, lugarId: $('#ciL', d).value });
    const pintar = () => { const x = leer(); $('#ciM', d).textContent = x.fecha ? M().correoCita({ e, anio, r: { cita: x }, lugar: lugar(x.lugarId), cfg: cfg(), empresa: P.empresa, nombre: nombreDe }).texto : 'Elige la fecha para ver el correo.'; };
    pintar(); ['#ciD', '#ciH', '#ciL'].forEach(s => $(s, d).addEventListener('input', pintar));
    $('#ciX', d).onclick = () => d.close('cancel'); $('#ciD', d).focus();
    $('#ciF', d).onsubmit = async ev => {
      ev.preventDefault(); const x = leer();
      if (!x.fecha) { $('#ciE', d).textContent = 'Indica la fecha.'; return; }
      const enviar = !ev.submitter?.dataset.solo;
      if (enviar && !x.lugarId) { $('#ciE', d).textContent = 'Elige el lugar antes de enviar (o pulsa solo «Guardar»).'; return; }
      await guardar(e.id, { cita: x, respuesta: 'acepta', ...(r.respuestaEl ? {} : { respuestaEl: hoyISO() }), ...(enviar ? { citaEnviada: hoyISO() } : { citaEnviada: '' }) });
      if (enviar) abrirCorreo(M().correoCita({ e, anio, r: { cita: x }, lugar: lugar(x.lugarId), cfg: cfg(), empresa: P.empresa, nombre: nombreDe }));
      d.close('ok'); toast(enviar ? 'Cita guardada: revisa el correo en Outlook y pulsa Enviar' : 'Cita guardada'); render(main);
    };
  }
  async function enviarCita(main, e) {
    const r = reg(e); if (!e.email) { toast(`${e.nombreCompleto} no tiene correo: añádelo en su ficha`); return; }
    if (!r.cita?.lugarId) { toast('Falta el lugar de la cita'); citar(main, e); return; }
    abrirCorreo(M().correoCita({ e, anio, r, lugar: lugar(r.cita.lugarId), cfg: cfg(), empresa: P.empresa, nombre: nombreDe }));
    await guardar(e.id, { citaEnviada: hoyISO() }); toast('Correo de la cita abierto en Outlook'); render(main);
  }

  /* Escrito de renuncia para firmar (imprimir o copiar). */
  function renunciaDlg(main, e) {
    const t = M().renuncia({ e, anio, cfg: cfg(), empresa: P.empresa, hoy: hoyISO() }), r = reg(e);
    const d = abrirModal(`<div class="dlg-b"><h2 style="font-size:20px;font-weight:600;margin:0">Renuncia de ${esc(e.nombreCompleto)}</h2>
      <div class="mail-body rm-doc">${esc(t)}</div>
      <label class="check"><input type="checkbox" id="reF" ${r.renunciaFirmada ? 'checked' : ''}> Firmada y archivada</label></div>
      <div class="dlg-f"><button class="btn ghost" id="reC">Copiar texto</button><button class="btn ghost" id="reP">${icon('documentos')}Imprimir</button><button class="btn" id="reOk">Hecho</button></div>`, { ancho: 640 });
    $('#reC', d).onclick = () => copiar(t, 'Texto copiado');
    $('#reP', d).onclick = () => { const w = window.open('', '_blank'); if (!w) { toast('El navegador ha bloqueado la ventana de impresión'); return; } w.document.write(`<!doctype html><meta charset="utf-8"><title>Renuncia ${anio}</title><style>body{font:15px/1.6 system-ui,sans-serif;max-width:640px;margin:48px auto;white-space:pre-wrap}</style>${esc(t)}`); w.document.close(); w.focus(); w.print(); };
    $('#reOk', d).onclick = async () => { const on = $('#reF', d).checked; if (on !== !!r.renunciaFirmada) await guardar(e.id, { renunciaFirmada: on ? hoyISO() : '' }); d.close('ok'); render(main); };
  }

  /* Detalle: todas las fechas editables (para corregir). */
  function detalle(main, e) {
    const r = reg(e), c = r.cita || {}, L = lugares();
    const d = abrirModal(`<form id="rdF" novalidate><div class="dlg-b"><h2 style="font-size:20px;font-weight:600;margin:0">${esc(e.nombreCompleto)} · ${anio}</h2>
      <p class="muted" style="margin:0">${esc([e.codigo, e.puesto, e.centro].filter(Boolean).join(' · '))} · ${e.email ? esc(e.email) : '<span class="late-txt">sin correo en su ficha</span>'}</p>
      <div class="row2"><div class="field"><label for="rdC">Comunicado aparte <span class="muted" style="font-weight:400">(si no, la fecha de la campaña)</span></label><input type="date" id="rdC" value="${(e.reconocimientos || {})[anio]?.comunicado || ''}" placeholder="${esc(campana().comunicado || '')}"></div>
        <div class="field"><label for="rdR">Respuesta</label><select id="rdR"><option value="">Sin respuesta</option><option value="acepta" ${r.respuesta === 'acepta' ? 'selected' : ''}>Acepta</option><option value="rechaza" ${r.respuesta === 'rechaza' ? 'selected' : ''}>Rechaza</option></select></div></div>
      <div class="row2"><div class="field"><label for="rdD">Cita: fecha</label><input type="date" id="rdD" value="${c.fecha || ''}"></div><div class="field"><label for="rdH">Hora</label><input type="time" id="rdH" value="${c.hora || ''}"></div></div>
      <div class="row2"><div class="field"><label for="rdL">Lugar</label><select id="rdL"><option value="">—</option>${L.map(x => `<option value="${x.id}" ${x.id === c.lugarId ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select></div>
        <div class="field"><label for="rdE">Realizado el</label><input type="date" id="rdE" value="${r.realizado || ''}"></div></div>
      <p class="muted small" style="margin:0">No anotes aquí resultados ni motivos de salud: solo fechas y estado.</p>
    </div><div class="dlg-f"><button type="button" class="btn ghost danger" id="rdB" style="margin-right:auto">Empezar de cero este año</button><button type="button" class="btn ghost" id="rdX">Cancelar</button><button class="btn">Guardar</button></div></form>`, { ancho: 600 });
    $('#rdX', d).onclick = () => d.close('cancel');
    $('#rdB', d).onclick = async ev => { const b = ev.currentTarget; if (!b.dataset.ok) { b.dataset.ok = 1; b.textContent = 'Pulsa otra vez para borrar su registro de ' + anio; return; } const x = Empleados.buscar(e.id), todos = { ...(x.reconocimientos || {}) }; delete todos[anio]; await Empleados.editarEmpleado(e.id, { reconocimientos: todos }); sincronizar(); d.close('ok'); render(main); };
    $('#rdF', d).onsubmit = async ev => {
      ev.preventDefault();
      const resp = $('#rdR', d).value, fecha = $('#rdD', d).value;
      await guardar(e.id, { comunicado: $('#rdC', d).value, respuesta: resp, respuestaEl: resp ? (r.respuestaEl || hoyISO()) : '', cita: fecha ? { fecha, hora: $('#rdH', d).value, lugarId: $('#rdL', d).value } : {}, realizado: $('#rdE', d).value });
      d.close('ok'); toast('Guardado'); render(main);
    };
  }

  /* Lugares y textos de los correos. */
  function pintarCfg(main) {
    const box = $('#rmCfg', main), L = lugares(), T = cfg();
    box.innerHTML = `<div class="rm-cfg-in">
      <span class="flabel">Lugares del reconocimiento</span>
      <ul class="rm-lug">${L.map((x, i) => `<li data-i="${i}"><input data-k="nombre" value="${esc(x.nombre)}" aria-label="Nombre del lugar" placeholder="Nombre"><input data-k="direccion" value="${esc(x.direccion || '')}" aria-label="Dirección" placeholder="Dirección"><input data-k="indicaciones" value="${esc(x.indicaciones || '')}" aria-label="Indicaciones" placeholder="Indicaciones (p. ej. acudir en ayunas)"><button class="icon-act" data-quitar="${i}" aria-label="Quitar ${esc(x.nombre)}" title="Quitar"><svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></li>`).join('') || '<li class="muted small">Aún no hay lugares.</li>'}</ul>
      <button class="btn ghost sm" id="rmAddL">+ Añadir lugar</button>
      <span class="flabel" style="margin-top:16px">Textos de los correos <span class="muted" style="font-weight:400">· claves: {nombre} {anio} {fecha} {hora} {lugar} {direccion} {indicaciones} {firma}</span></span>
      ${[['correoComunicacion', 'Comunicación de la campaña'], ['correoCita', 'Cita']].map(([k, n]) => `<div class="field"><label for="rt-${k}">${n} · asunto</label><input id="rt-${k}" data-t="${k}" data-p="asunto" value="${esc(T[k].asunto)}"><textarea data-t="${k}" data-p="texto" rows="7" aria-label="${n} · texto">${esc(T[k].texto)}</textarea></div>`).join('')}
      <div class="field"><label for="rt-ren">Escrito de renuncia <span class="muted" style="font-weight:400">· claves: {nombreCompleto} {codigo} {puesto} {anio} {ciudad} {hoy}</span></label><textarea id="rt-ren" data-t="renuncia" rows="8">${esc(T.renuncia)}</textarea></div>
      <button class="linkbtn" id="rmResetT">Volver a los textos de partida</button></div>`;
    box.querySelector('.rm-lug').addEventListener('change', ev => { const li = ev.target.closest('[data-i]'); if (!li) return; const l = lugares(); l[Number(li.dataset.i)][ev.target.dataset.k] = ev.target.value.trim(); Datos.set('rmLugares', l); toast('Lugar guardado'); });
    box.querySelector('.rm-lug').addEventListener('click', ev => { const b = ev.target.closest('[data-quitar]'); if (!b) return; const l = lugares(); l.splice(Number(b.dataset.quitar), 1); Datos.set('rmLugares', l); pintarCfg(main); });
    $('#rmAddL', box).onclick = () => { Datos.set('rmLugares', [...lugares(), { id: 'l' + Date.now().toString(36), nombre: '', direccion: '', indicaciones: '' }]); pintarCfg(main); $$('.rm-lug li', box).pop()?.querySelector('input')?.focus(); };
    $$('[data-t]', box).forEach(el => el.onchange = () => {
      const t = Datos.get('rmTextos', {}), k = el.dataset.t;
      if (k === 'renuncia') t.renuncia = el.value; else t[k] = { ...(t[k] || P.reconocimientos[k]), [el.dataset.p]: el.value };
      Datos.set('rmTextos', t); toast('Texto guardado');
    });
    $('#rmResetT', box).onclick = () => { Datos.set('rmTextos', {}); pintarCfg(main); toast('Textos de partida restaurados'); };
  }

  return { render, avisos, sincronizar };
})();
