"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { switchPersona } from "@/server/actions/personas";

export function SwitchPersonaButton({ personaId }: { personaId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await switchPersona(personaId);
        })
      }
    >
      Ativar
    </Button>
  );
}
