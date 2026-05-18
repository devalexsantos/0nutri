import { PersonaForm } from "@/components/personas/PersonaForm";

export default function NewPersonaPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Nova persona</h1>
        <p className="text-muted-foreground text-sm">
          Crie um workspace independente. Você pode trocar de persona pelo topo da tela.
        </p>
      </div>
      <PersonaForm />
    </div>
  );
}
