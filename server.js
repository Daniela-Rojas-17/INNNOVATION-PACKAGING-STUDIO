require("dotenv").config();

const express = require("express");
const { rateLimit } = require("express-rate-limit");
const fs = require("node:fs");
const path = require("node:path");
const OpenAI = require("openai").default;
const { toFile } = require("openai/uploads");
const { PACKAGE_CATALOG, PRODUCT_REFERENCES } = require("./catalog");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const MAX_REFERENCE_BYTES = 8 * 1024 * 1024;
const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini";
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const TRAINING_IMAGE_FOLDERS = {
  "01": ["AEROSOL 400ML ALTO", "03.png"],
  "02": ["AEROSOL 400ML BAJO", "03.png"],
  "03": ["AEROSOL 250ML", "03.png"],
  "04": ["DIAMANTE 700ML", "03.png"],
  "05": ["DIAMANTE 500ML", "03.png"],
  "06": ["BIDON CON ASA GALÓN CUADRADO", "03.png"],
  "07": ["BIDON CON ASA GALÓN OVALO", "03.png"],
  "08": ["ESTRIADO LITRO", "03.png"],
  "09": ["ESTRIADO 300ML", "03.png"],
  "10": ["CILINDRO 250ML", "03.png"]
};
const MIME_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT debe ser un número de puerto válido.");
}

const app = express();
const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  next();
});
app.use(express.json({ limit: "12mb" }));

const limitDesignRequests = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Se alcanzó el límite temporal de solicitudes de diseño. Intenta nuevamente en unos minutos."
  }
});

function getPackageId(entry) {
  return `ENV${entry.item.padStart(3, "0")}`;
}

function categoryFor(entry) {
  return entry.type.includes("AEROSOL") ? "Automotriz y hogar" : "Limpieza del hogar";
}

function localTrainingImage(entry) {
  const mapping = TRAINING_IMAGE_FOLDERS[entry.item];
  if (!mapping) return null;
  const imagePath = path.join(ROOT, "FOTOS", mapping[0], mapping[1]);
  return fs.existsSync(imagePath) ? imagePath : null;
}

function matchingReference(entry) {
  if (!entry.referenceForm || !entry.referenceVolumeMl) return null;
  return PRODUCT_REFERENCES.find((reference) => (
    reference.form === entry.referenceForm
    && reference.volumeMl === entry.referenceVolumeMl
  )) || null;
}

function publicPackage(entry) {
  const { referenceForm, referenceVolumeMl, ...technicalInfo } = entry;
  const image = localTrainingImage(entry)
    ? `/api/envases/${getPackageId(entry)}/imagen`
    : matchingReference(entry)?.image || null;
  return {
    ...technicalInfo,
    id: getPackageId(entry),
    reference: getPackageId(entry),
    category: categoryFor(entry),
    image
  };
}

function findPackage(id) {
  if (typeof id !== "string" || !/^ENV\d{3}$/.test(id)) return null;
  return PACKAGE_CATALOG.find((entry) => getPackageId(entry) === id) || null;
}

function imageMimeFromBuffer(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF"
    && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

function readUploadedImage(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match) return null;
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0 || buffer.length > MAX_REFERENCE_BYTES) return null;
  const mimeType = imageMimeFromBuffer(buffer);
  if (mimeType !== match[1]) return null;
  return { buffer, mimeType };
}

async function loadRemoteReference(reference) {
  const url = new URL(reference.image);
  if (!["simonizauto.com", "binner.com.co"].includes(url.hostname)) {
    throw new Error("La fuente de la imagen de referencia no está permitida.");
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`La imagen de referencia respondió ${response.status}.`);
  const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (!Object.hasOwn(MIME_EXTENSIONS, contentType)) {
    throw new Error("El sitio no devolvió una imagen compatible.");
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0 || buffer.length > MAX_REFERENCE_BYTES) {
    throw new Error("La imagen de referencia supera el tamaño permitido.");
  }
  const mimeType = imageMimeFromBuffer(buffer);
  if (mimeType !== contentType) throw new Error("La imagen de referencia no es válida.");
  return { buffer, mimeType };
}

async function imageForPackage(entry, uploadedDataUrl) {
  if (uploadedDataUrl) {
    const uploaded = readUploadedImage(uploadedDataUrl);
    if (!uploaded) {
      const error = new Error("La imagen debe ser PNG, JPG o WEBP y no superar 8 MB.");
      error.status = 400;
      throw error;
    }
    return uploaded;
  }

  const localImagePath = localTrainingImage(entry);
  if (localImagePath) {
    const buffer = await fs.promises.readFile(localImagePath);
    return { buffer, mimeType: imageMimeFromBuffer(buffer) };
  }

  const reference = matchingReference(entry);
  if (reference) return loadRemoteReference(reference);

  const error = new Error("Adjunta una foto de referencia del envase para generar la propuesta visual.");
  error.status = 400;
  throw error;
}

function requireOpenAI(response) {
  if (openai) return true;
  response.status(503).json({
    message: "El servicio de diseño IA no está configurado. Configura OPENAI_API_KEY en el servidor e inténtalo nuevamente."
  });
  return false;
}

function logOpenAIError(context, error) {
  const message = String(error?.message || "Error desconocido");
  const safeMessage = apiKey ? message.split(apiKey).join("[REDACTED]") : message;
  const code = error?.code || error?.error?.code;
  const type = error?.type || error?.error?.type;
  const requestId = error?.request_id || error?.requestID;
  console.error(
    `${context} (HTTP ${error?.status || "sin estado"}${type ? `, ${type}` : ""}${code ? `, ${code}` : ""}${requestId ? `, solicitud ${requestId}` : ""}): ${safeMessage}`
  );
}

function cleanText(value, maxLength = 700) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanStringArray(value, maximum = 8) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maximum)
    .map((item) => cleanText(item, 180))
    .filter(Boolean);
}

function normalizeDesignRoute(value, fallbackName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const palette = Array.isArray(value.paleta) ? value.paleta.slice(0, 6).map((color) => ({
    nombre: cleanText(color?.nombre, 50),
    hex: /^#[0-9a-f]{6}$/i.test(color?.hex) ? color.hex : "#D9E2E5",
    uso: cleanText(color?.uso, 120)
  })).filter((color) => color.nombre) : [];
  const route = {
    ruta: cleanText(value.ruta, 80) || fallbackName,
    concepto: cleanText(value.concepto),
    estilo: cleanText(value.estilo, 300),
    paleta: palette,
    tipografia: cleanText(value.tipografia, 300),
    personalidad_marca: cleanText(value.personalidad_marca, 300),
    jerarquia: cleanStringArray(value.jerarquia),
    elementos_graficos: cleanStringArray(value.elementos_graficos),
    fotografia: cleanText(value.fotografia, 400),
    claims: cleanStringArray(value.claims, 5),
    prompt_visual: cleanText(value.prompt_visual, 1200)
  };
  return route.concepto && route.estilo && route.prompt_visual ? route : null;
}

function normalizeProposal(value) {
  const proposal = normalizeDesignRoute(value, "Ruta recomendada");
  if (!proposal) return null;
  proposal.alternativas = Array.isArray(value.alternativas)
    ? value.alternativas.slice(0, 2)
      .map((route, index) => normalizeDesignRoute(route, `Alternativa ${index + 1}`))
      .filter(Boolean)
    : [];
  return proposal;
}

function requestedBrand(message, history) {
  const mentions = (text) => {
    const simoniz = /\bsimoniz\b/i.test(text);
    const binner = /\bbinner\b/i.test(text);
    if (simoniz && binner) return "ambas";
    if (simoniz) return "Simoniz";
    if (binner) return "Binner";
    return null;
  };
  const currentBrand = mentions(message);
  if (currentBrand) return currentBrand;
  if (Array.isArray(history)) {
    for (const turn of history.slice(-12).reverse()) {
      if (turn?.role !== "user") continue;
      const brand = mentions(cleanText(turn.content, 1200));
      if (brand) return brand;
    }
  }
  return null;
}

function brandArtDirection(brand) {
  const directions = {
    Simoniz: "SIMONIZ: interpreta la identidad como tecnología automotriz, rendimiento y precisión; trabaja con carbón, blanco y superficies metálicas, reserva el rojo para acentos de alto impacto y usa bloques geométricos, jerarquía contundente y códigos visuales técnicos.",
    Binner: "BINNER: interpreta la identidad como limpieza, frescura y eficiencia cotidiana; prioriza blanco, azul y turquesa, composición despejada, jerarquía fácil de escanear y recursos gráficos frescos y ordenados.",
    ambas: "El usuario solicita ambas marcas: crea rutas independientes para cada marca y una tercera ruta diferenciada solo si es coherente con el pedido. Mantén separadas sus identidades: SIMONIZ usa una dirección automotriz técnica de carbón, blanco, metal y acentos rojos; BINNER usa una dirección limpia y fresca de blanco, azul y turquesa. No mezcles sus códigos cromáticos en una misma propuesta."
  };
  return directions[brand] || "No se especificó marca: presenta tres rutas originales y claramente distintas, sin atribuirlas falsamente a Simoniz o Binner. Si el historial ya establece una marca, conserva esa dirección hasta que el usuario pida cambiarla.";
}

app.get("/api/envases", (request, response) => {
  response.json(PACKAGE_CATALOG.map(publicPackage));
});

app.get("/api/health", (request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/envases/:id/imagen", (request, response) => {
  const entry = findPackage(request.params.id);
  if (!entry) return response.status(404).json({ message: "El envase no existe." });
  const imagePath = localTrainingImage(entry);
  if (!imagePath) return response.status(404).json({ message: "No hay foto local para este envase." });
  return response.sendFile(imagePath);
});

app.post("/api/diseno", limitDesignRequests, async (request, response) => {
  if (!requireOpenAI(response)) return;
  const entry = findPackage(request.body?.envaseId);
  const message = cleanText(request.body?.mensaje, 2000);
  if (!entry) return response.status(400).json({ message: "Selecciona un envase reconocido antes de iniciar el diseño." });
  if (!message) return response.status(400).json({ message: "Escribe las instrucciones para la propuesta." });

  const history = Array.isArray(request.body?.historial)
    ? request.body.historial.slice(-12).map((turn) => {
      const role = turn?.role === "assistant" ? "Asistente" : "Usuario";
      return `${role}: ${cleanText(turn?.content, 1200)}`;
    }).filter((turn) => !turn.endsWith(": "))
    : [];
  const previousProposal = normalizeProposal(request.body?.propuestaAnterior);
  const previousConversation = history.length ? `\n\nHistorial de la sesión:\n${history.join("\n")}` : "";
  const previousConcept = previousProposal
    ? `\n\nPropuesta estructurada anterior (úsala para interpretar cambios solicitados):\n${JSON.stringify(previousProposal)}`
    : "";
  const brand = requestedBrand(message, history);
  const artDirection = brandArtDirection(brand);
  const userContent = [
    {
      type: "input_text",
      text: `Envase seleccionado: ${JSON.stringify(publicPackage(entry))}\nInstrucción del usuario: ${message}\nDirección de arte de marca: ${artDirection}${previousConversation}${previousConcept}\nLa respuesta debe estar en formato JSON válido.`
    }
  ];
  const imagePath = localTrainingImage(entry);
  const compatibleReferences = PRODUCT_REFERENCES.filter((reference) => (
    reference.form === entry.referenceForm
      && reference.volumeMl === entry.referenceVolumeMl
  ));
  const brandReference = brand === "Simoniz" || brand === "Binner"
    ? compatibleReferences.find((reference) => reference.brand === brand)
    : null;
  const visualReference = brandReference
    || (!imagePath ? compatibleReferences[0] : null);
  if (imagePath || visualReference) {
    try {
      if (imagePath) {
        const image = await fs.promises.readFile(imagePath);
        userContent.push({
          type: "input_text",
          text: "Referencia visual A: usa esta imagen únicamente para conservar exactamente la geometría, forma, capacidad y proporciones del recipiente seleccionado."
        });
        userContent.push({
          type: "input_image",
          image_url: `data:${imageMimeFromBuffer(image)};base64,${image.toString("base64")}`
        });
      }
      if (visualReference) {
        const image = await loadRemoteReference(visualReference);
        userContent.push({
          type: "input_text",
          text: `Referencia visual ${imagePath ? "B" : "A"} (${visualReference.brand}): úsala solo como inspiración de códigos gráficos, paleta, jerarquía y lenguaje de marca. No copies su etiqueta, composición, textos ni producto.`
        });
        userContent.push({
          type: "input_image",
          image_url: `data:${image.mimeType};base64,${image.buffer.toString("base64")}`
        });
      }
    } catch (error) {
      logOpenAIError("No se pudo cargar la imagen para el concepto", error);
      return response.status(502).json({
        message: "No fue posible cargar la imagen de referencia del envase. Intenta nuevamente."
      });
    }
  }

  try {
    const result = await openai.responses.create({
      model: OPENAI_TEXT_MODEL,
      instructions: [
        "Actúa como director de arte y diseñador gráfico senior especializado en identidad de marca y packaging comercial. En el chat, asesora al usuario con criterio profesional: producto, público, jerarquía de lectura, diferenciación en estantería, legibilidad y viabilidad de producción.",
        "Desarrolla exclusivamente el sistema gráfico aplicado al envase seleccionado. Conserva forma, material, capacidad, tapa y proporciones; nunca inventes especificaciones del recipiente.",
        "Usa la dirección de marca indicada en el mensaje y, cuando exista, la imagen del producto compatible como referencia de estilo únicamente. Extrae principios generales; crea un diseño original. No copies logotipos, etiquetas, fotografías, composición exacta, claims ni piezas de los sitios o imágenes de referencia. No inventes un logotipo oficial: reserva su área salvo que el usuario aporte un arte autorizado.",
        "Crea una dirección principal y dos rutas alternativas claramente distintas entre sí. Cambia de forma sustancial la idea, arquitectura de etiqueta, paleta, jerarquía y recursos gráficos; no presentes simples cambios de color del mismo diseño. Cada ruta debe poder visualizarse como una propuesta propia.",
        "En una conversación de ajustes, conserva la ruta elegida anteriormente y aplica el cambio pedido. Si el usuario solicita más opciones, renueva las rutas sin repetir los conceptos previos.",
        "No inventes afirmaciones técnicas o de eficacia: presenta cualquier claim como texto sugerido pendiente de validación.",
        "Devuelve solo un objeto JSON válido, sin Markdown, en español, con este esquema:",
        '{"ruta":"string","concepto":"string","estilo":"string","paleta":[{"nombre":"string","hex":"#RRGGBB","uso":"string"}],"tipografia":"string","personalidad_marca":"string","jerarquia":["string"],"elementos_graficos":["string"],"fotografia":"string","claims":["string"],"prompt_visual":"string","alternativas":[{"ruta":"string","concepto":"string","estilo":"string","paleta":[{"nombre":"string","hex":"#RRGGBB","uso":"string"}],"tipografia":"string","personalidad_marca":"string","jerarquia":["string"],"elementos_graficos":["string"],"fotografia":"string","claims":["string"],"prompt_visual":"string"},{"ruta":"string","concepto":"string","estilo":"string","paleta":[{"nombre":"string","hex":"#RRGGBB","uso":"string"}],"tipografia":"string","personalidad_marca":"string","jerarquia":["string"],"elementos_graficos":["string"],"fotografia":"string","claims":["string"],"prompt_visual":"string"}]}'
      ].join(" "),
      input: [{ role: "user", content: userContent }],
      text: { format: { type: "json_object" } },
      max_output_tokens: 3500
    });
    let rawProposal;
    try {
      rawProposal = JSON.parse(result.output_text);
    } catch {
      throw new Error("OpenAI devolvió una propuesta en un formato no válido.");
    }
    const proposal = normalizeProposal(rawProposal);
    if (!proposal) throw new Error("La propuesta no incluyó la información requerida.");
    const resumen = `${proposal.concepto}\n\nEstilo: ${proposal.estilo}\nSe prepararon ${proposal.alternativas.length + 1} rutas creativas para comparar.`;
    return response.json({ resumen, propuesta: proposal });
  } catch (error) {
    logOpenAIError("No se pudo generar el concepto de diseño", error);
    if (error.status === 429) {
      return response.status(503).json({
        message: "El servicio de diseño IA no está disponible por el momento. Intenta nuevamente más tarde."
      });
    }
    if (error.status === 400) {
      return response.status(502).json({
        message: "OpenAI rechazó la solicitud de diseño (HTTP 400). Reinicia el servidor para cargar la versión actualizada e inténtalo nuevamente."
      });
    }
    if (error.status === 401 || error.status === 403) {
      return response.status(503).json({
        message: "OpenAI rechazó la clave o sus permisos. Verifica OPENAI_API_KEY y el acceso del proyecto al modelo; luego reinicia el servidor."
      });
    }
    if (error.status === 404) {
      return response.status(503).json({
        message: "El modelo de diseño configurado no está disponible. Verifica OPENAI_TEXT_MODEL en el archivo .env y reinicia el servidor."
      });
    }
    return response.status(502).json({
      message: `No fue posible generar la propuesta${error.status ? ` (HTTP ${error.status})` : ""}. Revisa el registro del servidor e inténtalo nuevamente.`
    });
  }
});

app.post("/api/generar-imagen", limitDesignRequests, async (request, response) => {
  if (!requireOpenAI(response)) return;
  const entry = findPackage(request.body?.envaseId);
  const proposal = normalizeProposal(request.body?.propuesta);
  if (!entry) return response.status(400).json({ message: "Selecciona un envase reconocido antes de generar la imagen." });
  if (!proposal) return response.status(400).json({ message: "Primero crea una propuesta de diseño válida." });

  try {
    const reference = await imageForPackage(entry, request.body?.imagenReferencia);
    const prompt = [
      "Edita la imagen de referencia del envase para crear una fotografía comercial fotorrealista de una propuesta gráfica.",
      `Envase: ${entry.name}; tipo: ${entry.type}; capacidad: ${entry.content}; material: ${entry.material}.`,
      `Ruta seleccionada: ${proposal.ruta}.`,
      `Concepto: ${proposal.concepto}. Estilo: ${proposal.estilo}.`,
      `Paleta: ${proposal.paleta.map((color) => `${color.nombre} ${color.hex} (${color.uso})`).join("; ")}.`,
      `Tipografía: ${proposal.tipografia}. Jerarquía: ${proposal.jerarquia.join("; ")}.`,
      `Elementos gráficos: ${proposal.elementos_graficos.join("; ")}. Fotografía: ${proposal.fotografia}.`,
      `Claims sugeridos (si caben en la etiqueta): ${proposal.claims.join("; ")}.`,
      `Dirección visual: ${proposal.prompt_visual}.`,
      "Construye una propuesta visual original, con una solución gráfica completa, memorable y distinta de las referencias existentes; evita repetir layouts genéricos y no añadas textos ilegibles ni claims no aprobados.",
      "REGLA INNEGOCIABLE: conserva exactamente el envase físico de la foto de referencia: geometría, forma, silueta, proporciones, tapa, material y perspectiva. No cambies, deformes ni sustituyas el envase. Modifica únicamente la gráfica y la etiqueta; no añadas elementos que alteren su forma física."
    ].join(" ");
    const result = await openai.images.edit({
      model: OPENAI_IMAGE_MODEL,
      image: await toFile(reference.buffer, `referencia${MIME_EXTENSIONS[reference.mimeType]}`, { type: reference.mimeType }),
      prompt,
      size: "1024x1024",
      quality: "medium"
    });
    const encodedImage = result.data?.[0]?.b64_json;
    if (!encodedImage) throw new Error("El servicio no devolvió una imagen.");
    return response.json({ imagen: `data:image/png;base64,${encodedImage}` });
  } catch (error) {
    logOpenAIError("No se pudo generar la propuesta visual", error);
    if (error.status === 429) {
      return response.status(503).json({
        message: "El servicio de diseño IA no está disponible por el momento. Intenta nuevamente más tarde."
      });
    }
    if (error.status === 400) {
      return response.status(400).json({ message: error.message });
    }
    return response.status(502).json({
      message: "No fue posible generar la propuesta. Intenta nuevamente."
    });
  }
});

app.get("/", (request, response) => response.sendFile(path.join(ROOT, "index.html")));
app.get("/styles.css", (request, response) => response.sendFile(path.join(ROOT, "styles.css")));
app.get("/catalog.js", (request, response) => response.sendFile(path.join(ROOT, "catalog.js")));
app.get("/app.js", (request, response) => response.sendFile(path.join(ROOT, "app.js")));

app.use("/api", (request, response) => {
  response.status(404).json({ message: "La ruta solicitada no existe." });
});

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  if (error instanceof SyntaxError && "body" in error) {
    return response.status(400).json({ message: "La solicitud no contiene JSON válido." });
  }
  if (error.type === "entity.too.large") {
    return response.status(413).json({ message: "La solicitud supera el tamaño permitido." });
  }
  console.error("Error inesperado del servidor:", String(error.message || error));
  return response.status(500).json({ message: "Ocurrió un error inesperado. Intenta nuevamente." });
});

app.listen(PORT, HOST, () => {
  console.log(`Aplicación lista en http://${HOST}:${PORT}`);
  if (!openai) {
    console.error("OPENAI_API_KEY no está configurada. El catálogo funcionará, pero las funciones de diseño IA estarán deshabilitadas.");
  }
});
