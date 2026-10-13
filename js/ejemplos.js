"use strict";
/* Proyectos de ejemplo: muestran cómo se ve un proyecto bien publicado y una buena propuesta.
   Llevan el sello EJEMPLO, no reciben propuestas y no están en la base. */
(function () {
  const hace = d => new Date(Date.now() - d * 864e5 - 3 * 36e5).toISOString();
  const ej = (o) => Object.assign({ ejemplo: true, estado: "abierto", reabierto: false, owner: null, preguntas: [{ count: (o.qa || []).length }], qa: [], props: [] }, o);
  window.EJEMPLOS = [
    ej({
      id: "ej1", titulo: "Anteproyecto de vivienda con oficina y pileta en terreno con desnivel", owner_p: { tipo_cliente: "Particular" },
      rubro: "Arquitectura", trabajo: "Anteproyecto", modalidad: "Remoto",
      descripcion: "Casa de 2 plantas + terraza verde al fondo del lote, oficina independiente con baño al frente, cochera para 3 autos y pileta en el medio. Los primeros 14 m están a nivel de vereda y el fondo sube 1,50 m. Estilo contemporáneo: hormigón visto, piedra, madera y carpinterías negras.",
      entregables: "Implantación, plantas, cortes con desnivel, fachadas, modelo 3D y 4 renders. PDF + DWG.",
      frente: 10, fondo: 24.5, superficie: 220, particularidad: "+1,50 m desde los 14 m", provincia: "Santa Fe", localidad: "Funes",
      plazo: "45 días", presupuesto: "$500.000", etiquetas: ["vivienda", "anteproyecto", "render", "desnivel", "pileta"],
      max_propuestas: 10, propuestas_enviadas: 3, created_at: hace(1),
      qa: [{ q: "¿Tenés plano de mensura o solo medidas aproximadas?", a: "Tengo la mensura en PDF, la comparto con quien quede." }, { q: "¿La terraza lleva parrilla o solo deck?", a: "Parrilla chica y deck, sin techo." }],
      props: [
        { nom: "Lucía M.", sub: "Arquitecta · recibida en 2025", precio: "$480.000", plazo: "40 días", txt: "Propongo resolver el desnivel con la pileta y el área social sobre la plataforma de +1,50, apoyada en el muro de contención, y dejar cochera y oficina a nivel de vereda. Así la casa gana privacidad sin escaleras largas.\n\nEntrego implantación, plantas, 2 cortes por el desnivel, 4 fachadas, modelo 3D en SketchUp y 4 renders en D5. Incluyo 2 rondas de ajustes por etapa.\n\nPago: 30% al inicio, 30% al aprobar plantas y 40% con los renders." },
        { nom: "Martín R.", sub: "Maestro Mayor de Obras", precio: "$520.000", plazo: "45 días", txt: "Hola Carolina, soy Martín, MMO. Propongo elevar la casa sobre la plataforma de +1,50 y bajar la pileta a nivel intermedio para ganar privacidad desde la calle.\n\nEntrego implantación, plantas, cortes, fachadas, modelo 3D en Revit y 4 renders. PDF + DWG + modelo editable.\n\n2 rondas de ajustes por etapa. Plazo: 45 días. Precio: $520.000 (30% / 30% / 40%)." },
        { nom: "Sofía G.", sub: "Arquitecta · recibida en 2024", precio: "$450.000", plazo: "35 días", txt: "Hola, soy Sofía. Me gustó el desafío del desnivel: lo resolvería con una rampa vehicular corta y una escalera-jardín que conecte oficina y casa.\n\nEntrego plantas, 2 cortes, fachadas y 4 renders en D5. PDF + DWG.\n\nPlazo: 35 días. Precio: $450.000 (30% al inicio, 70% contra entrega)." }
      ]
    }),
    ej({
      id: "ej2", titulo: "Plano eléctrico para local comercial de 80 m²", owner_p: { tipo_cliente: "Empresa" },
      rubro: "Instalación eléctrica", trabajo: "Planos de instalación", modalidad: "Remoto",
      descripcion: "Inmobiliaria necesita plano eléctrico con unifilar y planilla de cargas para habilitar un local gastronómico chico. Hay plano de arquitectura en DWG.",
      entregables: "Plano de instalación, unifilar, planilla de cargas. DWG + PDF.",
      frente: 6, fondo: 13.5, superficie: 80, particularidad: null, provincia: "Santa Fe", localidad: "Rosario",
      plazo: "10 días", presupuesto: "A convenir", etiquetas: ["eléctrico", "local comercial", "AutoCAD"],
      max_propuestas: 5, propuestas_enviadas: 5, estado: "completo", created_at: hace(3)
    }),
    ej({
      id: "ej3", titulo: "Cómputo y presupuesto para ampliación de 2 dormitorios", owner_p: { tipo_cliente: "Particular" },
      rubro: "Cómputo y presupuesto", trabajo: "Cómputo y presupuesto", modalidad: "Remoto",
      descripcion: "Tengo los planos aprobados de una ampliación en planta alta (2 dormitorios + baño, 38 m²). Necesito cómputo de materiales y presupuesto de mano de obra para comparar con lo que me pasaron los constructores.",
      entregables: "Planilla de cómputo y presupuesto por rubro.",
      frente: null, fondo: null, superficie: 38, particularidad: "Planta alta sobre losa existente", provincia: "Córdoba", localidad: "Villa Allende",
      plazo: "7 días", presupuesto: null, etiquetas: ["reforma", "cómputo", "planta alta"],
      max_propuestas: 8, propuestas_enviadas: 1, created_at: hace(6),
      qa: [{ q: "¿La losa existente está calculada para una planta más?", a: "Sí, lo verificó un ingeniero cuando se hizo la casa." }],
      props: [{ soloPro: true, nom: "Proyecta Más", sub: "Propuesta de respaldo · 5 días sin propuestas", precio: "$180.000", plazo: "5 días", txt: "Hacemos el cómputo completo por rubro con nuestra Suite de Cómputo y Presupuesto: materiales con cantidades y mano de obra según escala UOCRA vigente.\n\nTe entregamos la planilla editable para que compares rubro por rubro con los presupuestos de los constructores." }]
    }),
    ej({
      id: "ej4", titulo: "Modelado Revit de edificio PB + 3 desde planos en PDF", owner_p: { tipo_cliente: "Estudio" },
      rubro: "BIM / Revit", trabajo: "Modelado 3D", modalidad: "Remoto",
      descripcion: "Estudio busca colaborador/a freelance para modelar en Revit (LOD 300) un edificio de PB + 3 pisos con 8 departamentos. Pasamos plantas, cortes y fachadas en PDF y una plantilla propia.",
      entregables: "Modelo .rvt LOD 300 con familias de carpinterías.",
      frente: 8.66, fondo: 30, superficie: 640, particularidad: null, provincia: "CABA", localidad: "Caballito",
      plazo: "20 días", presupuesto: "$900.000", etiquetas: ["Revit", "edificio", "LOD 300"],
      max_propuestas: 15, propuestas_enviadas: 7, created_at: hace(2),
      qa: [{ q: "¿Incluye familias de carpinterías a medida?", a: "Sí, son 6 tipos; mandamos las planillas." }]
    }),
    ej({
      id: "ej5", titulo: "Relevamiento y plano para regularizar quincho y garaje", owner_p: { tipo_cliente: "Particular" },
      rubro: "Relevamiento y regularización", trabajo: "Relevamiento", modalidad: "Presencial",
      descripcion: "Construí un quincho de 30 m² y un garaje sin permiso. Necesito relevamiento y planos para regularizar ante el municipio. Busco a alguien de la zona.",
      entregables: "Relevamiento y planos de regularización.",
      frente: 12, fondo: 35, superficie: 58, particularidad: null, provincia: "Buenos Aires", localidad: "Mar del Plata",
      plazo: "A convenir", presupuesto: "$280.000", etiquetas: ["regularización", "relevamiento", "quincho"],
      max_propuestas: 6, propuestas_enviadas: 1, created_at: hace(4)
    }),
    ej({
      id: "ej6", titulo: "Proyecto de gas para cocina de PH", owner_p: { tipo_cliente: "Particular" },
      rubro: "Instalación sanitaria y gas", trabajo: "Planos de instalación", modalidad: "Presencial",
      descripcion: "Remodelo la cocina de un PH y cambio de lugar la cocina y el calefón. Necesito el proyecto de gas para presentar a la distribuidora.",
      entregables: "Plano de gas con cálculo de cañerías.",
      frente: null, fondo: null, superficie: 14, particularidad: null, provincia: "Santa Fe", localidad: "Santa Fe",
      plazo: "15 días", presupuesto: "A convenir", etiquetas: ["gas", "PH", "reforma"],
      max_propuestas: 3, propuestas_enviadas: 0, created_at: hace(0)
    })
  ];
})();
