// Conexión del portal con el servidor de Lion.
// Imita las piezas que el portal usaba dentro de Claude (base de datos, IA, archivos y correo)
// para que el código del portal funcione igual sin cambios.
(function () {
  "use strict";
  const API = window.LION_API || "./api";
  const TK = "lion_portal_tk", VIEW = "lion_portal_view", VIEWM = "lion_portal_view_m";
  const store = {
    get(k, ss) { try { return (ss ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set(k, v, ss) { try { (ss ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} },
    del(k, ss) { try { (ss ? sessionStorage : localStorage).removeItem(k); } catch (e) {} },
  };
  const slugMeta = document.querySelector('meta[name="lion-portal"]');
  const Lion = (window.Lion = { token: store.get(TK), viewing: store.get(VIEW, true), viewingMember: store.get(VIEWM, true), me: null, onAuthLost: null,
    portalSlug: slugMeta ? slugMeta.content : null });

  function withW(path) {
    if (!Lion.viewing) return path;
    return path + (path.includes("?") ? "&" : "?") + "w=" + encodeURIComponent(Lion.viewing) + (Lion.viewingMember ? "&m=" + encodeURIComponent(Lion.viewingMember) : "");
  }
  async function call(path, opts = {}) {
    const headers = Object.assign({}, opts.headers || {});
    if (Lion.token) headers.authorization = "Bearer " + Lion.token;
    let res;
    try { res = await fetch(API + (opts.raw ? path : withW(path)), Object.assign({}, opts, { headers, credentials: "omit", cache: "no-store" })); }
    catch (e) { throw Object.assign(new Error("Sin conexión"), { code: "unavailable" }); }
    if (opts.response) return res;
    let body = null;
    try { body = await res.json(); } catch (e) {}
    if (!res.ok) {
      const code = (body && body.error && body.error.code) || "error";
      const map = { rate_limited: "resource_exhausted", too_large: "too_large", internal: "unavailable" };
      const err = Object.assign(new Error((body && body.error && body.error.message) || "Error " + res.status), { code: map[code] || code, status: res.status });
      if (res.status === 401 && path !== "/login") { Lion.logout(true); }
      if (res.status >= 500) err.code = "unavailable";
      throw err;
    }
    return body;
  }
  Lion.call = call;
  Lion.login = async (password) => {
    const r = await call("/login", { method: "POST", raw: true, headers: { "content-type": "application/json" }, body: JSON.stringify({ password, portal: Lion.portalSlug || undefined }) });
    Lion.token = r.token; Lion.me = r.me; store.set(TK, r.token); store.del(VIEW, true); store.del(VIEWM, true); Lion.viewing = null;
    return r.me;
  };
  Lion.logout = (lost) => {
    store.del(TK); store.del(VIEW, true); Lion.token = null;
    if (lost && Lion.onAuthLost) Lion.onAuthLost(); else location.reload();
  };
  Lion.view = (wid, mid) => {
    if (wid) store.set(VIEW, wid, true); else store.del(VIEW, true);
    if (wid && mid) store.set(VIEWM, mid, true); else store.del(VIEWM, true);
    location.reload();
  };

  // ---------------- base de datos ----------------
  const POLL_MS = 6000, POLL_HIDDEN_MS = 30000;
  const cache = {};        // col -> Map(id -> {data, updated})
  const loaded = {};       // col -> true cuando ya llegó la primera carga
  const listeners = [];    // {col, filter, cb, err}
  let since = 0, timer = null, polling = false, failures = 0;
  const cols = () => [...new Set(listeners.map((l) => l.col).concat(Object.keys(cache)))];
  const clone = (x) => JSON.parse(JSON.stringify(x));

  function snapshot(col, filter, changes) {
    const docs = [];
    for (const [id, v] of cache[col] || []) if (!filter || filter(v.data)) docs.push({ id, data: () => clone(v.data) });
    const ch = (changes || []).filter((c) => !filter || filter(c.data)).map((c) => ({ type: c.type, doc: { id: c.id, data: () => clone(c.data) } }));
    return { docs, docChanges: () => ch, metadata: { fromCache: false }, empty: !docs.length, size: docs.length };
  }
  function emit(col, changes) {
    if (!loaded[col]) return;
    for (const l of listeners) if (l.col === col) { try { l.cb(snapshot(col, l.filter, changes)); } catch (e) { console.error(e); } }
  }
  async function poll() {
    if (polling || !Lion.token) return;
    const cs = cols();
    if (!cs.length) return;
    polling = true;
    try {
      const fresh = cs.filter((c) => !loaded[c]), known = cs.filter((c) => loaded[c]);
      const r = known.length ? await call("/docs?cols=" + known.join(",") + "&since=" + Math.max(0, since - 3000)) : { now: Date.now(), docs: [], deleted: [] };
      if (fresh.length) {
        // colecciones nuevas: carga completa
        const f = await call("/docs?cols=" + fresh.join(",") + "&since=0");
        r.docs = r.docs.concat(f.docs);
        if (!known.length) r.now = f.now;
      }
      failures = 0;
      const changed = {};
      for (const d of r.docs) {
        const m = (cache[d.col] ||= new Map());
        const cur = m.get(d.id);
        if (cur && cur.updated > d.updated) continue;
        if (cur && cur.updated === d.updated) continue;
        m.set(d.id, { data: d.data, updated: d.updated });
        (changed[d.col] ||= []).push({ type: cur ? "modified" : "added", id: d.id, data: d.data });
      }
      for (const d of r.deleted || []) {
        const m = cache[d.col];
        if (!m || !m.has(d.id)) continue;
        const old = m.get(d.id); m.delete(d.id);
        // los quitados por un cierre de mes no se marcan como "borrados por fuera"
        (changed[d.col] ||= []).push(d.reason === "archivo" ? { type: "_silent", id: d.id, data: old.data } : { type: "removed", id: d.id, data: old.data });
      }
      since = r.now;
      for (const c of cs) {
        const first = !loaded[c];
        loaded[c] = true;
        (cache[c] ||= new Map());
        if (first || changed[c]) emit(c, (changed[c] || []).filter((x) => x.type !== "_silent"));
      }
    } catch (e) {
      failures++;
      if (failures === 2) for (const l of listeners) if (l.err) try { l.err(e); } catch (x) {}
    } finally {
      polling = false;
      clearTimeout(timer);
      timer = setTimeout(poll, document.hidden ? POLL_HIDDEN_MS : POLL_MS);
    }
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { clearTimeout(timer); poll(); } });
  let kick = null;
  function schedulePoll() { clearTimeout(kick); kick = setTimeout(() => { clearTimeout(timer); poll(); }, 30); }
  function waitLoaded(col) {
    return new Promise((res) => { const t = () => (loaded[col] ? res() : setTimeout(t, 60)); t(); });
  }
  function merge(a, b) {
    const out = Object.assign({}, a || {});
    for (const [k, v] of Object.entries(b || {})) {
      if (v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object" && !Array.isArray(out[k])) out[k] = Object.assign({}, out[k], v);
      else out[k] = v;
    }
    return out;
  }
  async function write(col, id, data, patch) {
    const body = JSON.stringify(data);
    const put = (code) => call("/docs/" + encodeURIComponent(col) + "/" + encodeURIComponent(id), { method: patch ? "PATCH" : "PUT", headers: Object.assign({ "content-type": "application/json" }, code ? { "x-approval": code } : {}), body });
    let r;
    try { r = await put(); }
    catch (e) {
      if (e.code !== "approval_required") throw e;
      try { r = await askApproval(col, id, data, patch, put, e.message); }
      catch (e2) {
        // no se guardó: la pantalla vuelve a mostrar lo que hay en el servidor
        const cur0 = (cache[col] || new Map()).get(id);
        if (cur0) emit(col, [{ type: "modified", id, data: cur0.data }]);
        throw e2;
      }
    }
    const m = (cache[col] ||= new Map());
    const cur = m.get(id);
    const nd = r.data ? r.data : patch ? merge(cur ? cur.data : {}, data) : data;
    m.set(id, { data: clone(nd), updated: r.updated });
    emit(col, [{ type: cur ? "modified" : "added", id, data: nd }]);
  }
  function collection(col) {
    if (!cache[col]) cache[col] = new Map();
    const api = {
      doc: (id) => ({
        set: (data) => write(col, String(id), data, false),
        update: (data) => write(col, String(id), data, true),
        get: async () => { await waitLoaded(col); const v = cache[col].get(String(id)); return { exists: !!v, id, data: () => (v ? clone(v.data) : undefined) }; },
      }),
      onSnapshot: (cb, err) => listen(col, null, cb, err),
      get: async () => { schedulePoll(); await waitLoaded(col); return snapshot(col, null, []); },
      where: (field, op, value) => {
        const f = (d) => (op === "==" ? d && d[field] === value : true);
        return { onSnapshot: (cb, err) => listen(col, f, cb, err), get: async () => { schedulePoll(); await waitLoaded(col); return snapshot(col, f, []); } };
      },
    };
    return api;
  }
  function listen(col, filter, cb, err) {
    const l = { col, filter, cb, err };
    listeners.push(l);
    if (loaded[col]) setTimeout(() => cb(snapshot(col, filter, [])), 0);
    else schedulePoll();
    return () => { const i = listeners.indexOf(l); if (i >= 0) listeners.splice(i, 1); };
  }
  Lion.db = { collection };

  // ---------------- código de autorización de Isnel ----------------
  // Cambiar algo ya vendido en una orden (extras, delivery, total) necesita un código que le llega a Isnel por correo.
  function askApproval(col, id, data, patch, put, why) {
    return new Promise((resolve, reject) => {
      const box = document.createElement("div");
      box.className = "modal"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true");
      box.innerHTML = `<div class="card2">
        <span class="lbl">Autorización de Isnel</span>
        <h2>Este cambio necesita un código</h2>
        <p class="muted" style="margin:0" id="apWhy"></p>
        <div id="apSum" class="ai" hidden></div>
        <div class="fld"><label for="apCode">Código de 6 números</label><input id="apCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="Pídelo primero" disabled></div>
        <p class="login-err" id="apErr" role="alert"></p>
        <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
          <button class="btn" type="button" id="apX">Cancelar</button>
          <button class="btn" type="button" id="apAsk">Pedir código a Isnel</button>
          <button class="btn pri" type="button" id="apOk" disabled>Confirmar cambio</button>
        </div></div>`;
      document.body.appendChild(box);
      const $ = (x) => box.querySelector("#" + x);
      $("apWhy").textContent = (why || "Las órdenes ya registradas solo se cambian con autorización.") + " A Isnel le llega el código por correo; vence en 15 minutos y solo sirve para este cambio.";
      const close = (err, val) => { box.remove(); err ? reject(err) : resolve(val); };
      $("apX").onclick = () => close(Object.assign(new Error("Cambio cancelado: no se guardó."), { code: "cancelled" }));
      $("apAsk").onclick = async () => {
        $("apAsk").disabled = true; $("apAsk").textContent = "Enviando…"; $("apErr").textContent = "";
        try {
          const r = await call("/approve/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ col, id, data, patch: !!patch }) });
          if (r.notNeeded) { try { close(null, await put()); } catch (e) { close(e); } return; }
          $("apSum").hidden = false; $("apSum").textContent = "Se le envió a Isnel:\n" + (r.summary || "");
          $("apCode").disabled = false; $("apCode").focus(); $("apOk").disabled = false;
          $("apAsk").textContent = "Pedir otro código"; $("apAsk").disabled = false;
        } catch (e) { $("apErr").textContent = e.message || "No se pudo pedir el código."; $("apAsk").disabled = false; $("apAsk").textContent = "Pedir código a Isnel"; }
      };
      const ok = async () => {
        const code = $("apCode").value.replace(/\D/g, "");
        if (code.length !== 6) { $("apErr").textContent = "Escribe los 6 números."; return; }
        $("apOk").disabled = true; $("apOk").textContent = "Guardando…";
        try { close(null, await put(code)); }
        catch (e) { $("apErr").textContent = e.message || "No se pudo guardar."; $("apOk").disabled = false; $("apOk").textContent = "Confirmar cambio"; }
      };
      $("apOk").onclick = ok;
      $("apCode").addEventListener("keydown", (e) => { if (e.key === "Enter") ok(); });
    });
  }

  // ---------------- IA ----------------
  const blobToB64 = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = rej; r.readAsDataURL(b); });
  async function ask(input, opts = {}, json) {
    const prompt = Array.isArray(input) ? input.map((m) => (m.role === "user" ? "" : "Asistente: ") + m.content).join("\n\n") : String(input);
    const images = [];
    for (const b of opts.images || []) if (b && b.type && /^image\//.test(b.type)) images.push({ type: b.type, data: await blobToB64(b) });
    const r = await call("/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt, tier: opts.modelTier === "quick" ? "quick" : "default", images, json: !!json }) });
    if (opts.onText) try { opts.onText({ text: r.text, delta: r.text }); } catch (e) {}
    return r.text;
  }
  const sample = async (input, opts) => ({ text: await ask(input, opts, false), truncated: false });
  sample.json = async (input, opts) => {
    const t = await ask(input, opts, true);
    const s = t.replace(/^```(?:json)?\s*|\s*```$/g, "");
    try { return JSON.parse(s); } catch (e) { const m = s.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); throw Object.assign(new Error("Respuesta no válida"), { code: "invalid_output" }); }
  };
  sample.limits = async () => ({ images: true });
  Lion.sample = sample;

  // ---------------- archivos ----------------
  Lion.assets = {
    upload: async (file, opts) => {
      const type = file.type || (opts && opts.type) || "application/pdf";
      return call("/files", { method: "POST", headers: { "content-type": type }, body: file });
    },
  };
  Lion.fetchFile = (id) => call("/files/" + encodeURIComponent(id), { response: true });
  const blobUrls = {};
  Lion.hydrateBlobs = (root) => {
    (root || document).querySelectorAll("img[data-blob]").forEach(async (img) => {
      const id = img.dataset.blob;
      if (!blobUrls[id]) blobUrls[id] = Lion.fetchFile(id).then((r) => (r.ok ? r.blob() : null)).then((b) => (b ? URL.createObjectURL(b) : null)).catch(() => null);
      const u = await blobUrls[id];
      if (u) img.src = u;
    });
  };

  // ---------------- correo a Isnel ----------------
  Lion.mcp = {
    callTool: async (server, tool, input) => {
      if (server !== "Gmail" || tool !== "send_message") throw Object.assign(new Error("No disponible"), { code: "not_in_manifest" });
      return call("/notify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subject: input.subject, body: input.body }) });
    },
  };
})();
