"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Clock,
  Droplet,
  Scale,
  Utensils,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { NextAction } from "@/lib/next-action";

const STYLES: Record<
  NextAction["type"],
  { icon: typeof Check; bg: string; accent: string; ring: string }
> = {
  "meal-now": {
    icon: Utensils,
    bg: "bg-primary/10",
    accent: "text-primary",
    ring: "border-primary/30",
  },
  "meal-soon": {
    icon: Clock,
    bg: "bg-secondary",
    accent: "text-secondary-foreground",
    ring: "border-secondary",
  },
  "meal-late": {
    icon: Utensils,
    bg: "bg-destructive/10",
    accent: "text-destructive",
    ring: "border-destructive/30",
  },
  water: {
    icon: Droplet,
    bg: "bg-water/10",
    accent: "text-water",
    ring: "border-water/30",
  },
  weight: {
    icon: Scale,
    bg: "bg-info/10",
    accent: "text-info",
    ring: "border-info/30",
  },
  checkin: {
    icon: ClipboardCheck,
    bg: "bg-warning/10",
    accent: "text-warning",
    ring: "border-warning/30",
  },
  "all-done": {
    icon: Check,
    bg: "bg-success/10",
    accent: "text-success",
    ring: "border-success/30",
  },
};

export function NextActionCard({ action }: { action: NextAction }) {
  const style = STYLES[action.type];
  const Icon = style.icon;

  const inner = (
    <motion.div
      key={action.title}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className={cn("border-2", style.ring)}>
        <CardContent className="flex items-center gap-3 py-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              style.bg,
              style.accent
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Próxima ação
            </div>
            <div className="text-sm font-semibold truncate">{action.title}</div>
            <div className="text-muted-foreground text-xs">{action.description}</div>
          </div>
          {action.href && <ArrowRight className="text-muted-foreground h-4 w-4 shrink-0" />}
        </CardContent>
      </Card>
    </motion.div>
  );

  if (action.href) {
    return (
      <Link href={action.href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
