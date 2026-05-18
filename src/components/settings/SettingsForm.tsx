"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateSettings } from "@/server/actions/settings";

type SettingsValues = {
  theme: "light" | "dark";
  showCalories: boolean;
  showMacros: boolean;
  dayStartTime: string;
  dayEndTime: string;
};

export function SettingsForm({ defaultValues }: { defaultValues: SettingsValues }) {
  const [values, setValues] = useState<SettingsValues>(defaultValues);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateSettings(values);
        toast.success("Configurações salvas.");
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível salvar.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Tema</Label>
          <Select
            value={values.theme}
            onValueChange={(v) => setValues({ ...values, theme: v as "light" | "dark" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">Tema light é o padrão recomendado.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Início do dia</Label>
            <Input
              type="time"
              value={values.dayStartTime}
              onChange={(e) => setValues({ ...values, dayStartTime: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fim do dia</Label>
            <Input
              type="time"
              value={values.dayEndTime}
              onChange={(e) => setValues({ ...values, dayEndTime: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Toggle
          label="Mostrar calorias"
          description="Exibir calorias estimadas em refeições."
          checked={values.showCalories}
          onChange={(v) => setValues({ ...values, showCalories: v })}
        />
        <Toggle
          label="Mostrar macros"
          description="Exibir proteínas, carboidratos e gorduras."
          checked={values.showMacros}
          onChange={(v) => setValues({ ...values, showMacros: v })}
        />
      </div>

      <Button type="submit" disabled={pending}>
        Salvar
      </Button>
    </form>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="border-border/60 flex cursor-pointer items-center justify-between rounded-lg border p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-muted-foreground text-xs">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-9"
      />
    </label>
  );
}
