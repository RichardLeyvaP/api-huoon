// services/FinancialAIService.js
const logger = require('../../config/logger');
const openai = require('../../config/openaiClient');
const { PriorityRepository } = require('../repositories');

const FinancialAIService = {
  async generateFinancialSuggestions(financialData, budgetData, existingSuggestions = []) {
    try {
      // Formatear los datos para el prompt
      const priorities = await PriorityRepository.findAll(); // [{id: 1, name: "Alta"}, ...]

    const now = new Date();
const todayFormatted = now.toISOString().split('T')[0]; // YYYY-MM-DD
const currentTimeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`; // HH:mm

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
5. VERIFICA LA COHERENCIA ENTRE TIEMPO ESTIMADO Y PERIODO DE EJECUCIÓN:
   - Para tareas cortas (menos de 8 horas), las fechas de inicio y fin deben ser el mismo día o días consecutivos
   - Para metas con tiempo estimado inferior a 1 día, NO sugieras plazos mensuales
   - La diferencia entre start_date/start_time y end_date/end_time debe ser coherente con estimated_time
   - Si hay incoherencia, PRIORITIZA el tiempo estimado y ajusta las fechas en consecuencia
6. VALIDA que el tiempo estimado sea razonable para el tipo de tarea/meta descrito

Fecha actual: ${todayFormatted}
Hora actual: ${currentTimeFormatted}

FORMATO PARA CADA SUGERENCIA (si se generan):
{
  "title": "Título claro y conciso",
  "description": "string (breve, no repetir el título, debe ser útil)",
  "content": "Contenido ampliado con pasos concretos, explicación y contexto",
  "typeTask": "Tarea" | "Meta",
  "taskData": {
      "title": Mismo que el campo superior,
      "description": Mismo que el campo superior,
      "start_date": string (YYYY-MM-DD, si no se menciona, la IA debe sugerir una razonable),
      "start_time": string (HH:mm, si no se menciona, la IA debe sugerir una razonable),
      "end_date": string (YYYY-MM-DD, si no se menciona, la IA debe sugerir una razonable),
      "end_time": string (HH:mm, si no se menciona, la IA debe sugerir una razonable),
      "priority_id": número (usa uno de los siguientes: ${priorities.map(p => `${p.id}(${p.name})`).join(', ')}),
      "estimated_time": número (en minutos, si no se menciona, la IA debe sugerir una razonable),
      "type": "Tarea" o "Meta",
      "recurrence": string (uno de los siguientes: "Diaria", "Semanal", "Mensual", "Anual", "No se repite"; si no se especifica en el texto, inferir del contexto; si no hay indicios, usar "No se repite")
    }
}

Instrucciones adicionales:
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

RESPONDER CON JSON que contenga:
{
  "analysis": "Breve análisis de la situación y necesidad de nuevas sugerencias",
  "suggestions": [
    // Solo incluir si cumplen todas las reglas anteriores
    // Máximo 3 sugerencias
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5-nano",
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