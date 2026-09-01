export interface NutritionFood {
  name: string;
  note?: string;
}

export interface NutritionSection {
  id: string;
  kind: "include" | "avoid";
  title: string;
  subtitle?: string;
  accent: "green" | "gold" | "wood" | "sky" | "red";
  foods: NutritionFood[];
}

export const PROTEIN_GOAL = "~130 g/día";

export const RULE_80_20 = {
  title: "Regla 80-20",
  body: "No se trata de prohibir nada al 100%. Un enfoque sostenible es 80-90% alimentos de la lista de incluir, y un 10-20% flexible para gustos puntuales — así no lo dejas a las 2 semanas.",
};

export const NUTRITION_SECTIONS: NutritionSection[] = [
  {
    id: "protein",
    kind: "include",
    title: "Proteínas",
    subtitle: "Prioridad #1 — objetivo ~130 g/día",
    accent: "green",
    foods: [
      { name: "Pechuga de pollo y pavo" },
      { name: "Huevos enteros" },
      { name: "Pescado blanco", note: "merluza, lubina, bacalao" },
      { name: "Pescado azul", note: "salmón, atún, sardinas" },
      { name: "Ternera y ternera magra" },
      { name: "Yogur griego o skyr", note: "natural, sin azúcar" },
      { name: "Queso fresco / cottage" },
      { name: "Legumbres", note: "lentejas, garbanzos, alubias — proteína + fibra" },
    ],
  },
  {
    id: "carbs",
    kind: "include",
    title: "Carbohidratos",
    subtitle: "Energía para entrenar, no los elimines",
    accent: "gold",
    foods: [
      { name: "Arroz", note: "blanco o integral" },
      { name: "Avena" },
      { name: "Patata y boniato" },
      { name: "Pasta integral" },
      { name: "Pan integral o de masa madre" },
      { name: "Quinoa" },
      { name: "Fruta entera", note: "plátano, manzana, frutos rojos" },
    ],
  },
  {
    id: "fats",
    kind: "include",
    title: "Grasas saludables",
    subtitle: "Con moderación, son tus aliadas",
    accent: "wood",
    foods: [
      { name: "Aceite de oliva virgen extra" },
      { name: "Aguacate" },
      { name: "Frutos secos crudos", note: "nueces, almendras — con moderación por calorías" },
      { name: "Pescado azul", note: "aporta omega-3" },
    ],
  },
  {
    id: "veggies",
    kind: "include",
    title: "Verduras",
    subtitle: "Libres, casi sin límite — volumen, fibra y saciedad",
    accent: "sky",
    foods: [
      { name: "Brócoli" },
      { name: "Espinacas" },
      { name: "Calabacín" },
      { name: "Pimiento" },
      { name: "Tomate" },
      { name: "Lechuga" },
      { name: "Champiñones" },
      { name: "Coliflor" },
    ],
  },
  {
    id: "hydration",
    kind: "include",
    title: "Hidratación",
    subtitle: "Agua como bebida principal",
    accent: "sky",
    foods: [
      { name: "Agua", note: "2-3 L/día" },
      { name: "Infusiones sin azúcar" },
      { name: "Café solo", note: "con moderación, no pasa nada" },
    ],
  },
  {
    id: "ultra",
    kind: "avoid",
    title: "Ultraprocesados y comida rápida",
    accent: "red",
    foods: [
      { name: "Bollería industrial, galletas, pasteles" },
      { name: "Comida rápida", note: "hamburguesas comerciales, pizza industrial, fritos empanados" },
      { name: "Snacks salados", note: "patatas fritas, aperitivos de bolsa" },
    ],
  },
  {
    id: "sugar",
    kind: "avoid",
    title: "Azúcares y bebidas azucaradas",
    accent: "red",
    foods: [
      { name: "Refrescos con azúcar" },
      { name: "Zumos envasados", note: "aunque digan “natural”" },
      { name: "Alcohol", note: "calorías vacías + afecta a la recuperación muscular y favorece la grasa abdominal" },
      { name: "Chocolate con leche en exceso", note: "el negro >70% con moderación está bien" },
    ],
  },
  {
    id: "badfats",
    kind: "avoid",
    title: "Grasas de mala calidad",
    accent: "red",
    foods: [
      { name: "Fritos en aceites reutilizados" },
      { name: "Embutidos grasos y procesados", note: "chorizo, salchichas, bacon en exceso" },
      { name: "Margarinas y grasas trans", note: "revisa etiquetas: “aceites parcialmente hidrogenados”" },
    ],
  },
  {
    id: "sauces",
    kind: "avoid",
    title: "Salsas y condimentos calóricos",
    accent: "red",
    foods: [
      { name: "Mayonesa, kétchup", note: "salsas comerciales con azúcar añadido" },
      { name: "Aliños cremosos en exceso" },
    ],
  },
  {
    id: "extras",
    kind: "avoid",
    title: "Extras a vigilar",
    accent: "red",
    foods: [
      { name: "Cereales de desayuno azucarados" },
      { name: "Pan blanco refinado en exceso", note: "mejor integral, no hace falta eliminarlo del todo" },
      { name: "Exceso de sal", note: "favorece la retención de líquidos y la hinchazón" },
    ],
  },
];
