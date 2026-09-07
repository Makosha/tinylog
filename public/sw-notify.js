// Focus or open the app when a reminder is tapped.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const client = list.find((c) => "focus" in c);
      if (client) return client.focus();
      return self.clients.openWindow(url);
    }),
  );
});
