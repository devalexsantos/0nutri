"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadProgressPhoto } from "@/server/actions/photos";

const TYPES = [
  { value: "frente", label: "Frente" },
  { value: "lado", label: "Lado" },
  { value: "costas", label: "Costas" },
];

export function PhotoUploader({ personaId }: { personaId: string }) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState("frente");
  const [date, setDate] = useState(todayIso);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function selectFile(f: File) {
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(f);
  }

  function submit() {
    if (!file) {
      toast.error("Selecione uma foto.");
      return;
    }
    const fd = new FormData();
    fd.set("personaId", personaId);
    fd.set("type", type);
    fd.set("date", date);
    fd.set("notes", notes);
    fd.set("file", file);
    startTransition(async () => {
      try {
        await uploadProgressPhoto(fd);
        toast.success("Foto enviada.");
        setFile(null);
        setPreview(null);
        setNotes("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Erro ao enviar.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">Tipo</Label>
        <div className="flex gap-1.5">
          {TYPES.map((t) => (
            <button
              type="button"
              key={t.value}
              onClick={() => setType(t.value)}
              className={cn(
                "h-9 flex-1 rounded-lg border text-sm font-medium transition-colors",
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

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Data</Label>
          <Input
            type="date"
            value={date}
            max={todayIso}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Arquivo</Label>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) selectFile(f);
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Observação (opcional)</Label>
        <Textarea
          rows={2}
          placeholder="Ex: Início da dieta. Iluminação natural."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {preview && (
        <div className="border-border bg-muted relative aspect-[3/4] w-full overflow-hidden rounded-lg border sm:max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Pré-visualização" className="h-full w-full object-cover" />
        </div>
      )}

      <Button onClick={submit} disabled={pending || !file} className="w-full">
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
        Enviar foto
      </Button>
    </div>
  );
}
