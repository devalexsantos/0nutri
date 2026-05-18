"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteWeightLog } from "@/server/actions/weight";
import { toast } from "sonner";

export function WeightLogTable({
  logs,
}: {
  logs: { id: string; date: string; weightKg: number; notes: string | null }[];
}) {
  const [pending, startTransition] = useTransition();
  if (logs.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nenhum peso registrado ainda. Use o formulário acima.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {logs.map((l) => (
        <li
          key={l.id}
          className="border-border/60 flex items-start justify-between gap-3 rounded-lg border bg-background/50 p-3"
        >
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-sm font-semibold">
                {l.weightKg.toFixed(2)}kg
              </span>
              <span className="text-muted-foreground text-xs">{l.date}</span>
            </div>
            {l.notes && (
              <p className="text-muted-foreground mt-1 text-xs">{l.notes}</p>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await deleteWeightLog(l.id);
                  toast.success("Registro removido");
                } catch (err) {
                  console.error(err);
                  toast.error("Erro ao remover");
                }
              })
            }
            aria-label="Remover"
          >
            <Trash2 className="text-muted-foreground h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
