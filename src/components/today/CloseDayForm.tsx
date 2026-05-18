"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { saveDailyCheckin } from "@/server/actions/summary";

type Initial = {
  energyLevel: number | null;
  moodLevel: number | null;
  hungerLevel: number | null;
  notes: string;
};

export function CloseDayForm({
  personaId,
  initial,
  unsatisfiedMeals,
}: {
  personaId: string;
  initial: Initial;
  unsatisfiedMeals: string[];
}) {
  const router = useRouter();
  const [state, setState] = useState<Initial>(initial);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!state.energyLevel && !state.moodLevel && !state.hungerLevel && !state.notes) {
      toast.error("Selecione pelo menos uma escala ou escreva uma nota.");
      return;
    }
    startTransition(async () => {
      try {
        await saveDailyCheckin({
          personaId,
          energyLevel: state.energyLevel,
          moodLevel: state.moodLevel,
          hungerLevel: state.hungerLevel,
          notes: state.notes,
        });
        toast.success("Dia fechado.");
        router.push("/today");
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível salvar.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Scale
        label="Como está sua energia?"
        value={state.energyLevel}
        onChange={(v) => setState({ ...state, energyLevel: v })}
        lowLabel="muito baixa"
        highLabel="alta"
      />
      <Scale
        label="Como está seu humor?"
        value={state.moodLevel}
        onChange={(v) => setState({ ...state, moodLevel: v })}
        lowLabel="ruim"
        highLabel="ótimo"
      />
      <Scale
        label="Como está sua fome agora?"
        value={state.hungerLevel}
        onChange={(v) => setState({ ...state, hungerLevel: v })}
        lowLabel="sem fome"
        highLabel="muita"
      />
      <div className="space-y-1.5">
        <Label className="text-xs">
          Algo digno de nota? (atrapalhou, deu certo, vontade extra…)
        </Label>
        <Textarea
          rows={3}
          placeholder="Ex: jantei mais cedo, deu sono à tarde, beliscei doces…"
          value={state.notes}
          onChange={(e) => setState({ ...state, notes: e.target.value })}
        />
      </div>

      {unsatisfiedMeals.length > 0 && (
        <div className="border-warning/30 bg-warning/10 text-warning rounded-lg border p-3 text-xs">
          Refeições ainda pendentes: {unsatisfiedMeals.join(", ")}.
          Volte para o /today para marcá-las antes de fechar o dia.
        </div>
      )}

      <Button onClick={save} disabled={pending} className="h-12 w-full text-base">
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Check className="mr-2 h-4 w-4" />
        )}
        Fechar o dia
      </Button>
    </div>
  );
}

function Scale({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-muted-foreground text-[10px]">
          {lowLabel} → {highLabel}
        </span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "h-12 flex-1 rounded-xl border text-sm font-semibold transition-all",
              value === n
                ? "border-primary bg-primary/10 text-primary scale-[1.02]"
                : "border-border hover:bg-muted"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
