"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Loader2, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  detectPushCapability,
  disablePush,
  enablePush,
  getCurrentSubscription,
  type PushCapability,
} from "@/lib/push-client";
import {
  sendTestPush,
  updateNotificationPreferences,
} from "@/server/actions/notifications";

type Prefs = {
  mealsEnabled: boolean;
  waterEnabled: boolean;
  dayCloseEnabled: boolean;
  freeMealEnabled: boolean;
};

const PREF_LABELS: Record<keyof Prefs, { label: string; hint: string }> = {
  mealsEnabled: {
    label: "Refeições programadas",
    hint: "Lembrete na hora da refeição se ainda estiver pendente",
  },
  waterEnabled: {
    label: "Meta de água",
    hint: "A cada ~90min se você estiver atrás do ritmo",
  },
  dayCloseEnabled: {
    label: "Fechar o dia",
    hint: "Por volta de 22h, se o check-in ainda não foi feito",
  },
  freeMealEnabled: {
    label: "Refeição livre planejada",
    hint: "Um aviso de manhã quando há uma planejada pro dia",
  },
};

export function NotificationsSettings({
  personaId,
  initialPrefs,
}: {
  personaId: string | null;
  initialPrefs: Prefs;
}) {
  const [capability, setCapability] = useState<PushCapability | "loading">("loading");
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  );
  const [subscribed, setSubscribed] = useState<boolean | "loading">("loading");
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs);
  const [pendingAction, startAction] = useTransition();

  useEffect(() => {
    setCapability(detectPushCapability());
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
    getCurrentSubscription()
      .then((s) => setSubscribed(Boolean(s)))
      .catch(() => setSubscribed(false));
  }, []);

  async function handleEnable() {
    if (!personaId) {
      toast.error("Crie uma persona ativa primeiro.");
      return;
    }
    const res = await enablePush(personaId);
    if (res.ok) {
      setSubscribed(true);
      setPermission("granted");
      toast.success("Lembretes ativados.");
    } else if (res.reason === "permission") {
      setPermission(Notification.permission);
      toast.error("Permissão negada. Habilite no iPhone em Ajustes → Notificações.");
    } else {
      toast.error(`Falha (${res.reason}): ${res.detail ?? ""}`);
    }
  }

  async function handleDisable() {
    await disablePush();
    setSubscribed(false);
    toast.success("Lembretes desativados.");
  }

  function togglePref(key: keyof Prefs, next: boolean) {
    if (!personaId) return;
    const optimistic = { ...prefs, [key]: next };
    setPrefs(optimistic);
    startAction(async () => {
      try {
        await updateNotificationPreferences({ personaId, [key]: next });
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível salvar a preferência.");
        setPrefs(prefs);
      }
    });
  }

  async function handleTest() {
    if (!personaId) return;
    startAction(async () => {
      try {
        const res = await sendTestPush(personaId);
        if (res.ok) {
          toast.success(`Push enviado para ${res.sent}/${res.total} dispositivo(s).`);
        } else {
          toast.error(`Falha: ${"error" in res ? res.error : "sem inscrições"}`);
        }
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível enviar.");
      }
    });
  }

  const supportText = (() => {
    if (capability === "loading") return null;
    if (capability === "unsupported") {
      return (
        <p className="text-muted-foreground text-xs">
          Este navegador não suporta Web Push. Use o app instalado em iPhone (iOS 16.4+) ou Chrome/Edge no desktop.
        </p>
      );
    }
    if (capability === "needs-install") {
      return (
        <div className="border-warning/50 bg-warning/5 rounded-md border p-3 text-xs">
          <p className="text-warning mb-1 flex items-center gap-1.5 font-medium">
            <Smartphone className="h-3.5 w-3.5" /> Adicione o app à tela inicial primeiro
          </p>
          <p className="text-muted-foreground">
            No Safari do iPhone: toque em <Share className="inline h-3 w-3" /> Compartilhar → <strong>Adicionar à Tela de Início</strong>. Depois abra o 0nutri pelo ícone (não pelo Safari) e volte aqui.
          </p>
        </div>
      );
    }
    if (capability === "insecure-context") {
      return (
        <div className="border-warning/50 bg-warning/5 rounded-md border p-3 text-xs">
          <p className="text-warning mb-1 font-medium">HTTPS necessário</p>
          <p className="text-muted-foreground">
            Web Push exige conexão segura. Você está acessando via HTTP (rede interna). Configure um proxy com HTTPS — por exemplo Tailscale Serve (<code className="bg-muted rounded px-1">tailscale serve --bg 8100</code>) ou Caddy/nginx com Let&apos;s Encrypt. Acesse pelo domínio HTTPS e tente novamente.
          </p>
        </div>
      );
    }
    return null;
  })();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" /> Lembretes push
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          Notificações no celular para próximas refeições, meta de água, fechar o dia e refeições livres planejadas.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {supportText}

        {capability === "ready" && (
          <>
            <div className="text-sm">
              Status:{" "}
              <strong>
                {subscribed === "loading"
                  ? "verificando…"
                  : subscribed
                    ? "ativos neste dispositivo"
                    : permission === "denied"
                      ? "bloqueado pelo sistema"
                      : "inativos neste dispositivo"}
              </strong>
            </div>

            <div className="flex flex-wrap gap-2">
              {subscribed === false && permission !== "denied" && (
                <Button onClick={handleEnable} size="sm" disabled={!personaId}>
                  <Bell className="mr-2 h-4 w-4" /> Ativar lembretes
                </Button>
              )}
              {subscribed === true && (
                <>
                  <Button onClick={handleTest} size="sm" variant="outline" disabled={pendingAction}>
                    {pendingAction ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Bell className="mr-2 h-4 w-4" />
                    )}
                    Enviar push de teste
                  </Button>
                  <Button onClick={handleDisable} size="sm" variant="ghost">
                    <BellOff className="mr-2 h-4 w-4" /> Desativar
                  </Button>
                </>
              )}
              {permission === "denied" && (
                <p className="text-muted-foreground text-xs">
                  Permissão negada. No iPhone: Ajustes → Notificações → 0nutri → Permitir.
                </p>
              )}
            </div>

            {subscribed === true && personaId && (
              <div className="border-border/60 mt-2 space-y-2 rounded-md border p-3">
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  Tipos de lembrete
                </p>
                {(Object.keys(PREF_LABELS) as (keyof Prefs)[]).map((k) => (
                  <label
                    key={k}
                    className="flex cursor-pointer items-start justify-between gap-3 text-sm"
                  >
                    <span>
                      {PREF_LABELS[k].label}
                      <span className="text-muted-foreground block text-xs">
                        {PREF_LABELS[k].hint}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={prefs[k]}
                      onChange={(e) => togglePref(k, e.target.checked)}
                      disabled={pendingAction}
                    />
                  </label>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
