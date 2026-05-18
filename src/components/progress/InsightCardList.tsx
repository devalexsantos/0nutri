"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Insight } from "@/lib/insights";

const STYLES: Record<
  Insight["tone"],
  { Icon: typeof Sparkles; bg: string; text: string; border: string }
> = {
  positive: {
    Icon: TrendingUp,
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/30",
  },
  attention: {
    Icon: AlertTriangle,
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/30",
  },
  neutral: {
    Icon: Sparkles,
    bg: "bg-info/10",
    text: "text-info",
    border: "border-info/30",
  },
};

export function InsightCardList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-6 text-center text-sm">
          Use o app por mais alguns dias e os insights começam a aparecer aqui.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {insights.map((insight, idx) => {
        const style = STYLES[insight.tone];
        const Icon = style.Icon;
        return (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.25 }}
          >
            <Card className={cn("border", style.border)}>
              <CardContent className="flex gap-3 py-4">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    style.bg,
                    style.text
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{insight.title}</div>
                  <div className="text-muted-foreground mt-0.5 text-xs">
                    {insight.body}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
