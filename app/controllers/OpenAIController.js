const logger = require('../../config/logger'); // Importa el logger
const openai  = require('../../config/openaiClient'); // Importa el logger

module.exports = {
    // Función para obtener la respuesta de OpenAI
async getAIResponse(req, res) {
    const { question, issue } = req.body;
  
    if (!question) {
      return res.status(400).json({ error: 'Pregunta es requerida' });
    }
  
    try {
      // Realizar la solicitud a OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",// Puedes usar "gpt-3.5-turbo" si prefieres
      messages: [
        { role: 'system', content: issue },
        { role: 'user', content: question }
      ],
      max_tokens: 300
    });
  
      // Enviar la respuesta de OpenAI
      res.json({ question, answer: response.choices[0].message.content });
    } catch (error) {
        const errorMsg = error.details
        ? error.details.map(detail => detail.message).join(', ')
        : error.message || 'Error desconocido';
        logger.error(`OpenAIController->getAIResponse: Hubo un error al obtener la respuesta de OpenAI: ${errorMsg}`);
      res.status(500).json({ error: 'Hubo un error al obtener la respuesta de OpenAI', details: errorMsg });
    }
    }
};
