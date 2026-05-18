"use client";

import { useState, useTransition } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  deleteMealPrep,
  saveMealPrep,
  toggleMealPrepDone,
} from "@/server/actions/marmita";

type Prep = {
  id: string;
  name: string;
  portions: number;
  protein: string | null;
  carb: string | null;
  vegetables: string | null;
  notes: string | null;
  done: boolean;
};

export function MarmitaPlanner({
  personaId,
  weekStartIso,
  preps,
}: {
  personaId: string;
  weekStartIso: string;
  preps: Prep[];
}) {
  return (
    <div className="space-y-3">
      {preps.map((p) => (
        <PrepCard key={p.id} prep={p} />
      ))}
      <AddPrepCard personaId={personaId} weekStartIso={weekStartIso} />
    </div>
  );
}

function PrepCard({ prep }: { prep: Prep }) {
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState(prep);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await saveMealPrep({
          id: prep.id,
          personaId: "ignored", // não usado em edição
          name: state.name,
          portions: state.portions,
          protein: state.protein,
          carb: state.carb,
          vegetables: state.vegetables,
          notes: state.notes,
        });
        toast.success("Marmita salva.");
        setEditing(false);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao salvar.");
      }
    });
  }

  function toggleDone() {
    startTransition(async () => {
      try {
        await toggleMealPrepDone(prep.id);
      } catch (err) {
        console.error(err);
      }
    });
  }

  function remove() {
    if (!confirm(`Excluir "${prep.name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteMealPrep(prep.id);
      } catch (err) {
        console.error(err);
      }
    });
  }

  return (
    <Card className={cn(prep.done && "opacity-70")}>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={toggleDone}
            disabled={pending}
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
              prep.done
                ? "border-success bg-success text-success-foreground"
                : "border-muted-foreground/40 hover:border-foreground"
            )}
          >
            {prep.done && <Check className="h-3.5 w-3.5" />}
          </button>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="space-y-2">
                <Input
                  value={state.name}
                  onChange={(e) => setState({ ...state, name: e.target.value })}
                  placeholder="Nome"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Porções</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={state.portions}
                      onChange={(e) => setState({ ...state, portions: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Field
                    label="Proteína"
                    value={state.protein ?? ""}
                    onChange={(v) => setState({ ...state, protein: v || null })}
                  />
                  <Field
                    label="Carbo"
                    value={state.carb ?? ""}
                    onChange={(v) => setState({ ...state, carb: v || null })}
                  />
                  <Field
                    label="Legumes"
                    value={state.vegetables ?? ""}
                    onChange={(v) => setState({ ...state, vegetables: v || null })}
                  />
                </div>
                <Textarea
                  rows={2}
                  placeholder="Observações de preparo"
                  value={state.notes ?? ""}
                  onChange={(e) => setState({ ...state, notes: e.target.value || null })}
                />
              </div>
            ) : (
              <div>
                <div className={cn("text-sm font-medium", prep.done && "line-through")}>
                  {prep.name} <span className="text-muted-foreground font-normal">· {prep.portions} porções</span>
                </div>
                <div className="text-muted-foreground mt-1 space-y-0.5 text-xs">
                  {prep.protein && <div>🍗 {prep.protein}</div>}
                  {prep.carb && <div>🍚 {prep.carb}</div>}
                  {prep.vegetables && <div>🥦 {prep.vegetables}</div>}
                  {prep.notes && <div className="italic">{prep.notes}</div>}
                </div>
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            {editing ? (
              <Button size="sm" onClick={save} disabled={pending}>
                Salvar
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                Editar
              </Button>
            )}
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="text-muted-foreground hover:text-destructive flex h-7 w-7 items-center justify-center self-end"
              aria-label="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddPrepCard({
  personaId,
  weekStartIso,
}: {
  personaId: string;
  weekStartIso: string;
}) {
  const [name, setName] = useState("");
  const [portions, setPortions] = useState("5");
  const [protein, setProtein] = useState("");
  const [carb, setCarb] = useState("");
  const [vegetables, setVegetables] = useState("");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!name.trim()) {
      toast.error("Informe um nome.");
      return;
    }
    startTransition(async () => {
      try {
        await saveMealPrep({
          personaId,
          weekStartDate: new Date(weekStartIso),
          name: name.trim(),
          portions: Number(portions),
          protein: protein || null,
          carb: carb || null,
          vegetables: vegetables || null,
          notes: notes || null,
        });
        toast.success("Marmita planejada.");
        setName("");
        setProtein("");
        setCarb("");
        setVegetables("");
        setNotes("");
        setOpen(false);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao salvar.");
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Adicionar marmita
      </Button>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="space-y-3 py-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_90px]">
          <Input placeholder="Nome (ex: Marmitas da quarta)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="number" min={1} max={30} value={portions} onChange={(e) => setPortions(e.target.value)} />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Field label="Proteína" value={protein} onChange={setProtein} />
          <Field label="Carbo" value={carb} onChange={setCarb} />
          <Field label="Legumes" value={vegetables} onChange={setVegetables} />
        </div>
        <Textarea
          rows={2}
          placeholder="Observações de preparo"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={submit} disabled={pending} className="flex-1">
            Salvar marmita
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px]">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="—" />
    </div>
  );
}
