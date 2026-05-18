"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Apple,
  Bot,
  CalendarDays,
  Camera,
  Droplet,
  Heart,
  LineChart,
  Scale,
  Settings,
  ShoppingCart,
  Sparkles,
  UserCircle2,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/today", label: "Hoje", icon: CalendarDays },
  { href: "/diet", label: "Dieta", icon: Apple },
  { href: "/ai-diet", label: "Montar Dieta com IA", icon: Sparkles },
  { href: "/water", label: "Água", icon: Droplet },
  { href: "/weight", label: "Peso", icon: Scale },
  { href: "/progress", label: "Progresso", icon: LineChart },
  { href: "/coach", label: "Coach IA", icon: Bot },
  { href: "/shopping", label: "Lista de compras", icon: ShoppingCart },
  { href: "/marmita", label: "Marmitas", icon: UtensilsCrossed },
  { href: "/favorites", label: "Favoritos", icon: Heart },
  { href: "/photos", label: "Fotos", icon: Camera },
  { href: "/personas", label: "Personas", icon: UserCircle2 },
  { href: "/usage", label: "Uso da IA", icon: Activity },
  { href: "/settings", label: "Configurações", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar hidden h-screen w-64 shrink-0 border-r md:sticky md:top-0 md:flex md:flex-col">
      <div className="px-6 py-6">
        <Link href="/today" className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold">
            0
          </div>
          <div className="leading-tight">
            <div className="text-foreground text-base font-semibold">0nutri</div>
            <div className="text-muted-foreground text-xs">Seu painel pessoal</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="text-muted-foreground px-6 py-4 text-xs">v0.1 · MVP</div>
    </aside>
  );
}
