const logger = require("../../config/logger");
const openai = require("../../config/openaiClient");
const {
  PriorityRepository,
  HomePersonRepository,
  RoleRepository,
} = require("../repositories");

const TaskSuggestionService = {
  recurrenceOptions: [
    { id: "Diaria", name: "Diaria" },
    { id: "Semanal", name: "Semanal" },
    { id: "Mensual", name: "Mensual" },
    { id: "Anual", name: "Anual" },
    { id: "No se repite", name: "No se repite" },
  ],

  // Método principal mejorado
  async processTextToTask(text, homeId, userId) {
    try {
      logger.info(
        `Procesando sugerencia para homeId: ${homeId}, usuario: ${userId}`
      );

      // 1. Obtener datos dinámicos con manejo robusto
      const [priorities, homePeople, taskRoles] = await this._fetchDynamicData(
        homeId,
        text,
        userId
      );

      // 2. Validar datos esenciales
      this._validateEssentialData(priorities, taskRoles);

      // 3. Procesar con IA usando datos dinámicos
      const suggestedTask = await this._analyzeWithAI(
        text,
        priorities,
        homePeople,
        taskRoles,
        userId,
        homeId
      );

      return {
        success: true,
        suggestedTask,
        message: "Sugerencia generada exitosamente",
      };
    } catch (error) {
      logger.error("Error en processTextToTask:", error.message);
      throw error;
    }
  },

  // Método auxiliar para obtener datos dinámicos
  async _fetchDynamicData(homeId, text, userId) {
    try {
      const [priorities, homePeople, taskRoles] = await Promise.all([
        PriorityRepository.findAll().catch(() => this._getDefaultPriorities()),
        this._getPeopleWithFuzzyMatching(homeId, text, userId),
        RoleRepository.getRolesType("Task"),
      ]);

      logger.info("Datos dinámicos obtenidos:", {
        priorities: priorities.length,
        people: homePeople.length,
        roles: taskRoles.length,
      });

      return [priorities, homePeople, taskRoles];
    } catch (error) {
      logger.error("Error obteniendo datos dinámicos:", error);
      throw new Error("Error al cargar configuración del sistema");
    }
  },

  // Prioridades por defecto
  _getDefaultPriorities() {
    return [
      { id: 1, name: "Baja", level: 1 },
      { id: 2, name: "Media", level: 2 },
      { id: 3, name: "Alta", level: 3 },
    ];
  },

  // Validación de datos esenciales
  _validateEssentialData(priorities, taskRoles) {
    if (!priorities?.length) {
      logger.warn("Usando prioridades por defecto");
      return this._getDefaultPriorities();
    }

    if (!taskRoles?.length) {
      throw new Error("Configuración de roles no disponible");
    }
  },

  // Método mejorado de análisis con IA
  async _analyzeWithAI(
    text,
    priorities,
    homePeople,
    taskRoles,
    userId,
    homeId
  ) {
    try {
      // 1. Preparar datos para el prompt
      const promptData = this._buildPromptData(
        text,
        priorities,
        homePeople,
        taskRoles,
        userId
      );

      // 2. Generar prompt estructurado
      const prompt = this._createStructuredPrompt(promptData);

      logger.debug("Prompt enviado a OpenAI:", prompt);

      // 3. Obtener respuesta de OpenAI
      const aiResponse = await this._getAIResponse(prompt);

      // 4. Parsear y validar respuesta
      const taskData = this._parseAIResponse(aiResponse);

      // 5. Formatear respuesta final con validación
      return this._validateAndFormatTask(
        taskData,
        userId,
        homeId,
        promptData.creatorRole,
        promptData.collaboratorRole,
        homePeople,
        taskRoles,
        priorities, // Añade este parámetro
        text // originalText
      );
    } catch (error) {
      logger.error("Error en _analyzeWithAI:", error);
      throw error;
    }
  },

  // Construir datos para el prompt
  _buildPromptData(text, priorities, homePeople, taskRoles, userId) {
    const creatorRole =
      taskRoles.find((r) => r.name === "Responsable") || taskRoles[0];
    const collaboratorRole =
      taskRoles.find((r) => r.name === "Colaborador") || taskRoles[0];

    return {
      text,
      priorityOptions: priorities
        .map((p) => `- ID ${p.id}: ${p.name} (Nivel ${p.level})`)
        .join("\n"),
      peopleOptions: homePeople
        .map((p) => `- ID ${p.person_id}: ${p.personName}`)
        .join("\n"),
      roleOptions: taskRoles.map((r) => `- ID ${r.id}: ${r.name}`).join("\n"),
      recurrenceOptions: this.recurrenceOptions
        .map((r) => `- ${r.id}`)
        .join("\n"),
      creatorRole,
      collaboratorRole,
      userId,
      currentTime: new Date().toTimeString().slice(0, 5),
    };
  },

  // Crear prompt estructurado
  _createStructuredPrompt(data) {
    return `ANALIZA EL TEXTO Y GENERA UNA TAREA USANDO ESTOS DATOS:

### DATOS DEL SISTEMA:
1. PRIORIDADES DISPONIBLES:
${data.priorityOptions}

2. PERSONAS EN EL HOGAR:
${data.peopleOptions}

3. ROLES DISPONIBLES:
${data.roleOptions}

4. OPCIONES DE RECURRENCIA:
${data.recurrenceOptions}

### REGLAS DE TRANSFORMACIÓN:
1. PRIORIDAD:
   - Si menciona "alta prioridad" → usar ID de prioridad más alta
   - Si menciona "media" → usar ID 2
   - Por defecto → usar ID 2

2. PERSONAS:
   - El creador (ID ${data.userId}) siempre es Responsable
   - Buscar nombres en: "${data.text}"
   - Coincidencias parciales aceptadas

3. RECURRENCIA:
   - "todos los días" → "Diaria"
   - "cada semana" → "Semanal"
   - Por defecto → "No se repite"

### TEXTO A ANALIZAR:
"${data.text}"

### GENERA JSON CON:
- title (obligatorio)
- description (con participantes)
- priority_id (usar IDs proporcionados)
- people (usar IDs reales)
- recurrence (usar opciones proporcionadas)
`;
  },

  // Obtener respuesta de OpenAI
  async _getAIResponse(prompt) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente que transforma texto en tareas estructuradas usando solo los datos proporcionados.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2, // Más determinista
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    return response.choices[0].message.content;
  },

  // Parsear respuesta de IA
  _parseAIResponse(content) {
    try {
      const taskData = JSON.parse(content);
      logger.debug("Respuesta de IA parseada:", taskData);

      if (!taskData.title) {
        throw new Error("La IA no generó un título válido");
      }

      return taskData;
    } catch (e) {
      logger.error("Error parseando respuesta IA:", content);
      throw new Error("Formato de respuesta inválido");
    }
  },

  async _getPeopleWithFuzzyMatching(homeId, text, userId) {
    try {
      const allPeople = await HomePersonRepository.getPeopleByHomeId(homeId);
      const mentionedPeople = this._findMentionedPeople(text, allPeople);

      // Asegurar que el creador esté incluido
      const creator = allPeople.find((p) => p.person_id === userId);
      if (creator && !mentionedPeople.some((p) => p.person_id === userId)) {
        mentionedPeople.push(creator);
      }

      return mentionedPeople.length > 0 ? mentionedPeople : allPeople;
    } catch (error) {
      logger.error("Error en búsqueda de personas:", error);
      return await HomePersonRepository.getPeopleByHomeId(homeId);
    }
  },

  _extractNamesFromText(text) {
    if (!text || typeof text !== "string") return [];
    const normalizedText = this._normalizeText(text);

    // Patrón más flexible para nombres
    const namePattern =
      /(?:con|y|participantes?|asignar a)\s+([a-záéíóúñ\s]+?)(?=\s|$)/gi;

    const matches = [...normalizedText.matchAll(namePattern)];
    const names = matches.flatMap((match) =>
      match[1]
        .split(/\s+y\s+|\s*,\s*/)
        .map((name) => name.trim())
        .filter((name) => name.length > 2)
    );

    return [...new Set(names)]; // Eliminar duplicados
  },

  _normalizeText(str) {
    if (!str || typeof str !== "string") return "";
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
      .replace(/[^a-z0-9áéíóúñ\s]/g, "") // Eliminar caracteres especiales
      .trim();
  },
  _validateAndFormatTask(
    taskData,
    userId,
    homeId,
    creatorRole,
    collaboratorRole,
    homePeople,
    taskRoles,
    priorities, // Nuevo parámetro
    originalText
  ) {
    // Validación y generación de título robusta
    if (!taskData.title || taskData.title === "undefined") {
      // Usar el texto original recibido como parámetro
      const verbMatch = originalText.match(/^(\w+\s+\w+\s+\w+\s+\w+)/);
      taskData.title = verbMatch ? verbMatch[0] : "Nueva tarea";
      taskData.title =
        taskData.title.charAt(0).toUpperCase() + taskData.title.slice(1);
    }
    // Validación de descripción
    if (!taskData.description || taskData.description.includes("undefined")) {
      const defaultTime = new Date().toTimeString().slice(0, 5);
      taskData.description = `Tarea programada para ${
        taskData.start_date || "hoy"
      } a las ${taskData.start_time || defaultTime}.`;

      // Agregar participantes si existen
      const mentionedNames = this._extractNamesFromText(text);
      if (mentionedNames.length > 0) {
        taskData.description += ` Participantes: ${mentionedNames.join(", ")}.`;
      }
    }

    // Asegurar tipo válido
    taskData.type = ["Task", "Meta"].includes(taskData.type)
      ? taskData.type
      : "Task";

    // Validar prioridad
    const validPriorityIds = priorities.map((p) => p.id);
    if (
      !taskData.priority_id ||
      !validPriorityIds.includes(taskData.priority_id)
    ) {
      taskData.priority_id = 2; // Prioridad media por defecto
    }

    // Validar y normalizar recurrencia
    const validRecurrences = this.recurrenceOptions.map((r) => r.id);
    if (
      !taskData.recurrence ||
      !validRecurrences.includes(taskData.recurrence)
    ) {
      taskData.recurrence = "No se repite"; // Valor por defecto
    }

    // Procesar personas
    const people = taskData.people || [];

    // 1. Asegurar que el creador esté incluido como Responsable
    const creatorIncluded = people.some((p) => p.person_id === userId);
    if (!creatorIncluded) {
      people.push({
        person_id: userId,
        role_id: creatorRole.id,
      });
    }

    // 2. Validar que las personas existan en el hogar
    const validPersonIds = homePeople.map((p) => p.person_id);
    const filteredPeople = people.filter((p) =>
      validPersonIds.includes(p.person_id)
    );

    // 3. Asignar roles por defecto si no están especificados
    const processedPeople = filteredPeople.map((person) => {
  // Datos base comunes
  const basePerson = {
    id: person.person_id, // Añadir campo 'id' que espera el frontend
    person_id: person.person_id,
    home_id: homeId,
    namePerson: person.name || `Usuario ${person.person_id}`, // Campo requerido
    imagePerson: person.image || 'default-avatar.jpg', // Campo requerido
    selected: true // Para que aparezcan seleccionadas
  };

  // No cambiar el rol del creador
  if (person.person_id === userId) {
    return {
      ...basePerson,
      roleId: creatorRole.id, // Añadir campo 'roleId' que espera el frontend
      role_id: creatorRole.id,
      roleName: creatorRole.name,
    };
  }

  // Para otros, usar rol especificado o colaborador por defecto
  const roleId = person.role_id || collaboratorRole.id;
  const role = taskRoles.find((r) => r.id === roleId) || collaboratorRole;

  return {
    ...basePerson,
    roleId: role.id, // Añadir campo 'roleId' que espera el frontend
    role_id: role.id,
    roleName: role.name,
  };
});

    // Formatear respuesta final
    return {
      title: taskData.title,
      description: taskData.description || null,
      type: taskData.type,
      priority_id: taskData.priority_id,
      start_date: taskData.start_date || null,
      start_time: taskData.start_time || null,
      estimated_time: taskData.estimated_time || null,
      recurrence: taskData.recurrence,
      people: processedPeople,
      home_id: homeId,
    };
  },

  _findMentionedPeople(text, homePeople) {
    if (!text || !homePeople) return [];

    // Normalización mejorada
    const normalize = (str) =>
      str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9áéíóúñ]/g, " ");

    const normalizedText = normalize(text);
    const mentionedNames = this._extractNamesFromText(text);

    return homePeople.filter((person) => {
      if (!person.personName) return false;

      const normalizedPerson = normalize(person.personName);
      const nameParts = normalizedPerson.split(" ").filter((p) => p.length > 2);

      // Coincidencia exacta o parcial
      return nameParts.some(
        (part) =>
          normalizedText.includes(part) ||
          mentionedNames.some((name) => normalize(name).includes(part))
      );
    });
  },
};

module.exports = TaskSuggestionService;
