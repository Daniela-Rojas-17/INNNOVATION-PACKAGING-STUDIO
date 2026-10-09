(() => {
  const MODEL_URL = "https://teachablemachine.withgoogle.com/models/Bsi-nf_xh/";
  const MIN_CONFIDENCE = 0.95;
  const SPECIFICATIONS = [
    ["Tipo de envase", "type"],
    ["Material", "material"],
    ["Contenido neto", "content"],
    ["Diámetro", "diameter"],
    ["Alto sin tapa", "heightWithoutCap"],
    ["Alto con tapa", "heightWithCap"],
    ["Ancho", "width"],
    ["Profundo", "depth"],
    ["Rosca", "thread"],
    ["Color", "color"]
  ];

  const elements = {
    serverNotice: document.querySelector("#server-notice"),
    modelStatus: document.querySelector("#model-status"),
    uploadTab: document.querySelector("#upload-tab"),
    cameraTab: document.querySelector("#camera-tab"),
    uploadPanel: document.querySelector("#upload-panel"),
    cameraPanel: document.querySelector("#camera-panel"),
    imageInput: document.querySelector("#image-input"),
    imagePreview: document.querySelector("#image-preview"),
    imagePreviewWrap: document.querySelector("#image-preview-wrap"),
    changeImage: document.querySelector("#change-image"),
    cameraVideo: document.querySelector("#camera-video"),
    cameraPlaceholder: document.querySelector("#camera-placeholder"),
    cameraStart: document.querySelector("#camera-start"),
    classifyButton: document.querySelector("#classify-button"),
    captureMessage: document.querySelector("#capture-message"),
    emptyResult: document.querySelector("#empty-result"),
    predictionResult: document.querySelector("#prediction-result"),
    predictionMessage: document.querySelector("#prediction-message"),
    predictionDetails: document.querySelector("#prediction-details"),
    recognizedName: document.querySelector("#recognized-name"),
    confidence: document.querySelector("#confidence"),
    alternatives: document.querySelector("#alternatives"),
    showSheet: document.querySelector("#show-sheet"),
    technicalSheet: document.querySelector("#technical-sheet"),
    sheetTitle: document.querySelector("#sheet-title"),
    sheetItem: document.querySelector("#sheet-item"),
    specifications: document.querySelector("#specifications"),
    referenceContent: document.querySelector("#reference-content"),
    referenceCount: document.querySelector("#reference-count"),
    referenceGallery: document.querySelector("#reference-gallery"),
    noMatchingExamples: document.querySelector("#no-matching-examples"),
    designRecognized: document.querySelector("#design-recognized"),
    enterDesignStudio: document.querySelector("#enter-design-studio"),
    designWorkspace: document.querySelector("#design-workspace"),
    designChatPanel: document.querySelector(".design-chat-panel"),
    selectedPackageName: document.querySelector("#selected-package-name"),
    selectedPackageImage: document.querySelector("#selected-package-image"),
    selectedPackagePlaceholder: document.querySelector("#selected-package-placeholder"),
    selectedPackageDetails: document.querySelector("#selected-package-details"),
    changePackage: document.querySelector("#change-package"),
    referenceUploadLabel: document.querySelector("#reference-upload-label"),
    designReferenceInput: document.querySelector("#design-reference-input"),
    referenceUploadStatus: document.querySelector("#reference-upload-status"),
    chatMessages: document.querySelector("#chat-messages"),
    chatForm: document.querySelector("#chat-form"),
    chatInput: document.querySelector("#chat-input"),
    sendDesign: document.querySelector("#send-design"),
    designStatus: document.querySelector("#design-status"),
    proposalPanel: document.querySelector("#proposal-panel"),
    proposalOptions: document.querySelector("#proposal-options"),
    proposalContent: document.querySelector("#proposal-content"),
    generateImage: document.querySelector("#generate-image"),
    visualResult: document.querySelector("#visual-result"),
    generatedImage: document.querySelector("#generated-image"),
    downloadImage: document.querySelector("#download-image")
  };

  let model = null;
  let cameraStream = null;
  let activeTab = "upload";
  let currentObjectUrl = null;
  let selectedPackage = null;
  let catalogEntries = [];
  let designPackage = null;
  let designHistory = [];
  let currentProposal = null;
  let proposalRoutes = [];
  let selectedProposalRouteIndex = 0;
  let uploadedReference = null;
  let referenceObjectUrl = null;

  function setDesignStatus(message, isError = false) {
    elements.designStatus.textContent = message;
    elements.designStatus.classList.toggle("design-status-error", isError);
  }

  function addChatMessage(role, text, extraClass = "") {
    const message = document.createElement("div");
    message.className = `chat-message ${role}${extraClass ? ` ${extraClass}` : ""}`;
    message.textContent = text;
    elements.chatMessages.append(message);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    return message;
  }

  async function loadCatalog() {
    if (window.location.protocol === "file:") return;
    try {
      const response = await fetch("/api/envases");
      if (!response.ok) throw new Error("No se pudo cargar el catálogo.");
      catalogEntries = await response.json();
    } catch (error) {
      console.error("No se pudo cargar la información de diseño de los envases:", error);
    }
  }

  function renderSelectedPackage(packageInfo) {
    elements.selectedPackageName.textContent = packageInfo.name;
    elements.selectedPackageDetails.replaceChildren();
    [
      ["Referencia", packageInfo.reference],
      ["Categoría", packageInfo.category],
      ["Capacidad", packageInfo.content],
      ["Tipo", packageInfo.type]
    ].forEach(([label, value]) => {
      const term = document.createElement("dt");
      term.textContent = label;
      const description = document.createElement("dd");
      description.textContent = value;
      elements.selectedPackageDetails.append(term, description);
    });
    const imageSource = uploadedReference ? referenceObjectUrl : packageInfo.image;
    elements.selectedPackageImage.hidden = !imageSource;
    elements.selectedPackagePlaceholder.hidden = Boolean(imageSource);
    if (imageSource) {
      elements.selectedPackageImage.src = imageSource;
      elements.selectedPackageImage.alt = `Referencia visual de ${packageInfo.name}`;
    }
  }

  function selectDesignPackage(packageInfo) {
    if (designPackage && designPackage.id === packageInfo.id) {
      elements.chatInput.disabled = false;
      elements.sendDesign.disabled = false;
      elements.designChatPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    designPackage = packageInfo;
    designHistory = [];
    currentProposal = null;
    proposalRoutes = [];
    selectedProposalRouteIndex = 0;
    uploadedReference = null;
    if (referenceObjectUrl) URL.revokeObjectURL(referenceObjectUrl);
    referenceObjectUrl = null;
    elements.designReferenceInput.value = "";
    elements.proposalPanel.hidden = true;
    elements.visualResult.hidden = true;
    elements.chatMessages.replaceChildren();
    renderSelectedPackage(packageInfo);
    elements.changePackage.textContent = "Cambiar envase";
    elements.selectedPackagePlaceholder.textContent = "Sin imagen de referencia";
    elements.referenceUploadLabel.hidden = false;
    elements.designReferenceInput.hidden = false;
    elements.referenceUploadStatus.hidden = false;
    elements.chatInput.disabled = false;
    elements.sendDesign.disabled = false;
    addChatMessage("assistant", `Envase ${packageInfo.name} seleccionado. Cuéntame qué propuesta quieres crear; puedo explorar tres rutas visuales distintas. Indica si buscas una identidad Simoniz o Binner.`);
    elements.designWorkspace.hidden = false;
    setDesignStatus("");
    elements.designChatPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetDesignWorkspace() {
    designPackage = null;
    designHistory = [];
    currentProposal = null;
    proposalRoutes = [];
    selectedProposalRouteIndex = 0;
    uploadedReference = null;
    if (referenceObjectUrl) URL.revokeObjectURL(referenceObjectUrl);
    referenceObjectUrl = null;
    elements.designReferenceInput.value = "";
    elements.designWorkspace.hidden = true;
    elements.chatInput.disabled = true;
    elements.sendDesign.disabled = true;
    elements.proposalPanel.hidden = true;
    elements.visualResult.hidden = true;
    elements.chatMessages.replaceChildren();
    setDesignStatus("");
  }

  function beginDesignForRecognizedPackage() {
    if (!selectedPackage) return;
    const catalogEntry = catalogEntries.find((entry) => entry.item === selectedPackage.item);
    const designEntry = catalogEntry || {
      ...selectedPackage,
      id: `ENV${selectedPackage.item.padStart(3, "0")}`,
      reference: `ENV${selectedPackage.item.padStart(3, "0")}`,
      category: selectedPackage.type.includes("AEROSOL") ? "Automotriz y hogar" : "Limpieza del hogar",
      image: null
    };
    selectDesignPackage(designEntry);
  }

  function enterDesignStudio() {
    if (!selectedPackage) {
      resetDesignWorkspace();
      elements.selectedPackageName.textContent = "Selecciona un envase";
      elements.selectedPackageDetails.replaceChildren();
      elements.selectedPackageImage.hidden = true;
      elements.selectedPackagePlaceholder.textContent = "Identifica un envase para comenzar a diseñar.";
      elements.changePackage.textContent = "Seleccionar envase";
      elements.referenceUploadLabel.hidden = true;
      elements.designReferenceInput.hidden = true;
      elements.referenceUploadStatus.hidden = true;
      elements.chatMessages.replaceChildren();
      addChatMessage("assistant", "El chat está listo. Para crear una propuesta, primero selecciona un envase con el botón “Seleccionar envase”.");
      elements.designWorkspace.hidden = false;
      elements.designChatPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    beginDesignForRecognizedPackage();
    elements.chatInput.focus({ preventScroll: true });
  }

  function renderProposal(proposal) {
    elements.proposalContent.replaceChildren();
    elements.proposalOptions.replaceChildren();
    proposalRoutes.forEach((route, index) => {
      const option = document.createElement("button");
      option.className = "proposal-route";
      option.type = "button";
      option.setAttribute("aria-pressed", String(index === selectedProposalRouteIndex));
      option.setAttribute("aria-label", `Seleccionar ruta ${route.ruta}: ${route.concepto}`);

      const optionHeader = document.createElement("span");
      optionHeader.className = "proposal-route-header";
      const name = document.createElement("strong");
      name.textContent = route.ruta || `Ruta ${index + 1}`;
      const marker = document.createElement("span");
      marker.className = "proposal-route-marker";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = String(index + 1).padStart(2, "0");
      optionHeader.append(name, marker);

      const concept = document.createElement("span");
      concept.className = "proposal-route-concept";
      concept.textContent = route.concepto;

      const colors = document.createElement("span");
      colors.className = "proposal-route-colors";
      route.paleta.slice(0, 4).forEach((color) => {
        const swatch = document.createElement("span");
        swatch.className = "proposal-route-color";
        swatch.style.backgroundColor = /^#[0-9a-f]{6}$/i.test(color.hex) ? color.hex : "#dfe7e8";
        swatch.setAttribute("aria-label", `${color.nombre}, ${color.hex}`);
        colors.append(swatch);
      });
      option.append(optionHeader, concept, colors);
      option.addEventListener("click", () => {
        selectedProposalRouteIndex = index;
        currentProposal = {
          ...route,
          alternativas: proposalRoutes.filter((_, routeIndex) => routeIndex !== index)
        };
        elements.visualResult.hidden = true;
        renderProposal(currentProposal);
        setDesignStatus(`Ruta “${route.ruta}” seleccionada. Genera la propuesta visual para explorarla.`);
      });
      elements.proposalOptions.append(option);
    });

    const addBlock = (title, content) => {
      const block = document.createElement("section");
      block.className = "proposal-block";
      const heading = document.createElement("h4");
      heading.textContent = title;
      block.append(heading, content);
      elements.proposalContent.append(block);
    };
    const addText = (title, value) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = value;
      addBlock(title, paragraph);
    };
    const addList = (title, values) => {
      const list = document.createElement("ul");
      values.forEach((value) => {
        const item = document.createElement("li");
        item.textContent = value;
        list.append(item);
      });
      addBlock(title, list);
    };
    addText("Concepto", proposal.concepto);
    addText("Estilo y personalidad", `${proposal.estilo} ${proposal.personalidad_marca}`.trim());
    const palette = document.createElement("div");
    palette.className = "palette-list";
    proposal.paleta.forEach((color) => {
      const swatch = document.createElement("span");
      swatch.className = "palette-swatch";
      const chip = document.createElement("span");
      chip.className = "palette-color";
      chip.style.backgroundColor = /^#[0-9a-f]{6}$/i.test(color.hex) ? color.hex : "#dfe7e8";
      const label = document.createElement("span");
      label.textContent = `${color.nombre} (${color.hex})`;
      swatch.append(chip, label);
      palette.append(swatch);
    });
    addBlock("Paleta de color", palette);
    addText("Tipografía", proposal.tipografia);
    addList("Jerarquía visual", proposal.jerarquia);
    addList("Elementos gráficos", proposal.elementos_graficos);
    addText("Fotografía", proposal.fotografia);
    addList("Claims sugeridos", proposal.claims);
    elements.proposalPanel.hidden = false;
    elements.proposalPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function readImageAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result));
      reader.addEventListener("error", () => reject(new Error("No se pudo leer la foto seleccionada.")));
      reader.readAsDataURL(file);
    });
  }

  function apiConnectionError() {
    if (window.location.protocol === "file:") {
      return "La aplicación se abrió como archivo local. Ejecuta `node server.js` en la carpeta del proyecto y abre http://127.0.0.1:3000 para usar el chat IA.";
    }
    return "No fue posible conectar con la API local. Verifica que el servidor esté activo en http://127.0.0.1:3000 y vuelve a intentarlo.";
  }

  async function sendDesignMessage(message) {
    const userMessage = message.trim();
    if (!designPackage || !userMessage) return;
    addChatMessage("user", userMessage);
    elements.chatInput.value = "";
    elements.sendDesign.disabled = true;
    setDesignStatus("Creando propuesta…");
    const pending = addChatMessage("assistant", "Analizando el envase y preparando el concepto…", "pending");
    try {
      const response = await fetch("/api/diseno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envaseId: designPackage.id,
          mensaje: userMessage,
          historial: designHistory.slice(-12),
          propuestaAnterior: currentProposal
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "No fue posible generar la propuesta. Intenta nuevamente.");
      pending.remove();
      addChatMessage("assistant", result.resumen);
      designHistory.push({ role: "user", content: userMessage }, { role: "assistant", content: result.resumen });
      currentProposal = result.propuesta;
      proposalRoutes = [currentProposal, ...currentProposal.alternativas];
      selectedProposalRouteIndex = 0;
      renderProposal(currentProposal);
      setDesignStatus("Propuesta lista.");
    } catch (error) {
      pending.remove();
      const messageText = error instanceof TypeError
        ? apiConnectionError()
        : error.message;
      addChatMessage("assistant", messageText);
      setDesignStatus(messageText, true);
      console.error("Falló la creación del concepto de diseño:", error);
    } finally {
      elements.sendDesign.disabled = false;
    }
  }

  async function generateVisualProposal() {
    if (!designPackage || !currentProposal) return;
    elements.generateImage.disabled = true;
    elements.generateImage.querySelector("span:first-child").textContent = "Generando imagen…";
    setDesignStatus("Generando imagen…");
    try {
      const response = await fetch("/api/generar-imagen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envaseId: designPackage.id,
          propuesta: currentProposal,
          imagenReferencia: uploadedReference
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "No fue posible generar la propuesta. Intenta nuevamente.");
      elements.generatedImage.src = result.imagen;
      elements.downloadImage.href = result.imagen;
      elements.visualResult.hidden = false;
      setDesignStatus("Propuesta lista.");
      elements.visualResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (error) {
      const message = error instanceof TypeError
        ? apiConnectionError()
        : error.message;
      setDesignStatus(message, true);
      console.error("Falló la generación de la propuesta visual:", error);
    } finally {
      elements.generateImage.disabled = false;
      elements.generateImage.querySelector("span:first-child").textContent = "Generar propuesta visual";
    }
  }

  function setCaptureMessage(message, isError = false) {
    elements.captureMessage.textContent = message;
    elements.captureMessage.classList.toggle("is-error", isError);
  }

  function setModelStatus(message, state) {
    elements.modelStatus.classList.remove("is-ready", "is-error");
    if (state) elements.modelStatus.classList.add(`is-${state}`);
    elements.modelStatus.lastChild.textContent = ` ${message}`;
  }

  function setActiveTab(tab) {
    activeTab = tab;
    const isUpload = tab === "upload";
    elements.uploadTab.classList.toggle("is-active", isUpload);
    elements.cameraTab.classList.toggle("is-active", !isUpload);
    elements.uploadTab.setAttribute("aria-pressed", String(isUpload));
    elements.cameraTab.setAttribute("aria-pressed", String(!isUpload));
    elements.uploadPanel.hidden = !isUpload;
    elements.cameraPanel.hidden = isUpload;
    if (isUpload) stopCamera();
    resetResult();
    updateClassifyButton();
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    elements.cameraVideo.srcObject = null;
    elements.cameraPlaceholder.hidden = false;
    elements.cameraStart.hidden = false;
  }

  function hasImage() {
    if (activeTab === "camera") return Boolean(cameraStream);
    return elements.imagePreview.complete && elements.imagePreview.naturalWidth > 0;
  }

  function updateClassifyButton() {
    elements.classifyButton.disabled = !model || !hasImage();
  }

  function showPrediction(message, isError = false) {
    elements.emptyResult.hidden = true;
    elements.predictionResult.hidden = false;
    elements.predictionDetails.hidden = true;
    elements.predictionMessage.hidden = false;
    elements.predictionMessage.textContent = message;
    elements.predictionMessage.classList.toggle("is-error", isError);
  }

  function showNoMatchingPackage() {
    resetDesignWorkspace();
    elements.technicalSheet.hidden = true;
    selectedPackage = null;
    showPrediction("NO EXISTE ESTE ENVASE", true);
    setCaptureMessage("No se pudo confirmar la forma del envase con al menos 95% de confianza. Centra un solo envase completo y vuelve a intentarlo.", true);
  }

  function resetResult() {
    resetDesignWorkspace();
    selectedPackage = null;
    elements.technicalSheet.hidden = true;
    elements.predictionResult.hidden = true;
    elements.predictionDetails.hidden = true;
    elements.emptyResult.hidden = false;
  }

  function normalizeLabel(label) {
    return label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
  }

  function sourceDimensions(source) {
    return {
      width: source.naturalWidth || source.videoWidth || source.width,
      height: source.naturalHeight || source.videoHeight || source.height
    };
  }

  function shapeFocusedCrops(source) {
    const { width, height } = sourceDimensions(source);
    if (!width || !height) return [];

    const sampleScale = Math.min(1, 320 / width, 320 / height);
    const sampleWidth = Math.max(1, Math.round(width * sampleScale));
    const sampleHeight = Math.max(1, Math.round(height * sampleScale));
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = sampleWidth;
    sampleCanvas.height = sampleHeight;
    const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
    sampleContext.drawImage(source, 0, 0, sampleWidth, sampleHeight);
    const pixels = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
    let weightTotal = 0;
    let weightedX = 0;
    let weightedY = 0;

    for (let y = Math.floor(sampleHeight * 0.2); y < sampleHeight * 0.8; y += 1) {
      for (let x = 0; x < sampleWidth; x += 1) {
        const offset = (y * sampleWidth + x) * 4;
        const colorRange = Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2])
          - Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
        if (colorRange < 55) continue;
        weightTotal += colorRange;
        weightedX += x * colorRange;
        weightedY += y * colorRange;
      }
    }

    if (weightTotal < 1000) {
      weightTotal = 0;
      weightedX = 0;
      weightedY = 0;
      for (let y = Math.floor(sampleHeight * 0.2); y < sampleHeight * 0.8 - 1; y += 1) {
        for (let x = 0; x < sampleWidth - 1; x += 1) {
          const offset = (y * sampleWidth + x) * 4;
          const right = offset + 4;
          const below = offset + sampleWidth * 4;
          const luminance = 0.299 * pixels[offset] + 0.587 * pixels[offset + 1] + 0.114 * pixels[offset + 2];
          const rightLuminance = 0.299 * pixels[right] + 0.587 * pixels[right + 1] + 0.114 * pixels[right + 2];
          const belowLuminance = 0.299 * pixels[below] + 0.587 * pixels[below + 1] + 0.114 * pixels[below + 2];
          const edgeStrength = Math.abs(luminance - rightLuminance) + Math.abs(luminance - belowLuminance);
          if (edgeStrength < 24) continue;
          weightTotal += edgeStrength;
          weightedX += x * edgeStrength;
          weightedY += y * edgeStrength;
        }
      }
    }

    if (weightTotal < 1000) return [];
    const centerX = weightedX / weightTotal / sampleWidth;
    const centerY = weightedY / weightTotal / sampleHeight;
    const centers = [];
    [0, 0.07, 0.14].forEach((offsetX) => {
      [-0.04, 0.03, 0.1].forEach((offsetY) => {
        centers.push({
          x: Math.max(0.08, Math.min(0.92, centerX + offsetX)),
          y: Math.max(0.12, Math.min(0.88, centerY + offsetY))
        });
      });
    });

    return centers.flatMap((center) => [0.16, 0.18, 0.24].map((scale) => {
      const side = Math.min(width, height) * scale;
      const crop = document.createElement("canvas");
      crop.width = 224;
      crop.height = 224;
      const context = crop.getContext("2d");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, crop.width, crop.height);
      context.drawImage(
        source,
        center.x * width - side / 2,
        center.y * height - side / 2,
        side,
        side,
        0,
        0,
        crop.width,
        crop.height
      );

      const image = context.getImageData(0, 0, crop.width, crop.height);
      for (let index = 0; index < image.data.length; index += 4) {
        const luminance = 0.299 * image.data[index]
          + 0.587 * image.data[index + 1]
          + 0.114 * image.data[index + 2];
        image.data[index] = luminance;
        image.data[index + 1] = luminance;
        image.data[index + 2] = luminance;
      }
      context.putImageData(image, 0, 0);
      // Neutralize the label area so the classifier relies more on the package silhouette.
      context.fillStyle = "#fff";
      context.fillRect(crop.width * 0.25, crop.height * 0.38, crop.width * 0.5, crop.height * 0.3);

      return { canvas: crop, center, scale };
    }));
  }

  async function shapeFocusedPrediction(source) {
    const crops = shapeFocusedCrops(source);
    const confidentPredictions = [];

    for (const crop of crops) {
      const predictions = (await model.predict(crop.canvas))
        .sort((first, second) => second.probability - first.probability);
      if (predictions[0].probability >= MIN_CONFIDENCE) {
        confidentPredictions.push({ ...crop, predictions });
      }
    }

    const supportedPredictions = confidentPredictions.filter((candidate) => (
      confidentPredictions.some((other) => (
        other !== candidate
        && normalizeLabel(other.predictions[0].className) === normalizeLabel(candidate.predictions[0].className)
        && Math.abs(other.center.x - candidate.center.x) <= 0.01
        && Math.abs(other.center.y - candidate.center.y) <= 0.01
        && other.scale !== candidate.scale
      ))
    ));
    if (!supportedPredictions.length) return null;

    supportedPredictions.sort((first, second) => (
      second.predictions[0].probability - first.predictions[0].probability
    ));
    return supportedPredictions[0].predictions;
  }

  function drawAlternatives(predictions) {
    elements.alternatives.replaceChildren();
    predictions.slice(1, 4).forEach((prediction) => {
      const row = document.createElement("div");
      row.className = "alternative";

      const label = document.createElement("span");
      label.textContent = prediction.className;
      const score = document.createElement("span");
      score.textContent = `${Math.round(prediction.probability * 100)}%`;

      const track = document.createElement("div");
      track.className = "alternative-track";
      const fill = document.createElement("div");
      fill.className = "alternative-fill";
      fill.style.width = `${Math.round(prediction.probability * 100)}%`;
      track.append(fill);
      row.append(label, score, track);
      elements.alternatives.append(row);
    });
  }

  function renderSpecification(entry, key) {
    const wrapper = document.createElement("div");
    wrapper.className = "specification";
    const term = document.createElement("dt");
    term.textContent = entry;
    const value = document.createElement("dd");
    value.textContent = selectedPackage[key];
    wrapper.append(term, value);
    elements.specifications.append(wrapper);
  }

  function renderGallery(entry) {
    const link = document.createElement("a");
    link.className = "reference-card";
    link.href = entry.page;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const image = document.createElement("img");
    image.src = entry.image;
    image.alt = entry.name;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => link.remove(), { once: true });

    const brand = document.createElement("small");
    brand.className = "reference-brand";
    brand.textContent = entry.brand;

    const name = document.createElement("span");
    name.textContent = entry.name;
    link.append(image, brand, name);
    elements.referenceGallery.append(link);
  }

  function renderSheet(packageInfo) {
    const packageId = `ENV${packageInfo.item.padStart(3, "0")}`;
    if (designPackage && designPackage.id !== packageId) resetDesignWorkspace();
    selectedPackage = packageInfo;
    elements.sheetTitle.textContent = packageInfo.name;
    elements.sheetItem.textContent = `Ítem ${packageInfo.item}`;
    elements.specifications.replaceChildren();
    SPECIFICATIONS.forEach(([label, key]) => renderSpecification(label, key));
    elements.referenceGallery.replaceChildren();
    const examples = PRODUCT_REFERENCES.filter(
      (reference) => reference.form === packageInfo.referenceForm
        && reference.volumeMl === packageInfo.referenceVolumeMl
    );
    const hasMatchingExamples = examples.length > 0;
    elements.referenceContent.hidden = !hasMatchingExamples;
    elements.noMatchingExamples.hidden = hasMatchingExamples;
    if (hasMatchingExamples) {
      elements.referenceCount.textContent = `${examples.length} ${examples.length === 1 ? "coincidencia" : "coincidencias"}`;
      examples.forEach(renderGallery);
    } else {
      elements.noMatchingExamples.textContent = "PRODUCTO EN DESARROLLO POR SIMONIZ Y BINNER. ¡PRODUCTO NUEVO!";
    }
    elements.technicalSheet.hidden = false;
    elements.technicalSheet.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function classifyImage() {
    if (!model || !hasImage()) return;

    elements.classifyButton.disabled = true;
    elements.classifyButton.querySelector("span:first-child").textContent = "Analizando imagen…";
    setCaptureMessage("El modelo está analizando la imagen.");
    try {
      const source = activeTab === "camera" ? elements.cameraVideo : elements.imagePreview;
      let predictions = (await model.predict(source))
        .sort((a, b) => b.probability - a.probability);
      let packageInfo = PACKAGE_CATALOG.find(
        (entry) => normalizeLabel(entry.label) === normalizeLabel(predictions[0].className)
      );

      let usedShapeFocusedPrediction = false;
      if (!packageInfo || predictions[0].probability < MIN_CONFIDENCE) {
        setCaptureMessage("Afinando la búsqueda por forma del envase, sin depender de su etiqueta…");
        const shapePrediction = await shapeFocusedPrediction(source);
        if (shapePrediction) {
          predictions = shapePrediction;
          packageInfo = PACKAGE_CATALOG.find(
            (entry) => normalizeLabel(entry.label) === normalizeLabel(predictions[0].className)
          );
          usedShapeFocusedPrediction = Boolean(packageInfo);
        }
      }

      if (!packageInfo || predictions[0].probability < MIN_CONFIDENCE) {
        showNoMatchingPackage();
        return;
      }

      const topPrediction = predictions[0];
      drawAlternatives(predictions);
      elements.predictionMessage.hidden = true;
      elements.predictionDetails.hidden = false;
      elements.recognizedName.textContent = packageInfo.name;
      elements.confidence.textContent = `${Math.round(topPrediction.probability * 100)}%`;
      elements.alternatives.hidden = false;
      elements.predictionResult.hidden = false;
      elements.emptyResult.hidden = true;
      renderSheet(packageInfo);
      setCaptureMessage(usedShapeFocusedPrediction
        ? "Envase identificado por forma y capacidad, sin depender de la etiqueta."
        : "Envase identificado. Puedes consultar la ficha técnica.");
    } catch (error) {
      showPrediction("No fue posible analizar esta imagen. Verifica la conexión al modelo e inténtalo nuevamente.", true);
      setCaptureMessage("Falló el análisis de la imagen. Revisa tu conexión y vuelve a intentarlo.", true);
      console.error("Falló la clasificación del envase:", error);
    } finally {
      elements.classifyButton.querySelector("span:first-child").textContent = "Reconocer envase";
      updateClassifyButton();
    }
  }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCaptureMessage("Este navegador no permite usar la cámara aquí. Abre la página en localhost o selecciona una imagen.", true);
      return;
    }

    try {
      stopCamera();
      cameraStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } }
      });
      elements.cameraVideo.srcObject = cameraStream;
      elements.cameraPlaceholder.hidden = true;
      elements.cameraStart.hidden = true;
      await elements.cameraVideo.play();
      setCaptureMessage("Cámara activa. Centra un envase y selecciona “Reconocer envase”.");
      resetResult();
      updateClassifyButton();
    } catch (error) {
      stopCamera();
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setCaptureMessage("No se autorizó el acceso a la cámara. Permite el acceso o selecciona una imagen.", true);
      } else {
        setCaptureMessage("No se pudo iniciar la cámara. Comprueba que esté conectada y no la use otra aplicación.", true);
      }
      console.error("No se pudo acceder a la cámara:", error);
    }
  }

  async function loadModel() {
    setModelStatus("Cargando modelo…");
    setCaptureMessage("Cargando el modelo de Teachable Machine…");
    try {
      if (!window.tmImage) {
        throw new Error("No se cargó la biblioteca de Teachable Machine.");
      }
      model = await window.tmImage.load(
        `${MODEL_URL}model.json`,
        `${MODEL_URL}metadata.json`
      );
      setModelStatus("Modelo listo", "ready");
      setCaptureMessage("Selecciona una imagen o activa la cámara para comenzar.");
      updateClassifyButton();
    } catch (error) {
      setModelStatus("Error al cargar", "error");
      setCaptureMessage("No se pudo cargar el modelo. Revisa tu conexión a internet y recarga la página.", true);
      console.error("No se pudo cargar el modelo de Teachable Machine:", error);
    }
  }

  elements.uploadTab.addEventListener("click", () => setActiveTab("upload"));
  elements.cameraTab.addEventListener("click", () => setActiveTab("camera"));
  elements.cameraStart.addEventListener("click", startCamera);
  elements.classifyButton.addEventListener("click", classifyImage);
  elements.showSheet.addEventListener("click", () => {
    elements.technicalSheet.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  elements.designRecognized.addEventListener("click", beginDesignForRecognizedPackage);
  elements.enterDesignStudio.addEventListener("click", (event) => {
    event.preventDefault();
    enterDesignStudio();
  });
  elements.changePackage.addEventListener("click", () => {
    resetResult();
    elements.changePackage.textContent = "Cambiar envase";
    elements.captureMessage.textContent = "Carga la imagen de otro envase o usa la cámara para identificarlo.";
    document.querySelector(".capture-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  elements.chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendDesignMessage(elements.chatInput.value);
  });
  elements.generateImage.addEventListener("click", generateVisualProposal);
  elements.designReferenceInput.addEventListener("change", async () => {
    const [file] = elements.designReferenceInput.files;
    if (!file) return;
    uploadedReference = null;
    if (referenceObjectUrl) URL.revokeObjectURL(referenceObjectUrl);
    referenceObjectUrl = null;
    renderSelectedPackage(designPackage);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      elements.designReferenceInput.value = "";
      elements.referenceUploadStatus.textContent = "Selecciona una imagen PNG, JPG o WEBP de hasta 8 MB.";
      elements.referenceUploadStatus.classList.add("design-status-error");
      return;
    }
    try {
      if (!model) throw new Error("El modelo aún no está listo. Intenta nuevamente.");
      const previewUrl = URL.createObjectURL(file);
      const referenceImage = new Image();
      referenceImage.src = previewUrl;
      try {
        await referenceImage.decode();
        const [prediction] = (await model.predict(referenceImage))
          .sort((first, second) => second.probability - first.probability);
        if (normalizeLabel(prediction.className) !== normalizeLabel(designPackage.label)
          || prediction.probability < MIN_CONFIDENCE) {
          throw new Error("NO EXISTE ESTE ENVASE");
        }
      } finally {
        URL.revokeObjectURL(previewUrl);
      }
      uploadedReference = await readImageAsDataUrl(file);
      if (referenceObjectUrl) URL.revokeObjectURL(referenceObjectUrl);
      referenceObjectUrl = URL.createObjectURL(file);
      renderSelectedPackage(designPackage);
      elements.referenceUploadStatus.textContent = "Foto de referencia lista para generar la propuesta visual.";
      elements.referenceUploadStatus.classList.remove("design-status-error");
    } catch (error) {
      elements.designReferenceInput.value = "";
      elements.referenceUploadStatus.textContent = error.message === "NO EXISTE ESTE ENVASE"
        ? "NO EXISTE ESTE ENVASE"
        : "No se pudo validar la imagen. Intenta nuevamente.";
      elements.referenceUploadStatus.classList.add("design-status-error");
      console.error("No se pudo validar la foto del envase:", error);
    }
  });

  elements.imageInput.addEventListener("change", () => {
    const [file] = elements.imageInput.files;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCaptureMessage("Selecciona un archivo de imagen válido.", true);
      elements.imageInput.value = "";
      return;
    }
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = URL.createObjectURL(file);
    elements.imagePreview.onload = () => {
      elements.imagePreviewWrap.hidden = false;
      elements.imageInput.closest(".upload-zone").hidden = true;
      resetResult();
      setCaptureMessage("Imagen lista. Selecciona “Reconocer envase”.");
      updateClassifyButton();
    };
    elements.imagePreview.onerror = () => {
      setCaptureMessage("No se pudo abrir la imagen seleccionada.", true);
      updateClassifyButton();
    };
    elements.imagePreview.src = currentObjectUrl;
  });

  elements.changeImage.addEventListener("click", () => elements.imageInput.click());
  elements.cameraVideo.addEventListener("loadeddata", updateClassifyButton);
  window.addEventListener("beforeunload", () => {
    stopCamera();
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    if (referenceObjectUrl) URL.revokeObjectURL(referenceObjectUrl);
  });

  elements.serverNotice.hidden = window.location.protocol !== "file:";
  loadCatalog();
  loadModel();
})();
