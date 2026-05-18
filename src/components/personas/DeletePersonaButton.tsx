"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deletePersona } from "@/server/actions/personas";

export function DeletePersonaButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function handleDelete() {
    if (!confirm(`Excluir persona "${name}" e todos os dados associados?`)) return;
    startTransition(async () => {
      try {
        await deletePersona(id);
        toast.success("Persona excluída.");
        router.push("/personas");
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível excluir.");
      }
    });
  }
  return (
    <Button variant="destructive" size="sm" disabled={pending} onClick={handleDelete}>
      <Trash2 className="mr-2 h-4 w-4" /> Excluir
    </Button>
  );
}
