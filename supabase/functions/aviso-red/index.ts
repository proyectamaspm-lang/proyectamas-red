// Avisos de la Red Proyecta Más: notificación en la Red + push al celular, y mail solo en lo imprescindible
// (cuando se comparten datos de contacto, la primera propuesta y el cupo completo; a Proyecta Más, las revisiones).
// Recibe {tabla, id, evento, uid?}. No confía en el pedido: relee el registro con permisos de servidor,
// verifica que el evento coincida con el estado real y registra cada aviso una sola vez (avisos_log).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const SITIO = "https://red.proyectamas.com.ar";
const ADMIN_MAIL = "hola@proyectamas.com.ar";
const DESDE = "Red Proyecta Más <hola@proyectamas.com.ar>";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const waLink = (n: string) => {
  let d = String(n || "").replace(/\D/g, "");
  if (d.startsWith("54")) d = d.slice(2);
  if (d.startsWith("9")) d = d.slice(1);
  return `https://wa.me/549${d}`;
};

function plantilla(titulo: string, cuerpo: string, boton?: [string, string]) {
  return `<div style="font-family:Arial,sans-serif;color:#122e54;max-width:560px">
  <p style="font-size:20px;font-weight:bold;margin:0 0 12px">${titulo}</p>${cuerpo}
  ${boton ? `<p style="margin:20px 0"><a href="${boton[1]}" style="background:#ffe500;color:#122e54;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold">${boton[0]}</a></p>` : ""}
  <p style="color:#5a6a85;font-size:12px;margin-top:24px">Red Proyecta Más · red.proyectamas.com.ar</p></div>`;
}

type Aviso = { para: string; email?: string; subject: string; html: string; notif: string; link: string; mail: boolean };

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("método no permitido", { status: 405 });
  let tabla = "", evento = "", id = 0, uid = "";
  try {
    const b = await req.json();
    tabla = String(b.tabla); evento = String(b.evento); id = Number(b.id) || 0; uid = String(b.uid || "");
  } catch { return new Response("pedido inválido", { status: 400 }); }
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return new Response("falta RESEND_API_KEY", { status: 500 });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const perfil = async (u: string) => {
    const [{ data: p }, { data: c }] = await Promise.all([
      db.from("perfiles").select("id,nombre,titulo,rol,matricula,localidad").eq("id", u).maybeSingle(),
      db.from("perfiles_contacto").select("email,whatsapp").eq("id", u).maybeSingle(),
    ]);
    return { ...(p || {}), ...(c || {}) } as Record<string, string>;
  };
  const proyecto = async (pid: number) => (await db.from("proyectos").select("*").eq("id", pid).maybeSingle()).data;
  const link = (path: string) => SITIO + path;
  const avisos: Aviso[] = [];
  const a = (who: Record<string, string> | "ADMIN", subject: string, html: string, notif: string, path: string, mail = false) =>
    avisos.push(who === "ADMIN"
      ? { para: "ADMIN", email: ADMIN_MAIL, subject, html, notif, link: path, mail }
      : { para: who.id, email: who.email, subject, html, notif, link: path, mail });
  const claveBase = `${tabla}:${id || uid}:${evento}`;

  try {
    if (tabla === "propuestas") {
      const { data: pr } = await db.from("propuestas").select("*").eq("id", id).maybeSingle();
      if (!pr) return new Response("no existe", { status: 200 });
      const p = await proyecto(pr.proyecto_id); const pro = await perfil(pr.pro); const cli = await perfil(p.owner);
      if (evento === "propuesta_revision" && pr.estado === "revision")
        a("ADMIN", `Propuesta para revisar: ${p.titulo}`, plantilla("Hay una propuesta para revisar", `<p><b>${esc(pro.nombre)}</b> mandó una propuesta para <b>${esc(p.titulo)}</b> y pidió tu revisión.</p><p>Precio ${esc(pr.precio)} · Plazo ${esc(pr.plazo)}</p>`, ["Abrir el panel", link("/#panel")]),
          `Propuesta para revisar de ${pro.nombre}: ${p.titulo}`, "/#panel", true);
      if (evento === "propuesta_correcciones" && pr.estado === "correcciones")
        a(pro, "Tenés correcciones en tu propuesta", plantilla("Revisamos tu propuesta", `<p>Dejamos algunas correcciones para tu propuesta en <b>${esc(p.titulo)}</b>. Corregila y enviala al cliente desde <b>Mis propuestas</b>.</p>`, ["Ver correcciones", link("/#mis-propuestas")]),
          `Tenés correcciones en tu propuesta para ${p.titulo}`, "/#mis-propuestas");
      if (evento === "propuesta_enviada" && pr.estado === "enviada") {
        a(cli, `Recibiste una propuesta para ${p.titulo}`, plantilla("Recibiste una propuesta", `<p><b>${esc(pro.nombre)}</b> (${esc(pro.titulo || "profesional")}) te mandó una propuesta para <b>${esc(p.titulo)}</b>.</p><p>Precio ${esc(pr.precio)} · Plazo ${esc(pr.plazo)}</p><p>Llevás ${p.propuestas_enviadas} de ${p.max_propuestas} propuestas.</p>`, ["Ver la propuesta", link("/#mis-proyectos")]),
          `Nueva propuesta de ${pro.nombre} para ${p.titulo}`, "/#mis-proyectos", p.propuestas_enviadas === 1);
        a(pro, "Tu propuesta ya le llegó al cliente", plantilla("Propuesta enviada", `<p>Tu propuesta para <b>${esc(p.titulo)}</b> ya está en manos del cliente. Te avisamos si la acepta.</p>`),
          `Tu propuesta para ${p.titulo} le llegó al cliente`, "/#mis-propuestas");
        if (p.estado === "completo")
          avisos.push({ para: cli.id, email: cli.email, subject: `Completaste el cupo de propuestas: ${p.titulo}`,
            html: plantilla("Ya tenés todas las propuestas que pediste", `<p>Recibiste las <b>${p.max_propuestas}</b> propuestas que pediste para <b>${esc(p.titulo)}</b>. Ya no llegan más.</p><p>Compará y elegí una. Si ninguna te convence, podés reabrir el proyecto con más cupos.</p>`, ["Ver las propuestas", link("/#mis-proyectos")]),
            notif: `Se completó el cupo de ${p.titulo}: ya podés elegir`, link: "/#mis-proyectos", mail: true });
      }
      if (evento === "propuesta_aceptada" && pr.estado === "aceptada" && p.origen === "publicado") {
        a(pro, `¡Aceptaron tu propuesta! ${p.titulo}`, plantilla("¡Aceptaron tu propuesta!", `<p><b>${esc(cli.nombre)}</b> aceptó tu propuesta para <b>${esc(p.titulo)}</b>. Estos son sus datos para coordinar:</p><p>WhatsApp: <b>${esc(cli.whatsapp)}</b><br>Email: <b>${esc(cli.email)}</b></p><p>Revisen juntos las etapas del acuerdo en la Red: anticipo, entregas y saldo.</p>`, ["Escribirle por WhatsApp", waLink(cli.whatsapp)]),
          `¡Aceptaron tu propuesta para ${p.titulo}!`, "/#mis-propuestas", true);
        a(cli, `Datos de ${pro.nombre} para coordinar`, plantilla("Ya pueden coordinar", `<p>Aceptaste la propuesta de <b>${esc(pro.nombre)}</b>. Sus datos:</p><p>WhatsApp: <b>${esc(pro.whatsapp)}</b><br>Email: <b>${esc(pro.email)}</b></p><p>El pago lo acuerdan entre ustedes. En la Red pueden registrar las etapas: anticipo, entregas y saldo.</p>`, ["Ver el acuerdo", link("/#mis-proyectos")]),
          `Aceptaste la propuesta de ${pro.nombre}: ya tenés sus datos`, "/#mis-proyectos", true);
        if (pr.firmante && pr.firmante_estado === "aceptado") {
          const f = await perfil(pr.firmante);
          a(f, "Se aceptó la propuesta que vas a firmar", plantilla("La propuesta fue aceptada", `<p>El cliente aceptó la propuesta de <b>${esc(pro.nombre)}</b> para <b>${esc(p.titulo)}</b>, donde figurás como firmante. Coordiná con ${esc(pro.nombre)} los pasos para la firma.</p>`),
            `Se aceptó la propuesta de ${pro.nombre} que vas a firmar`, "/#mis-propuestas");
        }
      }
      if (evento === "firma_invitacion" && pr.firmante && pr.firmante_estado === "invitado") {
        const f = await perfil(pr.firmante);
        a(f, `${pro.nombre} te invita a firmar un proyecto`, plantilla("Te invitan a firmar", `<p><b>${esc(pro.nombre)}</b> te propone como profesional firmante en su propuesta para <b>${esc(p.titulo)}</b> (${esc(p.localidad)}, ${esc(p.provincia)}).</p>`, ["Responder la invitación", link("/#mis-propuestas")]),
          `${pro.nombre} te invita a firmar: ${p.titulo}`, "/#mis-propuestas");
      }
    } else if (tabla === "preguntas") {
      const { data: q } = await db.from("preguntas").select("*").eq("id", id).maybeSingle();
      if (!q) return new Response("no existe", { status: 200 });
      const p = await proyecto(q.proyecto_id);
      if (evento === "pregunta_nueva") {
        const cli = await perfil(p.owner);
        a(cli, `Te hicieron una consulta sobre ${p.titulo}`, plantilla("Tenés una consulta nueva", `<p>“${esc(q.pregunta)}”</p><p>La consulta y tu respuesta solo las ven ustedes dos. Si te preguntan lo mismo varias veces, conviene sumar ese dato a la descripción del proyecto.</p>`, ["Responder", link(`/#proyecto-${p.id}`)]),
          `Nueva consulta sobre ${p.titulo}`, `/#proyecto-${p.id}`);
      }
      if (evento === "pregunta_respondida" && q.respuesta) {
        const au = await perfil(q.autor);
        a(au, `Respondieron tu consulta: ${p.titulo}`, plantilla("Respondieron tu consulta", `<p><b>Tu consulta:</b> ${esc(q.pregunta)}</p><p><b>Respuesta:</b> ${esc(q.respuesta)}</p>`, ["Ver el proyecto", link(`/#proyecto-${p.id}`)]),
          `Respondieron tu consulta sobre ${p.titulo}`, `/#proyecto-${p.id}`);
      }
    } else if (tabla === "solicitudes_servicio") {
      const { data: s } = await db.from("solicitudes_servicio").select("*").eq("id", id).maybeSingle();
      if (!s) return new Response("no existe", { status: 200 });
      const { data: sv } = await db.from("servicios").select("*").eq("id", s.servicio_id).maybeSingle();
      const pro = await perfil(sv.pro); const cli = await perfil(s.cliente);
      if (evento === "solicitud_nueva" && s.estado === "pendiente")
        a(pro, `Pedido nuevo: ${sv.titulo}`, plantilla("Te pidieron un servicio", `<p><b>${esc(cli.nombre)}</b> pidió <b>${esc(sv.titulo)}</b>, paquete <b>${esc(s.paquete)}</b>.</p><p>“${esc(s.mensaje)}”</p>`, ["Aceptar o rechazar", link("/#mis-servicios")]),
          `Pedido nuevo de ${cli.nombre}: ${sv.titulo}`, "/#mis-servicios");
      if (evento === "solicitud_aceptada" && s.estado === "aceptada") {
        a(cli, `${pro.nombre} aceptó tu pedido`, plantilla("Aceptaron tu pedido", `<p><b>${esc(pro.nombre)}</b> aceptó tu pedido de <b>${esc(sv.titulo)}</b>. Sus datos:</p><p>WhatsApp: <b>${esc(pro.whatsapp)}</b><br>Email: <b>${esc(pro.email)}</b></p>`, ["Ver el acuerdo", link("/#mis-proyectos")]),
          `${pro.nombre} aceptó tu pedido de ${sv.titulo}`, "/#mis-proyectos", true);
        a(pro, `Datos de ${cli.nombre} para coordinar`, plantilla("Pedido aceptado", `<p>Aceptaste el pedido de <b>${esc(cli.nombre)}</b>. Sus datos:</p><p>WhatsApp: <b>${esc(cli.whatsapp)}</b><br>Email: <b>${esc(cli.email)}</b></p>`, ["Escribirle por WhatsApp", waLink(cli.whatsapp)]),
          `Aceptaste el pedido de ${cli.nombre}: ya tenés sus datos`, "/#mis-propuestas", true);
      }
      if (evento === "solicitud_rechazada" && s.estado === "rechazada")
        a(cli, `Tu pedido de ${sv.titulo} no fue aceptado`, plantilla("Tu pedido no pudo tomarse", `<p>${esc(pro.nombre)} no puede tomar este pedido ahora. Podés pedírselo a otro profesional o publicar tu proyecto para recibir propuestas.</p>`, ["Publicar mi proyecto", link("/")]),
          `${pro.nombre} no pudo tomar tu pedido de ${sv.titulo}`, "/#servicios");
    } else if (tabla === "acuerdo_etapas") {
      const { data: e } = await db.from("acuerdo_etapas").select("*").eq("id", id).maybeSingle();
      if (!e || evento !== "etapa_marcada" || !e.marcado_at || e.confirmado_at) return new Response("sin aviso", { status: 200 });
      const p = await proyecto(e.proyecto_id);
      const { data: pr } = await db.from("propuestas").select("pro").eq("proyecto_id", p.id).eq("estado", "aceptada").maybeSingle();
      if (!pr) return new Response("sin aviso", { status: 200 });
      const soyPro = e.tipo === "pago";
      const destino = await perfil(soyPro ? pr.pro : p.owner);
      a(destino, `Confirmá: ${e.titulo} · ${p.titulo}`, plantilla("Hay una etapa para confirmar", `<p>${soyPro ? "El cliente marcó como pagada" : "El profesional marcó como entregada"} la etapa <b>${esc(e.titulo)}</b>${e.porcentaje ? ` (${e.porcentaje}%)` : ""} de <b>${esc(p.titulo)}</b>.</p>`, ["Confirmar", link(soyPro ? "/#mis-propuestas" : "/#mis-proyectos")]),
        `Confirmá la etapa «${e.titulo}» de ${p.titulo}`, soyPro ? "/#mis-propuestas" : "/#mis-proyectos");
    } else if (tabla === "proyectos") {
      const p = await proyecto(id);
      if (!p) return new Response("no existe", { status: 200 });
      if (evento === "proyecto_nuevo" && p.origen === "publicado") {
        const cli = await perfil(p.owner);
        a("ADMIN", `Proyecto publicado: ${p.titulo}`, plantilla("Se publicó un proyecto", `<p><b>${esc(p.titulo)}</b> · ${esc(p.rubro)} · ${esc(p.localidad)}, ${esc(p.provincia)}</p><p>Publicó: ${esc(cli.nombre)}. Si en 5 días no recibe propuestas, podés mandar la de Proyecta Más.</p>`, ["Ver proyecto", link(`/#proyecto-${p.id}`)]),
          `Proyecto publicado: ${p.titulo}`, `/#proyecto-${p.id}`);
      }
      if (evento === "proyecto_entregado" && p.estado === "entregado") {
        const { data: pr } = await db.from("propuestas").select("pro").eq("proyecto_id", p.id).eq("estado", "aceptada").maybeSingle();
        for (const [u, path] of [[p.owner, "/#mis-proyectos"], [pr?.pro, "/#mis-propuestas"]] as [string, string][]) {
          if (!u) continue;
          const x = await perfil(u);
          a(x, `Calificá el trabajo: ${p.titulo}`, plantilla("Trabajo terminado", `<p>Se confirmaron todas las etapas de <b>${esc(p.titulo)}</b>. Tomate un minuto para calificar.</p>`, ["Calificar", link(path)]),
            `Trabajo terminado: calificá ${p.titulo}`, path);
        }
      }
    } else if (tabla === "perfiles" && evento === "profesional_nuevo" && uid) {
      const u = await perfil(uid);
      if (u && u.rol === "pro")
        a("ADMIN", `Nuevo profesional: ${u.nombre}`, plantilla("Se registró un profesional", `<p><b>${esc(u.nombre)}</b> · ${esc(u.titulo || "")} · ${esc(u.localidad || "")}</p><p>Matrícula: ${esc(u.matricula || "no informó")}. Verificalo desde el panel.</p>`, ["Abrir el panel", link("/#panel")]),
          `Nuevo profesional: ${u.nombre}`, "/#panel");
    }
  } catch (e) { return new Response("error leyendo datos: " + String(e), { status: 500 }); }

  // push al celular
  const { data: claves } = await db.from("red_secretos").select("clave,valor").in("clave", ["vapid_public", "vapid_private"]);
  const kv = Object.fromEntries((claves || []).map((r: { clave: string; valor: string }) => [r.clave, r.valor]));
  const pushOk = !!(kv.vapid_public && kv.vapid_private);
  if (pushOk) webpush.setVapidDetails("mailto:hola@proyectamas.com.ar", kv.vapid_public, kv.vapid_private);
  const empujar = async (usuarios: string[], titulo: string, path: string) => {
    if (!pushOk || !usuarios.length) return;
    const { data: subs } = await db.from("push_suscripciones").select("*").in("usuario", usuarios);
    for (const sub of subs || []) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: "Red Proyecta Más", body: titulo, url: path }), { TTL: 86400 });
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await db.from("push_suscripciones").delete().eq("id", sub.id);
      }
    }
  };

  // admins para las notificaciones internas
  let admins: string[] = [];
  if (avisos.some((x) => x.para === "ADMIN"))
    admins = ((await db.from("perfiles").select("id").eq("rol", "admin")).data || []).map((r: { id: string }) => r.id);

  let enviados = 0;
  for (const m of avisos) {
    const clave = `${claveBase}:${m.para}:${m.subject}`;
    const { error: dup } = await db.from("avisos_log").insert({ clave });
    if (dup) continue; // ya se avisó
    const destinos = m.para === "ADMIN" ? admins : [m.para];
    if (destinos.length) await db.from("notificaciones").insert(destinos.map((p) => ({ para: p, titulo: m.notif, link: m.link })));
    await empujar(destinos, m.notif, m.link);
    if (!m.mail || !m.email) continue;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: DESDE, to: [m.email], subject: m.subject, html: m.html }),
    });
    if (r.ok) enviados++;
  }
  return new Response(`ok ${enviados}`, { status: 200 });
});
