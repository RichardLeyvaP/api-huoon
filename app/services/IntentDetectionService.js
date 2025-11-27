const logger = require('../../config/logger');
const openai = require('../../config/openaiClient');
const { PriorityRepository, BudgetRepository, TypeRepository, WareHouseRepository, PersonWareHouseRepository } = require('../repositories');

// Importar chrono-node para interpretar fechas en español
const chrono = require('chrono-node');
const CategoryService = require('./CategoryService');
const StatusService = require('./StatusService');

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
    const categoriesProduct = await CategoryService.getCategories(person_id, "Product");
               const statuses = await StatusService.getStatus("Product");
               const personWarehouses = await PersonWareHouseRepository.gettWarehouses(home_id, person_id);
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
- Registrar un producto en un almacén (Producto), como alimentos, artículos de limpieza, herramientas, etc., con detalles como nombre, cantidad, precio, fecha de compra, lugar, vencimiento, etc.
- Expresar un deseo personal o futuro (Deseo)

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

Para Registrar Producto:
{
  "intent": "Producto",
  "confidence": número entre 0 y 1,
  "explanation": breve explicación del análisis,
  "productData": {
    "warehouse_id": número (obtenido de ${personWarehouses.map(w => `${w.id}(${w.title} - ${w.location})`).join(', ')}; usar el ID del almacén que mejor coincida por título o ubicación descrita; si no coincide, null),
    "name": string (nombre del producto, ej. "Arroz", "Detergente", "Destornillador"),
    "category_id": número o null (asignar el ID de la categoría que mejor coincida con el nombre o descripción del producto, basado en: ${categoriesProduct.map(c => `${c.id}(${c.name})`).join(', ')}; si no hay coincidencia clara, null),
    "unit_price": número (precio por unidad; si se da total y cantidad, calcular unit_price = total_price / quantity),
    "quantity": número (cantidad comprada; debe ser positivo),
    "total_price": número (importe total; si se da unit_price y quantity, calcular total_price = unit_price * quantity),
    "purchase_place": string o null (lugar donde se compró, ej. "Líder", "Ferretería Don Pepe"; si no se menciona, null),
    "purchase_date": string (YYYY-MM-DD; si no se menciona, usar fecha actual: ${todayFormatted}),
    "expiration_date": string o null (YYYY-MM-DD; si no se menciona y no es relevante (ej. herramientas), null; si es alimento perecible y se menciona vencimiento, usarlo),
    "status_id": número (obtenido de ${statuses.map(s => `${s.id}(${s.name})`).join(', ')}; si no se especifica, asignar el ID del estado que signifique "En Uso" o similar; si no se encuentra, usar el ID del estado por defecto para productos activos),
    "additional_notes": string o null (notas adicionales del usuario, si las da; si no, null)
  }
}

Para Deseo:
{
  "intent": "Deseo",
  "confidence": número entre 0 y 1,
  "explanation": breve explicación del análisis,
  "desireData": {
    "name": string (título del deseo, inferido del contexto. Ej: "Comprar un auto", "Viajar a Japón". Si no se especifica, sugerir uno coherente),
    "description": string (breve descripción descriptiva que amplíe el nombre, haciendo alusión al contexto. Ej: "Adquirir un vehículo 0km para uso familiar"),
    "type": "Personal" | "Hogar" | "Profesional" (inferir del contexto; si no se especifica, usar "Personal" por defecto),
    "date": string (YYYY-MM-DD; fecha de inicio o creación del deseo. Si no se menciona, usar fecha actual: ${todayFormatted}),
    "end": string (YYYY-MM-DD; fecha esperada de cumplimiento. Si no se menciona, sugerir una razonable: ej. +1 meses para deseos pequeños, +3 meses para grandes deseos),
    "priority_id": número (usar uno de los siguientes: ${priorities.map(p => `${p.id}(${p.name})`).join(', ')}; si no se especifica, asignar prioridad media o alta según urgencia percibida),
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

5. Para Registrar Producto:
- El intent debe ser "Producto" (exactamente así).
- Todos los campos en productData deben inferirse del contexto.
- Esta intención **tiene prioridad sobre "Gasto"** cuando se menciona un **producto físico específico** (ej. carro, arroz, detergente, refrigerador).
- Detectar cuando el usuario describe la compra, adquisición o registro de un producto físico con cantidad, precio, lugar, etc.
- warehouse_id: - Si el usuario menciona un almacén ("despensa", "baño", "bodega"), usar su ID de: ${personWarehouses.map(w => `${w.id}(${w.title})`).join(', ')}.
   - **Si NO lo menciona, inferir el más adecuado** basado en:
     - Nombre del producto
     - Categoría (category_id),
     - Uso común
   - Ejemplos de inferencia:
     - Alimentos (arroz, atún) → "Despensa", "Cocina"
     - Limpieza (detergente, cloro) → "Limpieza", "Bodega"
     - Higiene (shampoo, cepillo) → "Baño"
     - Herramientas → "Taller", "Bodega"

- name: Extraer el nombre del producto mencionado (ej. "compré arroz", → "Arroz").
- category_id: Usar el servicio de categorías (${categories.map(c => `${c.id}(${c.name})`).join(', ')}) para asignar la más adecuada según nombre o contexto (ej. "arroz" → categoría "Alimentos").
- unit_price y total_price: Si se da uno y la cantidad, calcular el otro. Si se dan ambos, validar coherencia. Si solo se da uno sin cantidad, no calcular, dejar null si no es posible.
- quantity: Siempre debe ser un número positivo. Inferir de frases como "5 unidades", "un kilo", etc.
- purchase_place: Extraer nombres de tiendas, mercados, ferreterías, etc.
- purchase_date: Si no se especifica, usar ${todayFormatted}.
- expiration_date: Solo si se menciona explícitamente o se infiere (ej. "caduca en junio", "vence el 15 de julio"). Si no, null.
- status_id: Si no se menciona, usar el ID del estado que corresponda a "En Uso" (activo). Si no se puede inferir, elegir el estado por defecto para productos recién registrados.
- additional_notes: Capturar cualquier comentario adicional ("con descuento", "orgánico", "para emergencias", etc.).

7. Para Deseo:
- El intent debe ser "Deseo" (exactamente así).
- Esta intención se activa cuando el usuario expresa un anhelo, sueño, aspiración o objetivo a largo plazo que no necesariamente es una "meta" con acciones concretas inmediatas.
- Ejemplos de desencadenadores:
   * "Quiero", "Me gustaría", "Sueño con", "Algún día me encantaría", "Tengo ganas de", "Mi sueño es", "Me propuse tener", etc.
- name: Debe ser conciso y claro. Ej: "Comprar casa", "Aprender inglés", "Montar mi negocio".
- description: Debe expandir el nombre con detalles del contexto. No debe repetir el name. Ej: "Adquirir una vivienda en el sur del país para fines de semana".
- type: Inferir según el contexto:
   * "Profesional": si involucra carrera, trabajo, emprendimiento.
   * "Hogar": si involucra vivienda, muebles, remodelación.
   * "Personal": por defecto (viajes, hobbies, salud, educación personal).
- date: Fecha de creación del deseo. Si no se menciona, usar ${todayFormatted}.
- end: Fecha esperada de cumplimiento. Si no se especifica:
   * Deseos pequeños (ej. comprar objeto): +3 a 6 meses
   * Deseos grandes (ej. viaje, auto, casa): +1 a 2 años
   * Si el usuario da indicios ("el año que viene", "en 2025"), respetarlos.
- priority_id: Asignar basado en entonación:
   * "realmente quiero", "es muy importante" → prioridad alta (ID de prioridad Alta)
   * "me gustaría", "sería lindo" → prioridad media (ID Media)
   * "algún día" → prioridad baja (ID Baja)
   * Usar siempre un ID válido de: ${priorities.map(p => `${p.id}(${p.name})`).join(', ')}

8. Prioridad de detección:
- Si el deseo incluye una acción inmediata o plan concreto ("voy a empezar a ahorrar la próxima semana"), podría ser también una Meta → en ese caso, dar prioridad a "Meta".
- Si el deseo describe una compra específica con producto, cantidad, precio → prioridad a "Producto" o "Gasto".
- "Deseo" es para aspiraciones generales sin plan de acción inmediato.

9. Generales:
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
    //logger.info("IntentDetectionService->detectarIntentTask: Respuesta de OpenAI:", contenido);

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
  },

  // En TaskService.js o IntentDetectionService.js
  async calculateRewardsWithAI (taskData) {
  // ✅ 1. Obtener prioridades dentro del método (como en detectarIntentTask)
    const priorities = await PriorityRepository.findAll();

    const { 
      type, 
      title, 
      description, 
      priority_id, 
      start_date,   // ✅ ahora usamos start_date
      end_date,     // ✅ y end_date
      estimated_time, 
      recurrence 
    } = taskData;

    // Obtener nombre de la prioridad para contexto
    const priority = priorities.find(p => p.id === priority_id);
    const priorityName = priority ? priority.name : "Desconocida";

    // Calcular duración en semanas (solo si ambas fechas existen)
    let durationWeeks = null;
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      const diffTime = Math.abs(end - start);
      durationWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)); // días → semanas
    }

    const prompt = `
  Eres un sistema de recompensas inteligente para un gestor de productividad personal.

  Tu tarea es analizar los datos de una tarea o meta y devolver **exactamente** cuántas monedas y diamantes debe otorgar al usuario al completarla.

  ### Reglas estrictas:
  1. **Si es una "Tarea"**:
    - Solo otorga **monedas** (currency_reward entre 1 y 10).
    - **Nunca otorgues diamantes** (diamonds_reward = 0).
    - Las monedas se basan en: prioridad, tiempo estimado y complejidad.
      * Prioridad Baja → 1-3 monedas
      * Prioridad Media → 4-6 monedas
      * Prioridad Alta → 7-10 monedas

  2. **Si es una "Meta"**:
    - Siempre otorga **monedas** (5-10).
    - **Diamantes (solo 1 o 0)** se otorgan **solo si la meta es compleja**, evaluada por:
      * **Duración**: diferencia entre start_date y end_date en **semanas**.
        - Menos de 4 semanas → 0 diamantes.
        - 4 a 12 semanas → 1 diamante **solo si prioridad es Alta**.
        - Más de 12 semanas → 1 diamante (si prioridad Media o Alta).
      * **Prioridad**: Baja → nunca da diamantes.
      * **Descripción ambiciosa**: palabras como "maestría", "certificación", "construir", "lanzar", etc., refuerzan complejidad.
    - Si no cumple los criterios → diamonds_reward = 0.

  3. **Valores permitidos**:
    - currency_reward: entero entre 1 y 10.
    - diamonds_reward: 0 o 1 (nunca más de 1).

  ### Datos de la tarea/meta:
  - Tipo: "${type}"
  - Título: "${title}"
  - Descripción: "${description || 'Sin descripción'}"
  - Prioridad ID: ${priority_id} (${priorityName})
  - Fecha de inicio: ${start_date || 'No especificada'}
  - Fecha de fin: ${end_date || 'No especificada'}
  - Duración calculada: ${durationWeeks !== null ? `${durationWeeks} semanas` : 'No calculable'}
  - Tiempo estimado: ${estimated_time ? `${estimated_time} minutos` : 'No especificado'}
  - Repetición: "${recurrence || 'No se repite'}"
  - Lista de prioridades disponibles: ${priorities.map(p => `${p.id}(${p.name})`).join(', ')}

  ### Formato de respuesta (JSON estricto):
  {
    "currency_reward": número,
    "diamonds_reward": número
  }
  `;

    try {
      const respuesta = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres un calculador de recompensas. Responde SOLO con el JSON solicitado, sin explicaciones."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const contenido = respuesta.choices[0].message.content;
      const rewards = JSON.parse(contenido);

      // ✅ Validación final
      rewards.currency_reward = Math.max(1, Math.min(10, Math.round(rewards.currency_reward || 5)));
      rewards.diamonds_reward = type === "Tarea" 
        ? 0 
        : Math.max(0, Math.min(1, Math.round(rewards.diamonds_reward || 0)));

      return rewards;
    } catch (error) {
      logger.error("Error en calculateRewardsWithAI:", error);
      // Fallback seguro
      return {
        currency_reward: type === "Meta" ? 7 : 5,
        diamonds_reward: (type === "Meta" && priority_id === 3 && durationWeeks >= 4) ? 1 : 0
      };
    }
  }
};

module.exports = IntentDetectionService;