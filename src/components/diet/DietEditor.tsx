"use client";

import { useState, useTransition } from "react";
import { Check, Plus, Save, Trash2 } from "lucide-react";
import { SubstitutionsDialog } from "@/components/diet/SubstitutionsDialog";
import { DietVariantButtons } from "@/components/diet/DietVariantButtons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  activateDiet,
  addFoodItem,
  addMeal,
  addMealOption,
  deleteFoodItem,
  deleteMeal,
  deleteMealOption,
  renameDiet,
  updateMeal,
  updateMealOption,
} from "@/server/actions/diet";

type FoodItemUI = { id: string; name: string; quantity: number | null; unit: string | null };
type MealOptionUI = {
  id: string;
  name: string;
  description: string | null;
  foodItems: FoodItemUI[];
};
type MealUI = {
  id: string;
  name: string;
  scheduledAt: string;
  description: string | null;
  options: MealOptionUI[];
};

export function DietEditor({
  diet,
  otherDiets,
  personaId,
}: {
  diet: { id: string; name: string; description: string | null; meals: MealUI[] };
  otherDiets: { id: string; name: string }[];
  personaId: string;
}) {
  const [name, setName] = useState(diet.name);
  const [description, setDescription] = useState(diet.description ?? "");
  const [pending, startTransition] = useTransition();

  function saveDietHeader() {
    startTransition(async () => {
      try {
        await renameDiet({ id: diet.id, name, description: description || null });
        toast.success("Dieta atualizada.");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao salvar.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dieta ativa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button onClick={saveDietHeader} disabled={pending} size="sm">
            <Save className="mr-2 h-4 w-4" /> Salvar
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {diet.meals.map((meal) => (
          <MealEditor key={meal.id} meal={meal} />
        ))}
      </div>

      <AddMealCard dietId={diet.id} />

      <DietVariantButtons personaId={personaId} />

      {otherDiets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outras dietas salvas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {otherDiets.map((d) => (
              <div
                key={d.id}
                className="border-border/60 flex items-center justify-between gap-2 rounded-lg border p-3 text-sm"
              >
                <span>{d.name}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await activateDiet(d.id);
                        toast.success("Dieta ativada.");
                      } catch (err) {
                        console.error(err);
                        toast.error("Erro ao ativar.");
                      }
                    })
                  }
                  disabled={pending}
                >
                  Ativar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MealEditor({ meal }: { meal: MealUI }) {
  const [name, setName] = useState(meal.name);
  const [scheduledAt, setScheduledAt] = useState(meal.scheduledAt);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await updateMeal({ id: meal.id, name, scheduledAt, description: null });
        toast.success("Refeição atualizada.");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao salvar.");
      }
    });
  }

  function remove() {
    if (!confirm(`Excluir refeição "${meal.name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteMeal(meal.id);
        toast.success("Refeição excluída.");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao excluir.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">{meal.scheduledAt}</Badge>
          <Button size="icon" variant="ghost" onClick={remove} disabled={pending}>
            <Trash2 className="text-muted-foreground h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
          <Input
            type="time"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="sm:w-24"
          />
          <Button size="sm" onClick={save} disabled={pending}>
            <Save className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 pl-3 border-l-2 border-primary/20">
          {meal.options.map((opt) => (
            <MealOptionEditor key={opt.id} option={opt} />
          ))}
          <AddOptionForm mealId={meal.id} />
        </div>
      </CardContent>
    </Card>
  );
}

function MealOptionEditor({ option }: { option: MealOptionUI }) {
  const [name, setName] = useState(option.name);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await updateMealOption({ id: option.id, name, description: null });
        toast.success("Opção atualizada.");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao salvar.");
      }
    });
  }

  function remove() {
    if (!confirm(`Excluir "${option.name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteMealOption(option.id);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao excluir.");
      }
    });
  }

  return (
    <div className="border-border/60 space-y-2 rounded-lg border p-2.5">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
        <Button size="sm" onClick={save} disabled={pending} className="h-9">
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={remove} disabled={pending} className="h-9 w-9">
          <Trash2 className="text-muted-foreground h-4 w-4" />
        </Button>
      </div>
      <div className="pl-1">
        <SubstitutionsDialog mealOptionId={option.id} optionName={option.name} />
      </div>
      <ul className="space-y-1.5 pl-2">
        {option.foodItems.map((f) => (
          <FoodItemRow key={f.id} item={f} />
        ))}
      </ul>
      <AddFoodItemForm mealOptionId={option.id} />
    </div>
  );
}

function FoodItemRow({ item }: { item: FoodItemUI }) {
  const [pending, startTransition] = useTransition();
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span className="flex-1">
        {item.name}
        {item.quantity != null && (
          <span className="text-muted-foreground">
            {" "}— {item.quantity}{item.unit ? ` ${item.unit}` : ""}
          </span>
        )}
      </span>
      <Button
        size="icon"
        variant="ghost"
        disabled={pending}
        className="h-7 w-7"
        onClick={() =>
          startTransition(async () => {
            try {
              await deleteFoodItem(item.id);
            } catch (err) {
              console.error(err);
              toast.error("Erro ao excluir.");
            }
          })
        }
      >
        <Trash2 className="text-muted-foreground h-3.5 w-3.5" />
      </Button>
    </li>
  );
}

function AddFoodItemForm({ mealOptionId }: { mealOptionId: string }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const [pending, startTransition] = useTransition();
  function submit() {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await addFoodItem({
          mealOptionId,
          name: name.trim(),
          quantity: quantity ? Number(quantity) : null,
          unit: unit || null,
        });
        setName("");
        setQuantity("");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao adicionar.");
      }
    });
  }
  return (
    <div className="grid grid-cols-[1fr_70px_70px_auto] gap-1">
      <Input
        placeholder="Alimento"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 text-xs"
      />
      <Input
        type="number"
        placeholder="qtd"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="h-8 text-xs"
      />
      <Input
        placeholder="un"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        className="h-8 text-xs"
      />
      <Button size="icon" onClick={submit} disabled={pending} className="h-8 w-8">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function AddOptionForm({ mealId }: { mealId: string }) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  function submit() {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await addMealOption(mealId, name.trim());
        setName("");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao adicionar.");
      }
    });
  }
  return (
    <div className="flex gap-2">
      <Input
        placeholder="Nova opção (ex: Opção 4)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-9"
      />
      <Button size="sm" onClick={submit} disabled={pending}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function AddMealCard({ dietId }: { dietId: string }) {
  const [name, setName] = useState("");
  const [time, setTime] = useState("08:00");
  const [pending, startTransition] = useTransition();
  function submit() {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await addMeal(dietId, name.trim(), time);
        setName("");
        toast.success("Refeição adicionada.");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao adicionar.");
      }
    });
  }
  return (
    <Card className="border-dashed">
      <CardContent className="grid gap-2 py-4 sm:grid-cols-[1fr_auto_auto]">
        <Input
          placeholder="Nova refeição (ex: Pré-treino)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="sm:w-24"
        />
        <Button onClick={submit} disabled={pending}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </CardContent>
    </Card>
  );
}
