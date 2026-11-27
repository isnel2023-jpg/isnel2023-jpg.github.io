// Panel del administrador (solo Isnel): colaboradores, contraseñas, metas,
// tareas automáticas, cierre de mes, copias y registro de actividad.
(function () {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "$" + (Math.round((n || 0) * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const kb = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
  const when = (t) => new Date(t).toLocaleString("es", { dateStyle: "short", timeStyle: "short" });
  const api = (p, o) => Lion.call(p, Object.assign({ raw: true }, o || {}));
  // tablero de la competencia semanal (lo calcula el servidor)
  async function paintComp() {
    const el = document.getElementById("aComp"); if (!el) return;
    let r; try { r = await api("/competencia"); } catch (e) { return; }
    if (!r || !r.active || !r.weeks || !r.weeks.length) return;
    const w = r.weeks[0], ps = w.people, top = Math.max(1, ...ps.map((p) => p.total));
    const left = (() => { const d = w.end - Date.now(); if (d <= 0) return "semana cerrada"; const h = Math.floor(d / 36e5); return h >= 24 ? `faltan ${Math.floor(h / 24)} d ${h % 24} h` : `faltan ${h} h`; })();
    const fd = (k) => k.slice(8, 10) + "/" + k.slice(5, 7);
    const hist = r.weeks.slice(1).map((x) => `<tr><td>${fd(x.startDay)} – ${fd(x.endDay)}</td><td>${x.winner ? "🏆 " + esc(x.winner) : x.tie ? "Empate" : "—"}</td>${x.people.map((p) => `<td class="r">${esc(p.name)} ${money(p.total)}</td>`).join("")}</tr>`).join("");
    el.innerHTML = `<section class="panel comp"><div class="panel-h"><h2>🏆 ${esc(r.name)}</h2><span class="muted">Lunes ${fd(w.startDay)} a sábado ${fd(w.endDay)} (hora Miami) · ${left}</span></div>
      <div class="comp-rows">${ps.map((p, i) => `<div class="comp-row"><span class="comp-pos">${ps[0].total === 0 ? "·" : ["🥇", "🥈", "🥉"][i] || i + 1}</span><span class="comp-name">${esc(p.name)}<small class="muted">${p.orders} orden${p.orders === 1 ? "" : "es"}</small></span><span class="comp-bar"><i style="width:${Math.round((p.total / top) * 100)}%"></i></span><b class="num">${money(p.total)}</b></div>`).join("")}</div>
      <p class="muted" style="margin:0;font-size:.85rem">El sábado a las 11:55 p. m. te llega un correo con el ganador. El domingo no cuenta. Cuenta el dinero vendido (órdenes nuevas + extras − ajustes, sin canceladas).</p>
      ${hist ? `<div class="scroll"><table class="t"><thead><tr><th>Semana</th><th>Ganador</th><th colspan="${ps.length}">Vendido</th></tr></thead><tbody>${hist}</tbody></table></div>` : ""}</section>`;
  }
  const post = (p, body, method) => api(p, { method: method || "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const JOB_NAMES = { start: "¿Empezó turno? (4:20 p. m.)", check17: "Check-in 5 p. m. (se revisa 5:25)", check18: "Check-in 6 p. m. (se revisa 6:25)", check19: "Check-in 7 p. m. (se revisa 7:25)", daily: "Cierre del día (8:40 p. m.)", weekly2: "Corte semanal de comisión (domingo 3 p. m. Miami)", gaby15: "Corte 15% Gaby Flowers (sábado 5 p. m. Miami)" };
  const TZS = [["America/Bogota", "Colombia", -5], ["America/New_York", "Miami", -5], ["America/Mexico_City", "México", -6], ["America/Lima", "Perú", -5], ["America/Caracas", "Venezuela", -4], ["America/Santo_Domingo", "Rep. Dominicana", -4], ["America/Chicago", "Houston", -6]];
  let W = [], M = [], root, msgEl;

  function genPw() {
    const a = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const r = crypto.getRandomValues(new Uint32Array(12));
    return Array.from(r, (x) => a[x % a.length]).join("");
  }
  function flash(t, bad) { msgEl.className = bad ? "errmsg" : "okmsg"; msgEl.textContent = t; setTimeout(() => { if (msgEl.textContent === t) msgEl.textContent = ""; }, 7000); }

  window.startAdmin = async function (me) {
    root = document.getElementById("adminApp");
    root.innerHTML = `<header class="admin-top"><div class="wrap"><span class="lion-mark">LION</span><h1>Panel de administración</h1><span class="muted">${esc(me.name)}</span><button class="btn sm" id="aOut" type="button">Salir</button></div></header>
      <main class="wrap admin-main"><div id="aMsg" role="status"></div><div id="aBody"><div class="empty">Cargando…</div></div></main>`;
    msgEl = document.getElementById("aMsg");
    document.getElementById("aOut").onclick = () => Lion.logout();
    await load();
  };

  async function load() {
    try { W = (await api("/admin/workers")).workers; M = (await api("/admin/members")).members; } catch (e) { return flash(e.message, true); }
    const body = document.getElementById("aBody");
    const workers = W.filter((w) => w.role === "worker");
    const site = location.origin + "/portal/";
    const mrow = (x) => { const c = Object.assign({ goals: {}, salesGoals: { week: [0, 0] } }, x.config); return `<div class="row" style="margin-left:14px"><div class="main"><div class="t">${esc(x.name)} ${x.active ? "" : '<span class="pill bad">desactivado</span>'}</div>
        <div class="s">${esc(c.tzLabel || "")}${c.commission != null ? " · comisión " + Math.round(c.commission * 1000) / 10 + "%" : ""}${c.basePay != null ? " · base " + money(c.basePay) : ""}${c.salesGoals && c.salesGoals.week ? " · meta semana " + money(c.salesGoals.week[0]) : ""}</div></div>
        <div class="acts" style="flex-direction:row;flex-wrap:wrap"><button class="btn sm pri" type="button" data-openm="${esc(x.portal)}|${esc(x.id)}">Ver su portal</button><button class="btn sm" type="button" data-medit="${esc(x.id)}">Metas y ajustes</button>
        <button class="btn sm" type="button" data-mpw="${esc(x.id)}">Cambiar contraseña</button><button class="btn sm ghost" type="button" data-mact="${esc(x.id)}">${x.active ? "Desactivar" : "Activar"}</button></div></div>`; };
    body.innerHTML = `
    <div id="aComp">${(setTimeout(paintComp, 0), "")}</div>
    <section class="panel"><div class="panel-h"><h2>Empresas y colaboradores</h2><button class="btn sm pri" type="button" data-newp>+ Nueva empresa</button></div>
      <p class="muted" style="margin:0">Cada empresa tiene su portal. Sus colaboradores comparten los leads y las órdenes; cada uno entra con su propia contraseña y tiene sus propias metas, turno y comisión.</p>
      ${workers.map((w) => { const ms = M.filter((x) => x.portal === w.id); return `<div class="list" style="gap:6px">
        <div class="row"><div class="main"><div class="t">${esc(w.config.portalTitle || w.name)} ${w.active ? "" : '<span class="pill bad">desactivada</span>'}</div>
          <div class="s"><span class="mono">${esc(site + w.id + "/")}</span> · ${ms.filter((x) => x.active).length} colaborador${ms.filter((x) => x.active).length === 1 ? "" : "es"} · ${esc((w.config.brands || []).join(", "))}</div></div>
          <div class="acts" style="flex-direction:row;flex-wrap:wrap"><button class="btn sm" type="button" data-open="${esc(w.id)}">Ver como admin</button><button class="btn sm" type="button" data-pedit="${esc(w.id)}">Ajustes de la empresa</button><button class="btn sm pri" type="button" data-newm="${esc(w.id)}">+ Colaborador</button></div></div>
        ${ms.map(mrow).join("") || `<div class="empty" style="margin-left:14px">Sin colaboradores todavía. Solo entra el administrador.</div>`}</div>`; }).join("")}
      <div id="wForm"></div>
    </section>
    <section class="panel"><div class="panel-h"><h2>📲 Contenido (Trello)</h2><button class="btn sm" type="button" id="ctRef">Actualizar</button></div>
      <p class="muted" style="margin:0">Santi crea · Jackeline programa · Isnel y Valery aprueban Abba y Lion. Datos en vivo de los tableros Posts e Historias.</p>
      <div id="ctCal"></div><div id="ctOut"><div class="empty">Cargando…</div></div></section>
    <section class="panel"><div class="panel-h"><h2>Administradores</h2></div>
      <div class="list">${W.filter((w) => w.role === "admin").map((w) => `<div class="row"><div class="main"><div class="t">${esc(w.name)} <span class="pill acc">admin</span></div></div><div class="acts" style="flex-direction:row"><button class="btn sm" type="button" data-pw="${esc(w.id)}">Cambiar contraseña</button></div></div>`).join("")}</div>
    </section>
    <section class="panel"><div class="panel-h"><h2>Tareas automáticas</h2><span class="muted">correos a ${esc("Isnel")}</span></div>
      <p class="muted" style="margin:0">Mismas horas y reglas que las tareas programadas del portal anterior. Aquí puedes ver cómo saldría un correo sin mandarlo, o mandarlo ya.</p>
      <form class="f" id="jobForm">
        <div class="fld"><label for="jW">Colaborador o empresa</label><select id="jW">${M.filter((x) => x.active).map((x) => `<option value="${esc(x.id)}">${esc(x.name)} (${esc((workers.find((w) => w.id === x.portal) || {}).name || "")})</option>`).join("")}${workers.map((w) => `<option value="${esc(w.id)}">Empresa: ${esc(w.name)} (corte 15%)</option>`).join("")}</select></div>
        <div class="fld"><label for="jJ">Tarea</label><select id="jJ">${Object.entries(JOB_NAMES).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("")}</select></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="submit">Vista previa</button><button class="btn pri" type="button" id="jSend">Enviar ahora</button></div>
      </form><div id="jOut"></div>
    </section>
    <section class="panel"><div class="panel-h"><h2>Cierre de mes</h2></div>
      <p class="muted" style="margin:0">Guarda en un archivo ZIP todo lo cerrado del mes (órdenes pagadas o canceladas, PDFs, días, historial), te lo manda por correo y lo quita del portal para liberar espacio. En el portal queda el resumen del mes para comparar con gráficos. Lo pendiente (órdenes por cobrar y leads) se queda. Se puede cerrar un mes desde el día 8 del mes siguiente.</p>
      <form class="f" id="cmForm">
        <div class="fld"><label for="cmW">Empresa</label><select id="cmW">${workers.map((w) => `<option value="${esc(w.id)}">${esc(w.name)}</option>`).join("")}</select></div>
        <div class="fld"><label for="cmM">Mes</label><input id="cmM" type="month" required value="${prevMonth()}"></div>
        <div><button class="btn" type="submit">Ver qué se va a archivar</button></div>
      </form><div id="cmOut"></div>
    </section>
    <section class="panel"><div class="panel-h"><h2>Archivos de cierres</h2><button class="btn sm" type="button" id="arRef">Actualizar</button></div><div id="arOut" class="list"><div class="empty">Cargando…</div></div></section>
    <section class="panel"><div class="panel-h"><h2>Espacio usado</h2></div><div id="stOut"><div class="empty">Cargando…</div></div></section>
    <section class="panel"><div class="panel-h"><h2>Registro de actividad</h2><select id="auW" aria-label="Filtrar"><option value="">Todas las empresas</option>${workers.map((w) => `<option value="${esc(w.id)}">${esc(w.name)}</option>`).join("")}</select></div>
      <p class="muted" style="margin:0">Quién hizo qué, cuándo y desde dónde. Nadie puede borrar este registro.</p><div id="auOut"><div class="empty">Cargando…</div></div></section>`;
    bind();
    archives(); storage(); auditLog(); contenido(); ctCalendar();
    const cr = document.getElementById("ctRef"); if (cr) cr.onclick = contenido;
  }
  const me = () => Lion.me;
  function prevMonth() { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); }

  function bind() {
    const q = (s) => root.querySelectorAll(s);
    q("[data-open]").forEach((b) => (b.onclick = () => Lion.view(b.dataset.open)));
    q("[data-openm]").forEach((b) => (b.onclick = () => { const [p, x] = b.dataset.openm.split("|"); Lion.view(p, x); }));
    q("[data-newp]").forEach((b) => (b.onclick = () => portalForm(null)));
    q("[data-pedit]").forEach((b) => (b.onclick = () => portalForm(W.find((w) => w.id === b.dataset.pedit))));
    q("[data-newm]").forEach((b) => (b.onclick = () => workerForm(null, b.dataset.newm)));
    q("[data-medit]").forEach((b) => (b.onclick = () => workerForm(M.find((x) => x.id === b.dataset.medit))));
    q("[data-mpw]").forEach((b) => (b.onclick = async () => {
      const x = M.find((y) => y.id === b.dataset.mpw);
      const pw = prompt(`Nueva contraseña para ${x.name} (mínimo 8 caracteres). Déjalo vacío para generar una.`, "");
      if (pw === null) return;
      const np = pw.trim() || genPw();
      try { await post("/admin/members/" + encodeURIComponent(x.id), { password: np }, "PATCH"); flash(`Contraseña de ${x.name} cambiada: ${np}  (pásasela por privado; su sesión anterior se cerró)`); }
      catch (e) { flash(e.message, true); }
    }));
    q("[data-mact]").forEach((b) => (b.onclick = async () => {
      const x = M.find((y) => y.id === b.dataset.mact);
      if (x.active && !confirm(`¿Desactivar a ${x.name}? No podrá entrar ni se le mandarán alertas. Lo que hizo se queda.`)) return;
      try { await post("/admin/members/" + encodeURIComponent(x.id), { active: !x.active }, "PATCH"); flash(x.active ? "Desactivado." : "Activado."); load(); } catch (e) { flash(e.message, true); }
    }));
    q("[data-pw]").forEach((b) => (b.onclick = async () => {
      const w = W.find((x) => x.id === b.dataset.pw);
      const pw = prompt(`Nueva contraseña para ${w.name} (mínimo ${w.role === "admin" ? 10 : 8} caracteres). Déjalo vacío para generar una.`, "");
      if (pw === null) return;
      const np = pw.trim() || genPw();
      try { await post("/admin/workers/" + encodeURIComponent(w.id), { password: np }, "PATCH"); flash(`Contraseña de ${w.name} cambiada: ${np}  (cópiala y pásasela por privado; su sesión anterior se cerró)`); }
      catch (e) { flash(e.message, true); }
    }));
    q("[data-act]").forEach((b) => (b.onclick = async () => {
      const w = W.find((x) => x.id === b.dataset.act);
      if (w.active && !confirm(`¿Desactivar a ${w.name}? No podrá entrar ni se le mandarán alertas. Sus datos se quedan.`)) return;
      try { await post("/admin/workers/" + encodeURIComponent(w.id), { active: !w.active }, "PATCH"); flash(w.active ? "Desactivado." : "Activado."); load(); } catch (e) { flash(e.message, true); }
    }));
    document.getElementById("jobForm").onsubmit = (e) => { e.preventDefault(); runJob(true); };
    document.getElementById("jSend").onclick = () => { if (confirm("¿Mandar este correo ya a tu email?")) runJob(false); };
    document.getElementById("cmForm").onsubmit = (e) => { e.preventDefault(); closeMonth(false); };
    document.getElementById("arRef").onclick = archives;
    document.getElementById("auW").onchange = auditLog;
  }

  // ---------- crear / editar colaborador ----------
  // ---------- empresa ----------
  function portalForm(w) {
    const c = w ? w.config : { brands: [], jobs: {} };
    const box = document.getElementById("wForm");
    box.innerHTML = `<form class="f panel" id="pf" style="background:var(--sunk)">
      <h3 class="full">${w ? "Ajustes de " + esc(w.name) : "Nueva empresa"}</h3>
      <div class="fld"><label for="pN">Nombre de la empresa</label><input id="pN" required maxlength="80" value="${esc(w ? w.name : "")}"></div>
      ${w ? "" : `<div class="fld"><label for="pI">Dirección (minúsculas y guiones)</label><input id="pI" required pattern="[a-z0-9-]{2,40}" placeholder="gaby-flowers"></div>`}
      <div class="fld"><label for="pT">Título del portal</label><input id="pT" maxlength="80" value="${esc(c.portalTitle || "")}" placeholder="Portal Gaby Flowers"></div>
      <div class="fld"><label for="pB">Marcas que se venden aquí</label><input id="pB" value="${esc((c.brands || []).join(", "))}"></div>
      <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="pG" ${c.jobs && c.jobs.gaby15 ? "checked" : ""}> Corte del 15% Gaby Flowers por correo (sábados 5 p. m.)</label>
      <div class="full" style="display:flex;gap:8px"><button class="btn pri" type="submit">${w ? "Guardar" : "Crear empresa"}</button><button class="btn" type="button" id="pfX">Cancelar</button></div>
    </form>`;
    const g = (id) => document.getElementById(id);
    g("pfX").onclick = () => (box.innerHTML = "");
    g("pf").onsubmit = async (e) => {
      e.preventDefault();
      const name = g("pN").value.trim();
      const config = { displayName: name, shortName: name, portalTitle: g("pT").value.trim() || "Portal " + name, brands: g("pB").value.split(",").map((x) => x.trim()).filter(Boolean), jobs: { ...(c.jobs || {}), gaby15: g("pG").checked } };
      try {
        if (w) await post("/admin/workers/" + encodeURIComponent(w.id), { name, config }, "PATCH");
        else await post("/admin/workers", { id: g("pI").value.trim(), name, config });
        flash("Guardado."); load();
      } catch (err) { flash(err.message, true); }
    };
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- colaborador ----------
  function workerForm(w, portalId) {
    const c = w ? Object.assign({ tz: "America/Bogota", tzLabel: "Colombia", tzOffsetHours: -5, commission: 0.02, basePay: 300, commissionBrands: [], salesGoals: { week: [5000, 7500], month: [20000, 30000] }, goals: { newCalls: 50, followUps: 50, chats: 50 }, shiftStartHour: 16, shiftEndHour: 20, checkHours: [17, 18, 19, 20], workDays: [1, 2, 3, 4, 5], content: [], docsLinks: [], jobs: { startCheck: true, checkins: true, daily: true, weekly2: true } }, w.config) : { tz: "America/Bogota", tzLabel: "Colombia", tzOffsetHours: -5, commission: 0.02, basePay: 300, brands: ["Gaby Flowers", "ABBA Roses"], commissionBrands: ["Gaby Flowers"], salesGoals: { week: [5000, 7500], month: [20000, 30000] }, goals: { newCalls: 50, followUps: 50, chats: 50 }, shiftStartHour: 16, shiftEndHour: 20, checkHours: [17, 18, 19, 20], workDays: [1, 2, 3, 4, 5], content: [], docsLinks: [], jobs: { startCheck: true, checkins: true, daily: true, weekly2: true, gaby15: false } };
    const box = document.getElementById("wForm");
    const contentTxt = (c.content || []).map((x) => `${x.k} | ${x.n} | ${x.goal} | ${x.sub || ""}${x.from || x.to ? " | " + (x.from || "") + " | " + (x.to || "") : ""}`.replace(/ \| $/, "")).join("\n");
    const docsTxt = (c.docsLinks || []).map((x) => `${x.t} | ${x.url} | ${x.s || ""}`).join("\n");
    box.innerHTML = `<form class="f panel" id="wf" style="background:var(--sunk)">
      <h3 class="full">${w ? "Metas y ajustes de " + esc(w.name) : "Nuevo colaborador · " + esc((W.find((x) => x.id === portalId) || {}).name || "")}</h3>
      <div class="fld"><label for="fN">Nombre completo</label><input id="fN" required maxlength="80" value="${esc(w ? w.name : "")}"></div>
      <div class="fld"><label for="fS">Nombre corto</label><input id="fS" maxlength="30" value="${esc(c.shortName || "")}" placeholder="Santi"></div>
      ${w ? "" : `<div class="fld"><label for="fP">Contraseña (mín. 8)</label><div style="display:flex;gap:6px"><input id="fP" required minlength="8" value="${genPw()}"><button class="btn sm" type="button" id="fPg">Otra</button></div></div>`}
      <div class="fld"><label for="fTz">Zona horaria</label><select id="fTz">${TZS.map(([z, l]) => `<option value="${z}" ${c.tz === z ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <div class="fld"><label for="fSh">Turno (hora inicio – fin)</label><div style="display:flex;gap:6px"><input id="fSh" type="number" min="0" max="23" value="${c.shiftStartHour}"><input id="fEh" type="number" min="1" max="24" value="${c.shiftEndHour}"></div></div>
      <div class="fld"><label for="fCk">Horas de check-in</label><input id="fCk" value="${esc((c.checkHours || []).join(", "))}"></div>
      <div class="sep lbl">Pago</div>
      <div class="fld"><label for="fBp">Sueldo base al mes (USD)</label><input id="fBp" type="number" min="0" step="1" value="${c.basePay}"></div>
      <div class="fld"><label for="fCm">Comisión (%)</label><input id="fCm" type="number" min="0" max="100" step="0.1" value="${Math.round(c.commission * 1000) / 10}"></div>
      <div class="fld"><label for="fCb">Marcas que dan comisión</label><input id="fCb" value="${esc((c.commissionBrands || []).join(", "))}"></div>

      <div class="sep lbl">Metas</div>
      <div class="fld"><label for="fW0">Ventas semana: base / alta</label><div style="display:flex;gap:6px"><input id="fW0" type="number" min="0" value="${c.salesGoals.week[0]}"><input id="fW1" type="number" min="0" value="${c.salesGoals.week[1]}"></div></div>
      <div class="fld"><label for="fM0">Ventas mes: base / alta</label><div style="display:flex;gap:6px"><input id="fM0" type="number" min="0" value="${c.salesGoals.month[0]}"><input id="fM1" type="number" min="0" value="${c.salesGoals.month[1]}"></div></div>
      <div class="fld"><label for="fGn">Llamadas nuevas / follow-ups / chats al día</label><div style="display:flex;gap:6px"><input id="fGn" type="number" min="0" value="${c.goals.newCalls}"><input id="fGf" type="number" min="0" value="${c.goals.followUps}"><input id="fGc" type="number" min="0" value="${c.goals.chats}"></div></div>
      <div class="fld full"><label for="fCt">Tareas personales (una por línea: clave | nombre | meta diaria | nota | desde AAAA-MM-DD | hasta AAAA-MM-DD)</label><textarea id="fCt" rows="7" placeholder="gabyStories | Historias Gaby Flowers | 3">${esc(contentTxt)}</textarea></div>
      <div class="fld full"><label for="fDl">Documentos en la Guía (una por línea: título | https://… | descripción)</label><textarea id="fDl" rows="3">${esc(docsTxt)}</textarea></div>
      <div class="sep lbl">Correos automáticos para ti</div>
      ${[["startCheck", "¿Empezó turno?"], ["checkins", "Check-ins por hora"], ["daily", "Cierre del día"], ["weekly2", "Corte semanal de comisión (PDF, domingos)"]].map(([k, l]) => `<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="fj_${k}" ${c.jobs && c.jobs[k] ? "checked" : ""}> ${l}</label>`).join("")}
      <div class="full" style="display:flex;gap:8px"><button class="btn pri" type="submit">${w ? "Guardar cambios" : "Crear colaborador"}</button><button class="btn" type="button" id="wfX">Cancelar</button></div>
    </form>`;
    const g = (id) => document.getElementById(id);
    if (g("fPg")) g("fPg").onclick = () => (g("fP").value = genPw());
    g("wfX").onclick = () => (box.innerHTML = "");
    g("wf").onsubmit = async (e) => {
      e.preventDefault();
      const tz = TZS.find((t) => t.at === undefined && t[0] === g("fTz").value) || TZS[0];
      const list = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
      const content = g("fCt").value.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0] && p[1]).map(([k, n, goal, sub, from, to]) => ({ k: k.replace(/[^\w]/g, "").slice(0, 30), n, goal: Math.max(0, parseInt(goal, 10) || 1), ...(sub ? { sub } : {}), ...(/^\d{4}-\d{2}-\d{2}$/.test(from || "") ? { from } : {}), ...(/^\d{4}-\d{2}-\d{2}$/.test(to || "") ? { to } : {}) }));
      const docsLinks = g("fDl").value.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0] && /^https:\/\//.test(p[1] || "")).map(([t, url, s]) => ({ t, url, s: s || "" }));
      const n = (id) => Number(g(id).value) || 0;
      const config = {
        displayName: g("fN").value.trim(), shortName: g("fS").value.trim() || g("fN").value.trim().split(" ")[0],
        tz: tz[0], tzLabel: tz[1], tzOffsetHours: tz[2], shiftStartHour: n("fSh"), shiftEndHour: n("fEh"),
        checkHours: g("fCk").value.split(",").map((x) => parseInt(x, 10)).filter((x) => x >= 0 && x < 24),
        basePay: n("fBp"), commission: n("fCm") / 100, commissionBrands: list(g("fCb").value),
        salesGoals: { week: [n("fW0"), n("fW1")], month: [n("fM0"), n("fM1")] }, goals: { newCalls: n("fGn"), followUps: n("fGf"), chats: n("fGc") },
        content, docsLinks, jobs: Object.fromEntries(["startCheck", "checkins", "daily", "weekly2"].map((k) => [k, g("fj_" + k).checked])),
      };
      try {
        if (w) { await post("/admin/members/" + encodeURIComponent(w.id), { name: config.displayName, config }, "PATCH"); flash("Guardado. Se aplica la próxima vez que abra el portal."); }
        else { const pw = g("fP").value.trim(); await post("/admin/members", { portal: portalId, name: config.displayName, password: pw, config }); flash(`Colaborador creado. Su contraseña es: ${pw}  — pásasela por privado.`); }
        load();
      } catch (err) { flash(err.message, true); }
    };
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- tareas ----------
  async function runJob(dry) {
    const out = document.getElementById("jOut");
    out.innerHTML = `<div class="empty">${dry ? "Armando la vista previa…" : "Enviando…"}</div>`;
    try {
      const r = await post("/admin/jobs/run", { worker: document.getElementById("jW").value, job: document.getElementById("jJ").value, dry });
      const x = r.out[0];
      if (!x) { out.innerHTML = `<div class="empty">Esa tarea no aplica o está apagada (el corte 15% es de la empresa; las demás, de cada colaborador en "Metas y ajustes").</div>`; return; }
      if (!dry) { out.innerHTML = `<p class="okmsg">${esc(typeof x.result === "string" ? x.result : "Listo")}</p>`; return; }
      if (typeof x.result === "string") { out.innerHTML = `<p class="muted">${esc(x.result === "sin novedad" ? "Ahora mismo no hay nada que avisar: no se mandaría correo." : x.result)}</p>`; return; }
      const res = x.result;
      out.innerHTML = `<div class="panel" style="background:var(--sunk)"><b>${esc(res.subject)}</b><pre class="rep">${esc(res.text)}</pre><div id="jPdf"></div></div>`;
      if (res.pdf) {
        const bin = atob(res.pdf), u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([u8], { type: "application/pdf" }));
        const a = document.createElement("a"); a.href = url; a.download = (res.attachments[0] && res.attachments[0].filename) || "corte.pdf"; a.className = "btn"; a.textContent = "Descargar PDF de prueba";
        document.getElementById("jPdf").append(a);
      }
    } catch (e) { out.innerHTML = `<p class="errmsg">${esc(e.message)}</p>`; }
  }

  // ---------- cierre de mes ----------
  async function closeMonth(confirmIt) {
    const out = document.getElementById("cmOut");
    const worker = document.getElementById("cmW").value, month = document.getElementById("cmM").value;
    out.innerHTML = `<div class="empty">${confirmIt ? "Cerrando el mes… no cierres esta página." : "Revisando…"}</div>`;
    try {
      const r = await post("/admin/close-month", { worker, month, confirm: confirmIt });
      const s = r.summary.sales, p = r.summary.pay;
      const list = Object.entries(r.count).filter(([, v]) => v).map(([k, v]) => `${v} ${({ sales: "órdenes cerradas", days: "días", historial: "registros de historial", alertas: "alertas", avisos_extras: "avisos de extras", avisos_cambios: "avisos de cambios", visits: "visitas", pedidos_claude: "pedidos a Claude" })[k] || k}`).join(" · ");
      out.innerHTML = `<div class="panel" style="background:var(--sunk)">
        <b>${esc(r.worker)} · ${esc(r.month)}</b>
        <div>Ventas ${money(s.total)} en ${s.orders} órdenes · pago del mes ${money(p.total)} (base ${money(p.basePay)} + comisión ${money(p.commission)})</div>
        <div>${r.done ? "Archivado" : "Se va a archivar"}: ${esc(list || "nada")} · ${r.files} PDFs de órdenes</div>
        <div>Libera aprox. ${kb(r.freesBytes)} de datos${r.files ? " + los PDFs" : ""}. Se quedan ${r.keeps.leads} leads y ${r.keeps.pendingOrders} órdenes abiertas.</div>
        ${r.done ? `<p class="okmsg">Mes cerrado. ZIP de ${kb(r.zipBytes)} ${r.mailed ? "enviado a tu correo y " : ""}guardado en "Archivos de cierres".</p>` : `<button class="btn pri" type="button" id="cmGo">Cerrar el mes y archivar</button>`}
      </div>`;
      const go = document.getElementById("cmGo");
      if (go) go.onclick = () => { if (confirm(`¿Cerrar ${month} de ${r.worker}? Lo cerrado sale del portal y queda solo en el archivo ZIP.`)) closeMonth(true); };
      if (r.done) { archives(); storage(); }
    } catch (e) { out.innerHTML = `<p class="errmsg">${esc(e.message)}</p>`; }
  }
  async function archives() {
    const out = document.getElementById("arOut");
    try {
      const r = await api("/admin/archives");
      out.innerHTML = r.archives.length ? r.archives.map((a) => { const w = W.find((x) => x.id === a.w); return `<div class="row"><div class="main"><div class="t">${esc(w ? w.name : a.w)} · ${esc(a.month)}</div><div class="s">${kb(a.bytes || 0)} · ${a.t ? when(a.t) : ""}</div></div><div class="acts" style="flex-direction:row"><button class="btn sm pri" type="button" data-dl="${esc(a.key)}">Descargar</button><button class="btn sm ghost" type="button" data-rm="${esc(a.key)}">Borrar copia</button></div></div>`; }).join("") : `<div class="empty">Todavía no hay meses cerrados.</div>`;
      out.querySelectorAll("[data-dl]").forEach((b) => (b.onclick = async () => {
        const res = await Lion.call("/admin/archives/" + encodeURIComponent(b.dataset.dl), { raw: true, response: true });
        if (!res.ok) return flash("No se pudo descargar.", true);
        const url = URL.createObjectURL(await res.blob());
        const a = document.createElement("a"); a.href = url; a.download = "cierre-" + b.dataset.dl.split(":").slice(1).join("-") + ".zip"; document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }));
      out.querySelectorAll("[data-rm]").forEach((b) => (b.onclick = async () => {
        if (!confirm("¿Borrar la copia guardada en el servidor? Hazlo solo si ya la descargaste (también te llegó por correo). No se puede deshacer.")) return;
        try { await Lion.call("/admin/archives/" + encodeURIComponent(b.dataset.rm), { raw: true, method: "DELETE" }); archives(); } catch (e) { flash(e.message, true); }
      }));
    } catch (e) { out.innerHTML = `<p class="errmsg">${esc(e.message)}</p>`; }
  }
  // ---- contenido: calendario rotativo (mismo cálculo que el portal de cada colaborador) ----
  const CT_URL = "https://n8n.n8nainueva.com/webhook/contenido-metricas";
  // cuentas activas (TikTok, Instagram y Facebook de cada una); Lion Systems se agrega cuando tenga sus redes
  const CT_EMP = [["GABY", "Gaby Flowers"], ["ABBA", "ABBA Roses"], ["RUIZ", "Ruiz Creationz"]];
  const CT_SLOTS = ["8:00 a. m.", "12:00 p. m.", "5:00 p. m.", "7:00 p. m."], CT_POST_DAYS = [1, 3, 5, 0];
  const CT_GOALS = { postsSemana: CT_POST_DAYS.length * CT_EMP.length, historiasDia: 3 * CT_EMP.length };
  const DOWN = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  function ctSlot(k, i) { const d = new Date(k + "T12:00:00Z"), dow = d.getUTCDay(), di = CT_POST_DAYS.indexOf(dow); if (di < 0) return null; const mon = new Date(d); mon.setUTCDate(d.getUTCDate() - ((dow + 6) % 7)); return CT_SLOTS[(i + Math.floor(mon.getTime() / 6048e5) + di) % CT_SLOTS.length]; }
  function ctCalendar() {
    const el = document.getElementById("ctCal"); if (!el) return;
    const t = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" })), base = new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()));
    const days = []; for (let i = 0; i < 14 && days.length < 8; i++) { const d = new Date(base); d.setUTCDate(base.getUTCDate() + i); const k = d.toISOString().slice(0, 10); if (CT_POST_DAYS.includes(d.getUTCDay())) days.push(k); }
    el.innerHTML = `<div class="scroll"><table class="t"><thead><tr><th>Posts (hora Miami)</th>${CT_EMP.map(([, n]) => `<th>${esc(n)}</th>`).join("")}</tr></thead><tbody>${days.map((k) => `<tr><td>${DOWN[new Date(k + "T12:00:00Z").getUTCDay()]} ${k.slice(8, 10)}/${k.slice(5, 7)}</td>${CT_EMP.map((_, i) => `<td class="mono">${ctSlot(k, i)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <p class="muted" style="margin:4px 0 0">Historias: lunes a sábado, 3 por cuenta: de 8 a 9 a. m., de 12 a 1 p. m. y de 5 a 6 p. m. (hora Miami). Cada cuenta publica en TikTok, Instagram y Facebook. Las horas de los posts rotan: ninguna cuenta repite hora el mismo día y cada semana cambian.</p>`;
  }
  const ctUse = (kind, k) => { const dow = new Date(k + "T12:00:00Z").getUTCDay(); return kind === "historias" ? (dow === 0 ? 0 : 3) : (CT_POST_DAYS.includes(dow) ? 1 : 0); };
  const ctAdd = (k, n) => { const d = new Date(k + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  function ctDays(have, kind, k) { let n = 0, left = have; for (let i = 1; i <= 60; i++) { const u = ctUse(kind, ctAdd(k, i)); if (u > left) break; left -= u; if (u) n = i; } return n; }
  function ctNeed(have, kind, k) { let need = 0; for (let i = 1; i <= 7; i++) need += ctUse(kind, ctAdd(k, i)); return Math.max(0, need - have); }
  function ctAheadRows(r) {
    const t = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" })), k = new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())).toISOString().slice(0, 10), a = r.adelanto || {};
    return CT_EMP.map(([c, n]) => { const x = a[c] || {}, h = x.historias || 0, p = x.posts || 0, dh = ctDays(h, "historias", k), dp = ctDays(p, "posts", k), nh = ctNeed(h, "historias", k), np = ctNeed(p, "posts", k);
      return `<tr><td>${esc(n)}</td><td class="r"><span class="pill ${dh >= 7 ? "on" : "warn"}">${dh} d</span> <span class="muted">${h} listas</span></td><td class="r"><span class="pill ${dp >= 7 ? "on" : "warn"}">${dp} d</span> <span class="muted">${p} listos</span></td><td>${nh || np ? `${nh} historias · ${np} posts` : "✅ al día"}</td></tr>`; }).join("");
  }
  async function contenido() {
    const out = document.getElementById("ctOut"); if (!out) return;
    out.innerHTML = `<div class="empty">Cargando…</div>`;
    try {
      const r = await (await fetch(CT_URL, { cache: "no-store" })).json();
      const m = { ...(r.metas || {}), santi_historias_dia: CT_GOALS.historiasDia, santi_posts_semana: CT_GOALS.postsSemana, jacqueline_historias_dia: CT_GOALS.historiasDia }, s = r.santi || {}, j = r.jacqueline || {}, p = r.pendientes || {};
      const bar = (v, g) => { const pct = g ? Math.min(100, Math.round((v / g) * 100)) : 0; return `<span class="mono">${v}${g ? " / " + g : ""}</span> <span class="pill ${g && v >= g ? "on" : g ? "warn" : ""}">${g ? pct + "%" : "—"}</span>`; };
      const row = (a, b) => `<tr><td>${a}</td><td class="r">${b}</td></tr>`;
      const bancos = Object.entries(r.bancos || {}).map(([e, b]) => `<tr><td>${esc(e)}</td><td class="r mono">${b.disponibles}</td><td class="r mono">${b.total}</td><td>${b.alerta ? '<span class="pill bad">bajo (&lt;' + (m.banco_minimo || 15) + ")</span>" : '<span class="pill on">ok</span>'}</td></tr>`).join("");
      const emp = Object.entries(s.por_empresa_semana || {}).filter(([, n]) => n).map(([e, n]) => `${esc(e)} ${n}`).join(" · ") || "—";
      out.innerHTML = `<div class="scroll"><table class="t"><thead><tr><th>Santi — creación</th><th class="r">Hoy / semana vs. meta</th></tr></thead><tbody>
        ${row("Historias nuevas hoy", bar(s.historias_hoy || 0, m.santi_historias_dia))}
        ${row("Historias esta semana", `<span class="mono">${s.historias_semana || 0}</span>`)}
        ${row("Posts esta semana", bar(s.posts_semana || 0, m.santi_posts_semana))}
        ${row("Por empresa (semana)", `<span class="muted">${emp}</span>`)}
      </tbody></table>
      <table class="t"><thead><tr><th>Jackeline — programación</th><th class="r">Cantidad</th></tr></thead><tbody>
        ${row("Historias programadas hoy", bar(j.historias_programadas_hoy || 0, m.jacqueline_historias_dia))}
        ${row("Historias programadas semana", `<span class="mono">${j.historias_programadas_semana || 0}</span>`)}
        ${row("Posts programados hoy / semana", `<span class="mono">${j.posts_programados_hoy || 0} / ${j.posts_programados_semana || 0}</span>`)}
        ${row("Publicados esta semana", `<span class="mono">${j.posteados_semana || 0}</span>`)}
      </tbody></table>
      <table class="t"><thead><tr><th>Adelanto (meta: 7 días)</th><th class="r">Historias</th><th class="r">Posts</th><th>Le falta a Santi para la semana</th></tr></thead><tbody>${ctAheadRows(r)}</tbody></table>
      <table class="t"><thead><tr><th>Pendientes</th><th class="r">Cantidad</th></tr></thead><tbody>
        ${row("Esperan tu aprobación (Abba / Lion)", `<span class="mono">${(p.posts_por_aprobar || 0) + (p.historias_por_aprobar || 0)}</span> <span class="muted">posts ${p.posts_por_aprobar || 0} · historias ${p.historias_por_aprobar || 0}</span>`)}
        ${row("Listos sin programar", `<span class="mono">${(p.posts_sin_programar || 0) + (p.historias_nuevas_sin_programar || 0)}</span>`)}
        ${row("Posts programados a futuro", `<span class="mono">${p.posts_programados_futuro || 0}</span>`)}
        ${row("Atrasadas (ya salieron y no se movieron)", p.atrasadas ? `<span class="pill bad">${p.atrasadas}</span>` : '<span class="mono">0</span>')}
      </tbody></table>
      <table class="t"><thead><tr><th>Banco de historias</th><th class="r">Disponibles</th><th class="r">Total</th><th>Estado</th></tr></thead><tbody>${bancos}</tbody></table></div>
      <p class="muted" style="margin:6px 0 0">Actualizado ${esc(when(r.actualizado))} · <a href="https://trello.com/b/j40ktBFt" target="_blank" rel="noopener">Tablero Posts</a> · <a href="https://trello.com/b/iPV0GS8a" target="_blank" rel="noopener">Tablero Historias</a></p>`;
    } catch (e) { out.innerHTML = `<p class="errmsg">No se pudo leer Trello: ${esc(e.message)}</p>`; }
  }
  async function storage() {
    const out = document.getElementById("stOut");
    try {
      const r = await api("/admin/storage");
      const by = {};
      r.rows.forEach((x) => { (by[x.worker_id] ||= { n: 0, b: 0, cols: [] }); by[x.worker_id].n += x.n; by[x.worker_id].b += x.bytes; by[x.worker_id].cols.push(`${x.col} ${x.n}`); });
      out.innerHTML = `<table class="t"><thead><tr><th>Colaborador</th><th class="r">Registros</th><th class="r">Tamaño</th><th>Detalle</th></tr></thead><tbody>${Object.entries(by).map(([wid, v]) => { const w = W.find((x) => x.id === wid); return `<tr><td>${esc(w ? w.name : wid)}</td><td class="r">${v.n}</td><td class="r">${kb(v.b)}</td><td class="muted">${esc(v.cols.join(" · "))}</td></tr>`; }).join("") || `<tr><td colspan="4" class="muted">Vacío</td></tr>`}</tbody></table>`;
    } catch (e) { out.innerHTML = `<p class="errmsg">${esc(e.message)}</p>`; }
  }
  async function auditLog() {
    const out = document.getElementById("auOut");
    const w = document.getElementById("auW").value;
    try {
      const r = await api("/admin/audit" + (w ? "?w=" + encodeURIComponent(w) : ""));
      out.innerHTML = `<div class="scroll"><table class="t"><thead><tr><th>Cuándo</th><th>Quién</th><th>Qué</th><th>Dónde</th></tr></thead><tbody>${r.entries.slice(0, 200).map((x) => { const owner = W.find((y) => y.id === x.worker_id); return `<tr><td class="mono">${when(x.t)}</td><td>${esc(x.actor || "—")}${owner && owner.name !== x.actor ? ` <span class="muted">(portal de ${esc(owner.name)})</span>` : ""}</td><td>${esc(x.action)}${x.col ? " · " + esc(x.col) : ""}${x.doc_id ? ` <span class="mono muted">${esc(String(x.doc_id).slice(0, 24))}</span>` : ""}</td><td class="muted">${esc(x.ip || "")}</td></tr>`; }).join("")}</tbody></table></div>`;
    } catch (e) { out.innerHTML = `<p class="errmsg">${esc(e.message)}</p>`; }
  }
})();
