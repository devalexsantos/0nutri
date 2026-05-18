"use client";

import { useState, useTransition } from "react";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { logWeight } from "@/server/actions/weight";
import { toast } from "sonner";

export function WeightForm({ personaId }: { personaId: string }) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayIso);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(weight.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Informe um peso válido.");
      return;
    }
    startTransition(async () => {
      try {
        await logWeight({ personaId, weightKg: n, date: new Date(date), notes });
        setWeight("");
        setNotes("");
        toast.success(`Peso de ${n}kg registrado.`);
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível salvar.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Peso (kg)</Label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Ex: 80,80"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="h-11"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Data</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11"
            max={todayIso}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Observação (opcional)</Label>
        <Textarea
          rows={2}
          placeholder="Ex: Pesei depois do almoço"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        <Scale className="mr-2 h-4 w-4" /> Registrar peso
      </Button>
    </form>
  );
}
