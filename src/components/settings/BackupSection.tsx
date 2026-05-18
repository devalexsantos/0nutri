"use client";

import { useState, useTransition } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { importPersonaBackup } from "@/server/actions/backup";

export function BackupSection({
  personas,
  activePersonaId,
}: {
  personas: { id: string; name: string }[];
  activePersonaId: string | null;
}) {
  const [importText, setImportText] = useState("");
  const [pending, startTransition] = useTransition();

  function handleFileImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setImportText(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsText(file);
  }

  function runImport() {
    if (!importText.trim()) {
      toast.error("Cole um JSON ou selecione um arquivo.");
      return;
    }
    if (!confirm("Importar criará uma NOVA persona com sufixo '(importado)'. Continuar?")) return;
    startTransition(async () => {
      try {
        const persona = await importPersonaBackup(importText);
        toast.success(`Persona importada: ${persona.name}`);
        setImportText("");
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Erro ao importar.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Backup e restauração</CardTitle>
        <p className="text-muted-foreground text-xs">
          Exporte todos os dados de uma persona em JSON. Importação cria uma nova persona (não sobrescreve a atual).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Exportar</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {personas.map((p) => (
              <a
                key={p.id}
                href={`/api/backup?personaId=${p.id}`}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors",
                  p.id === activePersonaId
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border bg-background hover:bg-muted"
                )}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> {p.name}
              </a>
            ))}
            {personas.length === 0 && (
              <p className="text-muted-foreground text-xs">Nenhuma persona para exportar.</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Importar</Label>
          <input
            type="file"
            accept="application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileImport(file);
            }}
            className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs"
          />
          <Textarea
            rows={4}
            placeholder="… ou cole o JSON aqui"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="font-mono text-xs"
          />
          <Button onClick={runImport} disabled={pending || !importText.trim()} size="sm">
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {pending ? "Importando…" : "Importar JSON"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
