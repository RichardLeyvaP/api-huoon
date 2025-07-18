// services/FinancialAIService.js
const logger = require('../../config/logger');
const openai = require('../../config/openaiClient');

const FinancialAIService = {
  async generateFinancialSuggestions(financialData, budgetData, existingSuggestions = []) {
    try {
      // Formatear los datos para el prompt
      const currentDate = new Date().toISOString().slice(0, 10);
      const formattedBudget = budgetData.map(b => ({
        type: b.budget_type,
        category: b.category?.name || 'Sin categoría',
        amount: b.amount,
        used: b.used_amount || 0,
        remaining: b.amount - (b.used_amount || 0)
      }));

      // Crear prompt detallado para la IA
      const prompt = `
Eres un asesor financiero experto. Analiza esta situación y genera sugerencias ÚTILES Y NUEVAS:

DATOS ACTUALES:
- Ingresos este mes: ${financialData.currentMonth.income}
- Gastos este mes: ${financialData.currentMonth.spent} 
- Balance actual: ${financialData.currentMonth.balance}
- Comparación mes anterior:
  • Ingresos: ${financialData.percentages.income}% ${financialData.currentMonth.income > financialData.lastMonth.income ? '↑' : '↓'}
  • Gastos: ${financialData.percentages.spent}% ${financialData.currentMonth.spent > financialData.lastMonth.spent ? '↑' : '↓'}

PRESUPUESTOS:
${formattedBudget.map(b => `- ${b.type} - ${b.category}: Asignado ${b.amount}, Usado ${b.used}, Restante ${b.remaining}`).join('\n')}

SUGERENCIAS EXISTENTES HOY (${existingSuggestions.length}):
${existingSuggestions.map(s => `- ${s.title} (${s.status})`).join('\n') || 'Ninguna'}

REGLAS:
1. Solo sugiere si hay algo NUEVO Y RELEVANTE que aconsejar
2. Considera si las sugerencias existentes cubren ya las necesidades
3. Si los datos no han cambiado mucho y hay sugerencias recientes, no repitas
4. Máximo 3 sugerencias adicionales si son realmente necesarias

FORMATO PARA SUGERENCIAS (si se generan):
{
  "title": "Título sugerencia",
      "description": "Descripción detallada",
      "content": "Contenido ampliado con pasos concretos",
      "typeTask": "Tarea/Meta" // "Tarea" para acciones específicas y concretas, "Meta" para objetivos a largo plazo
}

RESPONDER CON JSON que contenga:
{
  "analysis": "Breve análisis de la situación y necesidad de nuevas sugerencias",
  "suggestions": [
    // Solo incluir si cumplen todas las reglas anteriores
    // Máximo 3 sugerencias
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Eres un asesor financiero experto que genera sugerencias personalizadas para mejorar las finanzas personales y del hogar." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      logger.error('FinancialAIService->generateFinancialSuggestions: ' + error.message);
      throw new Error('Error al generar sugerencias financieras con IA');
    }
  }
}

module.exports = FinancialAIService;