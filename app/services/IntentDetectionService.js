const logger = require('../../config/logger');
const openai = require('../../config/openaiClient');
const { PriorityRepository, BudgetRepository, TypeRepository, WareHouseRepository } = require('../repositories');

// Importar chrono-node para interpretar fechas en español
const chrono = require('chrono-node');
const CategoryService = require('./CategoryService');

// Función para interpretar frases de fecha/hora
function interpretarFecha(texto, now = new Date()) {
  const resultado = chrono.es.parse(texto, now); // Parser en español

  if (resultado && resultado.start) {
    const fechaInterpretada = resultado.start.date();
    return {
      date: fechaInterpretada.toISOString().split('T')[0], // YYYY-MM-DD
      time: `${fechaInterpretada.getHours().toString().padStart(2, '0')}:${fechaInterpretada.getMinutes().toString().padStart(2, '0')}`,
      isValid: true
    };
  }

  return {
    isValid: false,
    error: "No se pudo interpretar la fecha o hora"
  };
}

// Función para decidir si es hoy o mañana en base a la hora
function getFechaAdecuada(horaStr, now = new Date()) {
  const [horas, minutos] = horaStr.split(':').map(Number);
  const horaDada = new Date(now);
  horaDada.setHours(horas, minutos, 0, 0);

  if (horaDada > now) {
    return now.toISOString().split('T')[0]; // Hoy
  } else {
    const mañana = new Date(now);
    mañana.setDate(now.getDate() + 1);
    return mañana.toISOString().split('T')[0]; // Mañana
  }
}

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
        model: "gpt-4o",
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

  async detectarIntentTask(textoUsuario, person_id = null, home_id = null) {
    const priorities = await PriorityRepository.findAll(); // [{id: 1, name: "Alta"}, ...]
    const budgets = await BudgetRepository.findAllByPersonIdHomeId(person_id, home_id);
    const categories = await CategoryService.getCategories(person_id, "Budget");
    const types = await TypeRepository.findByType('Presupuesto');
    const warehouses = await WareHouseRepository.findByStatus(1); // [{id: 1, title: "...", description: "...", location: "...", status: 1}, ...]
    const now = new Date();
const todayFormatted = now.toISOString().split('T')[0]; // YYYY-MM-DD
const currentTimeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`; // HH:mm

const prompt = `
Analiza rigurosamente el siguiente texto del usuario para determinar si expresa una intención clara de:
- Crear/programar una tarea (Tarea)
- Establecer una meta (Meta)
- Registrar un ingreso financiero (Ingreso)
- Registrar un gasto financiero (Gasto)
- Registrar un presupuesto financiero (Presupuesto)
- Crear un nuevo almacén en el hogar (Warehouse), como un cuarto, baño, cocina, despensa, bodega, etc.

Fecha actual: ${todayFormatted}
Hora actual: ${currentTimeFormatted}

Si hay intención clara, devuelve un objeto JSON con uno de los siguientes formatos:

Para Tareas/Metas:
{
  "intent": "Tarea" o "Meta",
  "confidence": número entre 0 y 1,
  "explanation": breve explicación del análisis,
  "taskData": {
    "title": string (obligatorio),
    "description": string (breve, no repetir el título, debe ser útil),
    "start_date": string (YYYY-MM-DD, si no se menciona, la IA debe sugerir una razonable),
    "start_time": string (HH:mm, si no se menciona, la IA debe sugerir una razonable),
    "end_date": string (YYYY-MM-DD, si no se menciona, la IA debe sugerir una razonable),
    "end_time": string (HH:mm, si no se menciona, la IA debe sugerir una razonable),
    "priority_id": número (usa uno de los siguientes: ${priorities.map(p => `${p.id}(${p.name})`).join(', ')}),
    "estimated_time": número (en minutos, si no se menciona, la IA debe sugerir una razonable),
    "type": "Tarea" o "Meta"
    "recurrence": string (uno de los siguientes: "Diaria", "Semanal", "Mensual", "Anual", "No se repite"; si no se especifica en el texto, inferir del contexto; si no hay indicios, usar "No se repite")
  }
}

Para Finanzas (Ingreso/Gasto):
{
  "intent": "Ingreso" o "Gasto",
  "confidence": número entre 0 y 1,
  "explanation": breve explicación del análisis,
  "financeData": {
    "spent": número (valor del gasto, 0 si es ingreso),
    "income": número (valor del ingreso, 0 si es gasto),
    "date": string (YYYY-MM-DD, si no se menciona usar fecha actual),
    "description": string (descripción breve y útil, no genérica),
    "type": "Personal" o "Hogar" (inferir del contexto si no se especifica),
    "budget_id": número o null (solo para gastos, usa uno de los siguientes si coincide con el tipo y descripción: ${budgets.map(b => `${b.id}(${b.name} - ${b.type})`).join(', ')})
  }
}

Para Presupuesto:
{
  "intent": "Presupuesto",
  "confidence": número entre 0 y 1,
  "explanation": breve explicación del análisis,
  "budgetData": {
    "category_id": número o null (usa uno de los siguientes que mejor coincida con la descripción: ${categories.map(c => `${c.id}-(${c.name})`).join(', ')}, y si no detecta coincidencia null),
    "amount": número (monto del presupuesto),
    "start_date": string (YYYY-MM-DD, si no se menciona usar el primer día del mes actual),
    "end_date": string (YYYY-MM-DD, si no se menciona usar el último día del mes actual),
    "budget_type": "Personal" o "Hogar" (inferir del contexto si no se especifica),
    "description": string (breve, puede ser null),
    "currency": string (código de moneda, ej. USD, EUR, CLP; usar CLP si no se menciona)
    "type_id": número (usa uno de los siguientes IDs de tipo de presupuesto: ${types.map(t => `${t.id}(${t.name})`).join(', ')}; si no se especifica, la IA debe inferir el más acorde al contexto, pero siempre debe devolver un número válido existente en este listado)
  }
}

Para Crear Almacén:
{
  "intent": "Warehouse",
  "confidence": número entre 0 y 1,
  "explanation": breve explicación del análisis,
  "warehouseData": {
    "warehouse_id": número o null (si el almacén mencionado coincide con uno existente activo (${warehouses.map(w => `${w.id}(${w.title} - ${w.location})`).join(', ')}), usar su ID; si no, null),
    "title": string (título del almacén, ej. "Despensa", "Cocina", "Baño", "Bodega", etc. Si ya existe uno coincidente, usar el mismo título),
    "description": string (descripción útil del almacén, ej. "Lugar donde se guardan alimentos no perecibles", "Área para productos de limpieza", etc. Si existe coincidencia, usar la misma descripción),
    "location": string (ubicación dentro del hogar, ej. "planta baja", "segundo piso", "jardín", "pasillo", etc. Si existe coincidencia, usar la misma ubicación),
    "status": número (0 si es privado, 1 si es público/compartido; inferir del contexto. Ej: "mi bodega personal" → 0, "la despensa de la casa" → 1)
  }
}

Instrucciones adicionales:
1. Para Tareas/Metas:
- La descripción NO debe ser solo "realizar una tarea para..." sino que debe ser útil y descriptiva.
- Si no se especifica una fecha u hora, la IA debe inferir una razonable basada en el contexto actual.
- Si es una Meta, incluye end_date y end_time razonables si no se especifican.
- La prioridad debe asignarse en función de la importancia percibida de la tarea/meta.
- El tiempo estimado debe ser coherente con el tipo de tarea/meta.
- El campo "recurrence" debe reflejar si la tarea se repite:
   * Valores permitidos: "Diaria", "Semanal", "Mensual", "Anual", "No se repite"
   * Ejemplos de contexto:
      - "todos los días", "cada día" → "Diaria"
      - "cada semana", "los lunes" → "Semanal"
      - "cada mes", "mensualmente" → "Mensual"
      - "cada año", "anualmente" → "Anual"
      - Si no hay indicios de repetición → "No se repite"
   * Este campo es obligatorio en taskData.

2. Para Finanzas:
- Distinguir claramente entre ingreso (income > 0, spent = 0) y gasto (spent > 0, income = 0).
- Descripción debe ser específica (ej. "Compra supermercado" en lugar de "gasto").
- Tipo (Personal/Hogar) debe inferirse del contexto cuando no esté explícito.
- budget_id: Solo para gastos, asignar el ID del presupuesto que mejor coincida con:
   * El tipo (Personal/Hogar) del gasto
   * La descripción del gasto
   * Si no hay coincidencia clara, usar null

3. Para Presupuesto:
- category_id: Asignar el ID de categoría que mejor coincida con la descripción del presupuesto o sino null.
- amount: Monto total del presupuesto.
- start_date y end_date: Si no se mencionan, usar el primer y último día del mes actual respectivamente.
- budget_type: "Personal" o "Hogar", inferir del contexto si no se menciona.
- description: Breve descripción, siempre dar una descripción referente al contexto.
- currency: Código de moneda (ej. USD), usar USD por defecto si no se menciona.
- type_id: Debe asignarse un número válido de los tipos disponibles (${types.map(t => `${t.id}(${t.name})`).join(', ')}). Si el usuario no especifica un tipo, la IA debe inferir el más adecuado según el contexto (por ejemplo, si es un presupuesto para vacaciones, elegiría un tipo como 'Recreación' o 'Viaje'), pero **siempre debe devolver un valor numérico válido**, nunca null o undefined.

4. Para Crear Almacén:
- El intent debe ser "Warehouse" (exactamente así).
- warehouse_id: Si el almacén mencionado (por título o ubicación) coincide con uno de los activos (${warehouses.map(w => `${w.id}(${w.title} - ${w.location})`).join(', ')}), usar su ID; si no, null.
- title: Si se menciona un nombre como "despensa", "bodega", "cuarto de limpieza", etc., usarlo. Si coincide con un almacén existente, mantener el título original.
- description: Generar una descripción útil basada en el contexto. Si ya existe, usar la descripción existente.
- location: Indicar dónde está ubicado dentro del hogar (ej. "cocina", "garaje", "pasillo"). Si coincide con uno existente, usar la ubicación registrada.
- status: Determinar si es un almacén personal (0) o compartido (1). Ejemplos:
   - "mi armario" → 0
   - "la despensa de la casa" → 1
   - "el baño de visitas" → 1 (por defecto si no se especifica privacidad)
   - Si no se indica, asumir 1 (público/compartido).

5. Generales:
- Confidence debe reflejar la certeza de la intención detectada.
- Explanation debe justificar claramente la decisión tomada.

Texto a analizar: "${textoUsuario}"
`;
    const respuesta = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Eres un especialista en detectar intenciones de creación de tareas y metas. Responde solo con el JSON solicitado.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const contenido = respuesta.choices[0].message.content;
    logger.info("IntentDetectionService->detectarIntentTask: Respuesta de OpenAI:", contenido);

    try {
      const json = JSON.parse(contenido);
      return json;
    } catch (error) {
      logger.error("Error parsing JSON:", error);
      return {
        error: "No se pudo interpretar la respuesta como JSON",
        raw: contenido,
      };
    }
  }
};

module.exports = IntentDetectionService;