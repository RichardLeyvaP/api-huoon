const logger = require('../../config/logger');
const openai = require('../../config/openaiClient');

const IntentDetectionService = {
  async detectarIntent(textoUsuario) {
    try {
      const prompt = `
Analiza el siguiente texto y dime si contiene una intención clara (como pedir algo, saludar, quejarse, programar una tarea, etc.).

**Si hay intención**, devuélvela en **formato JSON** con los siguientes campos:
- "intent": una palabra o frase corta que represente la intención (ej. "saludo", "queja", "programar_tarea").
- "confidence": número entre 0 y 1 que indique cuán seguro estás.
- "explanation": breve explicación del por qué.

**Si no hay intención clara**, responde exactamente:
\`\`\`json
{ "intent": null }
\`\`\`

Texto a analizar:
\`\`\`
${textoUsuario}
\`\`\`
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Puedes cambiarlo a gpt-4o-mini si prefieres
        messages: [
          { role: "system", content: "Eres un analizador de intenciones en lenguaje natural." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 500
      });

      const content = response.choices[0].message.content;

      // Intentar parsear respuesta a JSON
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      const jsonString = content.slice(jsonStart, jsonEnd);

      return JSON.parse(jsonString);
    } catch (error) {
      logger.error('Error al detectar intención con OpenAI:', error);
      return { error: 'No se pudo detectar la intención', details: error.message };
    }
  }
};

module.exports = IntentDetectionService;
