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
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: readonly NavItem[] = [
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
