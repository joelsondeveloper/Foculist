function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if ("serviceWorker" in navigator) {
    try {
        
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("🟢 Service Worker registrado com sucesso!", registration);
        return registration
        
    } catch (error) {
        
        console.error("Erro ao registrar Service Worker:", error);

    }
  }
  return undefined
}

export async function subscribeUserForNotifications(userId: string, vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!('notifications' in window) || !('serviceWorker' in navigator)) {
        console.error('Notifications não são suportados pelo navegador.');
        return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        console.warn('Permissão de notificação negada pelo usuário.');
        return null;
    }

    try {
        
        const registration = await navigator.serviceWorker.ready;
        
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        const pushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
        });
        
        const res = await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pushSubscription })
        });

        if (!res.ok) {
            console.error('Erro ao registrar push subscription:', res.statusText);
            return null;
        }

        return pushSubscription

    } catch (error) {
        console.error('Erro ao registrar push subscription:', error);
        return null;
    }
}

export async function unsubscribeUserFromNotifications(userId: string, endpoint: string): Promise<boolean> {
    
    if (!('serviceWorker' in navigator)) {
        console.error('Service Worker não são suportados pelo navegador.');
        return false;
    }

    try {
        
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            const successFulUnsubscribe = await subscription.unsubscribe();
            if (!successFulUnsubscribe) {
                console.error('Erro ao desinscrever push subscription.');
                return false;
            }
            const res = await fetch('/api/notifications/unsubscribe', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ endpoint })
            });
            if (!res.ok) {
                throw new Error('Erro ao desinscrever push subscription.');
            }
            return true
        }

        return true
    } catch (error) {
        console.error('Erro ao desinscrever push subscription:', error);
        return false
    }
}

export function getNotificationPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
}