self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {title: "R6TBSARI MDT", body: "New Call"};
  event.waitUntil(
    self.registration.showNotification(data.title, { body: data.body })
  );
});
