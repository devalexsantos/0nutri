"use client";

import { useState, useTransition } from "react";
import { Cake } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { logFreeMeal } from "@/server/actions/free-meal";

const TYPES = [
  { value: "pizza", label: "Pizza" },
  { value: "hamburguer", label: "Hambúrguer" },
  { value: "sushi", label: "Sushi" },
  { value: "churrasco", label: "Churrasco" },
  { value: "doce", label: "Doce/sobremesa" },
  { value: "delivery", label: "Delivery" },
  { value: "alcool", label: "Bebida alcoólica" },
  { value: "outro", label: "Outro" },
];

const IMPACTS = [
  { value: "tranquilo", label: "Tranquilo, dentro do plano" },
  { value: "comi_mais", label: "Comi mais do que deveria" },
  { value: "sem_culpa", label: "Foi planejado, sem culpa" },
  { value: "atrapalhou", label: "Atrapalhou o dia" },
];

export function FreeMealDialog({ personaId }: { personaId: string }) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("");
  const [date, setDate] = useState(todayIso);
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const isFuture = date > todayIso;

  function reset() {
    setType("");
    setDate(todayIso);
    setDescription("");
    setImpact("");
  }

  function save() {
    if (!type) {
      toast.error("Escolha um tipo.");
      return;
    }
    startTransition(async () => {
      try {
        await logFreeMeal({
          personaId,
          type,
          description: description || undefined,
          impact: isFuture ? undefined : impact || undefined,
          date: new Date(date),
        });
        toast.success(
          isFuture
            ? "Refeição livre planejada. Aparecerá no /today quando chegar a data."
            : "Refeição livre registrada. Volte para o plano na próxima refeição."
        );
        setOpen(false);
        reset();
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível salvar.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger className="text-muted-foreground hover:text-foreground text-xs underline">
        registrar refeição livre
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refeição livre {isFuture ? "(planejar)" : ""}</DialogTitle>
          <DialogDescription>
            Registrar é melhor que esconder. Planejar com antecedência reduz culpa e mantém você no controle.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Data</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {isFuture && (
              <p className="text-info text-[10px]">
                Vai virar um compromisso futuro. O sistema avisa no /today quando chegar a data.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Tipo</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {TYPES.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={cn(
                    "h-10 rounded-lg border text-sm font-medium transition-colors",
                    type === t.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Detalhes</Label>
            <Textarea
              rows={2}
              placeholder="Ex: pizza com amigos, sobremesa do jantar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {!isFuture && (
            <div className="space-y-2">
              <Label className="text-xs">Como você se sente sobre isso?</Label>
              <div className="grid grid-cols-1 gap-1.5">
                {IMPACTS.map((i) => (
                  <button
                    type="button"
                    key={i.value}
                    onClick={() => setImpact(i.value)}
                    className={cn(
                      "h-9 rounded-lg border px-3 text-left text-sm transition-colors",
                      impact === i.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={save} disabled={pending} className="w-full">
            <Cake className="mr-2 h-4 w-4" /> {isFuture ? "Planejar" : "Registrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
