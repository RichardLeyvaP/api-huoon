const logger = require('../../config/logger');
const openai = require('../../config/openaiClient');

const IntentDetectionService = {
  async detectarIntent(textoUsuario) {
    try {
       const prompt = `
Analiza el siguiente texto para determinar si es una meta que podría descomponerse en tareas. Responde en formato JSON con:
- "is_meta": boolean (true si es una meta accionable)
- "reason": breve explicación

Ejemplos de metas accionables:
- "Control de gastos mensuales"
- "Organizar la boda"
- "Renovar la cocina"

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
  },
  async detectarIntentTask(textoUsuario) {
  const prompt = `
Analiza rigurosamente el siguiente texto del usuario para determinar si expresa una intención clara de:
- Crear/programar una tarea (Tarea)
- Establecer una meta (Meta)
- Otra intención relacionada con gestión de actividades

Considera como positivos incluso los casos donde la intención no sea explícita pero se pueda inferir claramente.

Ejemplos de intenciones positivas:
- "necesito crear una tarea para mañana a las 10" → {intent: "Task", ...}
- "quiero establecer una meta de ejercicio" → {intent: "Goal", ...}
- "programa una reunión con el equipo el viernes" → {intent: "Task", ...}
- "necesito crear una meta para limpiar la casa" → {intent: "Goal", ...}

La respuesta DEBE ser en formato JSON con los siguientes campos:
- "intent": string (ej. "Tarea", "Meta") o null si no aplica
- "confidence": número entre 0 y 1 (debe ser alto para intenciones claras)
- "explanation": breve explicación del análisis

Texto a analizar: "${textoUsuario}"
`;

  const respuesta = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "Eres un especialista en detectar intenciones de creación de tareas y metas. Responde solo con el JSON solicitado." 
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.5, // Aumentamos para mejor detección
    response_format: { type: "json_object" } // Forzamos formato JSON
  });

  const contenido = respuesta.choices[0].message.content;
  logger.info("Respuesta del modelo:", contenido);

  try {
    const json = JSON.parse(contenido);
    return json;
  } catch (error) {
    logger.error("Error parsing JSON:", error);
    return { 
      error: "No se pudo interpretar la respuesta como JSON",
      raw: contenido 
    };
  }
}
};

module.exports = IntentDetectionService;
