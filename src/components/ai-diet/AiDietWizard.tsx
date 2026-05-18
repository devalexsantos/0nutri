"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { generateAiDiet, importAiDiet } from "@/server/actions/ai-diet";
import {
  BUDGET_LEVELS,
  DIFFICULTIES,
  PREP_PREFS,
  type NutritionProfileInput,
} from "@/schemas/nutrition-profile";
import type { AiDietOutput } from "@/schemas/ai-diet";

const DIFFICULTY_LABEL: Record<(typeof DIFFICULTIES)[number], string> = {
  fome_noite: "Fome à noite",
  beliscar: "Beliscar entre refeições",
  doces: "Vontade de doces",
  delivery: "Pedir delivery",
  falta_tempo: "Falta de tempo",
  retencao: "Retenção/inchaço",
  nao_sei_o_que_comer: "Não sei o que comer",
};

const BUDGET_LABEL: Record<(typeof BUDGET_LEVELS)[number], string> = {
  economico: "Econômico",
  normal: "Normal",
  flexivel: "Flexível",
};

const PREP_LABEL: Record<(typeof PREP_PREFS)[number], string> = {
  marmita: "Marmita",
  rapido: "Refeições rápidas",
  caseiro: "Comida caseira",
  poucas_receitas: "Poucas receitas diferentes",
};

type WizardProps = {
  personaId: string;
  personaName: string;
  openAiConfigured: boolean;
  initialProfile: NutritionProfileInput;
};

export function AiDietWizard({
  personaId,
  personaName,
  openAiConfigured,
  initialProfile,
}: WizardProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<NutritionProfileInput>(initialProfile);
  const [generating, startGenerate] = useTransition();
  const [importing, startImport] = useTransition();
  const [result, setResult] = useState<{ id: string; data: AiDietOutput } | null>(null);

  function update<K extends keyof NutritionProfileInput>(key: K, value: NutritionProfileInput[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function handleGenerate() {
    if (!openAiConfigured) {
      toast.error("Configure OPENAI_API_KEY no .env primeiro.");
      return;
    }
    startGenerate(async () => {
      try {
        const res = await generateAiDiet({ personaId, profile });
        setResult({ id: res.generationId, data: res.output });
        toast.success("Dieta gerada. Revise e importe quando quiser.");
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Falha ao gerar.");
      }
    });
  }

  function handleImport(activate: boolean) {
    if (!result) return;
    startImport(async () => {
      try {
        await importAiDiet(result.id, activate);
        toast.success(activate ? "Dieta importada e ativada." : "Dieta salva como rascunho.");
        router.push("/diet");
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error("Falha ao importar.");
      }
    });
  }

  return (
    <div className="space-y-5">
      {!openAiConfigured && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="flex items-start gap-3 py-3 text-sm">
            <AlertTriangle className="text-warning mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">OpenAI não configurada</p>
              <p className="text-muted-foreground text-xs">
                Adicione <code className="bg-muted rounded px-1">OPENAI_API_KEY</code> no arquivo
                <code className="bg-muted ml-1 rounded px-1">.env</code> e reinicie o dev server.
                Você pode preencher o perfil agora; a geração só funcionará após configurar a chave.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Etapa 1 · Rotina</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Field label="Acorda às">
            <Input
              type="time"
              value={profile.wakeTime ?? ""}
              onChange={(e) => update("wakeTime", e.target.value || null)}
            />
          </Field>
          <Field label="Dorme às">
            <Input
              type="time"
              value={profile.sleepTime ?? ""}
              onChange={(e) => update("sleepTime", e.target.value || null)}
            />
          </Field>
          <Field label="Refeições por dia">
            <Input
              type="number"
              min={2}
              max={8}
              value={profile.desiredMealsPerDay ?? ""}
              onChange={(e) => update("desiredMealsPerDay", e.target.value ? Number(e.target.value) : null)}
            />
          </Field>
          <Field label="Trabalho" full>
            <Textarea
              rows={2}
              placeholder="Em casa, escritório, turnos..."
              value={profile.workRoutine ?? ""}
              onChange={(e) => update("workRoutine", e.target.value || null)}
            />
          </Field>
          <Field label="Treino/atividade" full>
            <Textarea
              rows={2}
              placeholder="Musculação 3x/semana, caminhada diária..."
              value={profile.trainingRoutine ?? ""}
              onChange={(e) => update("trainingRoutine", e.target.value || null)}
            />
          </Field>
          <Field label="Maior dificuldade">
            <Select
              value={profile.mainDifficulty ?? ""}
              onValueChange={(v) =>
                update("mainDifficulty", (v as (typeof DIFFICULTIES)[number]) || null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {DIFFICULTY_LABEL[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Etapa 2 · Preferências alimentares</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Alimentos base preferidos" hint="Separados por vírgula. Ex: arroz, feijão, frango, ovos">
            <Textarea
              rows={2}
              value={profile.preferredFoods.join(", ")}
              onChange={(e) =>
                update(
                  "preferredFoods",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Alimentos que NÃO gosta" hint="Separados por vírgula">
              <Textarea
                rows={2}
                value={profile.dislikedFoods.join(", ")}
                onChange={(e) =>
                  update(
                    "dislikedFoods",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
              />
            </Field>
            <Field label="Alergias" hint="Separadas por vírgula">
              <Textarea
                rows={2}
                value={profile.allergies.join(", ")}
                onChange={(e) =>
                  update(
                    "allergies",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
              />
            </Field>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Intolerâncias" hint="Lactose, glúten...">
              <Textarea
                rows={2}
                value={profile.intolerances.join(", ")}
                onChange={(e) =>
                  update(
                    "intolerances",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
              />
            </Field>
            <Field label="Restrições médicas">
              <Textarea
                rows={2}
                value={profile.medicalRestrictions ?? ""}
                onChange={(e) => update("medicalRestrictions", e.target.value || null)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Etapa 3 · Configurações da dieta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Field label="Orçamento">
            <Select
              value={profile.budgetLevel ?? ""}
              onValueChange={(v) =>
                update("budgetLevel", (v as (typeof BUDGET_LEVELS)[number]) || null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_LEVELS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {BUDGET_LABEL[b]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Preparo preferido">
            <Select
              value={profile.preparationPreference ?? ""}
              onValueChange={(v) =>
                update(
                  "preparationPreference",
                  (v as (typeof PREP_PREFS)[number]) || null
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {PREP_PREFS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PREP_LABEL[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="space-y-2 self-end">
            <Checkbox
              label="Mostrar calorias"
              checked={profile.showCalories}
              onChange={(v) => update("showCalories", v)}
            />
            <Checkbox
              label="Mostrar macros"
              checked={profile.showMacros}
              onChange={(v) => update("showMacros", v)}
            />
            <Checkbox
              label="Lista de compras"
              checked={profile.includeShoppingList}
              onChange={(v) => update("includeShoppingList", v)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={generating || !openAiConfigured}
          className="h-12 text-base"
        >
          {generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {generating ? "Gerando…" : `Gerar dieta para ${personaName}`}
        </Button>
      </div>

      {result && (
        <AiDietPreview
          result={result.data}
          onImport={handleImport}
          importing={importing}
          onRegenerate={() => setResult(null)}
        />
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  full,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "md:col-span-3" : ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-muted-foreground text-[10px]">{hint}</p>}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}

function AiDietPreview({
  result,
  onImport,
  importing,
  onRegenerate,
}: {
  result: AiDietOutput;
  onImport: (activate: boolean) => void;
  importing: boolean;
  onRegenerate: () => void;
}) {
  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader>
        <div className="space-y-1">
          <Badge variant="secondary" className="w-fit">
            <Sparkles className="mr-1 h-3 w-3" /> Gerado por IA
          </Badge>
          <CardTitle>{result.dietName}</CardTitle>
          <p className="text-muted-foreground text-sm">{result.objective}</p>
          {result.estimatedDailyCalories && (
            <p className="text-muted-foreground text-xs">
              ~ {result.estimatedDailyCalories} kcal/dia estimadas
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {result.warnings.length > 0 && (
          <div className="border-warning/40 bg-warning/10 rounded-lg border p-2 text-xs">
            {result.warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {result.meals.map((meal, idx) => (
            <div key={idx} className="bg-background rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{meal.name}</span>
                <span className="text-muted-foreground font-mono text-sm">
                  {meal.scheduledAt}
                </span>
              </div>
              {meal.options.map((opt, oi) => (
                <div key={oi} className="mb-2 last:mb-0">
                  <div className="text-sm font-medium">{opt.name}</div>
                  <ul className="text-muted-foreground space-y-0.5 pl-3 text-sm">
                    {opt.foodItems.map((f, fi) => (
                      <li key={fi}>
                        • {f.name}
                        {f.quantity != null && (
                          <>
                            {" "}— {f.quantity}{f.unit ? ` ${f.unit}` : ""}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>

        {result.shoppingList.length > 0 && (
          <div>
            <div className="mb-1 text-sm font-medium">Lista de compras</div>
            <ul className="text-muted-foreground grid grid-cols-2 gap-1 text-xs">
              {result.shoppingList.map((s, i) => (
                <li key={i}>• {s.name} — {s.quantity}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button onClick={() => onImport(true)} disabled={importing} className="flex-1">
            <Wand2 className="mr-2 h-4 w-4" />
            {importing ? "Importando…" : "Importar e ativar"}
          </Button>
          <Button
            variant="outline"
            onClick={() => onImport(false)}
            disabled={importing}
            className="flex-1"
          >
            Salvar como rascunho
          </Button>
          <Button variant="ghost" onClick={onRegenerate} disabled={importing}>
            Descartar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
