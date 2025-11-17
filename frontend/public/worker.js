importScripts('./workbox-4754cb34.js');

self.addEventListener("install", (event) => {
  console.log("Service Worker: Install event");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activate event");
  self.clientsClaim();
});

self.addEventListener("push", (event) => {
  console.log("=== Evento 'push' recebido no Service Worker ==="); // NOVO LOG
  debugger; // <<< ADICIONE ESTA LINHA AQUI!

  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
      console.log("Dados do evento push (parseados):", data); // NOVO LOG
    } else {
      console.warn("Evento push recebido sem dados."); // NOVO LOG
    }
  } catch (e) {
    console.error("Erro ao parsear dados do evento push:", e); // NOVO LOG
    data = { title: "Erro de Notificação", body: "Não foi possível exibir a notificação." };
  }

  const title = data.title || "Focuslist Notificação";
  const options = {
    body: data.body || "Você tem uma nova notificação do Focuslist!",
    icon: data.icon || "/icons/icon-192x192.png", // Use data.icon diretamente
    badge: data.badge || "/icons/icon-72x72.png", // Use data.badge diretamente
    vibrate: data.vibrate || [100, 50, 100],     // Use data.vibrate diretamente
    data: { // Seu SW espera { url: ... }, então o payload enviado precisa ter { data: { url: ... } }
      url: data.url || (data.data && data.data.url) || self.location.origin, // Mais robusto para url
      // Você pode querer passar todo o objeto `data` aqui se precisar de mais informações no `notificationclick`
      // data: data,
    },
    actions: data.actions || [],
  };

  console.log("Opções da notificação a serem exibidas:", options); // NOVO LOG

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log("✅ Notificação exibida com sucesso!")) // NOVO LOG
      .catch((e) => console.error("🔴 Erro ao exibir notificação:", e))  // NOVO LOG
  );
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
