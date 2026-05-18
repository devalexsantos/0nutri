import { prisma } from "@/lib/prisma";

export type DerivedIngredient = {
  name: string;
  unit: string | null;
  totalQuantity: number | null; // null se algum item era "à vontade"
  occurrences: number; // quantas vezes apareceu na semana
};

const CATEGORY_HINTS: Array<{ test: RegExp; category: string }> = [
  { test: /frango|peixe|carne|ovo|whey|patinho|atum|sardinha|salm[ãa]o|peru/i, category: "proteína" },
  { test: /arroz|p[ãa]o|tapioca|batata|mandioca|aveia|macarr[ãa]o|granola/i, category: "carb" },
  { test: /brócoli|cenoura|legume|salada|tomate|cebola|alface|couve|ab[óo]bora/i, category: "verdura" },
  { test: /banana|maç[ãa]|laranja|fruta|mam[ãa]o|manga|abacaxi/i, category: "fruta" },
  { test: /castanha|iogurte|queijo|leite|café|gelatina|azeite|chia|damasco/i, category: "outros" },
];

export function categorizeIngredient(name: string): string {
  for (const c of CATEGORY_HINTS) if (c.test.test(name)) return c.category;
  return "outros";
}

/**
 * Agrupa todos os FoodItems da dieta ativa por (nome normalizado, unidade).
 * Multiplicador permite estimar para N dias (1 = uma rodada de refeições por dia).
 */
export async function deriveShoppingItems(
  personaId: string,
  multiplier: number = 7
): Promise<DerivedIngredient[]> {
  const diet = await prisma.diet.findFirst({
    where: { personaId, isActive: true },
    include: {
      meals: {
        include: { options: { include: { foodItems: true } } },
      },
    },
  });
  if (!diet) return [];

  type Acc = { name: string; unit: string | null; totalQuantity: number | null; occurrences: number };
  const map = new Map<string, Acc>();

  for (const meal of diet.meals) {
    // Usar só a primeira opção como "padrão" para estimar a compra base
    const opt = meal.options[0];
    if (!opt) continue;
    for (const f of opt.foodItems) {
      const key = `${normalize(f.name)}|${f.unit ?? ""}`;
      const existing = map.get(key);
      const qty = f.quantity ?? null;
      if (existing) {
        existing.occurrences += 1;
        if (qty === null || existing.totalQuantity === null) {
          existing.totalQuantity = null;
        } else {
          existing.totalQuantity += qty;
        }
      } else {
        map.set(key, {
          name: f.name,
          unit: f.unit,
          totalQuantity: qty,
          occurrences: 1,
        });
      }
    }
  }

  return [...map.values()]
    .map((it) => ({
      ...it,
      totalQuantity:
        it.totalQuantity === null ? null : Math.round(it.totalQuantity * multiplier * 10) / 10,
    }))
    .sort((a, b) => b.occurrences - a.occurrences);
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export function formatQuantity(qty: number | null, unit: string | null): string {
  if (qty === null) return "à vontade";
  const u = unit ?? "";
  if (u === "g" && qty >= 1000) return `${(qty / 1000).toFixed(qty % 1000 === 0 ? 0 : 2)}kg`;
  if (u === "ml" && qty >= 1000) return `${(qty / 1000).toFixed(qty % 1000 === 0 ? 0 : 2)}L`;
  return `${qty}${u ? ` ${u}` : ""}`;
}
