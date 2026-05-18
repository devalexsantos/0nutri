import { formatDateLong } from "@/lib/dates";

export function TodayHeader({
  personaName,
  totalMeals,
  doneMeals,
  consumedMl,
}: {
  personaName: string;
  totalMeals: number;
  doneMeals: number;
  consumedMl: number;
}) {
  const date = formatDateLong(new Date());
  const water = (consumedMl / 1000).toFixed(2);
  const status =
    totalMeals === 0
      ? `Você ainda não tem uma dieta ativa.`
      : doneMeals === 0
      ? `Bom dia, ${personaName}. Vamos começar o dia.`
      : doneMeals < totalMeals
      ? `${personaName}, ${doneMeals} de ${totalMeals} refeições concluídas e ${water}L de água.`
      : `${personaName}, você completou todas as refeições. Excelente.`;

  return (
    <header className="space-y-1">
      <div className="text-muted-foreground text-xs uppercase tracking-wide">{date}</div>
      <h1 className="text-2xl font-semibold leading-tight">Hoje</h1>
      <p className="text-muted-foreground text-sm">{status}</p>
    </header>
  );
}
