const logger = require('../../config/logger');
const openai = require('../../config/openaiClient');
const { PriorityRepository } = require('../repositories');

const HealthAIService = {
  async generateHealthSuggestions(
    diagnoses,
    backgrounds,
    familyBackgrounds,
    physicalExams,
    medicalExams,
    treatments,
    medicalConsultations,
    existingSuggestions = []
  ) {
    try {
      // Formatear datos para el prompt
            // Formatear los datos para el prompt
            const currentDate = new Date().toISOString().slice(0, 10);
      const priorities = await PriorityRepository.findAll(); // [{id: 1, name: "Alta"}, ...]

    const now = new Date();
const todayFormatted = now.toISOString().split('T')[0]; // YYYY-MM-DD
const currentTimeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`; // HH:mm

      
      // Formatear diagnósticos - Corregido según modelo Diagnosis
      const formattedDiagnoses = diagnoses.map(d => ({
        name: d.description || 'Diagnóstico sin descripción',
        date: d.date || 'Sin fecha',
        type: d.type?.name || 'Tipo no especificado',
        notes: d.notes || ''
      }));
      
      // Formatear antecedentes personales - Corregido según modelo PersonalBackground
      const formattedBackgrounds = backgrounds.map(b => ({
        type: b.type?.name || 'Tipo no especificado',
        description: b.description || b.details || 'Sin descripción',
        start_date: b.startDate || 'Fecha desconocida',
        status: b.status || 'Estado no especificado'
      }));
      
      // Formatear antecedentes familiares - Corregido según modelo FamilyBackground
      const formattedFamilyBackgrounds = familyBackgrounds.map(fb => ({
        relationship: fb.relationship || 'Parentesco no especificado',
        condition: fb.disease || 'Condición no especificada',
        diagnosis_age: fb.diagnosis_age || 'Edad desconocida',
        notes: fb.details || ''
      }));
      
      // Formatear exámenes físicos - Corregido según modelo PhysicalExam
      const formattedPhysicalExams = physicalExams.map(pe => ({
        date: pe.exam_date || 'Fecha desconocida',
        height: pe.height || 'No registrado',
        weight: pe.weight || 'No registrado',
        bmi: pe.bmi || 'No calculado',
        blood_pressure: pe.blood_pressure || 'No medida',
        notes: pe.other_findings || pe.neurological_observations || ''
      }));
      
      // Formatear exámenes médicos - Corregido según modelo MedicalExam
      const formattedMedicalExams = medicalExams.map(me => ({
        name: me.exam_name || 'Examen sin nombre',
        type: me.type?.name || 'Tipo no especificado',
        date: me.date || 'Fecha desconocida',
        results: me.results || 'Sin resultados',
        notes: me.observations || ''
      }));
      
      // Formatear tratamientos - Corregido según modelo Treatment
      const formattedTreatments = treatments.map(t => ({
        name: t.medication || 'Tratamiento sin nombre',
        start_date: t.startDate || 'Fecha desconocida',
        end_date: t.endDate || 'Sin fecha de fin',
        dosage: t.dosage || 'Dosis no especificada',
        frequency: t.frequency || 'Frecuencia no especificada',
        purpose: t.purpose || 'Propósito no especificado'
      }));
      
      // Formatear consultas médicas - Corregido según modelo MedicalConsultation
      const formattedConsultations = medicalConsultations.map(mc => ({
        date: mc.date || 'Fecha desconocida',
        doctor: mc.professional || 'Profesional no especificado',
        type: mc.type?.name || 'Tipo no especificado',
        reason: mc.reason || 'Motivo no registrado',
        notes: mc.medicalNotes || ''
      }));

      // Crear prompt detallado para la IA
      const prompt = `
Eres un médico experto en salud preventiva y bienestar. Analiza esta situación y genera sugerencias ÚTILES Y RELEVANTES para mejorar la salud de esta persona:

DATOS DE SALUD ACTUALES:

DIAGNÓSTICOS (${formattedDiagnoses.length}):
${formattedDiagnoses.map(d => `- ${d.name} (${d.date}, ${d.type})${d.notes ? `: ${d.notes}` : ''}`).join('\n') || 'Ninguno'}

ANTECEDENTES PERSONALES (${formattedBackgrounds.length}):
${formattedBackgrounds.map(b => `- ${b.type}: ${b.description} (desde ${b.start_date}, ${b.status})`).join('\n') || 'Ninguno'}

ANTECEDENTES FAMILIARES (${formattedFamilyBackgrounds.length}):
${formattedFamilyBackgrounds.map(fb => `- ${fb.relationship}: ${fb.condition}${fb.diagnosis_age ? ` (diagnosticado a los ${fb.diagnosis_age} años)` : ''}${fb.notes ? ` - Notas: ${fb.notes}` : ''}`).join('\n') || 'Ninguno'}

EXÁMENES FÍSICOS RECIENTES (${formattedPhysicalExams.length}):
${formattedPhysicalExams.slice(0, 3).map(pe => `- ${pe.date}: Altura ${pe.height}, Peso ${pe.weight}, IMC ${pe.bmi}, Presión ${pe.blood_pressure}${pe.notes ? ` - Observaciones: ${pe.notes}` : ''}`).join('\n') || 'Ninguno'}

EXÁMENES MÉDICOS RECIENTES (${formattedMedicalExams.length}):
${formattedMedicalExams.slice(0, 3).map(me => `- ${me.name} (${me.type}, ${me.date}): ${me.results}${me.notes ? ` - Notas: ${me.notes}` : ''}`).join('\n') || 'Ninguno'}

TRATAMIENTOS ACTUALES (${formattedTreatments.length}):
${formattedTreatments.filter(t => !t.end_date || new Date(t.end_date) >= new Date()).map(t => `- ${t.name}: ${t.dosage} cada ${t.frequency}${t.end_date ? ` hasta ${t.end_date}` : ''} (${t.purpose})`).join('\n') || 'Ninguno'}

CONSULTAS RECIENTES (${formattedConsultations.length}):
${formattedConsultations.slice(0, 3).map(c => `- ${c.date} con ${c.doctor} (${c.type}): ${c.reason}${c.notes ? ` - Notas: ${c.notes}` : ''}`).join('\n') || 'Ninguna'}

SUGERENCIAS EXISTENTES HOY (${existingSuggestions.length}):
${existingSuggestions.map(s => `- ${s.title} (${s.status})`).join('\n') || 'Ninguna'}

REGLAS PARA LAS SUGERENCIAS:
1. Prioriza prevención basada en antecedentes familiares
2. Considera factores de riesgo según diagnósticos y exámenes
3. Sugiere seguimientos necesarios según tratamientos actuales
4. Propón mejoras de estilo de vida basadas en IMC y presión arterial
5. No repitas sugerencias existentes a menos que sea urgente
6. Máximo 3 sugerencias si son realmente necesarias, y de ser necesario agregar mas por la importancia agregarlas, como maximo 6 en total
7. Considera fechas recientes como más relevantes

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
      "end_date": string (YYYY-MM-DD, solo para Meta, si no se menciona, la IA debe sugerir una razonable),
      "end_time": string (HH:mm, solo para Meta, si no se menciona, la IA debe sugerir una razonable),
      "priority_id": número (usa uno de los siguientes: ${priorities.map(p => `${p.id}(${p.name})`).join(', ')}),
      "estimated_time": número (en minutos, si no se menciona, la IA debe sugerir una razonable),
      "type": "Tarea" o "Meta"
    }
}

Instrucciones adicionales:
- La descripción NO debe ser solo "realizar una tarea para..." sino que debe ser útil y descriptiva.
- Si no se especifica una fecha u hora, la IA debe inferir una razonable basada en el contexto actual.
- Si es una Meta, incluye end_date y end_time razonables si no se especifican.
- La prioridad debe asignarse en función de la importancia percibida de la tarea/meta.
- El tiempo estimado debe ser coherente con el tipo de tarea/meta.

RESPONDER CON JSON que contenga:
{
  "analysis": "Breve análisis de la situación de salud y necesidad de nuevas sugerencias",
  "suggestions": [
    // Solo incluir si cumplen todas las reglas anteriores
    // Máximo 3 sugerencias
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `Eres un médico experto en salud preventiva que genera sugerencias personalizadas para mejorar la salud. 
                      Fecha actual: ${currentDate}. Analiza todos los datos y ofrece recomendaciones prácticas y específicas.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      logger.error('HealthAIService->generateHealthSuggestions: ' + error.message);
      throw new Error('Error al generar sugerencias de salud con IA');
    }
  }
};

module.exports = HealthAIService;