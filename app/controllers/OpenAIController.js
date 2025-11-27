const logger = require('../../config/logger'); // Importa el logger
const openai  = require('../../config/openaiClient'); // Importa el IA
const { AiInteractionRepository } = require('../repositories');
const IntentDetectionService = require('../services/IntentDetectionService');
const userConversations = {};
module.exports = {
    // Función para obtener la respuesta de OpenAI
async getAIResponse(req, res) {
  logger.info(`${req.user.name} - Entrando a Chat con AI`);
  logger.info('datos recibidos al preguntar');
  logger.info(JSON.stringify(req.body));
    const { question, issue } = req.body;
    const userId = req.user.id;
    if (!question) {
      return res.status(400).json({ error: 'Pregunta es requerida' });
    }

    // Verificar si el usuario tiene un historial de conversación
    if (!userConversations[userId]) {
      userConversations[userId] = [];
    }

    // Agregar el mensaje del usuario al historial
    const userMessage = { role: 'user', content: question };
    userConversations[userId].push(userMessage);
  
    try {
      // Realizar la solicitud a OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o",// Puedes usar "gpt-3.5-turbo" si prefieres
      messages: [
        { role: 'system', content: issue },
        ...userConversations[userId]  // Pasar el historial de la conversación
      ],
      max_tokens: 1000,
      temperature: 0.7 // Ajustar para más creatividad
    });
  
    // Obtener la respuesta de OpenAI
    const aiMessage = { role: 'assistant', content: response.choices[0].message.content };
    
    // Agregar la respuesta de la IA al historial
    userConversations[userId].push(aiMessage);
      // Enviar la respuesta de OpenAI
      res.json({ question, answer: response.choices[0].message.content });
    } catch (error) {
        const errorMsg = error.details
        ? error.details.map(detail => detail.message).join(', ')
        : error.message || 'Error desconocido';
        logger.error(`OpenAIController->getAIResponse: Hubo un error al obtener la respuesta de OpenAI: ${errorMsg}`);
      res.status(500).json({ error: 'Hubo un error al obtener la respuesta de OpenAI', details: errorMsg });
    }
    },

async getAITask(req, res) {
  logger.info(`${req.user.name} - Entrando a Chat con AI en tareas`);
  logger.info('datos recibidos al preguntar');
  logger.info(JSON.stringify(req.body));
    const { question, issue } = req.body;
    const userId = req.user.id;
    const person_id = req.person.id;
    const home_id = req.body.home_id;
    if (!question) {
      return res.status(400).json({ error: 'Pregunta es requerida' });
    }

    // Verificar si el usuario tiene un historial de conversación
    if (!userConversations[userId]) {
      userConversations[userId] = [];
    }

    // Agregar el mensaje del usuario al historial
    const userMessage = { role: 'user', content: question };
    userConversations[userId].push(userMessage);
  
    try {
      // Primero detectar si hay intención de crear tarea/meta
    const intentDetection = await IntentDetectionService.detectarIntentTask(question, person_id, home_id);
      const MIN_CONFIDENCE = 0.7;
    // Verificar si hay una intención relevante (task o goal creation)
    if (intentDetection.intent &&
    intentDetection.confidence >= MIN_CONFIDENCE) {
  
  logger.info(`Intención detectada: ${JSON.stringify(intentDetection)}`);
  
  // Agregar el mensaje del usuario al historial aunque sea una intención
  const userMessage = { role: 'user', content: question };
  userConversations[userId].push(userMessage);
  
  // Devolver la intención detectada
  return res.json({
    intentDetected: true, // Corrige el typo (detected)
    intent: intentDetection.intent,
    confidence: intentDetection.confidence,
    explanation: intentDetection.explanation,
    originalQuestion: question,
    task: intentDetection.taskData || null,
    finances: intentDetection.financeData || null,
    budget: intentDetection.budgetData || null,
    warehouse: intentDetection.warehouseData || null,
    product: intentDetection.productData || null,
    desire: intentDetection.desireData || null,
  });
}
      // Realizar la solicitud a OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o",// Puedes usar "gpt-3.5-turbo" si prefieres
      messages: [
        { role: 'system', content: issue },
        ...userConversations[userId]  // Pasar el historial de la conversación
      ],
      max_tokens: 1000,
      temperature: 0.7 // Ajustar para más creatividad
    });
  
    // Obtener la respuesta de OpenAI
    const aiMessage = { role: 'assistant', content: response.choices[0].message.content };
    
    // Agregar la respuesta de la IA al historial
    userConversations[userId].push(aiMessage);
      // Enviar la respuesta de OpenAI
      res.json({ 
      intentDetected: false,
      question, 
      answer: response.choices[0].message.content 
    });
    } catch (error) {
        const errorMsg = error.details
        ? error.details.map(detail => detail.message).join(', ')
        : error.message || 'Error desconocido';
        logger.error(`OpenAIController->getAIResponse: Hubo un error al obtener la respuesta de OpenAI: ${errorMsg}`);
      res.status(500).json({ error: 'Hubo un error al obtener la respuesta de OpenAI', details: errorMsg });
    }
    },

    async AiInteraction(req, res) {
      logger.info(`${req.user.name} - Entrando a Guardar interacción con la IA`);
      logger.info('datos recibidos al guardar');
      logger.info(JSON.stringify(req.body));
        const userId = req.user.id;
        req.body.user_id = userId;
        try {
         const aiInteraction = await AiInteractionRepository.create(req.body);
          return res.status(201).json({ msg: 'AiInteractionStoreOk', aiInteraction });
        } catch (error) {
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';
            logger.error(`OpenAIController->AIInteraction: Hubo un error al uardar la interacción OpenAI: ${errorMsg}`);
          res.status(500).json({ error: 'Hubo un error al guardar la interacccion con de OpenAI', details: errorMsg });
        }
        }
};
