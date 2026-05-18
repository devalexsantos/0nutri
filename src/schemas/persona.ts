import { z } from "zod";

export const PERSONA_GOALS = [
  "perder_gordura",
  "ganhar_massa",
  "manutencao",
  "saude_geral",
] as const;

export const ACTIVITY_LEVELS = [
  "sedentario",
  "leve",
  "moderado",
  "intenso",
] as const;

export const personaSchema = z.object({
  name: z.string().min(1, "Informe um nome"),
  avatar: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  age: z.coerce.number().int().positive().nullable().optional(),
  sex: z.string().nullable().optional(),
  heightCm: z.coerce.number().int().positive().nullable().optional(),
  initialWeightKg: z.coerce.number().positive().nullable().optional(),
  targetWeightKg: z.coerce.number().positive().nullable().optional(),
  dailyWaterMl: z.coerce.number().int().positive().default(3000),
  goal: z.enum(PERSONA_GOALS).nullable().optional(),
  activityLevel: z.enum(ACTIVITY_LEVELS).nullable().optional(),
  region: z.string().nullable().optional(),
});

export type PersonaInput = z.infer<typeof personaSchema>;
