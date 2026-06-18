self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'R6TBSARI CAD', body: 'New Alert' };
  const options = {
    body: data.body,
    icon: 'https://via.placeholder.com/192x192/ef4444/ffffff?text=🚨',
    badge: 'https://via.placeholder.com/96x96/ef4444/ffffff?text=🚨',
    vibrate: [200, 100, 200]
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
