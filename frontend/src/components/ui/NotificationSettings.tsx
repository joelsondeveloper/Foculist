"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMessages } from "@/app/context/MessageContext";
import {
  subscribeUserForNotifications,
  unsubscribeUserFromNotifications,
  getNotificationPermissionStatus,
  registerServiceWorker
} from "@/lib/notificationUtils";
import ButtonGeneral from "./ButtonGeneral";
import { Send } from "lucide-react";

interface BrowserPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const NotificationSettings = () => {
  const { data: session } = useSession();
  const { addMessage } = useMessages();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission | null>("default");
const [sendingTest, setSendingTest] = useState(false);

  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  useEffect(() => {

    const setupServiceWorker = async () => {
      if ("serviceWorker" in navigator) {
        await registerServiceWorker();
      }
    };
    setupServiceWorker();

    if (!session?.user?.id || !VAPID_PUBLIC_KEY) {
      setNotificationsEnabled(false);
      setPermissionStatus(getNotificationPermissionStatus());
      setLoading(false);
      if (!VAPID_PUBLIC_KEY) {
        console.error(
          "🔴 NEXT_PUBLIC_VAPID_PUBLIC_KEY não está definida ou é inválida."
        );
        addMessage(
          "Erro: Chave de notificação do servidor não configurada.",
          "error"
        );
      }
      return;
    }

    const checkSubscriptionStatus = async () => {
      setLoading(true);
      try {
        const registration = await navigator.serviceWorker.ready;

        if (!registration) {
          console.warn("🟡 Nenhuma inscrição encontrada.");
          setNotificationsEnabled(false);
          setPermissionStatus("default");
          return;
        }

        const subscription = await registration.pushManager.getSubscription();
        setNotificationsEnabled(!!subscription);
        setPermissionStatus(getNotificationPermissionStatus());
      } catch (error) {
        console.error("Erro ao verificar status da inscrição:", error);
        setNotificationsEnabled(false);
        setPermissionStatus(getNotificationPermissionStatus());
      } finally {
        setLoading(false);
      }
    };

    checkSubscriptionStatus();
  }, [session?.user?.id, VAPID_PUBLIC_KEY, addMessage]);

  const handleToggleNotifications = async () => {
    if (!session?.user?.id && !VAPID_PUBLIC_KEY) {
      addMessage(
        "Você preu estar logado para alterar as configurações de notificação.",
        "error"
      );
      return;
    }
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        addMessage("Nenhuma inscrição encontrada.", "error");
        setLoading(false);
        return;
      }

      if (notificationsEnabled) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const success = await unsubscribeUserFromNotifications(
            session?.user.id as string,
            subscription.endpoint
          );
          if (success) {
            setNotificationsEnabled(false);
            addMessage("Notificação desativada com sucesso.", "success");
          } else {
            addMessage("Erro ao desativar notificação.", "error");
          }
        }
      } else {
        const subscription = await subscribeUserForNotifications(
          session?.user.id as string,
          VAPID_PUBLIC_KEY
        );
        if (subscription) {
          setNotificationsEnabled(true);
          addMessage("Notificação ativada com sucesso.", "success");
        } else {
          addMessage("Erro ao ativar notificação.", "error");
        }
      }
      setPermissionStatus(getNotificationPermissionStatus());
    } catch (error) {
      console.error("Erro ao ativar/desativar notificação:", error);
      addMessage("Erro ao ativar/desativar notificação.", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderStatusMessage = () => {
    if (loading) {
      return <p>Verificando status...</p>;
    }
    if (permissionStatus === "denied") {
      return (
        <p>
          Permissão de notificação negada pelo usuário. Ative a permissão na
          configuração do navegador.
        </p>
      );
    }
    if (permissionStatus === "default" && !notificationsEnabled) {
      return <p>Você será solicitado uma permissão de notificação.</p>;
    }
    if (notificationsEnabled) {
      return <p>Notificação ativada.</p>;
    }
    return <p>Notificação desativada.</p>;
  };

   const handleSendTestNotification = async () => {
      if (!session?.user?.id) {
        addMessage(
          "Você precisa estar logado para enviar uma notificação de teste.",
          "error"
        );
        return;
      }
      if (!notificationsEnabled) {
        addMessage(
          "As notificações não estão ativas. Ative-as primeiro.",
          "info"
        );
        return;
      }
  
      setSendingTest(true);
      try {
        const res = await fetch("/api/notifications/send-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
  
        const data = await res.json();
        if (!res.ok) {
          addMessage(
            data.message || "Falha ao enviar notificação de teste.",
            "error"
          );
          throw new Error(
            data.message || "Falha ao enviar notificação de teste."
          );
        }
        addMessage(
          data.message ||
            "Notificação de teste enviada! Verifique seu dispositivo.",
          "success"
        );
      } catch (error) {
        console.error("Erro ao enviar notificação de teste:", error);
        addMessage("Ocorreu um erro ao enviar a notificação de teste.", "error");
      } finally {
        setSendingTest(false);
      }
    };

  return (
    <div className="notificationCard p-8 flex flex-col bg-primary-foreground/4 rounded-2xl gap-5">
      <h3 className="font-semibold text-xl">Notificações</h3>
      <p className="text-sm">
        Receba lembretes e alertas importantes sobre suas tarefas, mesmo quando
        o aplicativo não estiver aberto.
      </p>
      <div className="flex items-center justify-between">
        <span className="text-sm">{renderStatusMessage()}</span>
        <label
          htmlFor="notificationToggle"
          className="flex items-center cursor-pointer"
        >
          <div className="relative">
            <input
              type="checkbox"
              id="notificationToggle"
              className="sr-only"
              checked={notificationsEnabled}
              onChange={handleToggleNotifications}
              disabled={loading || permissionStatus === "denied"} // Desabilita se estiver carregando ou negado
            />
            <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
            <div
              className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${
                notificationsEnabled ? "translate-x-full bg-indigo-500" : ""
              }`}
            ></div>
          </div>
        </label>
      </div>
      {notificationsEnabled && ( 
          <ButtonGeneral
            onClick={handleSendTestNotification}
            disabled={sendingTest}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {sendingTest ? (
              <span>Enviando teste...</span>
            ) : (
              <div className="flex items-center gap-2 justify-center">
                <Send size="1rem" /> <span>Enviar Teste de Notificação</span>
              </div>
            )}
          </ButtonGeneral>
        )}

      {permissionStatus === "denied" && (
        <p className="text-xs text-red-400">
          Para ativar, você precisa mudar as permissões de notificação do seu
          navegador nas configurações do site.
        </p>
      )}
    </div>
  );
};

export default NotificationSettings;
