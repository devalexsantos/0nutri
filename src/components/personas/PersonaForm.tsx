"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ACTIVITY_LEVELS, PERSONA_GOALS, personaSchema } from "@/schemas/persona";
import type { PersonaInput } from "@/schemas/persona";
import { createPersona, updatePersona } from "@/server/actions/personas";

const GOAL_LABEL: Record<(typeof PERSONA_GOALS)[number], string> = {
  perder_gordura: "Perder gordura",
  ganhar_massa: "Ganhar massa",
  manutencao: "Manutenção",
  saude_geral: "Saúde geral",
};

const ACTIVITY_LABEL: Record<(typeof ACTIVITY_LEVELS)[number], string> = {
  sedentario: "Sedentário",
  leve: "Leve",
  moderado: "Moderado",
  intenso: "Intenso",
};

const EMOJI_CHOICES = ["🧔", "👩", "🧑", "👨", "👧", "👶", "🦸", "🧘", "🏃", "🥗"];
const COLOR_CHOICES = [
  "#10b981",
  "#22d3ee",
  "#a78bfa",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
];

type Props = {
  defaultValues?: Partial<PersonaInput> & { id?: string };
};

export function PersonaForm({ defaultValues }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [avatar, setAvatar] = useState(defaultValues?.avatar ?? "🧑");
  const [color, setColor] = useState(defaultValues?.color ?? COLOR_CHOICES[0]);

  const form = useForm<PersonaInput>({
    resolver: zodResolver(personaSchema) as unknown as Resolver<PersonaInput>,
    defaultValues: {
      name: "",
      dailyWaterMl: 3000,
      ...defaultValues,
      avatar: defaultValues?.avatar ?? "🧑",
      color: defaultValues?.color ?? COLOR_CHOICES[0],
    },
  });

  function onSubmit(values: PersonaInput) {
    startTransition(async () => {
      try {
        const payload = { ...values, avatar, color };
        if (defaultValues?.id) {
          await updatePersona(defaultValues.id, payload);
          toast.success("Persona atualizada.");
        } else {
          await createPersona(payload);
          toast.success("Persona criada e selecionada.");
        }
        router.push("/personas");
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível salvar.");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label>Identidade visual</Label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_CHOICES.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => setAvatar(e)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg ${
                avatar === e ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {COLOR_CHOICES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              className={`h-7 w-7 rounded-full border-2 ${
                color === c ? "border-foreground" : "border-transparent"
              }`}
              style={{ background: c }}
              aria-label={`cor ${c}`}
            />
          ))}
        </div>
      </div>

      <Field label="Nome" error={form.formState.errors.name?.message}>
        <Input {...form.register("name")} placeholder="Ex: Alex" />
      </Field>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Idade">
          <Input type="number" min={1} {...form.register("age")} />
        </Field>
        <Field label="Altura (cm)">
          <Input type="number" min={50} {...form.register("heightCm")} />
        </Field>
        <Field label="Sexo">
          <Select
            value={form.watch("sex") ?? ""}
            onValueChange={(v) => form.setValue("sex", v || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="feminino">Feminino</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Peso inicial (kg)">
          <Input type="number" step="0.1" {...form.register("initialWeightKg")} />
        </Field>
        <Field label="Peso meta (kg)">
          <Input type="number" step="0.1" {...form.register("targetWeightKg")} />
        </Field>
        <Field label="Meta de água (ml)">
          <Input type="number" step={100} min={500} {...form.register("dailyWaterMl")} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Objetivo principal">
          <Select
            value={form.watch("goal") ?? ""}
            onValueChange={(v) => form.setValue("goal", v ? (v as (typeof PERSONA_GOALS)[number]) : null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {PERSONA_GOALS.map((g) => (
                <SelectItem key={g} value={g}>
                  {GOAL_LABEL[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Nível de atividade">
          <Select
            value={form.watch("activityLevel") ?? ""}
            onValueChange={(v) =>
              form.setValue(
                "activityLevel",
                v ? (v as (typeof ACTIVITY_LEVELS)[number]) : null
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_LEVELS.map((g) => (
                <SelectItem key={g} value={g}>
                  {ACTIVITY_LABEL[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Região/cidade">
        <Textarea rows={2} {...form.register("region")} placeholder="Ex: São Paulo — SP" />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {defaultValues?.id ? "Salvar" : "Criar persona"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
