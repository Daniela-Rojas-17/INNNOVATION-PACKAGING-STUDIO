const PRODUCT_REFERENCES = [
  {
    brand: "Simoniz",
    name: "Espuma limpia tapicería Simoniz en aerosol · 400 ml",
    form: "aerosol-alto",
    volumeMl: 400,
    image: "https://simonizauto.com/wp-content/uploads/2026/08/108040-1-Limpde_Espuma_400ML_Aerosol.webp",
    page: "https://simonizauto.com/producto/espuma-limpia-tapiceria-simoniz-en-aerosol-400ml/"
  },
  {
    brand: "Binner",
    name: "Espuma limpiadora para tapicería en aerosol · 400 ml",
    form: "aerosol-alto",
    volumeMl: 400,
    image: "https://binner.com.co/wp-content/uploads/2026/08/107012-0-Limptapiceria_400ML_En_Espuma_Aerosol.webp",
    page: "https://binner.com.co/tienda/limp-tapiceria-400ml-en-espuma-aerosol/"
  },
  {
    brand: "Binner",
    name: "Lustrador y protector para muebles en aerosol · 400 ml",
    form: "aerosol-alto",
    volumeMl: 400,
    image: "https://binner.com.co/wp-content/uploads/2026/07/105923-0-Lustrador_Protector_400ML_En_Aerosol-1.webp",
    page: "https://binner.com.co/tienda/lustrador-protector-400ml-en-aerosol/"
  },
  {
    brand: "Binner",
    name: "Ambientador desinfectante Binner Menta y Pomelo · 400 ml",
    form: "aerosol-alto",
    volumeMl: 400,
    image: "https://binner.com.co/wp-content/uploads/2026/08/206621-1-Ambient_Desinf_Binner_Menta_Pomelo_400ML.webp",
    page: "https://binner.com.co/tienda/ambient-desinf-binner-menta-pomelo-400ml/"
  },
  {
    brand: "Simoniz",
    name: "Limpiador de partes electrónicas Simoniz · 400 ml",
    form: "aerosol-alto",
    volumeMl: 400,
    image: "https://simonizauto.com/wp-content/uploads/2026/08/108074-1-Electronic_Contac_400ML_Cleaner-1.webp",
    page: "https://simonizauto.com/producto/electronic-contac-400ml-cleaner/"
  },
  {
    brand: "Simoniz",
    name: "Cera Insta Brillo Simoniz en aerosol · 250 ml",
    form: "aerosol",
    volumeMl: 250,
    image: "https://simonizauto.com/wp-content/uploads/2026/08/207151-1-Cera_Instabrillo_Simoniz_Rapida_250ML.webp",
    page: "https://simonizauto.com/producto/cera-insta-brillo-simoniz-en-aerosol-250ml/"
  },
  {
    brand: "Binner",
    name: "Ambientador desinfectante Binner en aerosol · 250 ml",
    form: "aerosol",
    volumeMl: 250,
    image: "https://binner.com.co/wp-content/uploads/2026/07/207148-0-Amb_Desinf_Binner_Sano_Lav_Sandia_250ML-1.webp",
    page: "https://binner.com.co/tienda/amb-desinf-binner-sano-lav-sandia-250ml/"
  },
  {
    brand: "Binner",
    name: "Espuma limpiatapicería Binner en aerosol · 250 ml",
    form: "aerosol",
    volumeMl: 250,
    image: "https://binner.com.co/wp-content/uploads/2026/08/208243-2-Espuma_Limpiadora_Binner_Tapiceria_250ML.webp",
    page: "https://binner.com.co/tienda/espuma-limpiatapiceria-250-ml/"
  },
  {
    brand: "Binner",
    name: "Polvo y brillo Binner Flores de Primavera · 500 ml",
    form: "diamante",
    volumeMl: 500,
    image: "https://binner.com.co/wp-content/uploads/2026/08/109826-0-Polvo_Brillo_500ML_Flor_De_Primavera.webp",
    page: "https://binner.com.co/tienda/polvo-y-brillo-flores-de-primavera-500-ml/"
  },
  {
    brand: "Binner",
    name: "Limpiador de mantenimiento para pisos de madera · 1 galón",
    form: "bidon-cuadrado",
    volumeMl: 3785.41,
    image: "https://binner.com.co/wp-content/uploads/2026/08/109784-0-Pisos_Madera_Limpmtto_1GL.webp",
    page: "https://binner.com.co/tienda/limpiador-de-mantenimiento-pisos-de-madera-1-gl/"
  },
  {
    brand: "Simoniz",
    name: "Refrigerante radiador Simoniz Qualitor verde · 1 galón",
    form: "bidon-cuadrado",
    volumeMl: 3785.41,
    image: "https://simonizauto.com/wp-content/uploads/2026/08/108187-1-Refrigradiador_Galon_Verde.webp",
    page: "https://simonizauto.com/producto/refrigerante-radiador-simoniz-qualitor-verde-1gl/"
  },
  {
    brand: "Binner",
    name: "Limpiador Econopack verde para frutas y verduras · 1 litro",
    form: "estriado-lateral",
    volumeMl: 1000,
    image: "https://binner.com.co/wp-content/uploads/2026/08/208852-4-Frutas_Verd_Bin_Verde_Desin_Limp_Econ_1L.webp",
    page: "https://binner.com.co/tienda/limpiador-desinfectante-binner-verde-frutas-verduras/"
  },
  {
    brand: "Binner",
    name: "Polvo-brillo BIN Multisuper Citrus · 250 ml",
    form: "cilindro",
    volumeMl: 250,
    image: "https://binner.com.co/wp-content/uploads/2026/08/208140-1-Polvo_Brillo_Bin_Multisuper_Citrus_250ML.webp",
    page: "https://binner.com.co/tienda/polvo-brillo-bin-multisuper-citrus-250ml/"
  }
];

const PACKAGE_CATALOG = [
  {
    item: "01",
    label: "ENVASE AEROSOL 400ML ALTO",
    name: "Envase aerosol alto · 400 ml",
    type: "ENVASE AEROSOL ALTO",
    material: "ALUMINIO",
    content: "400 ml",
    diameter: "57.69 mm",
    heightWithoutCap: "205 mm",
    heightWithCap: "247 mm",
    width: "N/A",
    depth: "N/A",
    thread: "N/A",
    color: "METÁLICO",
    referenceForm: "aerosol-alto",
    referenceVolumeMl: 400
  },
  {
    item: "02",
    label: "ENVASE AEROSOL 400ML BAJO",
    name: "Envase aerosol bajo · 400 ml",
    type: "ENVASE AEROSOL BAJO",
    material: "ALUMINIO",
    content: "400 ml",
    diameter: "65.80 mm",
    heightWithoutCap: "158 mm",
    heightWithCap: "201 mm",
    width: "N/A",
    depth: "N/A",
    thread: "N/A",
    color: "METÁLICO",
    referenceForm: "aerosol-bajo",
    referenceVolumeMl: 400
  },
  {
    item: "03",
    label: "ENVASE AEROSOL 250ML",
    name: "Envase aerosol · 250 ml",
    type: "ENVASE AEROSOL",
    material: "ALUMINIO",
    content: "250 ml",
    diameter: "57.22 mm",
    heightWithoutCap: "138 mm",
    heightWithCap: "180 mm",
    width: "N/A",
    depth: "N/A",
    thread: "N/A",
    color: "METÁLICO",
    referenceForm: "aerosol",
    referenceVolumeMl: 250
  },
  {
    item: "04",
    label: "ENVASE DIAMANTE 700ML",
    name: "Envase diamante · 700 ml",
    type: "ENVASE DIAMANTE",
    material: "PEAD / HDPE",
    content: "700 ml",
    diameter: "N/A",
    heightWithoutCap: "230 mm",
    heightWithCap: "290 mm",
    width: "88 mm",
    depth: "56 mm",
    thread: "27.30 mm",
    color: "TRASLÚCIDO",
    referenceForm: "diamante",
    referenceVolumeMl: 700
  },
  {
    item: "05",
    label: "ENVASE DIAMANTE 500ML",
    name: "Envase diamante · 500 ml",
    type: "ENVASE DIAMANTE",
    material: "PEAD / HDPE",
    content: "500 ml",
    diameter: "N/A",
    heightWithoutCap: "190mm",
    heightWithCap: "252 mm",
    width: "91 mm",
    depth: "54 mm",
    thread: "27.50 mm",
    color: "BLANCO",
    referenceForm: "diamante",
    referenceVolumeMl: 500
  },
  {
    item: "06",
    label: "ENVASE BIDÓN CON ASA CUADRADO",
    name: "Envase bidón con asa cuadrado · 1 galón",
    type: "ENVASE BIDÓN CON ASA CUADRADO",
    material: "PEAD / HDPE",
    content: "1 galon",
    diameter: "N/A",
    heightWithoutCap: "300 mm",
    heightWithCap: "300 mm",
    width: "192 mm",
    depth: "100 mm",
    thread: "37.50 mm",
    color: "BLANCO SEMITRANSPARENTE",
    referenceForm: "bidon-cuadrado",
    referenceVolumeMl: 3785.41
  },
  {
    item: "07",
    label: "ENVASE BIDÓN CON ASA OVALO",
    name: "Envase bidón con asa óvalo · 1 galón",
    type: "ENVASE BIDÓN CON ASA OVALO",
    material: "PEAD / HDPE",
    content: "1 galon",
    diameter: "N/A",
    heightWithoutCap: "300 mm",
    heightWithCap: "300 mm",
    width: "185 mm",
    depth: "95 mm",
    thread: "37.76 mm",
    color: "AZUL",
    referenceForm: "bidon-ovalado",
    referenceVolumeMl: 3785.41
  },
  {
    item: "08",
    label: "ENVASE ESTRIADO LATERAL LITRO",
    name: "Envase estriado lateral · 1 litro",
    type: "ENVASE ESTRIADO LATERAL",
    material: "PET",
    content: "1 litro",
    diameter: "N/A",
    heightWithoutCap: "202 mm",
    heightWithCap: "242 mm",
    width: "92 mm",
    depth: "67 mm",
    thread: "27.20 mm",
    color: "TRASLÚCIDO",
    referenceForm: "estriado-lateral",
    referenceVolumeMl: 1000
  },
  {
    item: "09",
    label: "ENVASE ESTRIADO LATERAL 300ML",
    name: "Envase estriado lateral · 300 ml",
    type: "ENVASE ESTRIADO LATERAL",
    material: "PET",
    content: "300 ml",
    diameter: "N/A",
    heightWithoutCap: "135 mm",
    heightWithCap: "177 mm",
    width: "69 mm",
    depth: "48 mm",
    thread: "27.46 mm",
    color: "AZUL",
    referenceForm: "estriado-lateral",
    referenceVolumeMl: 300
  },
  {
    item: "10",
    label: "ENVASE CILINDRO 250ML",
    name: "Envase cilíndrico · 250 ml",
    type: "ENVASE CILINDRICO",
    material: "PP",
    content: "250 ml",
    diameter: "50 mm",
    heightWithoutCap: "136 mm",
    heightWithCap: "185 mm",
    width: "N/A",
    depth: "N/A",
    thread: "23.50 mm",
    color: "MORADO",
    referenceForm: "cilindro",
    referenceVolumeMl: 250
  }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PACKAGE_CATALOG, PRODUCT_REFERENCES };
}
