(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  $("f").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    $("e").textContent = "";
    if ($("p").value !== $("p2").value) { $("e").textContent = "Las contraseñas no coinciden."; return; }
    $("b").disabled = true;
    try {
      const r = await fetch((window.LION_API || "api") + "/setup", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: $("n").value.trim(), token: $("t").value.trim(), password: $("p").value }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((d.error && d.error.message) || d.message || "No se pudo crear.");
      $("f").innerHTML = '<h1>Listo ✅</h1><p class="muted">Ya puedes entrar al portal con tu contraseña.</p><a class="btn pri" href="./">Ir al portal</a>';
    } catch (err) { $("e").textContent = err.message; $("b").disabled = false; }
  });
})();
