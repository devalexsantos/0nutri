"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logWater } from "@/server/actions/water";
import { toast } from "sonner";

export function WaterCustomAmount({ personaId }: { personaId: string }) {
  const [amount, setAmount] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const ml = Number(amount);
    if (!Number.isFinite(ml) || ml <= 0) {
      toast.error("Informe um valor válido em ml.");
      return;
    }
    startTransition(async () => {
      try {
        await logWater({ personaId, amountMl: Math.round(ml) });
        setAmount("");
        toast.success(`+${Math.round(ml)}ml registrados`);
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível salvar.");
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Input
        type="number"
        inputMode="numeric"
        placeholder="Valor em ml (ex: 450)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-11"
      />
      <Button className="h-11" disabled={pending} onClick={submit}>
        <Plus className="mr-1 h-4 w-4" /> Registrar
      </Button>
    </div>
  );
}
