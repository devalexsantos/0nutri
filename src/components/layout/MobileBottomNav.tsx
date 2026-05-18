"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, CalendarDays, Droplet, LineChart, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/today", label: "Hoje", icon: CalendarDays },
  { href: "/diet", label: "Dieta", icon: Apple },
  { href: "/water", label: "Água", icon: Droplet },
  { href: "/progress", label: "Progresso", icon: LineChart },
  { href: "/personas", label: "Persona", icon: UserCircle2 },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
