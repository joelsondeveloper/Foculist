self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "Focuslist Notificação";
  const options = {
    body: data.body || "Você tem uma nova notificação do Focuslist!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || self.location.origin,
    },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const clickedNotificationData = event.notification.data;
  const targetUrl = clickedNotificationData.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});
