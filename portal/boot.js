// Arranque: entrada con contraseña → portal del colaborador o panel del administrador.
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const show = (id) => ["login", "adminApp", "portalApp"].forEach((x) => ($(x).hidden = x !== id));

  // Dirección de una empresa (/portal/gaby-flowers/): la entrada muestra su nombre
  if (Lion.portalSlug) Lion.call("/portal-info?p=" + encodeURIComponent(Lion.portalSlug), { raw: true }).then((r) => {
    const h = document.querySelector("#loginForm h1"); if (h) h.textContent = r.title;
    document.title = r.title;
  }).catch(() => {});
  function loginScreen(msg) {
    show("login");
    $("loginErr").textContent = msg || "";
    setTimeout(() => $("pw").focus(), 30);
  }
  Lion.onAuthLost = () => { location.hash = ""; loginScreen("Tu sesión terminó. Vuelve a entrar."); };

  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("loginBtn");
    btn.disabled = true; btn.textContent = "Entrando…"; $("loginErr").textContent = "";
    try { await Lion.login($("pw").value); location.reload(); }
    catch (err) { $("loginErr").textContent = err.message || "No se pudo entrar."; btn.disabled = false; btn.textContent = "Entrar"; $("pw").select(); }
  });

  function startPortalFor(worker, asAdmin) {
    const cfg = worker.config;
    document.title = cfg.portalTitle || "Portal Lion";
    $("ptTitle").textContent = cfg.portalTitle || ("Portal de " + (cfg.shortName || worker.name));
    const who = document.getElementById("ptWho");
    if (who) who.textContent = cfg.__memberName ? cfg.__memberName : (asAdmin ? "Vista de admin" : "");
    $("tzLbl").textContent = "Hora " + (cfg.tzLabel || "");
    $("logoutBtn").onclick = () => Lion.logout();
    if (asAdmin) {
      const bar = $("adminBar");
      bar.hidden = false;
      bar.innerHTML = "";
      const t = document.createElement("span");
      t.textContent = "Admin · viendo " + (worker.config.portalTitle || worker.name) + (worker.config.__memberName ? " como " + worker.config.__memberName : "") + ". Lo que hagas aquí queda registrado a tu nombre.";
      const b = document.createElement("button");
      b.className = "btn sm"; b.type = "button"; b.textContent = "← Volver al panel";
      b.onclick = () => Lion.view(null);
      bar.append(b, t);
    }
    show("portalApp");
    window.startPortal(cfg, Lion);
  }

  async function boot() {
    if (!Lion.token) return loginScreen();
    let me;
    try { me = (await Lion.call("/me", { raw: true })).me; }
    catch (e) { if (e.status === 401) return; return loginScreen("No hay conexión con el servidor. Revisa tu internet."); }
    Lion.me = me;
    if (me.role === "admin") {
      if (Lion.viewing && Lion.viewing !== me.id) {
        try {
          const v = await Lion.call("/admin/view?w=" + encodeURIComponent(Lion.viewing) + (Lion.viewingMember ? "&m=" + encodeURIComponent(Lion.viewingMember) : ""), { raw: true });
          return startPortalFor({ id: v.portal.id, name: v.portal.name, config: v.config }, true);
        } catch (e) {}
        Lion.view(null);
        return;
      }
      show("adminApp");
      return window.startAdmin(me);
    }
    startPortalFor(me, false);
  }
  boot();
})();
