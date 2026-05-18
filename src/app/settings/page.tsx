import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackupSection } from "@/components/settings/BackupSection";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { getActivePersonaId, listPersonas } from "@/lib/persona";
import { prisma } from "@/lib/prisma";
import { getNotificationPreferences } from "@/server/actions/notifications";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, personas, activePersonaId] = await Promise.all([
    prisma.appSettings.findFirst(),
    listPersonas(),
    getActivePersonaId(),
  ]);
  const notificationPrefs = activePersonaId
    ? await getNotificationPreferences(activePersonaId)
    : {
        mealsEnabled: true,
        waterEnabled: true,
        dayCloseEnabled: true,
        freeMealEnabled: true,
      };
  const effectiveSettings = settings ?? {
    theme: "light",
    showCalories: false,
    showMacros: false,
    dayStartTime: "06:00",
    dayEndTime: "23:00",
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-muted-foreground text-sm">
          Preferências globais do app. Configurações específicas por persona ficam na tela de personas.
        </p>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            defaultValues={{
              theme: (effectiveSettings.theme as "light" | "dark") ?? "light",
              showCalories: effectiveSettings.showCalories ?? false,
              showMacros: effectiveSettings.showMacros ?? false,
              dayStartTime: effectiveSettings.dayStartTime ?? "06:00",
              dayEndTime: effectiveSettings.dayEndTime ?? "23:00",
            }}
          />
        </CardContent>
      </Card>

      <NotificationsSettings
        personaId={activePersonaId}
        initialPrefs={{
          mealsEnabled: notificationPrefs.mealsEnabled,
          waterEnabled: notificationPrefs.waterEnabled,
          dayCloseEnabled: notificationPrefs.dayCloseEnabled,
          freeMealEnabled: notificationPrefs.freeMealEnabled,
        }}
      />

      <BackupSection
        personas={personas.map((p) => ({ id: p.id, name: p.name }))}
        activePersonaId={activePersonaId}
      />
    </div>
  );
}
