// Avisos por mail de la Red Proyecta Más.
// Recibe {tabla, id, evento, uid?}. No confía en el pedido: relee el registro con permisos de servidor,
// verifica que el evento coincida con el estado real y registra cada aviso una sola vez (avisos_log).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SITIO = "https://red.proyectamas.com.ar";
const ADMIN = "hola@proyectamas.com.ar";
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
  const mails: { to: string; subject: string; html: string }[] = [];
  const claveBase = `${tabla}:${id || uid}:${evento}`;

  try {
    if (tabla === "propuestas") {
      const { data: pr } = await db.from("propuestas").select("*").eq("id", id).maybeSingle();
      if (!pr) return new Response("no existe", { status: 200 });
      const p = await proyecto(pr.proyecto_id); const pro = await perfil(pr.pro); const cli = await perfil(p.owner);
      if (evento === "propuesta_revision" && pr.estado === "revision")
        mails.push({ to: ADMIN, subject: `Propuesta para revisar: ${p.titulo}`, html: plantilla("Hay una propuesta para revisar", `<p><b>${esc(pro.nombre)}</b> mandó una propuesta para <b>${esc(p.titulo)}</b> y pidió tu revisión.</p><p>Precio ${esc(pr.precio)} · Plazo ${esc(pr.plazo)}</p>`, ["Abrir el panel", link("/#admin")]) });
      if (evento === "propuesta_correcciones" && pr.estado === "correcciones")
        mails.push({ to: pro.email, subject: "Tenés correcciones en tu propuesta", html: plantilla("Revisamos tu propuesta", `<p>Dejamos algunas correcciones para tu propuesta en <b>${esc(p.titulo)}</b>. Corregila y enviala al cliente desde <b>Mis propuestas</b>.</p>`, ["Ver correcciones", link("/#mis-propuestas")]) });
      if (evento === "propuesta_enviada" && pr.estado === "enviada") {
        mails.push({ to: cli.email, subject: `Recibiste una propuesta para ${p.titulo}`, html: plantilla("Recibiste una propuesta", `<p><b>${esc(pro.nombre)}</b> (${esc(pro.titulo || "profesional")}) te mandó una propuesta para <b>${esc(p.titulo)}</b>.</p><p>Precio ${esc(pr.precio)} · Plazo ${esc(pr.plazo)}</p><p>Llevás ${p.propuestas_enviadas} de ${p.max_propuestas} propuestas.</p>`, ["Ver la propuesta", link("/#mis-proyectos")]) });
        mails.push({ to: pro.email, subject: "Tu propuesta ya le llegó al cliente", html: plantilla("Propuesta enviada", `<p>Tu propuesta para <b>${esc(p.titulo)}</b> ya está en manos del cliente. Te avisamos si la acepta.</p>`) });
      }
      if (evento === "propuesta_aceptada" && pr.estado === "aceptada" && p.origen === "publicado") {
        mails.push({ to: pro.email, subject: `¡Aceptaron tu propuesta! ${p.titulo}`, html: plantilla("¡Aceptaron tu propuesta!", `<p><b>${esc(cli.nombre)}</b> aceptó tu propuesta para <b>${esc(p.titulo)}</b>. Estos son sus datos para coordinar:</p><p>WhatsApp: <b>${esc(cli.whatsapp)}</b><br>Email: <b>${esc(cli.email)}</b></p><p>Revisen juntos las etapas del acuerdo en la Red: anticipo, entregas y saldo.</p>`, ["Escribirle por WhatsApp", waLink(cli.whatsapp)]) });
        mails.push({ to: cli.email, subject: `Datos de ${pro.nombre} para coordinar`, html: plantilla("Ya pueden coordinar", `<p>Aceptaste la propuesta de <b>${esc(pro.nombre)}</b>. Sus datos:</p><p>WhatsApp: <b>${esc(pro.whatsapp)}</b><br>Email: <b>${esc(pro.email)}</b></p><p>El pago lo acuerdan entre ustedes. En la Red pueden registrar las etapas: anticipo, entregas y saldo.</p>`, ["Ver el acuerdo", link("/#mis-proyectos")]) });
        if (pr.firmante && pr.firmante_estado === "aceptado") {
          const f = await perfil(pr.firmante);
          mails.push({ to: f.email, subject: "Se aceptó la propuesta que vas a firmar", html: plantilla("La propuesta fue aceptada", `<p>El cliente aceptó la propuesta de <b>${esc(pro.nombre)}</b> para <b>${esc(p.titulo)}</b>, donde figurás como firmante. Contacto del cliente: ${esc(cli.whatsapp)} · ${esc(cli.email)}</p>`) });
        }
      }
      if (evento === "firma_invitacion" && pr.firmante && pr.firmante_estado === "invitado") {
        const f = await perfil(pr.firmante);
        mails.push({ to: f.email, subject: `${pro.nombre} te invita a firmar un proyecto`, html: plantilla("Te invitan a firmar", `<p><b>${esc(pro.nombre)}</b> te propone como profesional firmante en su propuesta para <b>${esc(p.titulo)}</b> (${esc(p.localidad)}, ${esc(p.provincia)}).</p><p>Si aceptás, figurás en la propuesta con tu título y matrícula.</p>`, ["Responder la invitación", link("/#mis-propuestas")]) });
      }
    } else if (tabla === "preguntas") {
      const { data: q } = await db.from("preguntas").select("*").eq("id", id).maybeSingle();
      if (!q) return new Response("no existe", { status: 200 });
      const p = await proyecto(q.proyecto_id);
      if (evento === "pregunta_nueva") {
        const cli = await perfil(p.owner);
        mails.push({ to: cli.email, subject: `Te hicieron una pregunta sobre ${p.titulo}`, html: plantilla("Tenés una pregunta nueva", `<p>“${esc(q.pregunta)}”</p><p>Responder rápido ayuda a que lleguen mejores propuestas. La respuesta queda a la vista de todos.</p>`, ["Responder", link(`/#proyecto-${p.id}`)]) });
      }
      if (evento === "pregunta_respondida" && q.respuesta) {
        const a = await perfil(q.autor);
        mails.push({ to: a.email, subject: `Respondieron tu pregunta: ${p.titulo}`, html: plantilla("Respondieron tu pregunta", `<p><b>Tu pregunta:</b> ${esc(q.pregunta)}</p><p><b>Respuesta:</b> ${esc(q.respuesta)}</p>`, ["Ver el proyecto", link(`/#proyecto-${p.id}`)]) });
      }
    } else if (tabla === "solicitudes_servicio") {
      const { data: s } = await db.from("solicitudes_servicio").select("*").eq("id", id).maybeSingle();
      if (!s) return new Response("no existe", { status: 200 });
      const { data: sv } = await db.from("servicios").select("*").eq("id", s.servicio_id).maybeSingle();
      const pro = await perfil(sv.pro); const cli = await perfil(s.cliente);
      if (evento === "solicitud_nueva" && s.estado === "pendiente")
        mails.push({ to: pro.email, subject: `Pedido nuevo: ${sv.titulo}`, html: plantilla("Te pidieron un servicio", `<p><b>${esc(cli.nombre)}</b> pidió <b>${esc(sv.titulo)}</b>, paquete <b>${esc(s.paquete)}</b>.</p><p>“${esc(s.mensaje)}”</p>`, ["Aceptar o rechazar", link("/#mis-servicios")]) });
      if (evento === "solicitud_aceptada" && s.estado === "aceptada") {
        mails.push({ to: cli.email, subject: `${pro.nombre} aceptó tu pedido`, html: plantilla("Aceptaron tu pedido", `<p><b>${esc(pro.nombre)}</b> aceptó tu pedido de <b>${esc(sv.titulo)}</b>. Sus datos:</p><p>WhatsApp: <b>${esc(pro.whatsapp)}</b><br>Email: <b>${esc(pro.email)}</b></p>`, ["Ver el acuerdo", link("/#mis-proyectos")]) });
        mails.push({ to: pro.email, subject: `Datos de ${cli.nombre} para coordinar`, html: plantilla("Pedido aceptado", `<p>Aceptaste el pedido de <b>${esc(cli.nombre)}</b>. Sus datos:</p><p>WhatsApp: <b>${esc(cli.whatsapp)}</b><br>Email: <b>${esc(cli.email)}</b></p>`, ["Escribirle por WhatsApp", waLink(cli.whatsapp)]) });
      }
      if (evento === "solicitud_rechazada" && s.estado === "rechazada")
        mails.push({ to: cli.email, subject: `Tu pedido de ${sv.titulo} no fue aceptado`, html: plantilla("Tu pedido no pudo tomarse", `<p>${esc(pro.nombre)} no puede tomar este pedido ahora. Podés pedírselo a otro profesional o publicar tu proyecto para recibir propuestas.</p>`, ["Publicar mi proyecto", link("/")]) });
    } else if (tabla === "acuerdo_etapas") {
      const { data: e } = await db.from("acuerdo_etapas").select("*").eq("id", id).maybeSingle();
      if (!e || evento !== "etapa_marcada" || !e.marcado_at || e.confirmado_at) return new Response("sin aviso", { status: 200 });
      const p = await proyecto(e.proyecto_id);
      const { data: pr } = await db.from("propuestas").select("pro").eq("proyecto_id", p.id).eq("estado", "aceptada").maybeSingle();
      if (!pr) return new Response("sin aviso", { status: 200 });
      const destino = await perfil(e.tipo === "pago" ? pr.pro : p.owner);
      mails.push({ to: destino.email, subject: `Confirmá: ${e.titulo} · ${p.titulo}`, html: plantilla("Hay una etapa para confirmar", `<p>${e.tipo === "pago" ? "El cliente marcó como pagada" : "El profesional marcó como entregada"} la etapa <b>${esc(e.titulo)}</b>${e.porcentaje ? ` (${e.porcentaje}%)` : ""} de <b>${esc(p.titulo)}</b>.</p>`, ["Confirmar", link("/#mis-proyectos")]) });
    } else if (tabla === "proyectos") {
      const p = await proyecto(id);
      if (!p) return new Response("no existe", { status: 200 });
      if (evento === "proyecto_nuevo" && p.origen === "publicado") {
        const cli = await perfil(p.owner);
        mails.push({ to: ADMIN, subject: `Proyecto publicado: ${p.titulo}`, html: plantilla("Se publicó un proyecto", `<p><b>${esc(p.titulo)}</b> · ${esc(p.rubro)} · ${esc(p.localidad)}, ${esc(p.provincia)}</p><p>Publicó: ${esc(cli.nombre)}. Si en 5 días no recibe propuestas, podés mandar la de Proyecta Más.</p>`, ["Ver proyecto", link(`/#proyecto-${p.id}`)]) });
      }
      if (evento === "proyecto_entregado" && p.estado === "entregado") {
        const { data: pr } = await db.from("propuestas").select("pro").eq("proyecto_id", p.id).eq("estado", "aceptada").maybeSingle();
        for (const u of [p.owner, pr?.pro].filter(Boolean)) {
          const x = await perfil(u as string);
          mails.push({ to: x.email, subject: `Calificá el trabajo: ${p.titulo}`, html: plantilla("Trabajo terminado", `<p>Se confirmaron todas las etapas de <b>${esc(p.titulo)}</b>. Tomate un minuto para calificar: tu nota se publica cuando califique la otra parte.</p>`, ["Calificar", link("/#mis-proyectos")]) });
        }
      }
    } else if (tabla === "perfiles" && evento === "profesional_nuevo" && uid) {
      const u = await perfil(uid);
      if (u && u.rol === "pro")
        mails.push({ to: ADMIN, subject: `Nuevo profesional: ${u.nombre}`, html: plantilla("Se registró un profesional", `<p><b>${esc(u.nombre)}</b> · ${esc(u.titulo || "")} · ${esc(u.localidad || "")}</p><p>Matrícula: ${esc(u.matricula || "no informó")}. Verificalo desde el panel.</p>`, ["Abrir el panel", link("/#admin")]) });
    }
  } catch (e) { return new Response("error leyendo datos: " + String(e), { status: 500 }); }

  let enviados = 0;
  for (const m of mails) {
    if (!m.to) continue;
    const clave = `${claveBase}:${m.to}`;
    const { error: dup } = await db.from("avisos_log").insert({ clave });
    if (dup) continue; // ya se mandó
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: DESDE, to: [m.to], subject: m.subject, html: m.html }),
    });
    if (!r.ok) { await db.from("avisos_log").delete().eq("clave", clave); return new Response(`Resend ${r.status}`, { status: 502 }); }
    enviados++;
  }
  return new Response(`ok ${enviados}`, { status: 200 });
});
