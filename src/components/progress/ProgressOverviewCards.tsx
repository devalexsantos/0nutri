import {
  Calendar,
  Droplet,
  Flame,
  Scale,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardData = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "info";
  icon: typeof Scale;
};

function ToneIcon({ icon: Icon, tone }: { icon: typeof Scale; tone: CardData["tone"] }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
        tone === "success" && "bg-success/15 text-success",
        tone === "warning" && "bg-warning/15 text-warning",
        tone === "info" && "bg-water/15 text-water",
        (!tone || tone === "default") && "bg-muted text-muted-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

export function ProgressOverviewCards({
  cards,
}: {
  cards: CardData[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="flex items-start gap-3 py-3">
            <ToneIcon icon={c.icon} tone={c.tone} />
            <div className="min-w-0">
              <div className="text-muted-foreground text-[10px] uppercase tracking-wide">
                {c.label}
              </div>
              <div className="text-base font-semibold tabular-nums leading-tight">
                {c.value}
              </div>
              {c.hint && (
                <div className="text-muted-foreground mt-0.5 truncate text-[11px]">
                  {c.hint}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export const ProgressIcons = { Scale, Target, Calendar, Droplet, Trophy, TrendingDown, TrendingUp, Flame };
