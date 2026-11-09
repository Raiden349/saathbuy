self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch { payload = { body: event.data ? event.data.text() : "New deals are open." }; }
  const title = payload.title || "New deals on campus";
  const options = {
    body: payload.body || "Open SaathBuy to see this week's deals.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: payload.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requested = new URL(event.notification.data?.url || "/", self.location.origin);
  const destination = (requested.origin === self.location.origin ? requested : new URL("/", self.location.origin)).toString();
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => client.url.startsWith(self.location.origin));
    if (existing) return existing.navigate(destination).then(() => existing.focus());
    return self.clients.openWindow(destination);
  }));
});
