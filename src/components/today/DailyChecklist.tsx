import Link from "next/link";
import { Check, Circle, Droplet, Scale, Utensils } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChecklistItem = {
  label: string;
  done: boolean;
  href?: string;
  icon: typeof Check;
  hint?: string;
};

export function DailyChecklist({
  items,
}: {
  items: ChecklistItem[];
}) {
  const completed = items.filter((i) => i.done).length;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Checklist de hoje</span>
          <span className="text-muted-foreground text-xs font-normal tabular-nums">
            {completed}/{items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const content = (
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg px-2 py-2 transition-colors",
                item.href && "hover:bg-muted cursor-pointer"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  item.done
                    ? "bg-success text-success-foreground"
                    : "text-muted-foreground border border-dashed"
                )}
              >
                {item.done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3 w-3" />}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "text-sm",
                    item.done && "text-muted-foreground line-through decoration-1"
                  )}
                >
                  {item.label}
                </div>
                {item.hint && !item.done && (
                  <div className="text-muted-foreground text-[11px]">{item.hint}</div>
                )}
              </div>
            </div>
          );
          return (
            <div key={item.label}>
              {item.href ? <Link href={item.href}>{content}</Link> : content}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export const ChecklistIcons = {
  Utensils,
  Droplet,
  Scale,
  Check,
  Circle,
};
