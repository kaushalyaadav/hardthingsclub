const CACHE_NAME = 'htc-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Hard Things Club';
  const options = {
    body: data.body || "Time to log today's activity!",
    icon: '/htc-logo.jpg',
    badge: '/htc-logo.jpg',
    tag: 'daily-log-reminder',
    renotify: true,
    requireInteraction: false,
    actions: [
      { action: 'log', title: 'Log now' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    data: { url: data.url || '/log' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/log';
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
