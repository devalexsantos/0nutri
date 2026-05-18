"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
  type NotificationPermissionState,
} from "@/lib/notifications";

export function NotificationsSettings() {
  const [state, setState] = useState<NotificationPermissionState>("default");

  useEffect(() => {
    // Lê permissão do browser ao montar (depende de API client-only).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getNotificationPermission());
  }, []);

  async function request() {
    const result = await requestNotificationPermission();
    setState(result);
    if (result === "granted") {
      toast.success("Notificações habilitadas.");
      void showNotification("Notificações ativas no 0nutri", {
        body: "Você receberá lembretes de refeições enquanto o app estiver aberto.",
      });
    } else if (result === "denied") {
      toast.error("Permissão negada. Habilite manualmente nas configurações do navegador.");
    }
  }

  async function test() {
    const ok = await showNotification("Teste do 0nutri", {
      body: "Se você está vendo isso, está funcionando.",
    });
    if (!ok) toast.error("Falha no envio. Verifique permissões.");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" /> Notificações
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          Lembretes locais para refeições do dia. Funcionam enquanto o app/PWA estiver aberto.
          Sem servidor de push.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          Status:{" "}
          <strong>
            {state === "granted"
              ? "ativadas"
              : state === "denied"
              ? "bloqueadas pelo navegador"
              : state === "unsupported"
              ? "navegador não suporta"
              : "ainda não solicitadas"}
          </strong>
        </div>
        <div className="flex gap-2">
          {state !== "granted" && state !== "unsupported" && (
            <Button onClick={request} size="sm">
              <Bell className="mr-2 h-4 w-4" /> Habilitar
            </Button>
          )}
          {state === "granted" && (
            <Button onClick={test} size="sm" variant="outline">
              <Bell className="mr-2 h-4 w-4" /> Enviar teste
            </Button>
          )}
          {state === "denied" && (
            <Button asChild size="sm" variant="outline" disabled>
              <span>
                <BellOff className="mr-2 h-4 w-4" /> Bloqueado
              </span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
