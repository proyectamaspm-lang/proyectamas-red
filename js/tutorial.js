"use strict";
/* Tutorial guiado de la Red: resalta cada parte de la página y explica qué poner en cada campo.
   Se abre solo la primera vez (por tipo de cuenta) y se puede volver a ver con "Ver tutorial". */
(function () {
  const RECORRIDOS = {
    /* quien publica (o visitante) */
    cli: [
      { hash: "", sel: null, t: "Bienvenido a la Red", x: "Acá publicás lo que necesitás (un anteproyecto, planos de instalación, renders, un cómputo) y te llegan propuestas de profesionales de todo el país. Es gratis y sin comisiones. Te mostramos dónde está cada cosa." },
      { hash: "proyectos", sel: "#proyectos .boardhead", t: "El tablero", x: "Todos los proyectos publicados. Podés buscar por palabra, rubro, provincia o si todavía tienen lugar para propuestas." },
      { hash: "profesionales", sel: "#v-profesionales .boardhead, #v-profesionales h1, #v-profesionales h2", t: "Profesionales", x: "El directorio con perfiles, trabajos, calificaciones y cuánto tardan en responder. El sello Verificado indica que revisamos su identidad, y el de Matrícula, que la matrícula está confirmada." },
      { hash: "servicios", sel: "#v-servicios h1, #v-servicios h2", t: "Servicios con precio cerrado", x: "Si tu necesidad es simple (un plano eléctrico, 3 renders), quizás ya hay un servicio con precio y plazo fijos. Lo pedís y listo, sin esperar propuestas." },
      { hash: "publicar", sel: "#p-titulo", t: "Publicar: el título", x: "Qué necesitás en una línea. Sé concreto: «Anteproyecto de vivienda en lote de 10 × 30 con desnivel» atrae mejores propuestas que «Necesito un arquitecto»." },
      { hash: "publicar", sel: "#p-rubro", t: "Rubro y tipo de trabajo", x: "Elegí la especialidad (arquitectura, eléctrica, 3D…) y qué querés recibir. Así le aparece a los profesionales correctos." },
      { hash: "publicar", sel: "#p-desc", t: "La descripción", x: "Contá el programa (ambientes, plantas, cochera), el estilo que te gusta y qué tenés hecho: mensura, planos viejos, fotos. Cuanto más claro, menos preguntas y mejores precios." },
      { hash: "publicar", sel: "#p-frente", t: "Medidas del terreno", x: "Frente, fondo y superficie a proyectar en metros. Si no sabés la superficie, dejala vacía: con frente y fondo alcanza para empezar." },
      { hash: "publicar", sel: "#p-desnivel", t: "Particularidades", x: "Lo que cambia el trabajo: desnivel, lote en esquina, medianeras, construcción existente que se mantiene." },
      { hash: "publicar", sel: "#p-loc", t: "Ubicación, plazo y presupuesto", x: "La localidad importa por el código de edificación. El plazo y el presupuesto son opcionales, pero ayudan a que te propongan algo que encaje." },
      { hash: "publicar", sel: "#chipin", t: "Etiquetas", x: "Palabras clave para que te encuentren: #vivienda, #reforma, #Revit, #steel frame. Escribí y apretá Enter, o tocá las sugeridas." },
      { hash: "publicar", sel: "#p-max", t: "Cuántas propuestas querés", x: "Cuando llegás a ese número el proyecto deja de recibir propuestas, así no te llenás de mensajes. Si ninguna te convence, lo reabrís con más cupos." },
      { hash: "publicar", sel: "#pubsend", t: "Publicar", x: "Listo. Los profesionales pueden hacerte consultas (solo las ven ustedes dos; las respondés desde la ficha) y mandarte propuestas. Si te preguntan lo mismo varias veces, sumá ese dato con «Editar proyecto». Te avisamos por mail cada vez que llega algo." },
      { hash: "", sel: "#bell", t: "Tus avisos", x: "En la campanita te avisamos cuando llega una propuesta, una consulta o se completa tu cupo. También te llega por mail." },
      { hash: "", sel: "#umbtn", t: "Mis proyectos", x: "Desde tu menú entrás a Mis proyectos: ahí comparás propuestas, ves el perfil y las calificaciones de cada profesional y aceptás la que más te guste. Al aceptar se comparten los contactos." },
      { hash: "", sel: null, t: "Después de aceptar", x: "En el mismo lugar aparecen las etapas del acuerdo (anticipo, entrega, saldo) para que los dos vayan marcando el avance. Solo las ven ustedes dos. Al terminar, se califican mutuamente." }
    ],
    /* profesional */
    pro: [
      { hash: "", sel: null, t: "Bienvenido a la Red", x: "Acá encontrás proyectos de arquitectura, ingeniería y obra de todo el país y mandás tu propuesta. Te mostramos dónde está cada cosa y qué conviene poner en cada lugar." },
      { hash: "proyectos", sel: "#proyectos .filters, #proyectos .boardhead", t: "Buscar proyectos", x: "Filtrá por rubro, provincia o si todavía tienen cupo. La barrita de cada tarjeta muestra cuántas propuestas quedan disponibles." },
      { hash: "proyectos", sel: "#grid .card, #grid", t: "La ficha del proyecto", x: "Tocá una tarjeta para ver medidas, descripción y preguntas. Si algo no está claro, consultá antes de cotizar: la consulta y la respuesta solo las ven vos y quien publicó." },
      { hash: "", sel: null, t: "Tu propuesta, campo por campo", x: "En la ficha está el formulario. «Usar plantilla» te arma la estructura: cómo lo encararías, qué entregás, cuántas revisiones incluís y la forma de pago. Completá precio y plazo con números concretos. La primera vez que lo abras te guiamos por cada campo." },
      { hash: "", sel: null, t: "Revisión antes de enviar", x: "Si tildás «Que Proyecta Más revise mi propuesta», te devolvemos sugerencias en 24 h hábiles antes de que la vea el cliente. Muy recomendable para las primeras." },
      { hash: "kit", sel: "#primer-cliente", t: "Kit primer cliente", x: "10 manuales cortos (cómo cotizar, cómo escribir la propuesta, contratos, matriculación), una calculadora de valor hora y la reserva de llamadas de 30 minutos por Meet." },
      { hash: "kit", sel: "#calc", t: "Calculadora de valor hora", x: "Poné tus gastos fijos, lo que querés ganar y las horas que facturás: te da tu valor hora y el precio sugerido para el trabajo, con anticipo y saldo." },
      { hash: "estimador", sel: "#estimador", t: "Estimador de honorarios", x: "Rango de referencia según el tipo de trabajo, los m² y la complejidad. También aparece dentro del formulario de propuesta. Solo lo ven los profesionales." },
      { hash: "kit", sel: "#call", t: "Llamada de 30 minutos", x: "¿Dudas con una cotización o un cliente? Elegí día y horario y confirmalo por WhatsApp. Te mandamos el link de Meet." },
      { hash: "perfil", sel: "#perfilbox form, #perfilbox", t: "Tu perfil", x: "Completá título, matrícula, especialidades y software. Sumá de 3 a 6 imágenes de tus trabajos: sirven los de la facultad. Un perfil completo es lo que más decide al cliente." },
      { hash: "perfil", sel: "#perfilbox .note, #perfilbox", t: "Sello Verificado", x: "Pedilo por WhatsApp con foto de tu DNI (y matrícula si tenés). Los perfiles verificados aparecen primero." },
      { hash: "mis-servicios", sel: "#svnew", t: "Servicios con precio cerrado", x: "Publicá trabajos que hagas seguido, con hasta 3 paquetes (Básico, Estándar, Completo). El cliente los pide directo, sin competir con otras propuestas." },
      { hash: "mis-propuestas", sel: "#v-mis-propuestas h1, #v-mis-propuestas h2", t: "Mis propuestas", x: "El estado de cada propuesta, las correcciones de la revisión y los trabajos aceptados con el contacto del cliente. Ahí también marcan las etapas del acuerdo, que solo ven ustedes dos, y se califican al terminar." },
      { hash: "", sel: "#bell", t: "Tus avisos", x: "En la campanita te avisamos cuando responden tu consulta, te devolvemos correcciones o aceptan tu propuesta. También te llega por mail." },
      { hash: "herramientas", sel: "#beneficios", t: "Herramientas", x: "Planillas, software y manuales con descuento por transferencia o 3 cuotas sin interés. Consultás directo por WhatsApp." }
    ],
    /* formulario de propuesta (dentro de la ficha) */
    propuesta: [
      { sel: "#tpl", t: "Empezá por la plantilla", x: "Te arma la estructura que mejor funciona: presentación corta, cómo lo encararías por etapas, qué entregás, revisiones incluidas y forma de pago. Reemplazá lo que está entre corchetes." },
      { sel: "#pm", t: "El texto de la propuesta", x: "Mencioná algo específico del proyecto (las medidas, el desnivel, el estilo) para que se note que lo leíste. Evitá textos genéricos que sirven para cualquier proyecto." },
      { sel: "#pp", t: "Precio y plazo", x: "Un número cerrado y un plazo realista, por ejemplo «$450.000» y «20 días». Si el trabajo va por etapas, aclaralo en el texto." },
      { sel: "#est-prop", t: "Referencia de honorarios", x: "Rango orientativo para este tipo de trabajo. Si tu precio queda muy abajo, revisalo con la calculadora del Kit." },
      { sel: "#fbus", t: "Firmante (opcional)", x: "Si el trabajo necesita la firma de un matriculado con otra incumbencia, buscalo por nombre y sumalo. Le llega una invitación para aceptar." },
      { sel: "#rev", t: "Revisión de Proyecta Más", x: "Dejala tildada en tus primeras propuestas: te devolvemos correcciones concretas antes de que la vea el cliente." }
    ]
  };

  RECORRIDOS.visita = [
    ...RECORRIDOS.cli.slice(0, 4),
    { hash: "", sel: "[data-auth='up']", t: "Creá tu cuenta gratis", x: "Para publicar un proyecto o mandar propuestas necesitás una cuenta. Elegís si sos quien publica o profesional, y después te guiamos campo por campo." }
  ];

  let pasos = [], i = 0, clave = "", raiz = null, luz = null, card = null;
  const visto = k => { try { return localStorage.getItem("tuto-" + k) === "1"; } catch { return false; } };
  const marcar = k => { try { localStorage.setItem("tuto-" + k, "1"); } catch { } };
  const visible = el => el && el.offsetParent !== null && el.getClientRects().length > 0;
  const buscar = sel => { if (!sel) return null; for (const s of sel.split(",")) { const el = document.querySelector(s.trim()); if (visible(el)) return el; } return null; };

  function montar() {
    quitar();
    const host = document.querySelector("dialog[open]") || document.body;
    raiz = document.createElement("div"); raiz.className = "tuto"; raiz.setAttribute("role", "dialog"); raiz.setAttribute("aria-live", "polite");
    raiz.innerHTML = `<div class="tuto-luz"></div><div class="tuto-card"></div>`;
    host.appendChild(raiz);
    luz = raiz.querySelector(".tuto-luz"); card = raiz.querySelector(".tuto-card");
    addEventListener("resize", ubicar); addEventListener("scroll", ubicar, true);
    document.addEventListener("keydown", teclas);
  }
  function quitar() {
    if (raiz) raiz.remove(); raiz = null;
    removeEventListener("resize", ubicar); removeEventListener("scroll", ubicar, true);
    document.removeEventListener("keydown", teclas);
  }
  function teclas(e) { if (e.key === "Escape") cerrar(); if (e.key === "ArrowRight") ir(i + 1); if (e.key === "ArrowLeft" && i > 0) ir(i - 1); }

  function pintar() {
    const p = pasos[i], ult = i === pasos.length - 1;
    card.innerHTML = `<div class="tuto-top"><span class="eyebrow">Paso ${i + 1} de ${pasos.length}</span><button type="button" class="tuto-x" aria-label="Cerrar tutorial">✕</button></div>
      <b class="tuto-t">${p.t}</b><p>${p.x}</p>
      <div class="tuto-bar"><i style="width:${(i + 1) / pasos.length * 100}%"></i></div>
      <div class="tuto-acc">${i > 0 ? `<button type="button" class="btn o sm" data-t="-1">Atrás</button>` : ""}<button type="button" class="btn sm" data-t="1">${ult ? "Terminar" : "Siguiente"}</button></div>
      ${ult ? "" : `<button type="button" class="tuto-saltar">Saltar tutorial</button>`}`;
    card.querySelector(".tuto-x").onclick = cerrar;
    card.querySelector(".tuto-saltar")?.addEventListener("click", cerrar);
    card.querySelectorAll("[data-t]").forEach(b => b.onclick = () => ult && b.dataset.t === "1" ? cerrar() : ir(i + +b.dataset.t));
    card.querySelector("[data-t='1']").focus({ preventScroll: true });
  }
  function ubicar() {
    if (!raiz) return;
    const el = buscar(pasos[i]?.sel);
    const m = innerWidth < 640;
    if (!el) { luz.hidden = true; card.className = "tuto-card centro"; card.style.cssText = ""; return; }
    const r = el.getBoundingClientRect(), pad = 8;
    luz.hidden = false;
    Object.assign(luz.style, { top: r.top - pad + "px", left: r.left - pad + "px", width: r.width + pad * 2 + "px", height: Math.min(r.height, innerHeight * .6) + pad * 2 + "px" });
    if (m) { card.className = "tuto-card abajo"; card.style.cssText = ""; if (r.top > innerHeight * .45) card.classList.replace("abajo", "arriba"); return; }
    card.className = "tuto-card"; const ch = card.offsetHeight, cw = card.offsetWidth;
    let top = r.top + Math.min(r.height, innerHeight * .6) + pad + 14;
    let left = Math.min(Math.max(12, r.left), innerWidth - cw - 12);
    if (top + ch > innerHeight - 12) {
      top = r.top - pad - 14 - ch;
      if (top < 12) { top = innerHeight - ch - 16; left = r.right + 16 + cw < innerWidth ? r.right + 16 : innerWidth - cw - 16; }
    }
    card.style.top = top + "px"; card.style.left = left + "px";
  }
  async function ir(n) {
    if (n < 0 || n >= pasos.length) return;
    i = n; const p = pasos[i];
    if (p.hash !== undefined && location.hash.slice(1) !== p.hash) {
      if (document.querySelector("#dlg[open]") && raiz?.parentElement === document.body) document.querySelector("#dlg").close();
      location.hash = p.hash; await new Promise(r => setTimeout(r, 450));
    }
    pintar();
    const el = buscar(p.sel);
    if (el) el.scrollIntoView({ block: "center", behavior: "instant" });
    else if (p.hash === "") scrollTo(0, 0);
    requestAnimationFrame(ubicar);
  }
  function cerrar() { marcar(clave); quitar(); }

  window.tutorial = {
    abrir(k) {
      if (!RECORRIDOS[k]) return;
      clave = k; pasos = RECORRIDOS[k]; i = 0; montar(); ir(0);
    },
    /* primera vez por tipo de cuenta */
    auto(k) {
      if (visto(k) || this._pend) return; this._pend = true;
      setTimeout(() => { this._pend = false; if (!raiz && !visto(k) && !document.querySelector("dialog[open]")) this.abrir(k); }, 900);
    },
    autoPropuesta() { if (!visto("propuesta")) setTimeout(() => this.abrir("propuesta"), 500); }
  };
})();
