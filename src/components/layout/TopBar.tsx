import Link from "next/link";
import { listPersonas, getActivePersona } from "@/lib/persona";
import { MobileMenuDrawer } from "@/components/layout/MobileMenuDrawer";
import { PersonaSwitcher } from "@/components/layout/PersonaSwitcher";

export async function TopBar() {
  const [active, personas] = await Promise.all([getActivePersona(), listPersonas()]);

  return (
    <header className="bg-background/90 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between gap-2 px-4 md:px-6">
        <div className="flex items-center gap-2 md:hidden">
          <MobileMenuDrawer />
          <Link href="/today" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg text-base font-bold">
              0
            </div>
            <span className="text-base font-semibold">0nutri</span>
          </Link>
        </div>
        <div className="hidden text-sm md:block">
          <span className="text-muted-foreground">Workspace ativo:</span>{" "}
          <span className="font-medium">{active?.name ?? "—"}</span>
        </div>
        <PersonaSwitcher
          active={
            active
              ? { id: active.id, name: active.name, avatar: active.avatar, color: active.color }
              : null
          }
          personas={personas.map((p) => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            color: p.color,
          }))}
        />
      </div>
    </header>
  );
}
