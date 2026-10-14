"use strict";
/* Red Proyecta Más — versión con cuentas reales (Supabase).
   Las reglas de seguridad viven en la base (RLS + triggers); esta página solo muestra y envía. */

const SB_URL = "https://juruidkvovpydbsnfnwk.supabase.co";
const SB_KEY = "sb_publishable_cJUGcGyuJVlR8OpRs2lPgw_pLqR9txk";
const LINK_ERR = (() => { const h = new URLSearchParams(location.hash.slice(1)); return h.get("error_code") || h.get("error") ? { code: h.get("error_code") || h.get("error"), desc: h.get("error_description") || "" } : null; })();
if (LINK_ERR) history.replaceState(null, "", location.pathname);
const sb = supabase.createClient(SB_URL, SB_KEY);

const WA_NUM = "5493425104877", WA_SHOW = "+54 9 342 510-4877";
const RUBROS = ["Arquitectura","Instalación eléctrica","Instalación sanitaria y gas","Estructuras","Visualización 3D y renders","BIM / Revit","Cómputo y presupuesto","Interiorismo","Relevamiento y regularización","Climatización"];
const TRABAJOS = ["Anteproyecto","Proyecto completo","Documentación técnica","Planos de instalación","Modelado 3D","Renders","Cómputo y presupuesto","Relevamiento","Consulta / asesoramiento"];
const PROVS = ["Buenos Aires","CABA","Catamarca","Chaco","Chubut","Córdoba","Corrientes","Entre Ríos","Formosa","Jujuy","La Pampa","La Rioja","Mendoza","Misiones","Neuquén","Río Negro","Salta","San Juan","San Luis","Santa Cruz","Santa Fe","Santiago del Estero","Tierra del Fuego","Tucumán"];
const TITULOS = ["Arquitecto/a","Ingeniero/a civil","Ingeniero/a electricista","Ingeniero/a mecánico/a","Maestro Mayor de Obras","Técnico/a en construcciones","Diseñador/a de interiores","Modelador/a 3D / renderista","Estudiante avanzado/a"];
const SUGG = ["vivienda","anteproyecto","render","desnivel","Revit","AutoCAD","reforma","local comercial","PH","eléctrico","gas","pileta","steel frame","SIP"];
const TEMPLATE = `Hola, soy [nombre], [título].

Cómo lo encararía:
1. [primera etapa]
2. [segunda etapa]
3. [entrega final]

Qué entrego:
- [plantas, cortes, fachadas, renders…]
- Archivos PDF + DWG

Revisiones incluidas: 2 rondas por etapa
Forma de pago: 30% al inicio, 70% contra entrega

Portfolio: [link]`;
const NOTAS_RAPIDAS = [
  ["Agregar","Mencioná algo específico del proyecto (medidas, desnivel, estilo) para que se note que lo leíste."],
  ["Agregar","Detallá los entregables con cantidades y formatos (láminas, renders, PDF + DWG)."],
  ["Agregar","Aclarar cuántas rondas de revisión incluye el precio."],
  ["Agregar","Sumá la forma de pago: anticipo y saldo."],
  ["Corregir","El plazo es muy corto para el alcance. Dividilo por etapas."],
  ["Corregir","El precio está bajo para lo que entregás. Revisalo con el estimador."],
  ["Sacar","Sacá la parte sobre tu experiencia general; enfocate en este proyecto."],
  ["Agregar","Agregá el link a tu portfolio."]
];

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const num = v => String(v).replace(".", ",");
const ars = v => "$" + Math.round(v).toLocaleString("es-AR");
const ago = d => { const h = (Date.now() - new Date(d)) / 36e5; if (h < 1) return "hace minutos"; if (h < 24) return `hace ${Math.round(h)} h`; const dd = Math.round(h / 24); return dd === 1 ? "hace 1 día" : `hace ${dd} días`; };
const fecha = d => new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
const waLink = (n, t = "") => { let d = String(n || "").replace(/\D/g, ""); if (d.startsWith("54")) d = d.slice(2); if (d.startsWith("9")) d = d.slice(1); return `https://wa.me/549${d}${t ? "?text=" + encodeURIComponent(t) : ""}`; };
const waNico = t => `https://wa.me/${WA_NUM}?text=${encodeURIComponent(t)}`;
const iniciales = n => String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase();
const fotoUrl = path => sb.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
const avatar = (p, cls = "av") => p?.foto ? `<span class="${cls}"><img src="${esc(fotoUrl(p.foto))}" alt=""></span>` : `<span class="${cls}">${esc(iniciales(p?.nombre))}</span>`;
const stars = v => { const r = Math.round(v || 0); return "★".repeat(r) + "☆".repeat(5 - r); };
function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => t.hidden = true, 3200); }
function fill(sel, arr, keep) { const el = $(sel); if (!el) return; if (!keep) el.innerHTML = ""; arr.forEach(v => el.insertAdjacentHTML("beforeend", `<option>${esc(v)}</option>`)); }
function errMsg(e) {
  const m = String(e?.message || e || "");
  const map = [
    [/Invalid login credentials/i, "El email o la contraseña no coinciden."],
    [/Email not confirmed/i, "Todavía no confirmaste tu email. Buscá el mail que te mandamos (fijate en spam)."],
    [/User already registered/i, "Ya hay una cuenta con ese email. Probá ingresar o recuperar la contraseña."],
    [/Password should be/i, "La contraseña tiene que tener al menos 8 caracteres."],
    [/rate limit/i, "Hiciste muchos intentos seguidos. Esperá unos minutos y probá de nuevo."],
    [/cupo completo/i, "El proyecto ya recibió todas las propuestas que pidió."],
    [/no recibe propuestas/i, "Este proyecto ya no recibe propuestas."],
    [/esperá la revisión/i, "Tu propuesta está en revisión; la vas a poder enviar cuando vuelva."],
    [/duplicate key.*propuestas/i, "Ya mandaste una propuesta para este proyecto."],
    [/duplicate key.*reservas/i, "Ese turno se acaba de ocupar. Elegí otro."],
    [/row-level security/i, "No tenés permiso para hacer esto con tu tipo de cuenta."],
    [/Failed to fetch|NetworkError/i, "No hay conexión. Revisá internet y probá de nuevo."]
  ];
  for (const [re, t] of map) if (re.test(m)) return t;
  return m.length < 160 ? m : "Algo salió mal. Probá de nuevo en un momento.";
}
async function q(promise) { const { data, error } = await promise; if (error) throw error; return data; }
function busy(btn, on, txt) { if (!btn) return; if (on) { btn._t = btn.textContent; btn.disabled = true; btn.textContent = txt || "Guardando…"; } else { btn.disabled = false; if (btn._t) btn.textContent = btn._t; } }
function dialogo(html, id = "dlg") { const d = $("#" + id); $(id === "dlg" ? "#dlbody" : "#authbody").innerHTML = html; if (!d.open) d.showModal(); d.scrollTop = 0; $$("[data-close]", d).forEach(b => b.onclick = () => d.close()); return d; }
const cerrarX = `<button class="x" data-close aria-label="Cerrar">✕</button>`;
/* Los diálogos solo se cierran con la X (o Cancelar): tocar afuera o Esc no borra lo escrito. */
$$("dialog").forEach(d => d.addEventListener("cancel", e => e.preventDefault()));

/* ---------- estado ---------- */
const S = { user: null, me: null, contacto: null, proyectos: [], cfg: null, honor: [] };
const rol = () => S.me?.rol || null;
const esAdmin = () => rol() === "admin";
const esPro = () => rol() === "pro" || esAdmin();
const esCli = () => rol() === "cli" || esAdmin();

/* ---------- sesión ---------- */
async function cargarYo() {
  const { data: { session } } = await sb.auth.getSession();
  S.user = session?.user || null;
  S.me = S.contacto = null;
  if (S.user) {
    const [p, c] = await Promise.all([
      sb.from("perfiles").select("*").eq("id", S.user.id).maybeSingle(),
      sb.from("perfiles_contacto").select("*").eq("id", S.user.id).maybeSingle()
    ]);
    S.me = p.data; S.contacto = c.data;
  }
  pintarSesion();
}
function pintarSesion() {
  const r = rol();
  $$("[data-when]").forEach(el => {
    const w = el.dataset.when.split(" ");
    el.hidden = !(w.includes("guest") ? !S.user : S.user && (w.includes("user") || w.includes(r)));
  });
  $$(".pro-only").forEach(el => el.hidden = !esPro());
  $$(".pub-only").forEach(el => el.hidden = esPro());
  if (S.me) { $("#uav").innerHTML = S.me.foto ? `<img src="${esc(fotoUrl(S.me.foto))}" alt="">` : esc(iniciales(S.me.nombre)); $("#uname").textContent = S.me.nombre.split(" ")[0]; $("#urol").textContent = { pro: "Profesional", cli: "Cliente", admin: "Admin" }[r]; }
}
let listo = false, uidPrevio;
/* Nada de llamadas a Supabase dentro del aviso de sesión: se difieren para no trabar el cliente. */
sb.auth.onAuthStateChange((ev, session) => {
  if (ev === "PASSWORD_RECOVERY") { setTimeout(nuevaClave, 0); return; }
  const uid = session?.user?.id || null;
  if (!listo || uid === uidPrevio) return;
  uidPrevio = uid;
  setTimeout(async () => { await cargarYo(); router(); vigilarNotif(); if (uid) { tutoAuto(); agendaSiPro(); } }, 0);
});
$("#logout").onclick = async () => { await sb.auth.signOut(); location.hash = ""; toast("Cerraste sesión"); };
$("#umbtn").onclick = e => { e.stopPropagation(); const l = $("#umlist"); l.hidden = !l.hidden; $("#umbtn").setAttribute("aria-expanded", String(!l.hidden)); };
document.addEventListener("click", () => { $("#umlist").hidden = true; });

function abrirIngreso(msg) {
  const draw = (modo = "in", info = "") => {
    dialogo(`<div class="dlhead"><div><div class="eyebrow">Red Proyecta Más</div><h2 id="auth-title" style="margin-top:4px">${modo === "in" ? "Ingresar" : "Recuperar contraseña"}</h2></div>${cerrarX}</div>
      ${msg ? `<div class="note">${esc(msg)}</div>` : ""}${info}
      <form id="lf" class="authf">
        <label class="f">Email<input type="email" id="l-email" required autocomplete="email"></label>
        ${modo === "in" ? `<label class="f">Contraseña<input type="password" id="l-pass" required autocomplete="current-password"></label>` : ""}
        <div class="formerr" id="lerr" hidden></div>
        <button class="btn" type="submit">${modo === "in" ? "Ingresar" : "Mandarme el link"}</button>
      </form>
      <p class="fine" style="margin:0">${modo === "in" ? `<button type="button" class="linkbtn" id="lforgot">Olvidé mi contraseña</button> · ¿No tenés cuenta? <a href="#registro" data-close>Crear cuenta</a>` : `<button type="button" class="linkbtn" id="lback">Volver a ingresar</button>`}</p>`, "auth");
    if ($("#lforgot")) $("#lforgot").onclick = () => draw("rec");
    if ($("#lback")) $("#lback").onclick = () => draw("in");
    $("#lf").onsubmit = async e => {
      e.preventDefault(); const b = $("#lf button[type=submit]"); busy(b, true, "Un momento…"); $("#lerr").hidden = true;
      try {
        if (modo === "in") {
          await q(sb.auth.signInWithPassword({ email: $("#l-email").value.trim(), password: $("#l-pass").value }));
          $("#auth").close(); toast("¡Hola de nuevo!");
        } else {
          await q(sb.auth.resetPasswordForEmail($("#l-email").value.trim(), { redirectTo: location.origin + location.pathname }));
          draw("in", `<div class="okbox">Si hay una cuenta con ese email, te llega un link para elegir una contraseña nueva.</div>`);
        }
      } catch (er) {
        $("#lerr").innerHTML = esc(errMsg(er)) + (/not confirmed/i.test(er?.message || "") ? ` <button type="button" class="linkbtn" id="lresend">Mandarme otro link de activación</button>` : "");
        $("#lerr").hidden = false; busy(b, false);
        if ($("#lresend")) $("#lresend").onclick = () => reenviarActivacion($("#l-email").value.trim());
      }
    };
  };
  draw();
}
function reenviarActivacion(emailPrevio, titulo) {
  dialogo(`<div class="dlhead"><div><div class="eyebrow">Activar cuenta</div><h2 id="auth-title" style="margin-top:4px">${titulo || "Te mandamos otro link"}</h2></div>${cerrarX}</div>
    <p style="margin:0">Escribí tu email y te mandamos un link nuevo para activar la cuenta. Usá siempre el <b>último</b> mail que te llegue. Si ya la activaste, <button type="button" class="linkbtn" id="rs-in">ingresá directamente</button>.</p>
    <form id="rsf" class="authf"><label class="f">Email<input type="email" id="rs-email" required autocomplete="email" value="${esc(emailPrevio || "")}"></label>
    <div class="formerr" id="rserr" hidden></div><button class="btn" type="submit">Mandarme el link</button></form>`, "auth");
  $("#rs-in").onclick = () => abrirIngreso();
  $("#rsf").onsubmit = async e => {
    e.preventDefault(); const b = $("#rsf button"); busy(b, true, "Enviando…"); $("#rserr").hidden = true;
    try {
      await q(sb.auth.resend({ type: "signup", email: $("#rs-email").value.trim(), options: { emailRedirectTo: location.origin + location.pathname } }));
      $("#rsf").outerHTML = `<div class="okbox">Listo. Revisá tu correo (y la carpeta de spam) y tocá el botón del mail más nuevo.</div>`;
    } catch (er) { $("#rserr").textContent = errMsg(er); $("#rserr").hidden = false; busy(b, false); }
  };
}
function nuevaClave() {
  dialogo(`<div class="dlhead"><div><h2 id="auth-title">Elegí tu contraseña nueva</h2></div>${cerrarX}</div>
    <form id="nc" class="authf"><label class="f">Contraseña nueva <small>Mínimo 8 caracteres</small><input type="password" id="nc-p" minlength="8" required autocomplete="new-password"></label>
    <div class="formerr" id="ncerr" hidden></div><button class="btn" type="submit">Guardar</button></form>`, "auth");
  $("#nc").onsubmit = async e => {
    e.preventDefault();
    try { await q(sb.auth.updateUser({ password: $("#nc-p").value })); $("#auth").close(); toast("Contraseña actualizada"); }
    catch (er) { $("#ncerr").textContent = errMsg(er); $("#ncerr").hidden = false; }
  };
}
$$("[data-auth]").forEach(b => b.addEventListener("click", () => b.dataset.auth === "in" ? abrirIngreso() : (location.hash = "registro")));

/* ---------- registro ---------- */
let regRol = "cli";
function pintarRegistro(r) {
  regRol = r;
  $$("#v-registro .role").forEach(b => b.classList.toggle("on", b.dataset.rol === r));
  $$("#v-registro [data-only]").forEach(el => el.hidden = el.dataset.only !== r);
  $("#r-nombre-l").textContent = r === "pro" ? "Nombre y apellido" : "Nombre o razón social";
}
$$("#v-registro .role").forEach(b => b.onclick = () => pintarRegistro(b.dataset.rol));
$("#regform").onsubmit = async e => {
  e.preventDefault();
  const err = $("#regerr"); err.hidden = true;
  const v = id => $(id).value.trim();
  if (regRol === "pro" && !$("#r-decl").checked) { err.textContent = "Confirmá que te registrás como persona independiente."; err.hidden = false; return; }
  if (v("#r-wa").replace(/\D/g, "").length < 8) { err.textContent = "Escribí tu WhatsApp con característica, por ejemplo 341 555-0101."; err.hidden = false; return; }
  const meta = { rol: regRol, nombre: v("#r-nombre"), whatsapp: v("#r-wa"), provincia: v("#r-prov"), localidad: v("#r-loc") };
  if (regRol === "cli") Object.assign(meta, { tipo_cliente: $("input[name=r-tipo]:checked").value, contacto: v("#r-contacto"), cuit: v("#r-cuit") });
  else Object.assign(meta, { titulo: v("#r-titulo"), egreso: v("#r-egreso"), matricula: v("#r-mat"), especialidades: v("#r-esp"), portfolio: v("#r-port") });
  const b = $("#regsend"); busy(b, true, "Creando cuenta…");
  try {
    const data = await q(sb.auth.signUp({ email: v("#r-email"), password: $("#r-pass").value, options: { data: meta, emailRedirectTo: location.origin + location.pathname } }));
    if (data.session) { toast("¡Cuenta creada!"); location.hash = regRol === "pro" ? "kit" : "publicar"; }
    else {
      $("#regform").innerHTML = `<div><div class="eyebrow">Último paso</div><h1>Revisá tu email</h1></div>
        <p>Te mandamos un mail a <b>${esc(v("#r-email"))}</b> con un link para activar tu cuenta. Si no lo ves en unos minutos, fijate en <b>spam</b> o <b>promociones</b>.</p>
        <div class="note">Después de activarla, ingresás con tu email y contraseña.</div>`;
    }
  } catch (er) { err.textContent = errMsg(er); err.hidden = false; busy(b, false); }
};

/* ---------- router ---------- */
const VISTAS = ["inicio", "profesionales", "servicios", "publicar", "registro", "mis-proyectos", "mis-propuestas", "mis-servicios", "perfil", "panel"];
const SECCIONES = { proyectos: "proyectos", estimador: "estimador", herramientas: "beneficios", kit: "primer-cliente", respaldo: "respaldo", camino: "camino" };
function mostrar(v) { $$(".view").forEach(x => x.hidden = x.id !== "v-" + v); }
async function router() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (h.startsWith("proyecto-")) { mostrar("inicio"); const pid = h.slice(9); return pid.startsWith("ej") ? abrirEjemplo(pid) : abrirProyecto(+pid); }
  if (h.startsWith("pro-")) { mostrar("profesionales"); cargarProfesionales(); return abrirPerfil(h.slice(4)); }
  if (h === "admin") { location.hash = "panel"; return; }
  if (SECCIONES[h]) {
    mostrar("inicio");
    if ((h === "kit" || h === "respaldo" || h === "camino" || h === "estimador") && !esPro()) { location.hash = "registro"; pintarRegistro("pro"); return; }
    requestAnimationFrame(() => document.getElementById(SECCIONES[h])?.scrollIntoView({ behavior: "smooth" }));
    return;
  }
  const v = VISTAS.includes(h) ? h : "inicio";
  const necesita = { "mis-proyectos": "cli", "mis-propuestas": "pro", "mis-servicios": "pro", perfil: "user", panel: "admin", publicar: "cli" }[v];
  if (necesita && !S.user) { mostrar("inicio"); return abrirIngreso(v === "publicar" ? "Para publicar un proyecto, ingresá o creá tu cuenta gratis." : "Ingresá para ver esta sección."); }
  if (necesita === "cli" && !esCli()) { mostrar("inicio"); toast(v === "publicar" ? "Las cuentas de profesional no publican proyectos. Usá una cuenta de cliente." : "Esta sección es para quienes publican proyectos."); return; }
  if (necesita === "pro" && !esPro()) { mostrar("inicio"); toast("Esta sección es para profesionales."); return; }
  if (necesita === "admin" && !esAdmin()) { mostrar("inicio"); return; }
  mostrar(v);
  window.scrollTo(0, 0);
  ({ inicio: () => {}, profesionales: cargarProfesionales, servicios: cargarServicios, publicar: prepPublicar, registro: () => S.user ? (location.hash = "") : null,
     "mis-proyectos": misProyectos, "mis-propuestas": misPropuestas, "mis-servicios": misServicios, perfil: miPerfil, panel: panel })[v]?.();
}
addEventListener("hashchange", router);
document.addEventListener("click", e => {
  const b = e.target.closest("[data-view]"); if (!b) return;
  e.preventDefault(); const v = b.dataset.view; if (v === "registro") pintarRegistro("pro"); location.hash = v;
});

/* ---------- tablero ---------- */
async function cargarProyectos() {
  try {
    S.proyectos = await q(sb.from("proyectos").select("*, owner_p:perfiles!proyectos_owner_fkey(nombre,tipo_cliente), preguntas(count)")
      .eq("origen", "publicado").in("estado", ["abierto", "completo"]).order("created_at", { ascending: false }).limit(200));
  } catch (er) { $("#grid").innerHTML = `<div class="empty">No pudimos cargar los proyectos. ${esc(errMsg(er))}</div>`; return; }
  pintarTablero();
}
function estadoPill(p) {
  if (p.estado === "completo") return `<span class="pill full">Cupo completo</span>`;
  if (p.estado === "en_curso") return `<span class="pill pm">En curso</span>`;
  if (p.estado === "entregado") return `<span class="pill done">Entregado</span>`;
  if (p.estado === "cerrado") return `<span class="pill full">Cerrado</span>`;
  if (p.reabierto) return `<span class="pill open">Cupos reabiertos</span>`;
  return `<span class="pill open">Abierto</span>`;
}
function cupo(p) { const n = Math.min(p.max_propuestas, 20), on = Math.round(p.propuestas_enviadas / p.max_propuestas * n); let h = ""; for (let i = 0; i < n; i++) h += `<i class="${i < on ? "on" : ""}"></i>`; return h; }
function specs(p) { const s = []; if (p.frente && p.fondo) s.push(`${num(p.frente)} × ${num(p.fondo)} m`); if (p.superficie) s.push(`${num(p.superficie)} m²`); if (p.particularidad) s.push(esc(p.particularidad)); return s.map(x => `<span>${x}</span>`).join(""); }
function pintarTablero() {
  const qq = $("#q").value.trim().toLowerCase(), r = $("#f-rubro").value, pv = $("#f-prov").value, cu = $("#f-cupo").value;
  const list = [...S.proyectos, ...(window.EJEMPLOS || [])].filter(p => (!qq || (p.titulo + p.descripcion + p.etiquetas.join(" ") + p.localidad).toLowerCase().includes(qq)) && (!r || p.rubro === r) && (!pv || p.provincia === pv) && (!cu || (cu === "libre" ? p.estado === "abierto" : p.estado === "completo")));
  $("#grid").innerHTML = list.length ? list.map(p => `
   <article class="card" tabindex="0" data-id="${p.id}" role="button" aria-label="Ver ${esc(p.titulo)}${p.ejemplo ? " (ejemplo)" : ""}">
    ${p.ejemplo ? '<span class="stamp">EJEMPLO</span>' : ""}
    <div class="cbody">
     <div class="meta">${estadoPill(p)}</div>
     <h3>${esc(p.titulo)}</h3>
     <p>${esc(p.descripcion)}</p>
     <div class="specs">${specs(p)}</div>
     <div class="tags">${p.etiquetas.map(t => `<span class="tag">#${esc(t)}</span>`).join("")}</div>
     <div class="meta">${esc(p.owner_p?.tipo_cliente || "Particular")} · ${esc(p.modalidad)} · publicado ${ago(p.created_at)}</div>
    </div>
    <div class="rotulo">
     <div><small>Trabajo</small><b>${esc(p.trabajo)}</b></div>
     <div><small>Ubicación</small><b>${esc(p.localidad)}</b></div>
     <div><small>Propuestas ${p.propuestas_enviadas}/${p.max_propuestas}</small><div class="cupo">${cupo(p)}</div></div>
    </div>
   </article>`).join("") : `<div class="empty">No hay proyectos con esos filtros.</div>`;
}
$("#grid").addEventListener("click", e => { const c = e.target.closest(".card"); if (c) location.hash = "proyecto-" + c.dataset.id; });
$("#grid").addEventListener("keydown", e => { if (e.key === "Enter" && e.target.classList.contains("card")) location.hash = "proyecto-" + e.target.dataset.id; });
["#q", "#f-rubro", "#f-prov", "#f-cupo"].forEach(s => $(s).addEventListener("input", pintarTablero));
$("#dlg").addEventListener("close", () => { if (location.hash.startsWith("#proyecto-") || location.hash.startsWith("#pro-")) history.replaceState(null, "", location.pathname + (location.hash.startsWith("#pro-") ? "#profesionales" : "#proyectos")); });

/* ---------- ficha de proyecto ---------- */
async function abrirProyecto(id) {
  dialogo(`<div class="dlhead"><div class="muted">Cargando…</div>${cerrarX}</div>`);
  let p, preguntas, mia = null;
  try {
    p = await q(sb.from("proyectos").select("*, owner_p:perfiles!proyectos_owner_fkey(nombre,tipo_cliente)").eq("id", id).maybeSingle());
    if (!p) { dialogo(`<div class="dlhead"><h2>Este proyecto no existe o fue cerrado.</h2>${cerrarX}</div>`); return; }
    preguntas = await q(sb.from("preguntas").select("*, autor_p:perfiles!preguntas_autor_fkey(nombre)").eq("proyecto_id", id).order("created_at"));
    if (S.user && esPro()) mia = (await q(sb.from("propuestas").select("*").eq("proyecto_id", id).eq("pro", S.user.id))).at(0) || null;
  } catch (er) { dialogo(`<div class="dlhead"><h2>No pudimos abrir el proyecto</h2>${cerrarX}</div><p>${esc(errMsg(er))}</p>`); return; }
  const owner = S.user && p.owner === S.user.id;
  const ficha = [["Frente", p.frente ? num(p.frente) + " m" : "—"], ["Fondo", p.fondo ? num(p.fondo) + " m" : "—"], ["Superficie", p.superficie ? num(p.superficie) + " m²" : "—"], ["Particularidad", p.particularidad || "—"], ["Plazo", p.plazo || "—"], ["Presupuesto", p.presupuesto || "No indicado"]];
  const qa = preguntas.map(x => `<div class="q">${esc(x.pregunta)} <small class="muted">· ${esc(x.autor_p?.nombre?.split(" ")[0] || "")}</small>
      <div class="a">${x.respuesta ? `<b>Respuesta:</b> ${esc(x.respuesta)}` : owner ? `<form class="inline resp" data-q="${x.id}" style="margin-top:6px"><input required maxlength="1000" placeholder="Tu respuesta (solo la ve quien preguntó)"><button class="btn o sm">Responder</button></form>` : "Esperando respuesta de quien publicó"}</div></div>`).join("");
  let accion = "";
  if (!S.user) accion = `<div class="pmbox"><b>¿Sos profesional?</b><span>Ingresá o creá tu cuenta gratis para preguntar y enviar tu propuesta.</span><div class="inline"><a class="btn y sm" href="#registro" data-close>Crear cuenta</a><button class="btn o sm" id="dl-in">Ingresar</button></div></div>`;
  else if (owner) accion = `<div class="note">Es tu proyecto. Las propuestas te llegan en <a href="#mis-proyectos" data-close>Mis proyectos</a>.</div>
      ${["abierto", "completo"].includes(p.estado) ? `<div><button type="button" class="btn o sm" id="editp">Editar proyecto</button></div>` : ""}
      ${p.estado === "completo" ? `<div class="reopen"><b>Recibiste las ${p.max_propuestas} propuestas que pediste</b><span>¿No te convenció ninguna? Reabrí el proyecto para recibir más. Las que ya tenés se mantienen.</span>
      <div class="inline"><select id="reo" aria-label="Cupos a sumar"><option value="3">3 cupos más</option><option value="5" selected>5 cupos más</option><option value="10">10 cupos más</option></select><button type="button" class="btn sm" id="reobtn">Reabrir cupos</button></div></div>` : ""}`;
  else if (!esPro()) accion = `<div class="note">Solo los profesionales pueden enviar propuestas.</div>`;
  else if (mia) accion = `<div class="box"><h5>Tu propuesta</h5><div class="meta">${estadoProp(mia.estado)}</div><p class="fine" style="margin:0">Seguila en <a href="#mis-propuestas" data-close>Mis propuestas</a>.</p></div>`;
  else if (p.estado !== "abierto") accion = `<div class="note">Este proyecto ya no recibe propuestas.</div>`;
  else accion = formPropuesta(p);

  dialogo(`
   <div class="dlhead"><div class="meta">${estadoPill(p)}</div>${cerrarX}</div>
   <div><div class="meta" style="margin-bottom:6px">${esc(p.owner_p?.tipo_cliente || "Particular")} · ${esc(p.localidad)}, ${esc(p.provincia)} · ${esc(p.modalidad)} · publicado ${ago(p.created_at)}</div><h2 id="dl-title">${esc(p.titulo)}</h2>
   <div class="meta" style="margin-top:6px"><span id="dl-rep"></span></div></div>
   <div class="meta"><span class="pill">${esc(p.rubro)}</span><span class="pill">${esc(p.trabajo)}</span>${p.etiquetas.map(t => `<span class="pill">#${esc(t)}</span>`).join("")}</div>
   <div><h4>Descripción</h4><p style="margin:0;max-width:65ch;white-space:pre-line">${esc(p.descripcion)}</p>${p.entregables ? `<p style="margin:8px 0 0;max-width:65ch"><b>Entregables:</b> ${esc(p.entregables)}</p>` : ""}</div>
   <div><h4>Ficha del terreno</h4><div class="sheet">${ficha.map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join("")}</div></div>
   <div><h4>Propuestas</h4><div class="meta">${p.propuestas_enviadas} de ${p.max_propuestas} recibidas<div class="cupo" style="flex:1;max-width:240px">${cupo(p)}</div></div></div>
   ${owner || (S.user && esPro()) ? `<div><h4>${owner ? `Consultas recibidas (${preguntas.length})` : `Tus consultas (${preguntas.length})`}</h4>
    <p class="fine" style="margin:0 0 8px">${owner ? "Solo las ven vos y quien pregunta. Si te preguntan lo mismo varias veces, sumá ese dato al proyecto con <b>Editar proyecto</b>." : "Solo las ven vos y quien publicó."}</p>
    <div class="qa">${qa || `<div class="note">${owner ? "Todavía no te hicieron consultas." : "No hiciste consultas sobre este proyecto."}</div>`}</div>
    ${S.user && esPro() && !owner && p.estado === "abierto" ? `<form class="inline" id="qform" style="margin-top:10px"><input id="qin" required minlength="3" maxlength="500" placeholder="¿Hay plano de mensura? ¿Qué software preferís?" aria-label="Tu consulta"><button class="btn o sm" type="submit">Consultar</button></form>` : ""}</div>` : ""}
   <div>${accion}</div>`);

  sb.rpc("indicadores", { p_perfiles: [p.owner] }).then(({ data }) => { const r = data?.[0]; if (r && $("#dl-rep")) $("#dl-rep").innerHTML = repHTML(r, "Quien publica"); });
  if ($("#dl-in")) $("#dl-in").onclick = () => { $("#dlg").close(); abrirIngreso(); };
  if ($("#qform")) $("#qform").onsubmit = async e => {
    e.preventDefault();
    try { await q(sb.from("preguntas").insert({ proyecto_id: id, autor: S.user.id, pregunta: $("#qin").value.trim() })); toast("Consulta enviada. Le avisamos a quien publicó."); abrirProyecto(id); }
    catch (er) { toast(errMsg(er)); }
  };
  $$(".resp").forEach(f => f.onsubmit = async e => {
    e.preventDefault();
    try { await q(sb.from("preguntas").update({ respuesta: $("input", f).value.trim() }).eq("id", +f.dataset.q)); toast("Respuesta publicada"); abrirProyecto(id); }
    catch (er) { toast(errMsg(er)); }
  });
  if ($("#editp")) $("#editp").onclick = () => editarProyecto(p);
  if ($("#reobtn")) $("#reobtn").onclick = async () => {
    try { await q(sb.rpc("reabrir_cupos", { p_proyecto: id, p_extra: +$("#reo").value })); toast("Cupos reabiertos"); cargarProyectos(); abrirProyecto(id); }
    catch (er) { toast(errMsg(er)); }
  };
  if ($("#pform")) bindPropuesta(p);
}
/* editar un proyecto publicado (solo el dueño) */
function editarProyecto(p) {
  const v = x => esc(x ?? "");
  dialogo(`<div class="dlhead"><div><div class="eyebrow">Tu proyecto</div><h2 id="dl-title" style="margin-top:4px">Editar proyecto</h2></div>${cerrarX}</div>
    <p class="fine" style="margin:0">Sumá lo que te consultan seguido, así los profesionales lo ven sin tener que preguntar. El rubro, el tipo de trabajo y la ubicación no se cambian.</p>
    <form id="epf" style="display:grid;gap:12px">
      <label class="f">Título<input name="titulo" required minlength="5" maxlength="120" value="${v(p.titulo)}"></label>
      <label class="f">Descripción<textarea name="descripcion" required maxlength="4000" style="min-height:140px">${v(p.descripcion)}</textarea></label>
      <label class="f">Entregables esperados<input name="entregables" maxlength="400" value="${v(p.entregables)}"></label>
      <div class="row"><label class="f">Frente (m)<input name="frente" type="number" step="0.01" min="0" value="${v(p.frente)}"></label><label class="f">Fondo (m)<input name="fondo" type="number" step="0.01" min="0" value="${v(p.fondo)}"></label><label class="f">Sup. (m²)<input name="superficie" type="number" step="1" min="0" value="${v(p.superficie)}"></label></div>
      <label class="f">Desnivel u otra particularidad<input name="particularidad" maxlength="200" value="${v(p.particularidad)}"></label>
      <div class="row"><label class="f">Plazo<input name="plazo" maxlength="60" value="${v(p.plazo)}"></label><label class="f">Presupuesto<input name="presupuesto" maxlength="60" value="${v(p.presupuesto)}"></label></div>
      <label class="f">Etiquetas <small>Separadas por coma</small><input name="etiquetas" maxlength="300" value="${v(p.etiquetas.join(", "))}"></label>
      <div class="formerr" id="eperr" hidden></div>
      <div class="inline"><button class="btn" type="submit">Guardar cambios</button><button type="button" class="btn o" id="epcancel">Cancelar</button></div>
    </form>`);
  $("#epcancel").onclick = () => abrirProyecto(p.id);
  $("#epf").onsubmit = async e => {
    e.preventDefault(); const f = e.target; const n = x => x.value === "" ? null : +x.value;
    const row = { titulo: f.titulo.value.trim(), descripcion: f.descripcion.value.trim(), entregables: f.entregables.value.trim() || null,
      frente: n(f.frente), fondo: n(f.fondo), superficie: n(f.superficie), particularidad: f.particularidad.value.trim() || null,
      plazo: f.plazo.value.trim() || null, presupuesto: f.presupuesto.value.trim() || null,
      etiquetas: f.etiquetas.value.split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean).slice(0, 8) };
    try { await q(sb.from("proyectos").update(row).eq("id", p.id)); toast("Proyecto actualizado"); await cargarProyectos(); abrirProyecto(p.id); }
    catch (er) { $("#eperr").textContent = errMsg(er); $("#eperr").hidden = false; }
  };
}

/* ficha de un proyecto de ejemplo: solo lectura */
function abrirEjemplo(id) {
  const p = (window.EJEMPLOS || []).find(x => x.id === id);
  if (!p) { location.hash = "proyectos"; return; }
  const ficha = [["Frente", p.frente ? num(p.frente) + " m" : "—"], ["Fondo", p.fondo ? num(p.fondo) + " m" : "—"], ["Superficie", p.superficie ? num(p.superficie) + " m²" : "—"], ["Particularidad", p.particularidad || "—"], ["Plazo", p.plazo || "—"], ["Presupuesto", p.presupuesto || "No indicado"]];
  const props = p.props.filter(x => !x.soloPro || esPro());
  const pie = esPro()
    ? `<div class="note">Es un proyecto de ejemplo: no recibe propuestas. Te sirve para ver cómo se arma una buena propuesta. Los proyectos reales están en el tablero sin el sello.</div>`
    : `<div class="pmbox"><b>Así se ve un proyecto bien publicado</b><span>Con medidas, qué tenés hecho y qué esperás recibir, te llegan propuestas más precisas.</span><div class="inline"><a class="btn y sm" href="#publicar" data-close>Publicar mi proyecto</a></div></div>`;
  dialogo(`
   <div class="dlhead"><div class="meta"><span class="pill" style="border:1.5px solid var(--blue);background:transparent;color:var(--blue)">EJEMPLO</span>${estadoPill(p)}</div>${cerrarX}</div>
   <div><div class="meta" style="margin-bottom:6px">${esc(p.owner_p.tipo_cliente)} · ${esc(p.localidad)}, ${esc(p.provincia)} · ${esc(p.modalidad)}</div><h2 id="dl-title">${esc(p.titulo)}</h2></div>
   <div class="meta"><span class="pill">${esc(p.rubro)}</span><span class="pill">${esc(p.trabajo)}</span>${p.etiquetas.map(t => `<span class="pill">#${esc(t)}</span>`).join("")}</div>
   <div><h4>Descripción</h4><p style="margin:0;max-width:65ch;white-space:pre-line">${esc(p.descripcion)}</p>${p.entregables ? `<p style="margin:8px 0 0;max-width:65ch"><b>Entregables:</b> ${esc(p.entregables)}</p>` : ""}</div>
   <div><h4>Ficha del terreno</h4><div class="sheet">${ficha.map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join("")}</div></div>
   <div><h4>Propuestas</h4><div class="meta">${p.propuestas_enviadas} de ${p.max_propuestas} recibidas<div class="cupo" style="flex:1;max-width:240px">${cupo(p)}</div></div></div>
   <div><h4>Consultas (${p.qa.length})</h4><div class="qa">${p.qa.map(x => `<div class="q">${esc(x.q)}<div class="a"><b>Respuesta:</b> ${esc(x.a)}</div></div>`).join("") || '<div class="note">Nadie preguntó todavía.</div>'}</div></div>
   ${props.length ? `<div><h4>Así se ve una buena propuesta</h4><div style="display:grid;gap:10px">${props.map(x => `<div class="prop"><span class="stamp">EJEMPLO</span>
      <div class="who2"><span class="av">${esc(iniciales(x.nom))}</span><div><b>${esc(x.nom)}</b><small>${esc(x.sub)}</small></div></div>
      <div class="propnums"><span>Precio ${esc(x.precio)}</span><span>Plazo ${esc(x.plazo)}</span></div><pre>${esc(x.txt)}</pre></div>`).join("")}</div>
      <p class="fine" style="margin-top:8px">En los proyectos reales, cada propuesta solo la ve quien publicó. Estas se muestran como ejemplo.</p></div>` : ""}
   <div>${pie}</div>`);
}
function estadoProp(e) {
  return { revision: '<span class="pill none">En revisión de Proyecta Más</span>', correcciones: '<span class="pill first">Con correcciones</span>', enviada: '<span class="pill open">Enviada al cliente</span>', aceptada: '<span class="pill pm">¡Aceptada!</span>', descartada: '<span class="pill full">No seleccionada</span>' }[e] || e;
}
function repHTML(r, who) {
  if (!r || !r.calificaciones) return `<span class="rep">${who} nuevo · sin calificaciones todavía</span>`;
  return `<span class="rep">${who} <span class="st" aria-hidden="true">${stars(r.promedio)}</span><b>${num(r.promedio)}</b> (${r.calificaciones}) · fidelidad <b>${r.fidelidad}%</b></span>`;
}

/* ---------- propuesta ---------- */
function formPropuesta(p) {
  return `<div><h4>Enviar tu propuesta · quedan ${p.max_propuestas - p.propuestas_enviadas} de ${p.max_propuestas}</h4>
    <form id="pform" style="display:grid;gap:12px">
     <label class="f"><span style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">Tu propuesta <button type="button" class="btn o sm" id="tpl">Usar plantilla Proyecta Más</button></span><small>Cómo lo encararías, qué entregás, cuántas revisiones incluís</small><textarea id="pm" required minlength="20" maxlength="5000" style="min-height:160px"></textarea></label>
     <div class="row"><label class="f">Precio total<input id="pp" required maxlength="60" placeholder="$450.000"></label><label class="f">Plazo<input id="pz" required maxlength="60" placeholder="20 días"></label></div>
     <div id="est-prop" class="est est-inline"></div>
     <div class="box"><h5>¿Necesitás que alguien firme?</h5><span class="fine" style="margin:0">Es un acuerdo interno entre profesionales: el cliente no lo ve. Si el trabajo necesita la firma de un matriculado con otra incumbencia, buscalo en la Red; si no encontrás a nadie, coordinalo con alguien de afuera.</span>
      <div id="firmasel"></div><input id="fbus" placeholder="Buscar profesional por nombre" aria-label="Buscar firmante"><div class="picklist" id="fpick"></div></div>
     <label class="check"><input type="checkbox" id="rev" checked> <span><b>Que Proyecta Más revise mi propuesta antes de enviarla.</b> Te devolvemos sugerencias en 24 h hábiles.</span></label>
     <div class="note">Si quien publica acepta tu propuesta, se comparten los contactos y acuerdan el pago por fuera de la Red.</div>
     <div class="formerr" id="perr" hidden></div>
     <div><button class="btn y" type="submit" id="psend">Enviar propuesta</button></div>
    </form></div>`;
}
function confirmarReemplazo() { return window.confirm ? confirm("¿Reemplazar lo que escribiste por la plantilla?") : true; }
function bindPropuesta(p) {
  let firmante = null;
  $("#tpl").onclick = () => { if ($("#pm").value.trim() && !confirmarReemplazo()) return; $("#pm").value = TEMPLATE.replace("[nombre]", S.me.nombre.split(" ")[0]).replace("[título]", S.me.titulo || "profesional"); $("#pm").focus(); };
  montarEstimador($("#est-prop"), { trabajo: p.trabajo, cantidad: p.superficie, compacto: true, titulo: "Referencia de honorarios para este trabajo" });
  let t;
  $("#fbus").oninput = () => {
    clearTimeout(t); const v = $("#fbus").value.trim();
    if (v.length < 2) { $("#fpick").innerHTML = ""; return; }
    t = setTimeout(async () => {
      const rows = await q(sb.from("perfiles").select("id,nombre,titulo,matricula,matricula_verificada").eq("rol", "pro").neq("id", S.user.id).ilike("nombre", `%${v}%`).limit(6)).catch(() => []);
      $("#fpick").innerHTML = rows.map(r => `<button type="button" data-f="${r.id}" data-n="${esc(r.nombre)}"><span><b>${esc(r.nombre)}</b> · ${esc(r.titulo || "")}</span><span class="muted">${r.matricula ? esc(r.matricula) + (r.matricula_verificada ? " ✓" : "") : "sin matrícula"}</span></button>`).join("") || `<span class="fine">No encontramos profesionales con ese nombre en la Red.</span>`;
      $$("#fpick [data-f]").forEach(b => b.onclick = () => { firmante = b.dataset.f; $("#firmasel").innerHTML = `<div class="firma">Firma: <b>${esc(b.dataset.n)}</b> <button type="button" class="linkbtn" id="fquit">Quitar</button></div>`; $("#fpick").innerHTML = ""; $("#fbus").value = ""; $("#fquit").onclick = () => { firmante = null; $("#firmasel").innerHTML = ""; }; });
    }, 250);
  };
  window.tutorial?.autoPropuesta();
  /* borrador: lo escrito se guarda en este navegador hasta que se envía */
  const bk = "borrador-propuesta-" + p.id;
  try { const d = JSON.parse(localStorage.getItem(bk) || "null"); if (d) { $("#pm").value = d.t || ""; $("#pp").value = d.p || ""; $("#pz").value = d.z || ""; } } catch { }
  ["#pm", "#pp", "#pz"].forEach(sel => $(sel).addEventListener("input", () => { try { localStorage.setItem(bk, JSON.stringify({ t: $("#pm").value, p: $("#pp").value, z: $("#pz").value })); } catch { } }));
  $("#pform").onsubmit = async e => {
    e.preventDefault(); const b = $("#psend"); busy(b, true, "Enviando…"); $("#perr").hidden = true;
    const rev = $("#rev").checked;
    try {
      await q(sb.from("propuestas").insert({ proyecto_id: p.id, pro: S.user.id, texto: $("#pm").value.trim(), precio: $("#pp").value.trim(), plazo: $("#pz").value.trim(), estado: rev ? "revision" : "enviada", firmante }));
      try { localStorage.removeItem("borrador-propuesta-" + p.id); } catch { }
      toast(rev ? "Enviada a revisión. Seguila en Mis propuestas" : "Propuesta enviada al cliente");
      $("#dlg").close(); cargarProyectos(); pedirOpinion("propuesta");
    } catch (er) { $("#perr").textContent = errMsg(er); $("#perr").hidden = false; busy(b, false); }
  };
}

/* ---------- estimador ---------- */
async function datosEstimador() {
  if (S.cfg) return;
  const [cfg, honor] = await Promise.all([q(sb.from("red_config").select("*")), q(sb.from("honorarios_ref").select("*").order("id"))]);
  S.cfg = Object.fromEntries(cfg.map(r => [r.clave, +r.valor])); S.honor = honor;
}
async function montarEstimador(box, o = {}) {
  if (!box || !esPro()) return;
  try { await datosEstimador(); } catch { box.innerHTML = ""; return; }
  if (!S.honor.length) { S.cfg = null; box.innerHTML = ""; return; }
  const h0 = S.honor.find(h => h.trabajo === o.trabajo) || S.honor[0];
  box.innerHTML = `${o.titulo ? `<b style="font-size:15px">${esc(o.titulo)}</b>` : ""}
    <div class="row">
      <label class="f">Trabajo<select data-e="t">${S.honor.map(h => `<option ${h.id === h0.id ? "selected" : ""} value="${h.id}">${esc(h.trabajo)}</option>`).join("")}</select></label>
      <label class="f"><span data-e="ul">Superficie (m²)</span><input data-e="c" type="number" min="1" step="1" value="${o.cantidad ? Math.round(o.cantidad) : 100}"></label>
      <label class="f">Complejidad<select data-e="x"><option value="0.85">Simple</option><option value="1" selected>Normal</option><option value="1.25">Compleja</option></select></label>
    </div>
    <div class="rng"><div><small>Desde</small><b data-e="mn"></b></div><div class="mid"><small>Habitual</small><b data-e="tp"></b></div><div><small>Hasta</small><b data-e="mx"></b></div></div>
    <span class="fine" style="margin:0" data-e="nota"></span>`;
  const g = k => $(`[data-e="${k}"]`, box);
  const calc = () => {
    const h = S.honor.find(x => x.id === +g("t").value); const c = Math.max(1, +g("c").value || 1), k = +g("x").value;
    g("ul").textContent = { m2: "Superficie (m²)", imagen: "Cantidad de imágenes", unidad: "Cantidad" }[h.unidad];
    const vh = S.cfg.valor_hora_ars || 25000, mg = 1 + (S.cfg.margen_imprevistos || 0.2);
    const pr = hs => ars(Math.max(h.minimo_horas, hs * c * k) * vh * mg);
    g("mn").textContent = pr(+h.horas_min); g("tp").textContent = pr(+h.horas_tip); g("mx").textContent = pr(+h.horas_max);
    g("nota").textContent = `${h.nota || ""} Referencia orientativa de la Red: cada profesional cotiza según tu caso.`;
    if (o.onCalc) o.onCalc(g("tp").textContent);
  };
  ["t", "c", "x"].forEach(k => g(k).addEventListener("input", calc)); calc();
  return { set: (trabajo, cant) => { const h = S.honor.find(x => x.trabajo === trabajo); if (h) g("t").value = h.id; if (cant) g("c").value = Math.round(cant); calc(); } };
}

/* ---------- publicar ---------- */
let newTags = [], estPub = null;
function drawChips() { $$("#chipin .chip").forEach(c => c.remove()); newTags.forEach((t, i) => $("#p-tag").insertAdjacentHTML("beforebegin", `<span class="chip">#${esc(t)}<button type="button" data-i="${i}" aria-label="Quitar ${esc(t)}">✕</button></span>`)); }
function addTag(t) { t = t.trim().replace(/^#/, ""); if (t && t.length <= 30 && !newTags.includes(t) && newTags.length < 8) { newTags.push(t); drawChips(); } }
$("#p-tag").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(e.target.value); e.target.value = ""; } });
$("#chipin").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { newTags.splice(+b.dataset.i, 1); drawChips(); } });
SUGG.forEach(s => $("#suggest").insertAdjacentHTML("beforeend", `<button type="button" class="tag" data-s="${esc(s)}">#${esc(s)}</button>`));
$("#suggest").addEventListener("click", e => { const b = e.target.closest("[data-s]"); if (b) addTag(b.dataset.s); });
async function prepPublicar() {
  if (S.me?.provincia) $("#p-prov").value = S.me.provincia;
  if (S.me?.localidad && !$("#p-loc").value) $("#p-loc").value = S.me.localidad;
}
["#p-trabajo", "#p-sup"].forEach(s => $(s).addEventListener("change", () => estPub?.set($("#p-trabajo").value, +$("#p-sup").value)));
$("#pubform").onsubmit = async e => {
  e.preventDefault(); const b = $("#pubsend"), err = $("#puberr"); err.hidden = true;
  const pend = $("#p-tag").value; if (pend) { addTag(pend); $("#p-tag").value = ""; }
  const n = id => { const v = $(id).value; return v === "" ? null : +v; };
  busy(b, true, "Publicando…");
  try {
    const row = await q(sb.from("proyectos").insert({
      owner: S.user.id, titulo: $("#p-titulo").value.trim(), rubro: $("#p-rubro").value, trabajo: $("#p-trabajo").value,
      descripcion: $("#p-desc").value.trim(), entregables: $("#p-entreg").value.trim() || null,
      frente: n("#p-frente"), fondo: n("#p-fondo"), superficie: n("#p-sup"), particularidad: $("#p-desnivel").value.trim() || null,
      provincia: $("#p-prov").value, localidad: $("#p-loc").value.trim(), modalidad: $("input[name=mod]:checked").value,
      plazo: $("#p-plazo").value.trim() || null, presupuesto: $("#p-pres").value.trim() || null, etiquetas: newTags, max_propuestas: +$("#p-max").value
    }).select("id").single());
    $("#pubform").reset(); newTags = []; drawChips(); busy(b, false);
    await cargarProyectos(); location.hash = "proyecto-" + row.id; toast("¡Proyecto publicado!"); pedirOpinion("publicación");
  } catch (er) { err.textContent = errMsg(er); err.hidden = false; busy(b, false); }
};

/* ---------- profesionales ---------- */
let proCache = null;
async function cargarProfesionales() {
  if (!proCache) {
    try {
      const pros = await q(sb.from("perfiles").select("id,nombre,titulo,egreso,matricula,matricula_verificada,verificado,provincia,localidad,especialidades,portfolio,nivel,foto").eq("rol", "pro").order("verificado", { ascending: false }).order("created_at").limit(300));
      const ids = pros.map(p => p.id);
      const [ind, port] = ids.length ? await Promise.all([q(sb.rpc("indicadores", { p_perfiles: ids.slice(0, 100) })), q(sb.from("portfolio").select("pro,imagen_path,titulo,orden").in("pro", ids).order("orden"))]) : [[], []];
      const im = Object.fromEntries(ind.map(r => [r.perfil, r]));
      proCache = pros.map(p => ({ ...p, ind: im[p.id], fotos: port.filter(f => f.pro === p.id) }));
    } catch (er) { $("#progrid").innerHTML = `<div class="empty">${esc(errMsg(er))}</div>`; return; }
  }
  pintarProfesionales();
}
const foto = path => sb.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
function sellos(p) { return `${p.verificado ? '<span class="badge ok">✓ Verificado</span>' : ""}${p.matricula_verificada ? `<span class="badge mat">Matrícula ${esc(p.matricula || "")}</span>` : ""}`; }
function statsHTML(r) {
  if (!r) return "";
  const s = [];
  if (r.calificaciones) s.push(`<span><b>${num(r.promedio)}</b> ★ (${r.calificaciones})</span>`, `<span>Fidelidad <b>${r.fidelidad}%</b></span>`);
  s.push(`<span><b>${r.terminados || 0}</b> proyectos terminados</span>`);
  if (r.respuesta_horas != null) s.push(`<span>Responde en <b>~${r.respuesta_horas < 24 ? r.respuesta_horas + " h" : Math.round(r.respuesta_horas / 24) + " días"}</b></span>`);
  return `<div class="stats">${s.join("")}</div>`;
}
function pintarProfesionales() {
  const qq = $("#pq").value.trim().toLowerCase(), pv = $("#pf-prov").value, ver = $("#p-ver").checked;
  const list = (proCache || []).filter(p => (!qq || (p.nombre + " " + (p.titulo || "") + " " + (p.especialidades || "")).toLowerCase().includes(qq)) && (!pv || p.provincia === pv) && (!ver || p.verificado));
  $("#progrid").innerHTML = list.length ? list.map(p => `<button class="pcard" data-pro="${p.id}">
    <div class="phead">${avatar(p)}<div style="min-width:0"><b>${esc(p.nombre)}</b><small>${esc(p.titulo || "Profesional")}${p.egreso ? " · " + esc(p.egreso) : ""} · ${esc(p.localidad || "")}${p.provincia ? ", " + esc(p.provincia) : ""}</small></div></div>
    <div class="meta">${sellos(p)}</div>
    ${p.especialidades ? `<p class="muted" style="margin:0;font-size:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(p.especialidades)}</p>` : ""}
    ${p.fotos.length ? `<div class="thumbs">${p.fotos.slice(0, 3).map(f => `<img src="${esc(foto(f.imagen_path))}" alt="${esc(f.titulo)}" loading="lazy">`).join("")}</div>` : ""}
    ${statsHTML(p.ind)}</button>`).join("") : `<div class="empty">${proCache?.length ? "No hay profesionales con esos filtros." : "Los primeros profesionales se están sumando. ¿Sos uno? <a href=\"#registro\" data-view=\"registro\">Creá tu perfil</a>."}</div>`;
}
$("#progrid").addEventListener("click", e => { const c = e.target.closest("[data-pro]"); if (c) location.hash = "pro-" + c.dataset.pro; });
["#pq", "#pf-prov", "#p-ver"].forEach(s => $(s).addEventListener("input", pintarProfesionales));
async function abrirPerfil(id) {
  dialogo(`<div class="dlhead"><div class="muted">Cargando…</div>${cerrarX}</div>`);
  try {
    const [p, port, svs, cal, ind] = await Promise.all([
      q(sb.from("perfiles").select("*").eq("id", id).maybeSingle()),
      q(sb.from("portfolio").select("*").eq("pro", id).order("orden")),
      q(sb.from("servicios").select("*").eq("pro", id).eq("activo", true)),
      q(sb.from("calificaciones").select("promedio,fidelidad,comentario,created_at").eq("para", id).order("created_at", { ascending: false }).limit(20)),
      q(sb.rpc("indicadores", { p_perfiles: [id] }))
    ]);
    if (!p || p.rol === "cli") { dialogo(`<div class="dlhead"><h2>Perfil no disponible</h2>${cerrarX}</div>`); return; }
    dialogo(`<div class="dlhead"><div class="phead">${avatar(p)}<div><h2 id="dl-title" style="margin:0">${esc(p.nombre)}</h2><small class="muted">${esc(p.titulo || "Profesional")}${p.egreso ? " · egreso " + esc(p.egreso) : ""} · ${esc(p.localidad || "")}${p.provincia ? ", " + esc(p.provincia) : ""}</small></div></div>${cerrarX}</div>
      <div class="meta">${sellos(p)}</div>${statsHTML(ind[0])}
      ${p.especialidades ? `<div><h4>Especialidades</h4><p style="margin:0;white-space:pre-line">${esc(p.especialidades)}</p></div>` : ""}
      ${p.portfolio ? `<p style="margin:0"><a href="${esc(/^https?:\/\//.test(p.portfolio) ? p.portfolio : "https://" + p.portfolio)}" target="_blank" rel="noopener nofollow">Ver portfolio externo ↗</a></p>` : ""}
      <div><h4>Trabajos</h4>${port.length ? `<div class="gallery">${port.map(f => `<figure><img src="${esc(foto(f.imagen_path))}" alt="${esc(f.titulo)}" loading="lazy"><figcaption><b>${esc(f.titulo)}</b>${f.descripcion ? `<br><span class="muted">${esc(f.descripcion)}</span>` : ""}</figcaption></figure>`).join("")}</div>` : '<p class="muted" style="margin:0">Todavía no cargó trabajos.</p>'}</div>
      ${svs.length ? `<div><h4>Servicios con precio cerrado</h4><div style="display:grid;gap:10px">${svs.map(s => svCard(s, p, true)).join("")}</div></div>` : ""}
      <div><h4>Calificaciones (${cal.length})</h4>${cal.length ? cal.map(c => `<div class="q"><span class="st">${stars(c.promedio)}</span> ${c.fidelidad ? "· lo volverían a contratar" : ""} <small class="muted">· ${fecha(c.created_at)}</small>${c.comentario ? `<div class="a">“${esc(c.comentario)}”</div>` : ""}</div>`).join("") : '<p class="muted" style="margin:0">Sin calificaciones todavía.</p>'}</div>`);
    bindPedir();
  } catch (er) { dialogo(`<div class="dlhead"><h2>No pudimos abrir el perfil</h2>${cerrarX}</div><p>${esc(errMsg(er))}</p>`); }
}

/* ---------- servicios ---------- */
let svCache = null;
function svCard(s, pro, enPerfil) {
  return `<div class="svcard"><div class="meta"><span class="pill">${esc(s.rubro)}</span>${pro && !enPerfil ? `<a href="#pro-${pro.id}" class="muted">${esc(pro.nombre)}</a>${pro.verificado ? ' <span class="badge ok">✓</span>' : ""}` : ""}</div>
    <h3 style="margin:0;font:700 19px/1.2 var(--f-body)">${esc(s.titulo)}</h3>
    <p class="muted" style="margin:0;white-space:pre-line;font-size:14px">${esc(s.descripcion)}</p>
    <div class="pkgs">${s.paquetes.map(k => `<div class="pkg"><b>${esc(k.nombre)}</b><span class="price">${esc(k.precio)}</span><span class="muted">Entrega ${esc(k.entrega)} · ${esc(k.revisiones ?? 1)} revisión(es)</span>${k.incluye ? `<span>${esc(k.incluye)}</span>` : ""}
      ${!S.user || esCli() ? `<button class="btn y sm" data-pedir="${s.id}" data-pk="${esc(k.nombre)}" data-tit="${esc(s.titulo)}">Pedir</button>` : ""}</div>`).join("")}</div></div>`;
}
async function cargarServicios() {
  if (!svCache) {
    try { svCache = await q(sb.from("servicios").select("*, pro_p:perfiles!servicios_pro_fkey(id,nombre,verificado)").eq("activo", true).order("created_at", { ascending: false }).limit(200)); }
    catch (er) { $("#svgrid").innerHTML = `<div class="empty">${esc(errMsg(er))}</div>`; return; }
  }
  const qq = $("#sq").value.trim().toLowerCase(), r = $("#s-rubro").value;
  const list = svCache.filter(s => (!qq || (s.titulo + s.descripcion).toLowerCase().includes(qq)) && (!r || s.rubro === r));
  $("#svgrid").innerHTML = list.length ? list.map(s => svCard(s, s.pro_p)).join("") : `<div class="empty">${svCache.length ? "No hay servicios con esos filtros." : "Todavía no hay servicios publicados. Si sos profesional, <a href=\"#mis-servicios\">publicá el primero</a>."}</div>`;
  bindPedir();
}
["#sq", "#s-rubro"].forEach(s => $(s).addEventListener("input", cargarServicios));
function bindPedir() {
  $$("[data-pedir]").forEach(b => b.onclick = () => {
    if (!S.user) { $("#dlg").open && $("#dlg").close(); return abrirIngreso("Ingresá o creá tu cuenta gratis para pedir este servicio."); }
    dialogo(`<div class="dlhead"><div><div class="eyebrow">Pedir servicio</div><h2 id="auth-title" style="margin-top:4px">${esc(b.dataset.tit)}</h2></div>${cerrarX}</div>
      <div class="meta"><span class="pill first">Paquete ${esc(b.dataset.pk)}</span></div>
      <form id="pdf" class="authf"><label class="f">Contale tu caso <small>Medidas, qué tenés hecho, para cuándo lo necesitás</small><textarea id="pd-m" required minlength="10" maxlength="3000" style="min-height:120px"></textarea></label>
      <div class="note">Si el profesional acepta, se comparten los contactos y arreglan el pago entre ustedes.</div><div class="formerr" id="pderr" hidden></div>
      <button class="btn y" type="submit">Enviar pedido</button></form>`, "auth");
    $("#pdf").onsubmit = async e => {
      e.preventDefault();
      try { await q(sb.from("solicitudes_servicio").insert({ servicio_id: +b.dataset.pedir, cliente: S.user.id, paquete: b.dataset.pk, mensaje: $("#pd-m").value.trim() })); $("#auth").close(); toast("Pedido enviado. Te avisamos cuando responda."); }
      catch (er) { $("#pderr").textContent = errMsg(er); $("#pderr").hidden = false; }
    };
  });
}

/* ---------- acuerdo y calificación (compartido) ---------- */
async function bloqueAcuerdo(p, soyPro) {
  const et = await q(sb.from("acuerdo_etapas").select("*").eq("proyecto_id", p.id).order("orden"));
  const puedoMarcar = e => !e.marcado_at && ((e.tipo === "pago" && !soyPro) || (e.tipo === "entrega" && soyPro));
  const puedoConfirmar = e => e.marcado_at && !e.confirmado_at && ((e.tipo === "pago" && soyPro) || (e.tipo === "entrega" && !soyPro));
  const editable = et.every(e => !e.marcado_at);
  return `<div class="box"><h5>Etapas del acuerdo</h5>
    <span class="fine" style="margin:0">La Red no maneja el pago: solo registra lo que acordaron. Los pagos los marca el cliente y los confirma el profesional; las entregas, al revés.</span>
    <div class="etapas">${et.map(e => `<div class="etapa ${e.confirmado_at ? "confirmada" : e.marcado_at ? "marcada" : ""}"><span class="dot">${e.confirmado_at ? "✓" : e.orden}</span>
      <div><b>${esc(e.titulo)}</b>${e.porcentaje ? ` · ${num(e.porcentaje)}%` : ""} <small>${e.tipo === "pago" ? "Pago" : "Entrega"} · ${e.confirmado_at ? "confirmado " + fecha(e.confirmado_at) : e.marcado_at ? "marcado " + fecha(e.marcado_at) + ", falta confirmar" : "pendiente"}</small></div>
      <div class="inline">${puedoMarcar(e) ? `<button class="btn o sm" data-marcar="${e.id}">${e.tipo === "pago" ? "Marcar pagado" : "Marcar entregado"}</button>` : ""}${puedoConfirmar(e) ? `<button class="btn y sm" data-confirmar="${e.id}">Confirmar</button>` : ""}${editable && p.estado === "en_curso" ? `<button class="linkbtn" data-borrar="${e.id}">Quitar</button>` : ""}</div></div>`).join("")}</div>
    ${editable && p.estado === "en_curso" ? `<form class="inline" data-addet="${p.id}"><input name="t" required maxlength="120" placeholder="Nueva etapa, ej. Entrega de plantas"><select name="k" style="width:auto"><option value="entrega">Entrega</option><option value="pago">Pago</option></select><input name="pc" type="number" min="0" max="100" placeholder="%" style="width:80px"><button class="btn o sm">Agregar</button></form>` : ""}</div>`;
}
function bindAcuerdo(root, recargar) {
  $$("[data-marcar]", root).forEach(b => b.onclick = async () => { try { await q(sb.rpc("marcar_etapa", { p_etapa: +b.dataset.marcar })); toast("Marcado. Le avisamos a la otra parte para que confirme."); recargar(); } catch (er) { toast(errMsg(er)); } });
  $$("[data-confirmar]", root).forEach(b => b.onclick = async () => { try { await q(sb.rpc("confirmar_etapa", { p_etapa: +b.dataset.confirmar })); toast("Etapa confirmada"); recargar(); } catch (er) { toast(errMsg(er)); } });
  $$("[data-borrar]", root).forEach(b => b.onclick = async () => { try { await q(sb.from("acuerdo_etapas").delete().eq("id", +b.dataset.borrar)); recargar(); } catch (er) { toast(errMsg(er)); } });
  $$("[data-addet]", root).forEach(f => f.onsubmit = async e => {
    e.preventDefault(); const pid = +f.dataset.addet;
    const max = (await q(sb.from("acuerdo_etapas").select("orden").eq("proyecto_id", pid))).reduce((a, x) => Math.max(a, x.orden), 0);
    try { await q(sb.from("acuerdo_etapas").insert({ proyecto_id: pid, orden: max + 1, titulo: f.t.value.trim(), tipo: f.k.value, porcentaje: f.pc.value ? +f.pc.value : null })); recargar(); } catch (er) { toast(errMsg(er)); }
  });
}
async function bloqueCalificar(p, para, soyPro) {
  const ya = (await q(sb.from("calificaciones").select("id").eq("proyecto_id", p.id).eq("de", S.user.id))).length;
  if (ya) return `<div class="okbox">¡Gracias por calificar! Tu calificación ya se ve en el perfil.</div>`;
  const crits = soyPro ? [["claridad", "Claridad del pedido"], ["pago", "Pago en tiempo y forma"], ["respeto", "Respeto de lo acordado"]] : [["calidad", "Calidad del trabajo"], ["plazos", "Cumplimiento de plazos"], ["comunicacion", "Comunicación"]];
  return `<form class="box" data-calif="${p.id}" data-para="${para}"><h5>${soyPro ? "Calificá al cliente" : "Calificá al profesional"}</h5>
    ${crits.map(([k, l]) => `<div class="crit"><span>${l}</span><span class="stars" data-k="${k}">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}" aria-label="${n} de 5">★</button>`).join("")}</span></div>`).join("")}
    <div class="crit"><span><b>Fidelidad.</b> ${soyPro ? "¿Volverías a trabajar con este cliente?" : "¿Lo volverías a contratar?"}</span><span class="yn"><button type="button" data-fid="1">Sí</button><button type="button" data-fid="0">No</button></span></div>
    <input name="com" maxlength="1000" placeholder="Comentario (opcional, se publica)">
    <div><button class="btn sm" type="submit">Enviar calificación</button></div></form>`;
}
function bindCalificar(root, recargar) {
  $$("[data-calif]", root).forEach(f => {
    const v = {}; let fid = null;
    $$(".stars", f).forEach(s => $$("button", s).forEach(b => b.onclick = () => { v[s.dataset.k] = +b.dataset.n; $$("button", s).forEach(x => x.classList.toggle("on", +x.dataset.n <= v[s.dataset.k])); }));
    $$("[data-fid]", f).forEach(b => b.onclick = () => { fid = b.dataset.fid === "1"; $$("[data-fid]", f).forEach(x => x.classList.toggle("on", x === b)); });
    f.onsubmit = async e => {
      e.preventDefault();
      if (Object.keys(v).length < 3 || fid === null) { toast("Completá las estrellas y la pregunta de fidelidad"); return; }
      const prom = Object.values(v).reduce((a, x) => a + x, 0) / 3;
      try { await q(sb.from("calificaciones").insert({ proyecto_id: +f.dataset.calif, de: S.user.id, para: f.dataset.para, criterios: v, promedio: Math.round(prom * 100) / 100, fidelidad: fid, comentario: f.com.value.trim() || null })); toast("¡Gracias por calificar!"); recargar(); }
      catch (er) { toast(errMsg(er)); }
    };
  });
}

/* ---------- mis proyectos (cliente) ---------- */
async function misProyectos() {
  const box = $("#mpbox"); box.innerHTML = `<div class="empty">Cargando…</div>`;
  try {
    let qy = sb.from("proyectos").select("*").order("created_at", { ascending: false });
    if (!esAdmin()) qy = qy.eq("owner", S.user.id);
    const proys = await q(qy.limit(100));
    if (!proys.length) { box.innerHTML = `<div class="empty">Todavía no publicaste proyectos. <a href="#publicar">Publicá el primero</a> o <a href="#servicios">pedí un servicio</a>.</div>`; return; }
    const ids = proys.map(p => p.id);
    const [props, sols] = await Promise.all([
      q(sb.from("propuestas").select("*, pro_p:perfiles!propuestas_pro_fkey(id,nombre,titulo,verificado,matricula,matricula_verificada,foto)").in("proyecto_id", ids).in("estado", ["enviada", "aceptada", "descartada"])),
      q(sb.from("preguntas").select("proyecto_id").in("proyecto_id", ids).is("respuesta", null))
    ]);
    const ind = props.length ? Object.fromEntries((await q(sb.rpc("indicadores", { p_perfiles: [...new Set(props.map(x => x.pro))] }))).map(r => [r.perfil, r])) : {};
    const html = [];
    for (const p of proys) {
      const ps = props.filter(x => x.proyecto_id === p.id), acc = ps.find(x => x.estado === "aceptada");
      const sinResp = sols.filter(x => x.proyecto_id === p.id).length;
      let contacto = "", acuerdo = "", calif = "";
      if (acc && p.owner === S.user.id) {
        const c = (await q(sb.from("perfiles_contacto").select("email,whatsapp").eq("id", acc.pro))).at(0);
        contacto = `<div class="contact"><div class="eyebrow">Propuesta aceptada · contactos compartidos</div><b>${esc(acc.pro_p.nombre)}</b> · ${esc(acc.pro_p.titulo || "")}<br>WhatsApp ${esc(c?.whatsapp || "")} · ${esc(c?.email || "")}
          <div class="inline" style="margin-top:8px"><a class="btn wa sm" target="_blank" rel="noopener" href="${waLink(c?.whatsapp, `Hola ${acc.pro_p.nombre.split(" ")[0]}, soy ${S.me.nombre}. Acepté tu propuesta en la Red Proyecta Más para "${p.titulo}".`)}">Escribirle por WhatsApp</a></div></div>`;
        acuerdo = await bloqueAcuerdo(p, false);
        if (p.estado === "entregado") calif = await bloqueCalificar(p, acc.pro, false);
      }
      html.push(`<article class="mis" data-pid="${p.id}">
        <div class="meta">${estadoPill(p)}${p.origen === "servicio" ? '<span class="pill">Servicio</span>' : ""}<span>${esc(p.localidad)} · ${p.propuestas_enviadas}/${p.max_propuestas} propuestas · ${ago(p.created_at)}</span>${sinResp ? `<a href="#proyecto-${p.id}" class="pill first">${sinResp} pregunta${sinResp > 1 ? "s" : ""} sin responder</a>` : ""}</div>
        <h3 class="ptitle"><a href="#proyecto-${p.id}" style="color:inherit">${esc(p.titulo)}</a></h3>
        ${contacto}${acuerdo}${calif}
        ${p.origen === "publicado" ? `<h4 class="h4b">Propuestas recibidas (${ps.length})</h4>
        ${ps.length ? `<div class="rlist">${ps.map(r => `<div class="prop ${r.estado === "aceptada" ? "pmp" : ""} ${r.estado === "descartada" ? "desc" : ""}">
          <div class="who2">${avatar(r.pro_p)}<div><a href="#pro-${r.pro}"><b>${esc(r.pro_p.nombre)}</b></a> ${r.pro_p.verificado ? '<span class="badge ok">✓ Verificado</span>' : ""}<small>${esc(r.pro_p.titulo || "")}</small>${repHTML(ind[r.pro], "Profesional")}</div></div>
          <div class="propnums"><span>Precio ${esc(r.precio)}</span><span>Plazo ${esc(r.plazo)}</span>${r.estado !== "enviada" ? `<span>${r.estado === "aceptada" ? "Aceptada" : "No seleccionada"}</span>` : ""}</div>
          <pre>${esc(r.texto)}</pre>
          ${!acc && r.estado === "enviada" && p.owner === S.user.id ? `<div class="inline"><button type="button" class="btn y sm" data-acc="${r.id}" data-n="${esc(r.pro_p.nombre)}">Aceptar propuesta</button></div>` : ""}
        </div>`).join("")}</div>` : '<div class="note">Todavía no recibiste propuestas. Te avisamos por mail cuando llegue la primera.</div>'}` : ""}
        ${p.estado === "abierto" && p.owner === S.user.id ? `<div><button class="linkbtn" data-cerrar="${p.id}">Cerrar el proyecto</button></div>` : ""}
      </article>`);
    }
    box.innerHTML = html.join("");
    bindAcuerdo(box, misProyectos); bindCalificar(box, misProyectos);
    $$("[data-acc]", box).forEach(b => b.onclick = () => {
      dialogo(`<div class="dlhead"><div><div class="eyebrow">Confirmar</div><h2 id="auth-title" style="margin-top:4px">¿Aceptás la propuesta de ${esc(b.dataset.n)}?</h2></div>${cerrarX}</div>
        <div class="note">Al aceptar, ${esc(b.dataset.n)} recibe tu nombre, WhatsApp y email, y vos recibís los suyos. El pago y las condiciones los acuerdan entre ustedes. Las demás propuestas quedan como no seleccionadas.</div>
        <div class="inline"><button type="button" class="btn y" id="accok">Aceptar y compartir contactos</button><button type="button" class="btn o" data-close>Cancelar</button></div>`, "auth");
      $("#accok").onclick = async () => { try { await q(sb.from("propuestas").update({ estado: "aceptada" }).eq("id", +b.dataset.acc)); $("#auth").close(); toast("¡Listo! Ya pueden coordinar."); misProyectos(); cargarProyectos(); } catch (er) { toast(errMsg(er)); } };
    });
    $$("[data-cerrar]", box).forEach(b => b.onclick = async () => { try { await q(sb.from("proyectos").update({ estado: "cerrado" }).eq("id", +b.dataset.cerrar)); toast("Proyecto cerrado"); misProyectos(); cargarProyectos(); } catch (er) { toast(errMsg(er)); } });
  } catch (er) { box.innerHTML = `<div class="empty">${esc(errMsg(er))}</div>`; }
}

/* ---------- mis propuestas (profesional) ---------- */
async function misPropuestas() {
  const box = $("#mprbox"); box.innerHTML = `<div class="empty">Cargando…</div>`;
  try {
    const [mias, invit] = await Promise.all([
      q(sb.from("propuestas").select("*, proy:proyectos(*), fir_p:perfiles!propuestas_firmante_fkey(nombre)").eq("pro", S.user.id).order("created_at", { ascending: false })),
      q(sb.from("propuestas").select("*, proy:proyectos(titulo,localidad,provincia), pro_p:perfiles!propuestas_pro_fkey(nombre,titulo)").eq("firmante", S.user.id).order("created_at", { ascending: false }))
    ]);
    const corr = mias.length ? await q(sb.from("correcciones").select("*").in("propuesta_id", mias.map(m => m.id)).order("created_at")) : [];
    const html = [];
    const pend = invit.filter(x => x.firmante_estado === "invitado");
    if (pend.length) html.push(`<div class="box"><h5>Invitaciones para firmar (${pend.length})</h5>${pend.map(x => `<div class="firma" style="justify-content:space-between"><span><b>${esc(x.pro_p.nombre)}</b> te propone como firmante en <b>${esc(x.proy.titulo)}</b> (${esc(x.proy.localidad)})</span><span class="inline"><button class="btn y sm" data-firma="${x.id}" data-a="1">Aceptar</button><button class="btn o sm" data-firma="${x.id}" data-a="0">Rechazar</button></span></div>`).join("")}</div>`);
    if (!mias.length) html.push(`<div class="empty">Todavía no enviaste propuestas. <a href="#proyectos">Mirá los proyectos abiertos</a>.</div>`);
    for (const m of mias) {
      const p = m.proy, cs = corr.filter(c => c.propuesta_id === m.id);
      let extra = "";
      if (m.estado === "aceptada") {
        const c = (await q(sb.from("perfiles_contacto").select("email,whatsapp").eq("id", p.owner))).at(0);
        const own = (await q(sb.from("perfiles").select("nombre").eq("id", p.owner))).at(0);
        extra = `<div class="contact"><div class="eyebrow">¡Aceptada! Contacto del cliente</div><b>${esc(own?.nombre)}</b><br>WhatsApp ${esc(c?.whatsapp || "")} · ${esc(c?.email || "")}
          <div class="inline" style="margin-top:8px"><a class="btn wa sm" target="_blank" rel="noopener" href="${waLink(c?.whatsapp, `Hola, soy ${S.me.nombre}, de la Red Proyecta Más. Gracias por aceptar mi propuesta para "${p.titulo}".`)}">Escribirle por WhatsApp</a></div></div>`
          + await bloqueAcuerdo(p, true) + (p.estado === "entregado" ? await bloqueCalificar(p, p.owner, true) : "");
      }
      if (m.estado === "correcciones") extra = `${m.comentario_revision ? `<div class="note"><b>Comentario de Proyecta Más:</b> ${esc(m.comentario_revision)}</div>` : ""}
        <ul class="notas">${cs.map(n => `<li class="nota"><span class="nt nt-${n.tipo.toLowerCase()}">${esc(n.tipo)}</span><span>${esc(n.texto)}</span></li>`).join("")}</ul>
        <form data-edit="${m.id}" style="display:grid;gap:10px"><label class="f">Tu propuesta <small>Corregila y enviala al cliente</small><textarea name="t" required minlength="20" style="min-height:160px">${esc(m.texto)}</textarea></label>
        <div class="row"><label class="f">Precio<input name="p" required value="${esc(m.precio)}"></label><label class="f">Plazo<input name="z" required value="${esc(m.plazo)}"></label></div>
        <div><button class="btn y" type="submit">Enviar al cliente</button></div></form>`;
      if (m.estado === "revision") extra = `<p class="fine" style="margin:0">Proyecta Más la está leyendo. Te avisamos por mail cuando tengas la devolución.</p><pre class="ptext">${esc(m.texto)}</pre>`;
      html.push(`<article class="mis"><div class="meta">${estadoProp(m.estado)}<span>${esc(p.localidad)} · ${ago(m.created_at)}</span></div>
        <h3 class="ptitle"><a href="#proyecto-${p.id}" style="color:inherit">${esc(p.titulo)}</a></h3>
        <div class="propnums"><span>Precio ${esc(m.precio)}</span><span>Plazo ${esc(m.plazo)}</span>${m.firmante ? `<span>Firma: ${esc(m.fir_p?.nombre || "")} · ${{ invitado: "esperando respuesta", aceptado: "aceptó", rechazado: "rechazó" }[m.firmante_estado] || ""}</span>` : ""}</div>${extra}</article>`);
    }
    box.innerHTML = html.join("");
    bindAcuerdo(box, misPropuestas); bindCalificar(box, misPropuestas);
    $$("[data-firma]", box).forEach(b => b.onclick = async () => { try { await q(sb.rpc("responder_firma", { p_propuesta: +b.dataset.firma, p_acepta: b.dataset.a === "1" })); toast("Respuesta enviada"); misPropuestas(); } catch (er) { toast(errMsg(er)); } });
    $$("[data-edit]", box).forEach(f => f.onsubmit = async e => {
      e.preventDefault();
      try { await q(sb.from("propuestas").update({ texto: f.t.value.trim(), precio: f.p.value.trim(), plazo: f.z.value.trim(), estado: "enviada" }).eq("id", +f.dataset.edit)); toast("Propuesta enviada al cliente"); misPropuestas(); }
      catch (er) { toast(errMsg(er)); }
    });
  } catch (er) { box.innerHTML = `<div class="empty">${esc(errMsg(er))}</div>`; }
}

/* ---------- mis servicios (profesional) ---------- */
async function misServicios() {
  const box = $("#msvbox"); box.innerHTML = `<div class="empty">Cargando…</div>`;
  try {
    const svs = await q(sb.from("servicios").select("*").eq("pro", S.user.id).order("created_at", { ascending: false }));
    const sols = svs.length ? await q(sb.from("solicitudes_servicio").select("*, cli:perfiles!solicitudes_servicio_cliente_fkey(nombre,tipo_cliente,localidad)").in("servicio_id", svs.map(s => s.id)).order("created_at", { ascending: false })) : [];
    const pend = sols.filter(s => s.estado === "pendiente");
    box.innerHTML = (pend.length ? `<div class="box"><h5>Pedidos para responder (${pend.length})</h5>${pend.map(s => `<div class="prop"><div><b>${esc(s.cli?.nombre)}</b> · ${esc(s.cli?.tipo_cliente || "")} · ${esc(s.cli?.localidad || "")} · paquete <b>${esc(s.paquete)}</b> · ${esc(svs.find(x => x.id === s.servicio_id)?.titulo)}</div><pre>${esc(s.mensaje)}</pre>
      <div class="inline"><button class="btn y sm" data-sol="${s.id}" data-a="1">Aceptar y compartir contactos</button><button class="btn o sm" data-sol="${s.id}" data-a="0">No puedo tomarlo</button></div></div>`).join("")}</div>` : "")
      + (svs.length ? svs.map(s => `<article class="mis"><div class="meta"><span class="pill ${s.activo ? "open" : "full"}">${s.activo ? "Publicado" : "Pausado"}</span><span>${sols.filter(x => x.servicio_id === s.id).length} pedidos</span></div>${svCard(s, null, true)}
        <div class="inline"><button class="btn o sm" data-svedit="${s.id}">Editar</button><button class="btn o sm" data-svtog="${s.id}" data-v="${s.activo ? 0 : 1}">${s.activo ? "Pausar" : "Publicar"}</button></div></article>`).join("")
        : `<div class="empty">Todavía no publicaste servicios. Pensá en algo que hagas seguido, con alcance claro: “Plano eléctrico de vivienda hasta 100 m²”, “3 renders de exterior”.</div>`);
    $$("[data-sol]", box).forEach(b => b.onclick = async () => { try { await q(sb.rpc("aceptar_solicitud", { p_solicitud: +b.dataset.sol, p_acepta: b.dataset.a === "1" })); toast(b.dataset.a === "1" ? "Aceptado. El trabajo quedó en Mis propuestas con su acuerdo." : "Pedido rechazado"); misServicios(); } catch (er) { toast(errMsg(er)); } });
    $$("[data-svtog]", box).forEach(b => b.onclick = async () => { try { await q(sb.from("servicios").update({ activo: b.dataset.v === "1" }).eq("id", +b.dataset.svtog)); svCache = null; misServicios(); } catch (er) { toast(errMsg(er)); } });
    $$("[data-svedit]", box).forEach(b => b.onclick = () => editarServicio(svs.find(s => s.id === +b.dataset.svedit)));
    $$("[data-pedir]", box).forEach(b => b.remove());
  } catch (er) { box.innerHTML = `<div class="empty">${esc(errMsg(er))}</div>`; }
}
$("#svnew").onclick = () => editarServicio(null);
function editarServicio(s) {
  const pk = s?.paquetes || [{ nombre: "Básico", precio: "", entrega: "", revisiones: 1, incluye: "" }];
  const fila = (k, i) => `<div class="box" data-pk="${i}"><div class="row"><label class="f">Paquete<input name="n" required maxlength="30" value="${esc(k.nombre)}"></label><label class="f">Precio<input name="p" required maxlength="40" value="${esc(k.precio)}" placeholder="$150.000"></label><label class="f">Entrega<input name="e" required maxlength="40" value="${esc(k.entrega)}" placeholder="7 días"></label><label class="f">Revisiones<input name="r" type="number" min="0" max="10" value="${esc(k.revisiones ?? 1)}"></label></div><label class="f">Incluye<input name="i" maxlength="300" value="${esc(k.incluye || "")}" placeholder="Plano + unifilar + planilla de cargas, PDF y DWG"></label></div>`;
  dialogo(`<div class="dlhead"><div><div class="eyebrow">Servicio con precio cerrado</div><h2 id="dl-title" style="margin-top:4px">${s ? "Editar servicio" : "Nuevo servicio"}</h2></div>${cerrarX}</div>
    <form id="svf" style="display:grid;gap:12px">
      <label class="f">Título<input name="t" required minlength="5" maxlength="120" value="${esc(s?.titulo || "")}" placeholder="Plano eléctrico de vivienda hasta 100 m²"></label>
      <label class="f">Rubro<select name="r">${RUBROS.map(r => `<option ${s?.rubro === r ? "selected" : ""}>${esc(r)}</option>`).join("")}</select></label>
      <label class="f">Descripción <small>Qué incluye, qué necesitás del cliente, qué no está incluido</small><textarea name="d" required maxlength="3000">${esc(s?.descripcion || "")}</textarea></label>
      <div id="pks" style="display:grid;gap:8px">${pk.map(fila).join("")}</div>
      <div><button type="button" class="btn o sm" id="pkadd">Agregar paquete (hasta 3)</button></div>
      <div id="est-sv" class="est est-inline"></div>
      <div class="formerr" id="sverr" hidden></div>
      <div><button class="btn y" type="submit">Guardar</button></div></form>`);
  montarEstimador($("#est-sv"), { titulo: "Referencia para ponerle precio" });
  $("#pkadd").onclick = () => { const n = $$("#pks [data-pk]").length; if (n < 3) $("#pks").insertAdjacentHTML("beforeend", fila({ nombre: ["Básico", "Estándar", "Completo"][n], precio: "", entrega: "", revisiones: 1 }, n)); };
  $("#svf").onsubmit = async e => {
    e.preventDefault(); const f = e.target;
    const paquetes = $$("#pks [data-pk]").map(b => ({ nombre: $("[name=n]", b).value.trim(), precio: $("[name=p]", b).value.trim(), entrega: $("[name=e]", b).value.trim(), revisiones: +$("[name=r]", b).value || 0, incluye: $("[name=i]", b).value.trim() }));
    const row = { titulo: f.t.value.trim(), rubro: f.r.value, descripcion: f.d.value.trim(), paquetes };
    try { await q(s ? sb.from("servicios").update(row).eq("id", s.id) : sb.from("servicios").insert({ ...row, pro: S.user.id })); svCache = null; $("#dlg").close(); toast("Servicio guardado"); misServicios(); }
    catch (er) { $("#sverr").textContent = errMsg(er); $("#sverr").hidden = false; }
  };
}

/* ---------- mi perfil ---------- */
async function miPerfil() {
  const box = $("#perfilbox"), m = S.me, c = S.contacto || {};
  const pro = m.rol !== "cli";
  const port = pro ? await q(sb.from("portfolio").select("*").eq("pro", S.user.id).order("orden")).catch(() => []) : [];
  box.innerHTML = `<div class="eyebrow">Tu cuenta</div><h2 class="big">Mi <mark>perfil</mark></h2>
    <div class="meta">${pro ? sellos(m) || '<span class="badge warn">Sin verificar</span>' : ""}${pro ? `<a href="#pro-${m.id}">Ver mi perfil público</a>` : ""}</div>
    ${pro && !m.verificado ? `<div class="note">Para obtener el sello <b>Verificado</b>, mandanos por WhatsApp una foto de tu DNI y, si tenés, de tu credencial de matrícula. <a class="btn wa sm" target="_blank" rel="noopener" href="${waNico(`Hola, soy ${m.nombre} y quiero verificar mi perfil en la Red Proyecta Más.`)}">Pedir verificación</a></div>` : ""}
    <div class="formbox fotobox" style="max-width:820px">${avatar(m, "av big")}
      <div style="display:grid;gap:6px"><b>Tu foto</b><span class="fine" style="margin:0">Una foto de tu cara, clara y de frente, genera más confianza${pro ? " y te ayuda a conseguir más trabajos" : ""}. JPG, PNG o WEBP, hasta 5 MB.</span>
      <div class="inline"><label class="btn o sm" style="cursor:pointer">${m.foto ? "Cambiar foto" : "Subir foto"}<input type="file" id="fotoin" accept="image/jpeg,image/png,image/webp" hidden></label>${m.foto ? `<button type="button" class="linkbtn" id="fotodel">Quitar</button>` : ""}</div></div></div>
    <form id="pf" class="formbox" style="max-width:820px">
      <div class="row"><label class="f">${pro ? "Nombre y apellido" : "Nombre o razón social"}<input name="nombre" required minlength="2" maxlength="120" value="${esc(m.nombre)}"></label>
        <label class="f">WhatsApp<input name="wa" required maxlength="30" value="${esc(c.whatsapp || "")}"></label></div>
      <div class="row"><label class="f">Provincia<select name="prov">${PROVS.map(p => `<option ${m.provincia === p ? "selected" : ""}>${esc(p)}</option>`).join("")}</select></label>
        <label class="f">Localidad<input name="loc" maxlength="80" value="${esc(m.localidad || "")}"></label></div>
      ${pro ? `<div class="row"><label class="f">Título<select name="tit">${TITULOS.map(t => `<option ${m.titulo === t ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>
        <label class="f">Año de egreso<input name="egr" maxlength="20" value="${esc(m.egreso || "")}"></label>
        <label class="f">Matrícula <small>Si la cambiás, se vuelve a verificar</small><input name="mat" maxlength="40" value="${esc(m.matricula || "")}"></label></div>
        <label class="f">Especialidades y software<textarea name="esp" maxlength="600">${esc(m.especialidades || "")}</textarea></label>
        <label class="f">Portfolio externo<input name="port" maxlength="300" value="${esc(m.portfolio || "")}"></label>` : `<label class="f">Tipo<select name="tc">${["Particular", "Estudio", "Empresa"].map(t => `<option ${m.tipo_cliente === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>`}
      <div><button class="btn" type="submit">Guardar cambios</button></div></form>
    ${pro ? `<div class="formbox" style="max-width:820px;margin-top:16px"><h2 style="font:700 20px var(--f-body);margin:0">Mis trabajos</h2>
      <p class="fine" style="margin:0">Subí de 3 a 6 imágenes de tus mejores trabajos (JPG, PNG o WEBP, hasta 5 MB). Sirven los de facultad o proyectos propios.</p>
      <div class="gallery">${port.map(f => `<figure><img src="${esc(foto(f.imagen_path))}" alt="${esc(f.titulo)}"><figcaption><b>${esc(f.titulo)}</b> <button class="linkbtn" data-delp="${f.id}" data-path="${esc(f.imagen_path)}">Quitar</button></figcaption></figure>`).join("")}</div>
      <form id="upf" style="display:grid;gap:10px"><div class="row"><label class="f">Título del trabajo<input name="t" required maxlength="120" placeholder="Vivienda en lote angosto"></label><label class="f">Imagen<input name="f" type="file" accept="image/jpeg,image/png,image/webp" required></label></div>
      <label class="f">Descripción <small>Opcional</small><input name="d" maxlength="1000"></label><div><button class="btn o" type="submit">Subir</button></div></form></div>` : ""}
    ${m.rol !== "admin" ? `<div class="formbox danger" style="max-width:820px;margin-top:16px"><h2 style="font:700 20px var(--f-body);margin:0">Eliminar mi cuenta</h2>
      <p class="fine" style="margin:0">Se borran tu perfil, tus datos de contacto${pro ? ", tus propuestas, tus trabajos del portfolio, tus servicios" : ", tus proyectos con sus preguntas y propuestas"} y tus calificaciones. No se puede deshacer. Si tenés un trabajo en curso, primero terminalo o cerralo.</p>
      <div><button type="button" class="btn o sm" id="delacc">Eliminar mi cuenta</button></div></div>` : ""}`;
  $("#fotoin").onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast("La foto pesa más de 5 MB. Achicala y probá de nuevo."); return; }
    const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const path = `${S.user.id}/foto-${Date.now()}.${ext}`;
    try {
      await q(sb.storage.from("portfolio").upload(path, file, { contentType: file.type }));
      const vieja = S.me.foto;
      await q(sb.from("perfiles").update({ foto: path }).eq("id", S.user.id));
      if (vieja) sb.storage.from("portfolio").remove([vieja]);
      await cargarYo(); proCache = null; toast("Foto actualizada"); miPerfil();
    } catch (er) { toast(errMsg(er)); }
  };
  if ($("#fotodel")) $("#fotodel").onclick = async () => {
    try { const vieja = S.me.foto; await q(sb.from("perfiles").update({ foto: null }).eq("id", S.user.id)); if (vieja) sb.storage.from("portfolio").remove([vieja]); await cargarYo(); proCache = null; miPerfil(); }
    catch (er) { toast(errMsg(er)); }
  };
  $("#pf").onsubmit = async e => {
    e.preventDefault(); const f = e.target;
    const row = { nombre: f.nombre.value.trim(), provincia: f.prov.value, localidad: f.loc.value.trim() };
    if (pro) Object.assign(row, { titulo: f.tit.value, egreso: f.egr.value.trim() || null, matricula: f.mat.value.trim() || null, especialidades: f.esp.value.trim() || null, portfolio: f.port.value.trim() || null });
    else row.tipo_cliente = f.tc.value;
    try { await q(sb.from("perfiles").update(row).eq("id", S.user.id)); await q(sb.from("perfiles_contacto").update({ whatsapp: f.wa.value.trim() }).eq("id", S.user.id)); await cargarYo(); proCache = null; toast("Perfil actualizado"); miPerfil(); }
    catch (er) { toast(errMsg(er)); }
  };
  if ($("#upf")) $("#upf").onsubmit = async e => {
    e.preventDefault(); const f = e.target, file = f.f.files[0]; const b = $("button", f);
    if (!file) return; if (file.size > 5 * 1024 * 1024) { toast("La imagen pesa más de 5 MB. Achicala y probá de nuevo."); return; }
    busy(b, true, "Subiendo…");
    const path = `${S.user.id}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_").slice(-60)}`;
    try { await q(sb.storage.from("portfolio").upload(path, file, { contentType: file.type })); await q(sb.from("portfolio").insert({ pro: S.user.id, titulo: f.t.value.trim(), descripcion: f.d.value.trim() || null, imagen_path: path, orden: port.length })); proCache = null; toast("Trabajo agregado"); miPerfil(); }
    catch (er) { toast(errMsg(er)); busy(b, false); }
  };
  if ($("#delacc")) $("#delacc").onclick = () => {
    dialogo(`<div class="dlhead"><div><div class="eyebrow">No se puede deshacer</div><h2 id="auth-title" style="margin-top:4px">¿Eliminar tu cuenta?</h2></div>${cerrarX}</div>
      <p style="margin:0">Se borra todo lo que tenés en la Red. Para confirmar, escribí <b>ELIMINAR</b>.</p>
      <form id="delf" class="authf"><input id="delin" autocomplete="off" aria-label="Escribí ELIMINAR"><div class="formerr" id="delerr" hidden></div>
      <div class="inline"><button class="btn sm" type="submit" style="background:var(--warn);border-color:var(--warn)">Eliminar definitivamente</button><button type="button" class="btn o sm" data-close>Cancelar</button></div></form>`, "auth");
    $("#delf").onsubmit = async e => {
      e.preventDefault(); const err = $("#delerr"); err.hidden = true;
      if ($("#delin").value.trim().toUpperCase() !== "ELIMINAR") { err.textContent = "Escribí ELIMINAR para confirmar."; err.hidden = false; return; }
      const b = $("#delf button[type=submit]"); busy(b, true, "Eliminando…");
      try {
        const { data: arch } = await sb.storage.from("portfolio").list(S.user.id, { limit: 100 });
        if (arch?.length) await sb.storage.from("portfolio").remove(arch.map(f => `${S.user.id}/${f.name}`));
        await q(sb.rpc("eliminar_mi_cuenta"));
        await sb.auth.signOut(); $("#auth").close(); location.hash = ""; toast("Tu cuenta fue eliminada");
      } catch (er) { err.textContent = errMsg(er); err.hidden = false; busy(b, false); }
    };
  };
  $$("[data-delp]").forEach(b => b.onclick = async () => { try { await q(sb.from("portfolio").delete().eq("id", +b.dataset.delp)); await sb.storage.from("portfolio").remove([b.dataset.path]); proCache = null; miPerfil(); } catch (er) { toast(errMsg(er)); } });
}

/* ---------- panel admin ---------- */
const TABS = [["rev", "Revisión"], ["pros", "Profesionales"], ["sin", "Sin propuestas"], ["lista", "Lista de espera"], ["llam", "Llamadas"], ["opi", "Opiniones"], ["est", "Estimador"]];
let tabAct = "rev";
async function panel() {
  $("#ptabs").innerHTML = TABS.map(([k, l]) => `<button role="tab" aria-selected="${k === tabAct}" data-tab="${k}">${l}<span class="n" id="n-${k}" hidden></span></button>`).join("");
  $$("#ptabs [data-tab]").forEach(b => b.onclick = () => { tabAct = b.dataset.tab; panel(); });
  sb.from("propuestas").select("id", { count: "exact", head: true }).eq("estado", "revision").then(({ count }) => { if (count) { $("#n-rev").textContent = count; $("#n-rev").hidden = false; } });
  const box = $("#pbox"); box.innerHTML = `<div class="empty">Cargando…</div>`;
  try { await ({ rev: pRevision, pros: pPros, sin: pSin, lista: pLista, llam: pLlamadas, opi: pOpiniones, est: pEstimador })[tabAct](box); }
  catch (er) { box.innerHTML = `<div class="empty">${esc(errMsg(er))}</div>`; }
}
async function pRevision(box) {
  const rows = await q(sb.from("propuestas").select("*, proy:proyectos(id,titulo,descripcion,localidad), pro_p:perfiles!propuestas_pro_fkey(nombre,titulo,egreso)").eq("estado", "revision").order("created_at"));
  if (!rows.length) { box.innerHTML = `<div class="empty">No hay propuestas para revisar. 🎉</div>`; return; }
  box.innerHTML = rows.map(r => `<article class="mis" data-r="${r.id}"><div class="meta"><span class="pill none">En revisión</span><span>${ago(r.created_at)}</span></div>
    <h3 class="ptitle">${esc(r.pro_p.nombre)} <small class="muted">(${esc(r.pro_p.titulo || "")}${r.pro_p.egreso ? ", " + esc(r.pro_p.egreso) : ""})</small> → <a href="#proyecto-${r.proy.id}">${esc(r.proy.titulo)}</a></h3>
    <div class="propnums"><span>Precio ${esc(r.precio)}</span><span>Plazo ${esc(r.plazo)}</span></div><pre class="ptext">${esc(r.texto)}</pre>
    <div><h4 class="h4b">Correcciones</h4><ul class="notas" data-lista></ul></div>
    <div class="quick">${NOTAS_RAPIDAS.map((n, i) => `<button type="button" class="qbtn" data-q="${i}"><span class="nt nt-${n[0].toLowerCase()}">${n[0]}</span>${esc(n[1])}</button>`).join("")}</div>
    <div class="inline"><select data-nt style="width:auto"><option>Corregir</option><option>Agregar</option><option>Sacar</option></select><input data-nx placeholder="Corrección propia"><button type="button" class="btn o sm" data-nadd>Agregar</button></div>
    <label class="f">Comentario general <small>Lo lee primero</small><textarea data-gral style="min-height:70px"></textarea></label>
    <div class="inline"><button type="button" class="btn y" data-dev>Devolver con correcciones</button><button type="button" class="btn" data-apr>Aprobar y enviar al cliente</button></div></article>`).join("");
  $$("[data-r]", box).forEach(a => {
    const notas = [];
    const draw = () => { $("[data-lista]", a).innerHTML = notas.map((n, i) => `<li class="nota"><span class="nt nt-${n[0].toLowerCase()}">${n[0]}</span><span>${esc(n[1])}</span><button type="button" class="x sm" data-del="${i}">✕</button></li>`).join("") || '<li class="fine">Sin correcciones todavía.</li>'; $$("[data-del]", a).forEach(b => b.onclick = () => { notas.splice(+b.dataset.del, 1); draw(); }); };
    draw();
    $$("[data-q]", a).forEach(b => b.onclick = () => { notas.push(NOTAS_RAPIDAS[+b.dataset.q]); draw(); });
    $("[data-nadd]", a).onclick = () => { const t = $("[data-nx]", a).value.trim(); if (t) { notas.push([$("[data-nt]", a).value, t]); $("[data-nx]", a).value = ""; draw(); } };
    const id = +a.dataset.r;
    $("[data-dev]", a).onclick = async () => {
      if (!notas.length) { toast("Agregá al menos una corrección"); return; }
      try { await q(sb.from("correcciones").insert(notas.map(([tipo, texto]) => ({ propuesta_id: id, tipo, texto })))); await q(sb.from("propuestas").update({ estado: "correcciones", comentario_revision: $("[data-gral]", a).value.trim() || null }).eq("id", id)); toast("Devuelta. Le avisamos por mail."); panel(); }
      catch (er) { toast(errMsg(er)); }
    };
    $("[data-apr]", a).onclick = async () => { try { await q(sb.from("propuestas").update({ estado: "enviada", comentario_revision: $("[data-gral]", a).value.trim() || null }).eq("id", id)); toast("Aprobada y enviada al cliente"); panel(); } catch (er) { toast(errMsg(er)); } };
  });
}
async function pPros(box) {
  const [pros, cont] = await Promise.all([q(sb.from("perfiles").select("*").eq("rol", "pro").order("created_at", { ascending: false })), q(sb.from("perfiles_contacto").select("*"))]);
  const cm = Object.fromEntries(cont.map(c => [c.id, c]));
  box.innerHTML = pros.length ? `<div class="tbl2"><table><thead><tr><th>Profesional</th><th>Contacto</th><th>Matrícula</th><th>Verificado</th><th>Matrícula verif.</th></tr></thead><tbody>${pros.map(p => `<tr>
    <td><a href="#pro-${p.id}"><b>${esc(p.nombre)}</b></a><br><span class="muted">${esc(p.titulo || "")} · ${esc(p.localidad || "")} · ${fecha(p.created_at)}</span></td>
    <td>${esc(cm[p.id]?.email || "")}<br><a target="_blank" rel="noopener" href="${waLink(cm[p.id]?.whatsapp)}">${esc(cm[p.id]?.whatsapp || "")}</a></td>
    <td>${esc(p.matricula || "—")}</td>
    <td><input type="checkbox" data-v="${p.id}" data-k="verificado" ${p.verificado ? "checked" : ""} aria-label="Verificado"></td>
    <td><input type="checkbox" data-v="${p.id}" data-k="matricula_verificada" ${p.matricula_verificada ? "checked" : ""} ${p.matricula ? "" : "disabled"} aria-label="Matrícula verificada"></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Todavía no hay profesionales registrados.</div>`;
  $$("[data-v]", box).forEach(c => c.onchange = async () => { try { await q(sb.from("perfiles").update({ [c.dataset.k]: c.checked }).eq("id", c.dataset.v)); proCache = null; toast("Guardado"); } catch (er) { toast(errMsg(er)); c.checked = !c.checked; } });
}
async function pSin(box) {
  const lim = new Date(Date.now() - 5 * 864e5).toISOString();
  const rows = await q(sb.from("proyectos").select("id,titulo,localidad,provincia,created_at").eq("estado", "abierto").eq("origen", "publicado").eq("propuestas_enviadas", 0).lt("created_at", lim).order("created_at"));
  box.innerHTML = rows.length ? `<p class="lead">Proyectos con 5 días o más sin propuestas. Podés mandar la propuesta de Proyecta Más desde la ficha.</p>` + rows.map(p => `<article class="mis"><div class="meta"><span class="pill none">Sin propuestas</span><span>${esc(p.localidad)}, ${esc(p.provincia)} · ${ago(p.created_at)}</span></div><h3 class="ptitle"><a href="#proyecto-${p.id}">${esc(p.titulo)}</a></h3></article>`).join("") : `<div class="empty">Ningún proyecto lleva 5 días sin propuestas.</div>`;
}
async function pLista(box) {
  const rows = await q(sb.from("lista_espera").select("*").order("created_at", { ascending: false }).limit(500));
  box.innerHTML = rows.length ? `<div class="tbl2"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Nombre</th><th>Contacto</th><th>Detalle</th><th>Contactado</th></tr></thead><tbody>${rows.map(r => `<tr>
    <td>${fecha(r.created_at)}</td><td>${r.tipo === "profesional" ? "Profesional" : "Publica"}</td><td><b>${esc(r.nombre)}</b><br><span class="muted">${esc([r.localidad, r.provincia].filter(Boolean).join(", "))}</span></td>
    <td>${esc(r.email)}<br><a target="_blank" rel="noopener" href="${waLink(r.whatsapp, `Hola ${r.nombre.split(" ")[0]}, te escribo de la Red Proyecta Más: ¡ya abrimos! Creá tu cuenta en red.proyectamas.com.ar`)}">${esc(r.whatsapp)}</a></td>
    <td class="muted">${esc(r.tipo === "profesional" ? [r.titulo, r.egreso, r.especialidades].filter(Boolean).join(" · ") : [r.tipo_publicante, r.rubro, r.necesidad].filter(Boolean).join(" · "))}${r.notas ? `<br><i>${esc(r.notas)}</i>` : ""}</td>
    <td><input type="checkbox" data-le="${r.id}" ${r.contactado ? "checked" : ""} aria-label="Contactado"></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Nadie se anotó todavía.</div>`;
  $$("[data-le]", box).forEach(c => c.onchange = async () => { try { await q(sb.from("lista_espera").update({ contactado: c.checked }).eq("id", +c.dataset.le)); } catch (er) { toast(errMsg(er)); } });
}
async function pLlamadas(box) {
  const rows = await q(sb.from("reservas_llamada").select("*, pro_p:perfiles!reservas_llamada_pro_fkey(nombre)").gte("fecha", new Date(Date.now() - 864e5).toISOString().slice(0, 10)).order("fecha").order("hora"));
  box.innerHTML = rows.length ? rows.map(r => `<article class="mis"><div class="meta"><span class="pill ${r.estado === "pendiente" ? "none" : "open"}">${esc(r.estado)}</span><span>${new Date(r.fecha + "T12:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "numeric" })} · ${r.hora.slice(0, 5)} h</span></div>
    <h3 class="ptitle">${esc(r.pro_p?.nombre)} · ${esc(r.tema)}</h3>${r.detalle ? `<p style="margin:0">“${esc(r.detalle)}”</p>` : ""}
    <div class="inline">${["confirmada", "hecha", "cancelada"].map(s => `<button class="btn o sm" data-rs="${r.id}" data-s="${s}">${{ confirmada: "Confirmar", hecha: "Marcar hecha", cancelada: "Cancelar" }[s]}</button>`).join("")}</div></article>`).join("") : `<div class="empty">No hay llamadas reservadas.</div>`;
  $$("[data-rs]", box).forEach(b => b.onclick = async () => { try { await q(sb.from("reservas_llamada").update({ estado: b.dataset.s }).eq("id", +b.dataset.rs)); panel(); } catch (er) { toast(errMsg(er)); } });
}
async function pOpiniones(box) {
  const rows = await q(sb.from("opiniones").select("*").order("created_at", { ascending: false }).limit(300));
  if (!rows.length) { box.innerHTML = `<div class="empty">Todavía no hay opiniones.</div>`; return; }
  const avg = rows.reduce((a, o) => a + o.estrellas, 0) / rows.length; const cnt = {};
  rows.forEach(o => o.sugerencias.forEach(t => cnt[t] = (cnt[t] || 0) + 1));
  box.innerHTML = `<div class="opin"><div class="kithead"><h3>Opiniones de usuarios</h3><span>${num(avg.toFixed(1))} ★ promedio · ${rows.length} opiniones</span></div>
    <div class="toptags"><b>Lo más pedido:</b> ${Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([t, n]) => `<span class="pill">${esc(t)} · ${n}</span>`).join("") || "—"}</div>
    <div class="oplist">${rows.map(o => `<div class="opi"><span class="rep"><span class="st">${stars(o.estrellas)}</span> después de ${esc(o.accion)} · ${fecha(o.created_at)}</span>${o.comentario ? `<span>“${esc(o.comentario)}”</span>` : ""}</div>`).join("")}</div></div>`;
}
async function pEstimador(box) {
  S.cfg = null; await datosEstimador();
  box.innerHTML = `<p class="lead">Estos valores alimentan el estimador que ven los profesionales. Actualizá el valor hora cuando cambien los precios.</p>
    <div class="row" style="max-width:520px"><label class="f">Valor hora (ARS)<input type="number" id="cfg-vh" value="${S.cfg.valor_hora_ars}"></label><label class="f">Margen imprevistos (0,20 = 20%)<input type="number" step="0.01" id="cfg-mg" value="${S.cfg.margen_imprevistos}"></label></div>
    <div class="tbl2" style="margin-top:12px"><table><thead><tr><th>Trabajo</th><th>Unidad</th><th>Horas mín.</th><th>Habitual</th><th>Máx.</th><th>Mínimo (h)</th></tr></thead><tbody>${S.honor.map(h => `<tr data-h="${h.id}"><td>${esc(h.trabajo)}</td><td>${esc(h.unidad)}</td>${["horas_min", "horas_tip", "horas_max", "minimo_horas"].map(k => `<td><input type="number" step="0.01" data-k="${k}" value="${h[k]}"></td>`).join("")}</tr>`).join("")}</tbody></table></div>
    <div class="inline" style="margin-top:12px"><button class="btn" id="cfgsave">Guardar</button></div>`;
  $("#cfgsave").onclick = async () => {
    try {
      await q(sb.from("red_config").update({ valor: +$("#cfg-vh").value, updated_at: new Date().toISOString() }).eq("clave", "valor_hora_ars"));
      await q(sb.from("red_config").update({ valor: +$("#cfg-mg").value, updated_at: new Date().toISOString() }).eq("clave", "margen_imprevistos"));
      for (const tr of $$("[data-h]", box)) { const row = {}; $$("[data-k]", tr).forEach(i => row[i.dataset.k] = +i.value); await q(sb.from("honorarios_ref").update(row).eq("id", +tr.dataset.h)); }
      S.cfg = null; estPub = null; toast("Estimador actualizado");
    } catch (er) { toast(errMsg(er)); }
  };
}

/* ---------- kit: manuales, calculadora, agenda ---------- */
function abrirManual(n) {
  const m = window.MANUALES?.[n]; if (!m) return;
  dialogo(`<div class="dlhead"><div><div class="eyebrow">${esc(m.sub)}</div><h2 id="dl-title" style="margin-top:4px">${esc(m.t)}</h2></div>${cerrarX}</div><article class="reader">${m.h}</article><div class="inline"><button class="btn o" data-close>Cerrar</button>${n === 3 ? '<button class="btn y" id="gocalc">Ir a la calculadora</button>' : ""}</div>`);
  if ($("#gocalc")) $("#gocalc").onclick = () => { $("#dlg").close(); $("#calc").scrollIntoView({ behavior: "smooth" }); };
}
$$("#primer-cliente .man").forEach((m, i) => {
  const n = i + 1; m.tabIndex = 0; m.setAttribute("role", "button");
  m.querySelector("div").insertAdjacentHTML("beforeend", `<span class="manst ready">Leer</span>`);
  m.onclick = () => abrirManual(n); m.onkeydown = e => { if (e.key === "Enter") abrirManual(n); };
});
(function calculadora() {
  if (!$("#c-gastos")) return;
  const n = id => Math.max(0, parseFloat(String($(id).value).replace(/\./g, "").replace(",", ".")) || 0);
  const calc = () => { const vh = (n("#c-gastos") + n("#c-neto")) / (n("#c-horas") || 1); const pr = vh * n("#c-ht") * (1 + parseFloat($("#c-margen").value)); $("#c-vh").textContent = ars(vh); $("#c-precio").textContent = ars(pr); $("#c-ant").textContent = ars(pr * .3); $("#c-saldo").textContent = ars(pr * .7); };
  ["#c-gastos", "#c-neto", "#c-horas", "#c-ht", "#c-margen"].forEach(id => $(id).addEventListener("input", calc)); calc();
})();
async function agenda() {
  const box = $("#callbody"); if (!box || !S.user) return;
  const HORAS = ["18:00", "18:30", "19:00", "19:30"], dias = [], d = new Date(); d.setHours(0, 0, 0, 0);
  while (dias.length < 6) { d.setDate(d.getDate() + 1); if (d.getDay() === 2 || d.getDay() === 4) dias.push(new Date(d)); }
  const iso = x => x.toISOString().slice(0, 10);
  let ocup = [];
  try { ocup = await q(sb.rpc("turnos_ocupados", { desde: iso(dias[0]), hasta: iso(dias.at(-1)) })); } catch { }
  const mias = await q(sb.from("reservas_llamada").select("*").eq("pro", S.user.id).in("estado", ["pendiente", "confirmada"]).gte("fecha", iso(new Date()))).catch(() => []);
  const fmt = x => x.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "numeric" });
  if (mias.length) {
    const r = mias[0];
    box.innerHTML = `<div class="booked"><span class="eyebrow">Llamada reservada</span><b>${new Date(r.fecha + "T12:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "numeric" })} · ${r.hora.slice(0, 5)} h · 30 min</b><span style="font-size:14px">Tema: ${esc(r.tema)}</span>
      <span class="fine" style="margin:0">Es por Google Meet. Confirmala por WhatsApp y te mandamos el link.</span>
      <div class="inline"><a class="btn wa sm" target="_blank" rel="noopener" href="${waNico(`Hola, soy ${S.me.nombre} de la Red Proyecta Más. Reservé la llamada por Meet del ${r.fecha} a las ${r.hora.slice(0, 5)} h. Tema: ${r.tema}.${r.detalle ? " " + r.detalle : ""}`)}">Confirmar por WhatsApp</a><button class="btn o sm" id="rcancel">Cancelar reserva</button></div></div>`;
    $("#rcancel").onclick = async () => { try { await q(sb.from("reservas_llamada").update({ estado: "cancelada" }).eq("id", r.id)); agenda(); } catch (er) { toast(errMsg(er)); } };
    return;
  }
  let sel = { dia: 0, hora: null };
  const draw = () => {
    const tomado = (i, h) => ocup.some(o => o.fecha === iso(dias[i]) && o.hora.slice(0, 5) === h);
    box.innerHTML = `<div class="days">${dias.map((x, i) => `<button type="button" class="day ${i === sel.dia ? "on" : ""}" data-d="${i}">${fmt(x).split(" ")[0]}<small>${fmt(x).split(" ").slice(1).join(" ")}</small></button>`).join("")}</div>
      <div class="slots">${HORAS.map(h => `<button type="button" class="slot ${sel.hora === h ? "on" : ""}" data-h="${h}" ${tomado(sel.dia, h) ? "disabled" : ""}>${h}</button>`).join("")}</div>
      <div class="row"><label class="f">Tema<select id="tema">${["Cotización", "Propuesta", "Duda técnica", "Cliente o cobro", "Otro"].map(t => `<option>${t}</option>`).join("")}</select></label></div>
      <label class="f">¿Qué querés resolver?<input id="ctxt" maxlength="140" placeholder="Me piden 3 renders y no sé si cobrar aparte el modelo 3D"></label>
      <div class="note">Antes de reservar, fijate si la respuesta está en los manuales.</div>
      <div><button type="button" class="btn" id="book" ${sel.hora ? "" : "disabled"}>Reservar ${sel.hora ? fmt(dias[sel.dia]) + " · " + sel.hora : "turno"}</button></div>`;
    $$(".day", box).forEach(b => b.onclick = () => { sel = { dia: +b.dataset.d, hora: null }; draw(); });
    $$(".slot", box).forEach(b => b.onclick = () => { sel.hora = b.dataset.h; draw(); });
    $("#book").onclick = async () => {
      try { await q(sb.from("reservas_llamada").insert({ pro: S.user.id, fecha: iso(dias[sel.dia]), hora: sel.hora, tema: $("#tema").value, detalle: $("#ctxt").value.trim() || null })); toast("Llamada reservada"); agenda(); }
      catch (er) { toast(errMsg(er)); try { ocup = await q(sb.rpc("turnos_ocupados", { desde: iso(dias[0]), hasta: iso(dias.at(-1)) })); } catch { } draw(); }
    };
  };
  draw();
}

/* ---------- opinión ---------- */
const SUG = ["Chat con el cliente dentro de la Red", "Más proyectos de mi zona", "Avisos por WhatsApp", "App para el celular", "Más plantillas y manuales", "Ver el perfil completo del cliente"];
function pedirOpinion(accion) {
  try { if (localStorage.getItem("opino-" + accion)) return; } catch { }
  const f = { st: 0, tags: [] };
  const draw = () => {
    dialogo(`<div class="dlhead"><div><div class="eyebrow">Tu opinión nos ayuda a mejorar</div><h2 id="auth-title" style="margin-top:4px">¿Qué te pareció?</h2></div>${cerrarX}</div>
     <p style="margin:0" class="muted">Acabás de ${accion === "propuesta" ? "enviar una propuesta" : "publicar un proyecto"}. Toma 20 segundos.</p>
     <div class="bigstars">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-st="${n}" class="${f.st >= n ? "on" : ""}" aria-label="${n} de 5">★</button>`).join("")}</div>
     <div><h4 class="h4b">¿Qué agregarías?</h4><div class="sugs">${SUG.map(t => `<button type="button" class="sug ${f.tags.includes(t) ? "on" : ""}" data-sug="${esc(t)}">${esc(t)}</button>`).join("")}</div></div>
     <label class="f">Comentario <small>Opcional</small><textarea id="fbtxt" style="min-height:80px">${esc(f.txt || "")}</textarea></label>
     <div class="inline"><button type="button" class="btn y" id="fbsend" ${f.st ? "" : "disabled"}>${f.st ? "Enviar opinión" : "Elegí las estrellas"}</button><button type="button" class="btn o" data-close>Ahora no</button></div>`, "auth");
    $$("[data-st]").forEach(b => b.onclick = () => { f.st = +b.dataset.st; f.txt = $("#fbtxt").value; draw(); });
    $$("[data-sug]").forEach(b => b.onclick = () => { const t = b.dataset.sug; f.tags = f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t]; f.txt = $("#fbtxt").value; draw(); });
    $("#fbsend").onclick = async () => {
      try { await q(sb.from("opiniones").insert({ autor: S.user.id, accion, estrellas: f.st, sugerencias: f.tags, comentario: $("#fbtxt").value.trim() || null })); try { localStorage.setItem("opino-" + accion, "1"); } catch { } $("#auth").close(); toast("¡Gracias por tu opinión!"); }
      catch (er) { toast(errMsg(er)); }
    };
  };
  setTimeout(() => { draw(); }, 600);
}

/* ---------- herramientas (WhatsApp) ---------- */
$$("[data-wa]").forEach(a => a.href = waNico(`Hola, vengo de la Red Proyecta Más y quiero info sobre ${a.dataset.wa}.`));

/* ---------- notificaciones ---------- */
let notifTimer = null;
async function cargarNotif() {
  if (!S.user) { $("#bell").hidden = true; return; }
  const { count } = await sb.from("notificaciones").select("id", { count: "exact", head: true }).eq("para", S.user.id).eq("leida", false);
  const n = count || 0; $("#bell-n").textContent = n > 9 ? "9+" : n; $("#bell-n").hidden = !n;
  $("#bell").setAttribute("aria-label", n ? `Avisos: ${n} sin leer` : "Avisos");
}
async function abrirNotif() {
  const l = $("#bell-list"); l.hidden = !l.hidden; if (l.hidden) return;
  l.innerHTML = `<div class="muted" style="padding:10px">Cargando…</div>`;
  const { data } = await sb.from("notificaciones").select("*").eq("para", S.user.id).order("created_at", { ascending: false }).limit(25);
  const rows = data || [];
  l.innerHTML = `<div class="bellhead"><b>Avisos</b>${rows.some(r => !r.leida) ? `<button type="button" class="linkbtn" id="bell-all">Marcar todo leído</button>` : ""}</div>`
    + (rows.length ? rows.map(r => `<a href="${esc(r.link || "#")}" class="bellitem ${r.leida ? "" : "nuevo"}" data-nid="${r.id}"><span>${esc(r.titulo)}</span><small>${ago(r.created_at)}</small></a>`).join("")
      : `<div class="muted" style="padding:12px">No tenés avisos todavía.</div>`);
  $$("[data-nid]", l).forEach(a => a.onclick = async () => { l.hidden = true; if (a.classList.contains("nuevo")) { await sb.from("notificaciones").update({ leida: true }).eq("id", +a.dataset.nid); cargarNotif(); } });
  if ($("#bell-all")) $("#bell-all").onclick = async e => { e.stopPropagation(); await sb.from("notificaciones").update({ leida: true }).eq("para", S.user.id).eq("leida", false); l.hidden = true; cargarNotif(); };
}
$("#bell").onclick = e => { e.stopPropagation(); $("#umlist").hidden = true; abrirNotif(); };
$("#bell-list").addEventListener("click", e => e.stopPropagation());
document.addEventListener("click", () => { $("#bell-list").hidden = true; });
function vigilarNotif() { clearInterval(notifTimer); cargarNotif(); if (S.user) notifTimer = setInterval(cargarNotif, 60000); }
addEventListener("focus", () => S.user && cargarNotif());

/* ---------- tutorial ---------- */
const tutoClave = () => !S.user ? "visita" : esPro() ? "pro" : "cli";
$("#vertuto").onclick = () => { $("#umlist").hidden = true; window.tutorial?.abrir(tutoClave()); };
function tutoAuto() { if (!esAdmin()) window.tutorial?.auto(tutoClave()); }

/* ---------- inicio ---------- */
fill("#f-rubro", RUBROS, true); fill("#f-prov", PROVS, true); fill("#pf-prov", PROVS, true); fill("#s-rubro", RUBROS, true);
fill("#p-rubro", RUBROS); fill("#p-trabajo", TRABAJOS); fill("#p-prov", PROVS); fill("#r-prov", PROVS); fill("#r-titulo", TITULOS);
$("#p-prov").value = "Santa Fe"; $("#r-prov").value = "Santa Fe";
let estMain = false;
function agendaSiPro() { if (!esPro()) return; agenda(); if (!estMain) { estMain = true; montarEstimador($("#est-main")); } }
(async () => {
  await cargarYo();
  uidPrevio = S.user?.id || null; listo = true;
  await cargarProyectos();
  router();
  vigilarNotif();
  if (LINK_ERR && !S.user) reenviarActivacion("", /expired|invalid/i.test(LINK_ERR.code + LINK_ERR.desc) ? "Ese link ya venció o ya se usó" : "No pudimos activar la cuenta con ese link");
  else tutoAuto();
  agendaSiPro();
})();
