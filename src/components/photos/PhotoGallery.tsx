"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { deleteProgressPhoto } from "@/server/actions/photos";

type Photo = {
  id: string;
  imageUrl: string;
  type: string | null;
  date: string;
  notes: string | null;
};

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<Photo | null>(null);
  const [pending, startTransition] = useTransition();

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center text-sm">
          Nenhuma foto ainda. Use o formulário acima para começar a registrar.
        </CardContent>
      </Card>
    );
  }

  // Agrupa por data
  const byDate = new Map<string, Photo[]>();
  for (const p of photos) {
    if (!byDate.has(p.date)) byDate.set(p.date, []);
    byDate.get(p.date)!.push(p);
  }

  return (
    <div className="space-y-5">
      {[...byDate.entries()].map(([date, items]) => (
        <div key={date}>
          <div className="text-muted-foreground mb-2 text-xs uppercase tracking-wide">{date}</div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {items.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setOpen(p)}
                className="border-border group relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt={p.type ?? ""} className="h-full w-full object-cover" />
                {p.type && (
                  <Badge variant="secondary" className="absolute left-1.5 top-1.5 text-[9px]">
                    {p.type}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle className="sr-only">Foto de evolução</DialogTitle>
          {open && (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={open.imageUrl}
                alt={open.type ?? ""}
                className="bg-muted w-full rounded-lg object-contain"
              />
              <div className="text-sm">
                <strong>{open.date}</strong>
                {open.type && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {open.type}
                  </Badge>
                )}
              </div>
              {open.notes && <p className="text-muted-foreground text-xs">{open.notes}</p>}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm("Excluir esta foto?")) return;
                  startTransition(async () => {
                    try {
                      await deleteProgressPhoto(open.id);
                      toast.success("Foto excluída.");
                      setOpen(null);
                    } catch (err) {
                      console.error(err);
                      toast.error("Erro ao excluir.");
                    }
                  });
                }}
                className="text-destructive flex items-center gap-1 text-xs hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir foto
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
