import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

type FoodItemSeed = { name: string; quantity?: number; unit?: string; notes?: string };
type MealOptionSeed = { name: string; description?: string; foodItems: FoodItemSeed[] };
type MealSeed = { name: string; scheduledAt: string; sortOrder: number; options: MealOptionSeed[] };

const ALEX_DIET: MealSeed[] = [
  {
    name: "Café da manhã",
    scheduledAt: "08:00",
    sortOrder: 0,
    options: [
      {
        name: "Opção 1 — Ovos e pão integral",
        foodItems: [
          { name: "ovos inteiros", quantity: 3, unit: "un" },
          { name: "pão integral", quantity: 40, unit: "g" },
          { name: "café sem açúcar", quantity: 1, unit: "xícara" },
        ],
      },
      {
        name: "Opção 2 — Omelete com banana",
        foodItems: [
          { name: "omelete (3 ovos)", quantity: 150, unit: "g" },
          { name: "banana", quantity: 100, unit: "g" },
          { name: "canela", notes: "a gosto" },
        ],
      },
      {
        name: "Opção 3 — Tapioca recheada",
        foodItems: [
          { name: "tapioca", quantity: 50, unit: "g" },
          { name: "ovos", quantity: 2, unit: "un" },
          { name: "queijo branco", quantity: 30, unit: "g" },
        ],
      },
    ],
  },
  {
    name: "Lanche da manhã",
    scheduledAt: "10:30",
    sortOrder: 1,
    options: [
      {
        name: "Opção 1 — Banana com castanhas",
        foodItems: [
          { name: "banana", quantity: 100, unit: "g" },
          { name: "castanhas", quantity: 4, unit: "un" },
        ],
      },
      {
        name: "Opção 2 — Maçã com damasco",
        foodItems: [
          { name: "maçã", quantity: 1, unit: "un média" },
          { name: "damasco seco", quantity: 3, unit: "un" },
        ],
      },
      {
        name: "Opção 3 — Iogurte com chia",
        foodItems: [
          { name: "iogurte natural", quantity: 170, unit: "g" },
          { name: "chia", quantity: 10, unit: "g" },
        ],
      },
    ],
  },
  {
    name: "Almoço",
    scheduledAt: "12:30",
    sortOrder: 2,
    options: [
      {
        name: "Opção 1 — Arroz, frango e salada",
        foodItems: [
          { name: "arroz branco cozido", quantity: 120, unit: "g" },
          { name: "frango grelhado", quantity: 180, unit: "g" },
          { name: "legumes/salada", notes: "à vontade" },
          { name: "azeite", quantity: 1, unit: "colher pequena" },
        ],
      },
      {
        name: "Opção 2 — Arroz com lentilha e patinho",
        foodItems: [
          { name: "arroz cozido", quantity: 100, unit: "g" },
          { name: "lentilha", quantity: 80, unit: "g" },
          { name: "patinho moído", quantity: 180, unit: "g" },
          { name: "salada", notes: "à vontade" },
        ],
      },
      {
        name: "Opção 3 — Batata, frango e brócolis",
        foodItems: [
          { name: "batata inglesa cozida", quantity: 200, unit: "g" },
          { name: "frango grelhado", quantity: 180, unit: "g" },
          { name: "brócolis/cenoura", notes: "à vontade" },
        ],
      },
    ],
  },
  {
    name: "Lanche da tarde",
    scheduledAt: "15:30",
    sortOrder: 3,
    options: [
      {
        name: "Opção 1 — Ovos cozidos com café",
        foodItems: [
          { name: "ovos cozidos", quantity: 2, unit: "un" },
          { name: "café sem açúcar", quantity: 1, unit: "xícara" },
        ],
      },
      {
        name: "Opção 2 — Iogurte com castanhas",
        foodItems: [
          { name: "iogurte natural", quantity: 170, unit: "g" },
          { name: "castanhas", quantity: 4, unit: "un" },
        ],
      },
      {
        name: "Opção 3 — Whey com banana",
        foodItems: [
          { name: "whey protein", quantity: 30, unit: "g" },
          { name: "banana pequena", quantity: 80, unit: "g" },
        ],
      },
    ],
  },
  {
    name: "Jantar",
    scheduledAt: "19:00",
    sortOrder: 4,
    options: [
      {
        name: "Opção 1 — Omelete com salada",
        foodItems: [
          { name: "omelete (3 ovos)", quantity: 150, unit: "g" },
          { name: "tomate", notes: "à vontade" },
          { name: "cebola", notes: "a gosto" },
          { name: "salada", notes: "à vontade" },
        ],
      },
      {
        name: "Opção 2 — Frango com abóbora",
        foodItems: [
          { name: "frango grelhado", quantity: 180, unit: "g" },
          { name: "legumes refogados", notes: "à vontade" },
          { name: "abóbora", quantity: 120, unit: "g" },
        ],
      },
      {
        name: "Opção 3 — Sopa de frango com legumes",
        foodItems: [
          { name: "sopa com frango desfiado", quantity: 150, unit: "g" },
          { name: "legumes", notes: "à vontade" },
          { name: "batata", quantity: 80, unit: "g" },
        ],
      },
    ],
  },
  {
    name: "Ceia",
    scheduledAt: "22:00",
    sortOrder: 5,
    options: [
      {
        name: "Opção 1 — Iogurte natural",
        foodItems: [{ name: "iogurte natural", quantity: 170, unit: "g" }],
      },
      {
        name: "Opção 2 — Ovos cozidos",
        foodItems: [{ name: "ovos cozidos", quantity: 2, unit: "un" }],
      },
      {
        name: "Opção 3 — Gelatina zero",
        foodItems: [{ name: "gelatina zero", quantity: 1, unit: "porção" }],
      },
    ],
  },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Seed: iniciando...");

  // Limpar dados existentes (idempotente)
  await prisma.dailyMealLog.deleteMany();
  await prisma.foodItem.deleteMany();
  await prisma.mealOption.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.aiDietGeneration.deleteMany();
  await prisma.diet.deleteMany();
  await prisma.waterLog.deleteMany();
  await prisma.weightLog.deleteMany();
  await prisma.dailySummary.deleteMany();
  await prisma.favoriteFood.deleteMany();
  await prisma.progressPhoto.deleteMany();
  await prisma.nutritionProfile.deleteMany();
  await prisma.persona.deleteMany();
  await prisma.appSettings.deleteMany();

  // Persona Alex
  const alex = await prisma.persona.create({
    data: {
      name: "Alex",
      avatar: "🧔",
      color: "#10b981",
      heightCm: 170,
      initialWeightKg: 81.95,
      targetWeightKg: 72,
      dailyWaterMl: 3000,
      goal: "perder_gordura",
      activityLevel: "moderado",
      isActive: true,
      startDate: new Date(),
    },
  });

  // Dieta principal
  const diet = await prisma.diet.create({
    data: {
      personaId: alex.id,
      name: "Dieta de cutting — Alex",
      description: "Plano focado em perda de gordura preservando massa.",
      objective: "perder_gordura",
      isActive: true,
      startDate: new Date(),
    },
  });

  for (const meal of ALEX_DIET) {
    await prisma.meal.create({
      data: {
        dietId: diet.id,
        name: meal.name,
        scheduledAt: meal.scheduledAt,
        sortOrder: meal.sortOrder,
        options: {
          create: meal.options.map((opt, optIdx) => ({
            name: opt.name,
            description: opt.description,
            sortOrder: optIdx,
            foodItems: {
              create: opt.foodItems.map((food, foodIdx) => ({
                name: food.name,
                quantity: food.quantity,
                unit: food.unit,
                notes: food.notes,
                sortOrder: foodIdx,
              })),
            },
          })),
        },
      },
    });
  }

  // Registro inicial de peso
  await prisma.weightLog.create({
    data: {
      personaId: alex.id,
      weightKg: 81.95,
      date: new Date(),
      notes: "Peso inicial registrado pelo seed.",
    },
  });

  // App settings com Alex como persona ativa
  await prisma.appSettings.create({
    data: {
      activePersonaId: alex.id,
      theme: "light",
    },
  });

  console.log(`✅ Seed concluído. Persona ativa: ${alex.name} (${alex.id})`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("❌ Seed falhou:", err);
  process.exit(1);
});
