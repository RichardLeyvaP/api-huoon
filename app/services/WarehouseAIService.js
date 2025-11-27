// services/WarehouseAIService.js
const logger = require("../../config/logger");
const openai = require("../../config/openaiClient");
const { PriorityRepository } = require("../repositories");

const WarehouseAIService = {
  async generateWarehouseSuggestions(warehousesData, existingSuggestions = []) {
    try {
      const priorities = await PriorityRepository.findAll(); // [{id: 1, name: "Alta"}, ...]

      const now = new Date();
      const todayFormatted = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const currentTimeFormatted = `${now
        .getHours()
        .toString()
        .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`; // HH:mm

      // Procesar almacenes y productos
      const allProducts = [];
      const warehousesSummary = warehousesData.map((warehouse) => {
        const products = warehouse.products
          .filter((p) => p.status?.name !== "Baja") // Solo productos activos
          .map((p) => {
            const productData = {
              name: p.product?.name || "Sin nombre",
              category: p.product?.category?.name || "Sin categoría",
              quantity: p.quantity,
              unitPrice: parseFloat(p.unit_price),
              expirationDate: p.expiration_date
                ? new Date(p.expiration_date).toISOString().split("T")[0]
                : null,
              daysUntilExpiration: p.expiration_date
                ? Math.ceil(
                    (new Date(p.expiration_date) - now) / (1000 * 60 * 60 * 24)
                  )
                : null,
              brand: p.brand || "Sin marca",
              status: p.status?.name || "Sin estado",
              warehouse: warehouse.location || warehouse.title || "Desconocido",
            };
            allProducts.push(productData); // Para análisis global
            return productData;
          });

        return {
          id: warehouse.id,
          title: warehouse.title,
          location: warehouse.location,
          productCount: products.length,
          products,
        };
      });

      // Agrupar productos por categoría (útil para recetas)
      const productsByCategory = {};
      allProducts.forEach((p) => {
        const cat = p.category;
        if (!productsByCategory[cat]) productsByCategory[cat] = [];
        productsByCategory[cat].push(p);
      });

      // Detectar productos próximos a vencer (menos de 7 días)
      const expiringSoon = allProducts
        .filter(
          (p) =>
            p.daysUntilExpiration !== null &&
            p.daysUntilExpiration <= 7 &&
            p.daysUntilExpiration >= 0
        )
        .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);

      // Detectar productos vencidos
      const expired = allProducts.filter(
        (p) => p.daysUntilExpiration !== null && p.daysUntilExpiration < 0
      );

      // Productos esenciales con bajo stock
      const lowStock = allProducts.filter(
        (p) =>
          p.quantity <= 1 &&
          ["Alimentos", "Limpieza", "Higiene", "Medicamentos"].includes(
            p.category
          )
      );

      // Analizar posibles recetas (solo si hay alimentos frescos o próximos a vencer)
      const foodProducts = productsByCategory["Alimentos"] || [];
      const hasIngredientsForRecipes = foodProducts.length >= 2;

      // --- PROMPT AMPLIADO ---
      const prompt = `
Eres un asistente inteligente de hogar experto en organización, nutrición, cocina y sostenibilidad. Analiza los almacenes y productos del hogar, y genera hasta 3 sugerencias útiles, variadas y no repetidas.

DATOS DE ALMACENES:
${warehousesSummary
  .map(
    (w) => `
Almacén: ${w.title} (Ubicación: ${w.location})
Productos: ${w.productCount}
${w.products
  .map(
    (p) =>
      `- ${p.name} | Categoría: ${p.category} | Cantidad: ${
        p.quantity
      } | Vence: ${p.expirationDate || "N/A"} (${
        p.daysUntilExpiration !== null ? `${p.daysUntilExpiration} días` : "N/A"
      })`
  )
  .join("\n")}
`
  )
  .join("\n")}

INFORMACIÓN ADICIONAL:
- Productos próximos a vencer (≤7 días): ${expiringSoon.length}
  ${
    expiringSoon
      .map(
        (p) => `${p.name} (${p.daysUntilExpiration} días, en ${p.warehouse})`
      )
      .join(", ") || "Ninguno"
  }
- Productos ya vencidos: ${expired.length}
- Bajo stock (cantidad ≤1) en categorías clave: ${lowStock.length}
- Total productos alimenticios: ${foodProducts.length}

SUGERENCIAS EXISTENTES HOY (${existingSuggestions.length}):
${
  existingSuggestions.map((s) => `- ${s.title} (${s.status})`).join("\n") ||
  "Ninguna"
}

REGLAS:
1. Genera entre 0 y 3 sugerencias nuevas, solo si son útiles y no duplicadas.
2. Prioriza:
   - Alertas de vencimiento o seguridad (alta prioridad)
   - Recetas con productos próximos a vencer
   - Reabastecimiento de productos esenciales
   - Organización o eficiencia
   - Recomendaciones de estilo de vida o sostenibilidad
3. Si hay ingredientes frescos próximos a vencer, SUGIERE AL MENOS UNA RECETA (si no hay ya una similar).
4. Las recetas deben:
   - Usar productos disponibles (especialmente los que vencen pronto)
   - Incluir nombre, ingredientes clave, tiempo estimado y nivel de dificultad
   - Ser realistas (ej: "pasta con tomate y atún")
5. Usa prioridades reales:
   - Alta: vencimientos, peligro, falta crítica
   - Media: bajo stock, desorganización
   - Baja: optimización, sugerencias opcionales
6. Tiempo estimado razonable:
   - Receta: 20-60 min
   - Revisión de alacena: 15-30 min
   - Organización: 45-90 min
7. recurrence:
   - "No se repite" para tareas únicas
   - "Semanal" si es hábito (ej: planificación de menú)
   - "Mensual" para limpieza o revisión

Fecha actual: ${todayFormatted}
Hora actual: ${currentTimeFormatted}

FORMATO DE RESPUESTA (JSON):
{
  "analysis": "Breve análisis: qué encontraste (vencimientos, ingredientes, desorganización, etc.)",
  "suggestions": [
    {
      "title": "Claro y atractivo",
      "description": "Resumen útil (ej: 'Usa el tomate y atún antes de que se echen a perder')",
      "content": "Detallado: pasos, ingredientes, contexto, beneficios",
      "typeTask": "Tarea" | "Meta",
      "taskData": {
        "title": "Igual que arriba",
        "description": "Igual que arriba",
        "start_date": "YYYY-MM-DD",
        "start_time": "HH:mm",
        "end_date": "YYYY-MM-DD",
        "end_time": "HH:mm",
        "priority_id": número (elige de: ${priorities
          .map((p) => `${p.id}(${p.name})`)
          .join(", ")}),
        "estimated_time": número (minutos),
        "type": "Tarea" | "Meta",
        "recurrence": "Diaria" | "Semanal" | "Mensual" | "Anual" | "No se repite"
      }
    }
  ]
}

TIPOS DE SUGERENCIAS POSIBLES:
- 🍝 "Prepara una pasta con atún y tomate (usa productos próximos a vencer)"
- 🛒 "Reabastecer papel higiénico (solo queda 1 unidad)"
- 🧹 "Organizar la despensa por categorías"
- 🍽️ "Plan semanal de comidas para reducir desperdicios"
- 🌱 "Considera productos ecológicos: compras frecuentes de limpieza convencional"
- ❗ "Retirar productos vencidos del refrigerador"

RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO. NADA MÁS.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente doméstico inteligente que combina organización, cocina, sostenibilidad y salud. Ayudas a las personas a aprovechar mejor sus recursos en casa, evitar desperdicios y mejorar su calidad de vida.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7, // Subimos un poco para creatividad en recetas
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      logger.error(
        "WarehouseAIService->generateWarehouseSuggestions: " + error.message
      );
      throw new Error("Error al generar sugerencias de almacén con IA");
    }
  },
};

module.exports = WarehouseAIService;
