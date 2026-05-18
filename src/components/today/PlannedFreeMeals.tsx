"use client";

import { useTransition } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarHeart, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { deleteFreeMeal } from "@/server/actions/free-meal";

type Planned = {
  id: string;
  type: string;
  description: string | null;
  date: string; // YYYY-MM-DD
};

const TYPE_LABEL: Record<string, string> = {
  pizza: "Pizza",
  hamburguer: "Hambúrguer",
  sushi: "Sushi",
  churrasco: "Churrasco",
  doce: "Doce/sobremesa",
  delivery: "Delivery",
  alcool: "Bebida alcoólica",
  outro: "Refeição livre",
};

export function PlannedFreeMeals({ planned }: { planned: Planned[] }) {
  const [pending, startTransition] = useTransition();
  if (planned.length === 0) return null;
  const today = new Date();

  function remove(id: string) {
    if (!confirm("Cancelar essa refeição livre planejada?")) return;
    startTransition(async () => {
      try {
        await deleteFreeMeal(id);
        toast.success("Cancelada.");
      } catch (err) {
        console.error(err);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarHeart className="text-warning h-4 w-4" /> Refeições livres planejadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {planned.map((p) => {
          const date = new Date(p.date);
          const daysAhead = differenceInCalendarDays(date, today);
          const when =
            daysAhead === 0
              ? "Hoje"
              : daysAhead === 1
              ? "Amanhã"
              : daysAhead > 1
              ? `Em ${daysAhead} dias`
              : `Há ${-daysAhead} dia(s)`;
          return (
            <div
              key={p.id}
              className="border-border/60 flex items-center justify-between gap-3 rounded-lg border bg-background/50 p-3 text-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {TYPE_LABEL[p.type] ?? p.type}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {format(date, "dd 'de' MMM (EEEE)", { locale: ptBR })} · {when}
                  </span>
                </div>
                {p.description && (
                  <div className="text-muted-foreground mt-1 truncate text-xs italic">
                    {p.description}
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(p.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Cancelar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
