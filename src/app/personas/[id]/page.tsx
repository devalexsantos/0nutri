import { notFound } from "next/navigation";
import { PersonaForm } from "@/components/personas/PersonaForm";
import { DeletePersonaButton } from "@/components/personas/DeletePersonaButton";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditPersonaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const persona = await prisma.persona.findUnique({ where: { id } });
  if (!persona) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Editar persona</h1>
          <p className="text-muted-foreground text-sm">
            Ajuste os dados que personalizam seu painel.
          </p>
        </div>
        <DeletePersonaButton id={persona.id} name={persona.name} />
      </div>
      <PersonaForm
        defaultValues={{
          id: persona.id,
          name: persona.name,
          avatar: persona.avatar,
          color: persona.color,
          age: persona.age,
          sex: persona.sex,
          heightCm: persona.heightCm,
          initialWeightKg: persona.initialWeightKg,
          targetWeightKg: persona.targetWeightKg,
          dailyWaterMl: persona.dailyWaterMl,
          goal: persona.goal as never,
          activityLevel: persona.activityLevel as never,
          region: persona.region,
        }}
      />
    </div>
  );
}
