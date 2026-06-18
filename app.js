let map, marker;
let isAdmin = false;
const ADMIN_PASSWORD = "IR6TB-018";

let incidents = [];
let currentIncidentId = null;
let units = [
  {id:1, name: "E01", status: "available"},
  {id:2, name: "E02", status: "available"},
  {id:3, name: "L01", status: "available"},
  {id:4, name: "R01", status: "available"},
  {id:5, name: "BC1", status: "available"}
];
let history = [];

const alarms = ["1st Alarm", "2nd Alarm", "3rd Alarm", "4th Alarm", "5th Alarm"];

// === YOUR VAPID KEYS ===
const VAPID_PUBLIC_KEY = "BDjQWJcTn9rjzd9iLngxpwPQ4eeqoEXTBCda2JckvhvUCjMkB_ydr96dzkjBzvoRaOSj7gSf6GgR9ovWB3_llNw";

async function sendPushNotification(title, body) {
  if ('Notification' in window && Notification.permission === "granted") {
    new Notification(title, { 
      body, 
      icon: 'https://via.placeholder.com/192x192/ef4444/ffffff?text=🚨',
      tag: 'r6tbsari-dispatch'
    });
  }
  console.log(`🔔 PUSH SENT: ${title} - ${body}`);
}

function initMap() {
  map = L.map('map').setView([10.3, 123.9], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

  map.on("click", e => {
    if (!isAdmin) return;
    if (marker) map.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(map).bindPopup("Incident Location").openPopup();
  });
}

function playSiren() {
  const audio = document.getElementById("alarmSound");
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function loginAdmin() {
  const pass = prompt("Enter Admin Password:");
  if (pass === ADMIN_PASSWORD) {
    isAdmin = true;
    document.getElementById("adminPanel").style.display = "block";
    document.getElementById("mode").innerHTML = "🛡️ DISPATCH MODE";
  } else {
    alert("Access Denied");
  }
}

function sendAlert() {
  if (!isAdmin) return;
  playSiren();

  const newIncident = {
    id: Date.now(),
    address: document.getElementById("address").value.trim() || "Unknown Location",
    details: document.getElementById("details").value.trim(),
    status: alarms[0],
    highest: 0,
    time: new Date().toLocaleString(),
    responders: []
  };

  incidents.push(newIncident);
  currentIncidentId = newIncident.id;

  document.getElementById("address").value = "";
  document.getElementById("details").value = "";

  sendPushNotification("🚨 NEW INCIDENT", newIncident.address);
  updateUI();
}

function raiseAlarm() {
  if (!isAdmin || !currentIncidentId) return;
  const inc = incidents.find(i => i.id === currentIncidentId);
  if (!inc) return;
  const idx = alarms.indexOf(inc.status);
  if (idx < alarms.length - 1) {
    inc.status = alarms[idx + 1];
    if (idx + 1 > inc.highest) inc.highest = idx + 1;
    playSiren();
    sendPushNotification("🔺 ALARM ESCALATED", `${inc.status} at ${inc.address}`);
    updateUI();
  }
}

function underControl() {
  if (!isAdmin || !currentIncidentId) return;
  const inc = incidents.find(i => i.id === currentIncidentId);
  if (inc) inc.status = "UNDER CONTROL";
  updateUI();
}

function fireOut() {
  if (!isAdmin || !currentIncidentId) return;
  const idx = incidents.findIndex(i => i.id === currentIncidentId);
  if (idx === -1) return;
  const inc = incidents[idx];
  history.push({...inc, final: inc.status, respondersCount: inc.responders.length});
  incidents.splice(idx, 1);
  currentIncidentId = incidents.length ? incidents[0].id : null;
  updateUI();
}

function respond() {
  if (!currentIncidentId) return;
  const name = document.getElementById("callsign").value.trim();
  if (!name) return;
  const inc = incidents.find(i => i.id === currentIncidentId);
  if (inc && !inc.responders.includes(name)) {
    inc.responders.push(name);
    sendPushNotification("🚒 UNIT RESPONDING", `${name} responding to ${inc.address}`);
  }
  document.getElementById("callsign").value = "";
  updateUI();
}

function changeUnitStatus(unitId, newStatus) {
  const unit = units.find(u => u.id === unitId);
  if (unit) unit.status = newStatus;
  updateUI();
}

function updateUI() {
  document.getElementById("activeIncidents").innerHTML = incidents.map(inc => `
    <div class="incident-item" onclick="currentIncidentId=${inc.id};updateUI()">
      <strong>${inc.address}</strong><br>
      <span style="color:#ef4444">${inc.status}</span> • ${inc.responders.length} units
    </div>
  `).join("") || "<em>No active incidents</em>";

  document.getElementById("unitList").innerHTML = units.map(u => `
    <div class="unit-item">
      <strong>${u.name}</strong>
      <select onchange="changeUnitStatus(${u.id}, this.value)">
        <option value="available" ${u.status==='available'?'selected':''}>AVAILABLE</option>
        <option value="responding" ${u.status==='responding'?'selected':''}>RESPONDING</option>
        <option value="onscene" ${u.status==='onscene'?'selected':''}>ON SCENE</option>
      </select>
    </div>
  `).join("");

  document.getElementById("history").innerHTML = history.slice().reverse().map(h => `
    <div class="incident-item">
      📍 ${h.address}<br>
      <small>Final: ${h.final} | ${h.respondersCount} units</small>
    </div>
  `).join("") || "<em>No history yet</em>";
}

// Push Setup
async function registerPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const registration = await navigator.serviceWorker.register('sw.js');
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log("✅ Push subscription successful");
    }
  } catch (e) {
    console.log("Push setup incomplete (local notifications still work)");
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

window.onload = () => {
  initMap();
  updateUI();
  registerPush();
  if ('Notification' in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
};
