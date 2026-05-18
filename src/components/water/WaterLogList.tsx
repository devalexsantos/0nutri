"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteWaterLog } from "@/server/actions/water";
import { toast } from "sonner";

export function WaterLogList({
  logs,
}: {
  logs: { id: string; amountMl: number; loggedAt: string }[];
}) {
  const [pending, startTransition] = useTransition();
  if (logs.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum copo registrado hoje.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {logs.map((l) => {
        const time = new Date(l.loggedAt).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return (
          <li
            key={l.id}
            className="flex items-center justify-between rounded-md px-2 py-2 text-sm"
          >
            <span>
              <span className="text-water font-semibold">{l.amountMl}ml</span>{" "}
              <span className="text-muted-foreground">às {time}</span>
            </span>
            <Button
              size="icon"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await deleteWaterLog(l.id);
                    toast.success("Registro removido");
                  } catch (err) {
                    console.error(err);
                    toast.error("Erro ao remover");
                  }
                })
              }
              aria-label="Remover"
            >
              <Trash2 className="text-muted-foreground h-3.5 w-3.5" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
