"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { applySubstitution, generateMealSubstitutions } from "@/server/actions/ai-coach";
import type { Substitutions } from "@/schemas/ai-coach";

export function SubstitutionsDialog({
  mealOptionId,
  optionName,
}: {
  mealOptionId: string;
  optionName: string;
}) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState("");
  const [result, setResult] = useState<Substitutions | null>(null);
  const [pending, startTransition] = useTransition();
  const [applying, startApply] = useTransition();

  function generate() {
    startTransition(async () => {
      try {
        const out = await generateMealSubstitutions(mealOptionId, hint || undefined);
        setResult(out);
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Falha ao gerar.");
      }
    });
  }

  function applyAlt(idx: number) {
    if (!result) return;
    const alt = result.alternatives[idx];
    if (!alt) return;
    startApply(async () => {
      try {
        await applySubstitution({
          optionId: mealOptionId,
          newName: alt.name,
          foodItems: alt.foodItems,
        });
        toast.success(`Opção substituída por "${alt.name}".`);
        setOpen(false);
        setResult(null);
        setHint("");
      } catch (err) {
        console.error(err);
        toast.error("Falha ao aplicar.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setResult(null);
          setHint("");
        }
      }}
    >
      <DialogTrigger className="text-primary inline-flex items-center gap-1 text-xs hover:underline">
        <Sparkles className="h-3 w-3" /> substituir com IA
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Substituir &ldquo;{optionName}&rdquo;</DialogTitle>
          <DialogDescription>
            A IA gera 3 alternativas equivalentes respeitando alergias e preferências da persona.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Pedido extra (opcional)</Label>
            <Input
              placeholder="Ex: sem ovo, com mais proteína, opção sem glúten…"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
            />
          </div>

          <Button onClick={generate} disabled={pending} className="w-full">
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            {pending ? "Gerando alternativas…" : "Gerar 3 alternativas"}
          </Button>

          {result && (
            <div className="space-y-2 pt-2">
              {result.alternatives.map((alt, i) => (
                <div
                  key={i}
                  className="border-border space-y-2 rounded-lg border p-3"
                >
                  <div>
                    <div className="text-sm font-medium">{alt.name}</div>
                    <div className="text-muted-foreground text-xs italic">
                      {alt.rationale}
                    </div>
                  </div>
                  <ul className="space-y-0.5 text-xs">
                    {alt.foodItems.map((f, fi) => (
                      <li key={fi}>
                        • {f.name}
                        {f.quantity != null && (
                          <span className="text-muted-foreground">
                            {" "}— {f.quantity}{f.unit ? ` ${f.unit}` : ""}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={applying}
                    onClick={() => applyAlt(i)}
                    className="w-full"
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" /> Usar essa
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
