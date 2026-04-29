


self.addEventListener("install", function () {
  console.log("Service worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};

  event.waitUntil(
    self.registration.showNotification(data.title || "Nova reserva", {
      body: data.body || "A Alicantíssima recebeu uma nova reserva.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: {
        url: data.url || "/desk",
      },
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || "/desk")
  );
});