"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ChevronDown, Plus, UserCircle2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { switchPersona } from "@/server/actions/personas";

type PersonaItem = {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
};

export function PersonaSwitcher({
  active,
  personas,
}: {
  active: PersonaItem | null;
  personas: PersonaItem[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSwitch(id: string) {
    if (id === active?.id) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await switchPersona(id);
      setOpen(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="hover:bg-muted flex items-center gap-2 rounded-full px-2 py-1 text-sm transition-colors">
        <PersonaAvatar persona={active} />
        <span className="hidden font-medium sm:inline">
          {active?.name ?? "Sem persona"}
        </span>
        <ChevronDown className="text-muted-foreground h-4 w-4" />
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Trocar persona</SheetTitle>
          <SheetDescription>
            Os dados de cada persona ficam separados — dieta, água, peso e progresso.
          </SheetDescription>
        </SheetHeader>
        <ul className="mt-4 space-y-1 px-4 pb-4">
          {personas.map((p) => {
            const isActive = p.id === active?.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleSwitch(p.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                    isActive ? "bg-primary/10" : "hover:bg-muted"
                  )}
                >
                  <PersonaAvatar persona={p} size={36} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p.name}</div>
                    {isActive && (
                      <div className="text-primary text-xs">Persona ativa</div>
                    )}
                  </div>
                  {isActive && <Check className="text-primary h-5 w-5" />}
                </button>
              </li>
            );
          })}
          <li className="pt-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/personas/new" onClick={() => setOpen(false)}>
                <Plus className="mr-2 h-4 w-4" /> Nova persona
              </Link>
            </Button>
          </li>
        </ul>
      </SheetContent>
    </Sheet>
  );
}

function PersonaAvatar({
  persona,
  size = 28,
}: {
  persona: PersonaItem | null;
  size?: number;
}) {
  if (!persona) {
    return (
      <div
        className="bg-muted text-muted-foreground flex items-center justify-center rounded-full"
        style={{ width: size, height: size }}
      >
        <UserCircle2 className="h-1/2 w-1/2" />
      </div>
    );
  }
  const bg = persona.color ?? "var(--primary)";
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.45 }}
    >
      {persona.avatar ?? persona.name.charAt(0).toUpperCase()}
    </div>
  );
}
