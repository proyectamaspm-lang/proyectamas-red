// Aviso de la lista de espera de la Red Proyecta Más.
// Recibe solo {id}; lee el registro con permisos de servidor y manda cada aviso una sola vez
// (marca 'avisado'), así una llamada repetida o falsa no genera mails de más.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const AVISO_PARA = "hola@proyectamas.com.ar";
const DESDE = "Red Proyecta Más <hola@proyectamas.com.ar>";
const WA = "+54 9 342 510-4877";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

async function enviar(key: string, to: string, subject: string, html: string, replyTo?: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: DESDE, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("método no permitido", { status: 405 });
  let id: number;
  try { id = Number((await req.json()).id); } catch { return new Response("pedido inválido", { status: 400 }); }
  if (!Number.isInteger(id) || id <= 0) return new Response("pedido inválido", { status: 400 });

  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return new Response("falta RESEND_API_KEY", { status: 500 });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Reclama el registro: solo sigue si todavía no fue avisado
  const { data: row, error } = await db.from("lista_espera").update({ avisado: true }).eq("id", id).eq("avisado", false).select().maybeSingle();
  if (error) return new Response(error.message, { status: 500 });
  if (!row) return new Response("ya avisado", { status: 200 });

  const pro = row.tipo === "profesional";
  const filas: [string, unknown][] = pro
    ? [["Título", row.titulo], ["Egreso", row.egreso], ["Especialidades", row.especialidades], ["Portfolio", row.portfolio]]
    : [["Tipo", row.tipo_publicante], ["Rubro", row.rubro], ["Necesita", row.necesidad]];
  const tabla = [["Nombre", row.nombre], ["Email", row.email], ["WhatsApp", row.whatsapp], ["Ubicación", [row.localidad, row.provincia].filter(Boolean).join(", ")], ...filas]
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:6px 10px;color:#5a6a85">${k}</td><td style="padding:6px 10px">${esc(v)}</td></tr>`).join("");
  const waNum = String(row.whatsapp).replace(/\D/g, "");

  try {
    await enviar(key, AVISO_PARA,
      pro ? `Nuevo profesional en la lista: ${row.nombre}` : `Nuevo pedido de proyecto: ${row.nombre}`,
      `<div style="font-family:Arial,sans-serif;color:#122e54"><h2 style="margin:0 0 10px">${pro ? "Se anotó un profesional" : "Alguien quiere publicar un proyecto"}</h2>
       <table style="border-collapse:collapse;font-size:14px">${tabla}</table>
       <p><a href="https://wa.me/${waNum}">Escribirle por WhatsApp</a> · <a href="https://supabase.com/dashboard/project/juruidkvovpydbsnfnwk/editor">Ver la lista completa</a></p></div>`,
      row.email);
    await enviar(key, row.email,
      "Te anotaste en la Red Proyecta Más",
      `<div style="font-family:Arial,sans-serif;color:#122e54;max-width:560px"><h2 style="margin:0 0 10px">¡Gracias, ${esc(String(row.nombre).split(" ")[0])}!</h2>
       <p>${pro ? "Quedaste anotado/a como profesional. Te vamos a avisar apenas abra la Red para que puedas ver los primeros proyectos y enviar propuestas." : "Recibimos tu pedido. Apenas abra la Red lo publicamos y te avisamos cuando empiecen a llegar propuestas de profesionales."}</p>
       <p>Si querés adelantar algo, escribinos por WhatsApp al ${WA}.</p>
       <p style="color:#5a6a85;font-size:13px">Proyecta Más · red.proyectamas.com.ar</p></div>`);
  } catch (e) {
    await db.from("lista_espera").update({ avisado: false }).eq("id", id);
    return new Response(String(e), { status: 502 });
  }
  return new Response("ok", { status: 200 });
});
