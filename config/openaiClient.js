// openaiClient.js
require('dotenv').config();
const { OpenAI } = require('openai');

// Configuración de la API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = openai;
