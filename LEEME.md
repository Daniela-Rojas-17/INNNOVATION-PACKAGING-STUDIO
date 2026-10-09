# Identificador de envases y asistente de diseño

La aplicación conserva el flujo de identificación existente:

1. En el **Paso 1**, carga una foto o activa la cámara.
2. En el **Paso 2**, Teachable Machine identifica el envase. Solo se acepta una coincidencia de al menos 95 %; si la imagen completa no alcanza ese nivel, se revisan recortes en escala de grises con la zona gráfica central neutralizada y se acepta únicamente una clase confirmada en más de una vista. Si no hay coincidencia suficiente, se muestra `NO EXISTE ESTE ENVASE`.
3. La ficha técnica muestra los datos de `Ficha Tecnica.xlsx` y únicamente ejemplos Simoniz/Binner cuya forma y capacidad coinciden. Si no hay ejemplos coincidentes, aparece `PRODUCTO EN DESARROLLO POR SIMONIZ Y BINNER. ¡PRODUCTO NUEVO!`. La cantidad de referencias varía según los productos compatibles disponibles en los sitios oficiales; no se completan cinco a costa de mostrar envases de otra forma o capacidad.
4. Pulsa **Diseñar este envase** desde la ficha para abrir el chat de diseño. **Cambiar envase** vuelve al Paso 1.

Las referencias oficiales verificadas cubren actualmente 6 de las 10 clases: aerosol alto 400 ml, aerosol 250 ml, diamante 500 ml, bidón cuadrado de 1 galón, estriado lateral de 1 litro y cilindro 250 ml. Las clases aerosol bajo 400 ml, diamante 700 ml, bidón ovalado de 1 galón y estriado lateral 300 ml no muestran ejemplos mientras no se encuentre un producto cuya imagen coincida en forma y capacidad. Para comparar los bidones, 1 galón se normaliza a 3785.41 ml.

## Requisitos e inicio

1. Instala Node.js.
2. En esta carpeta, instala las dependencias con `npm install`.
3. Configura `OPENAI_API_KEY` en un archivo local `.env`. La clave se utiliza solo en `server.js`; no la pongas en archivos del navegador ni la compartas.
4. Inicia la aplicación con `node server.js`.
5. Abre `http://127.0.0.1:3000` en Chrome o Edge.

No abras `index.html` directamente desde el explorador de archivos. En ese caso la página usa el protocolo `file://` y las rutas `/api/diseno` y `/api/generar-imagen` no llegan a Express. Mantén la ventana de terminal del servidor abierta mientras utilizas el chat y la generación visual. Si el puerto 3000 está ocupado, detén únicamente el servidor anterior de este proyecto antes de iniciar otro.

Después de actualizar archivos del servidor, detén el proceso anterior con `Ctrl+C` en su terminal, vuelve a ejecutar `node server.js` y recarga `http://127.0.0.1:3000`. Los mensajes de diseño usan salida JSON estructurada; el servidor añade ese requisito al mensaje enviado a OpenAI y registra los detalles técnicos de errores sin devolverlos junto con credenciales al navegador.

El servidor no hace llamadas de prueba a OpenAI al iniciarse. Si falta la clave, la identificación y las fichas siguen disponibles; el chat y la generación visual informan que el servicio IA no está configurado. Se puede definir `OPENAI_TEXT_MODEL` o `OPENAI_IMAGE_MODEL` en el entorno para cambiar los modelos; por defecto se usan `gpt-4.1-mini` y `gpt-image-1`.

## Diseño asistido por IA

El chat trabaja como director de arte y diseñador gráfico de packaging. Recibe el envase reconocido, las dimensiones de la ficha y el historial de esa sesión. Cuando se pide Simoniz o Binner, aplica una dirección diferenciada inspirada en sus códigos visuales; si hay un producto de esa marca que coincide en forma y capacidad, utiliza su imagen solo como referencia de estilo, nunca para copiar su etiqueta. Si no se especifica marca, genera rutas originales sin atribuirlas a una marca.

Cada solicitud prepara tres rutas creativas seleccionables. Elige una antes de generar la propuesta visual; las rutas deben diferenciarse en concepto, paleta y composición. Al pedir cambios en el chat, el asistente conserva la ruta elegida. La generación visual utiliza la foto del envase para preservar su geometría y trata las referencias de marca solo como inspiración gráfica. Si no hay una foto de entrenamiento o referencia compatible, adjunta una foto del mismo envase; la aplicación vuelve a verificar que Teachable Machine lo reconozca en la misma clase con al menos 95 % de confianza.

La propuesta visual solicita preservar la forma, la tapa, las proporciones, la geometría y la perspectiva del envase y modificar únicamente su presentación gráfica. Los diseños no reproducen etiquetas, logotipos, composiciones ni claims de las referencias. El resultado depende de la disponibilidad y los permisos de los modelos en la cuenta de OpenAI, así como de su cuota. El servidor maneja errores de conexión, configuración y cuota sin exponer la clave al navegador.

## Rutas de API

- `GET /api/envases`: datos del catálogo técnico para el contexto del diseño.
- `POST /api/diseno`: crea un concepto estructurado a partir del envase, el mensaje y el historial.
- `POST /api/generar-imagen`: edita una imagen de referencia con la propuesta aprobada.

El modelo de Teachable Machine (`https://teachablemachine.withgoogle.com/models/Bsi-nf_xh/`) y las imágenes remotas de marcas requieren conexión a internet.

### Imágenes con etiquetas y nuevos envases

El análisis alternativo reduce la influencia del color y de la zona central impresa de la etiqueta, y busca la forma entre varios recortes de la imagen. Esto permite reconocer envases ya entrenados aunque tengan una presentación gráfica diferente, como el bidón Binner del ejemplo compartido. La ficha devuelta sigue correspondiendo a una de las diez clases actuales y su capacidad registrada; la aplicación no puede determinar con fiabilidad una capacidad desconocida solo a partir de una etiqueta o fotografía.

Este ajuste no reentrena Teachable Machine ni añade clases automáticamente. Para incorporar un envase de forma permanente, agrega al conjunto de entrenamiento varias fotos del recipiente vacío y etiquetado, con distintos fondos, ángulos e iluminación; conserva una sola clase por combinación de forma y capacidad, vuelve a entrenar y publicar el modelo y actualiza `MODEL_URL` en `app.js`.
