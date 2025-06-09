const logger = require('../../config/logger');
const openai  = require('../../config/openaiClient'); // Importa el IA

const  OCRProcessorService = {
  async extractProductsFromOCR(ocrText) {
    try {
      const prompt = `
      Analiza el siguiente texto OCR de una boleta de compra y genera un objeto JSON con:
      1. Metadatos del documento (folio, fecha, RUT y total general)
      2. Lista detallada de productos comprados

      **Formato de salida requerido:**
      \`\`\`json
      {
        "documento": {
          "folio": "B123456",
          "fecha": "2023-12-15",
          "rut": "12.345.678-9",
          "total": 12590,
          "lugar": {
          "nombre": "Nombre del local",
          "direccion": "Dirección completa",
          "sucursal": "Sucursal si está especificada"
        }
        },
        "productos": [
          {
            "nombre": "Nombre del producto",
            "cantidad": 2,
            "precioUnitario": 1290,
            "total": 2580
          }
        ]
      }
      \`\`\`

      **Instrucciones específicas:**
      1. Para productos:
        - Extraer todos los ítems detectados
        - Cantidad como número cuando sea posible (ej: "2 unidades" → 2)
        - Precios convertidos a números (ej: "$1.290" → 1290)

      2. Para metadatos:
        - Fecha en formato \`YYYY-MM-DD\` (transformar de "DD/MM/AAAA" si es necesario)
        - RUT con formato \`XX.XXX.XXX-X\` (ej: "12345678-9" → "12.345.678-9")
        - Folio exactamente como aparece en el documento

      3. Reglas generales:
        - Campos no identificados → \`null\`
        - Solo devolver el objeto JSON (sin comentarios o texto adicional)
        - Priorizar precisión sobre completitud

      Texto OCR a procesar:
      \`\`\`
      ${ocrText}
      \`\`\`
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres un asistente especializado en extraer información estructurada de textos OCR de compras."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" } // Forzar formato JSON
      });

      const content = response.choices[0].message.content;
      
     // 1. Buscar el objeto JSON completo (no solo el array)
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      const jsonString = content.slice(jsonStart, jsonEnd);
      
      // 2. Parsear el objeto completo
      const result = JSON.parse(jsonString);
      
      // 3. Devolver toda la estructura (documento + productos)
      return result;
    } catch (error) {
      logger.error('Error al procesar el OCR con OpenAI:', error);
      throw new Error('Error al procesar el OCR');
    }
  },
}

module.exports = OCRProcessorService;