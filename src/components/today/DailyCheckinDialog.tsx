"use client";

import { useState, useTransition } from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { saveDailyCheckin } from "@/server/actions/summary";

type CheckinState = {
  energyLevel: number | null;
  moodLevel: number | null;
  hungerLevel: number | null;
  notes: string;
};

export function DailyCheckinDialog({
  personaId,
  initial,
  variant = "card",
}: {
  personaId: string;
  initial: CheckinState;
  variant?: "card" | "button";
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<CheckinState>(initial);
  const [pending, startTransition] = useTransition();

  const filled = state.energyLevel || state.moodLevel || state.hungerLevel;

  function save() {
    startTransition(async () => {
      try {
        await saveDailyCheckin({
          personaId,
          energyLevel: state.energyLevel,
          moodLevel: state.moodLevel,
          hungerLevel: state.hungerLevel,
          notes: state.notes,
        });
        toast.success("Check-in salvo.");
        setOpen(false);
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível salvar.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          variant === "card"
            ? "border-border bg-card hover:bg-muted flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors"
            : "text-primary text-xs hover:underline"
        )}
      >
        {variant === "card" ? (
          <>
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">
                {initial.energyLevel || initial.moodLevel || initial.hungerLevel
                  ? "Atualizar check-in do dia"
                  : "Fazer check-in do dia"}
              </div>
              <div className="text-muted-foreground text-xs">
                Como você está se sentindo? Energia, humor e fome (escala 1–5).
              </div>
            </div>
          </>
        ) : (
          "fazer check-in"
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check-in do dia</DialogTitle>
          <DialogDescription>
            Registrar humor, energia e fome ajuda a identificar padrões ao longo do tempo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Scale
            label="Energia"
            value={state.energyLevel}
            onChange={(v) => setState({ ...state, energyLevel: v })}
            lowLabel="muito baixa"
            highLabel="alta"
          />
          <Scale
            label="Humor"
            value={state.moodLevel}
            onChange={(v) => setState({ ...state, moodLevel: v })}
            lowLabel="ruim"
            highLabel="ótimo"
          />
          <Scale
            label="Fome"
            value={state.hungerLevel}
            onChange={(v) => setState({ ...state, hungerLevel: v })}
            lowLabel="sem fome"
            highLabel="muita"
          />
          <div className="space-y-1.5">
            <Label className="text-xs">Notas</Label>
            <Textarea
              rows={2}
              placeholder="Algo digno de nota?"
              value={state.notes}
              onChange={(e) => setState({ ...state, notes: e.target.value })}
            />
          </div>
          <Button onClick={save} disabled={pending || !filled} className="w-full">
            Salvar check-in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
      <div className="flex items-center justify-between text-sm">
        <Label className="text-xs font-medium">{label}</Label>
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
              "h-10 flex-1 rounded-lg border text-sm font-medium transition-colors",
              value === n
                ? "border-primary bg-primary/10 text-primary"
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
