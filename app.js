// === JSONBIN CONFIG (YOUR KEYS) ===
const BIN_ID = "6a35088cf5f4af5e290dfd57";
const MASTER_KEY = "$2a$10$9tAozl0KM.tjp5SiZrLhr.pLYpLlnk1p5Veo/I1t9Rlj1y6IBCL2q";

let map, marker;
let isAdmin = false;
const ADMIN_PASSWORD = "IR6TB-018";

let incidents = [];
let currentIncidentId = null;
let units = [
  {id:1, name: "RESCUE 1", status: "available"},
  {id:2, name: "RESCUE 2", status: "available"},
  {id:3, name: "RESCUE 3", status: "available"},
  {id:4, name: "RESCUE 4", status: "available"},
  {id:5, name: "RESCUE 5", status: "available"}
];
let history = [];

const alarms = ["1st Alarm", "2nd Alarm", "3rd Alarm", "4th Alarm", "5th Alarm"];

// Fetch latest data
async function fetchData() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      headers: { "X-Master-Key": MASTER_KEY }
    });
    if (res.ok) {
      const data = await res.json();
      incidents = data.record.incidents || [];
      history = data.record.history || [];
      if (incidents.length > 0 && !currentIncidentId) {
        currentIncidentId = incidents[0].id;
      }
      updateUI();
    }
  } catch (e) {
    console.log("Sync failed, trying again...");
  }
}

// Save data to cloud
async function saveData() {
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": MASTER_KEY
      },
      body: JSON.stringify({ incidents, history })
    });
  } catch (e) {
    console.log("Save failed");
  }
}

// Auto refresh every 4 seconds
setInterval(fetchData, 4000);

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
    document.getElementById("mode").innerHTML = "🛡️ ADMIN MODE";
  } else {
    alert("Access Denied");
  }
}

function sendAlert() {
  if (!isAdmin) return;
  playSiren();

  const newIncident = {
    id: Date.now().toString(),
    address: document.getElementById("address").value.trim() || "Unknown Location",
    details: document.getElementById("details").value.trim(),
    status: alarms[0],
    highest: 0,
    time: new Date().toLocaleString(),
    responders: []
  };

  incidents.unshift(newIncident);
  currentIncidentId = newIncident.id;
  document.getElementById("address").value = "";
  document.getElementById("details").value = "";
  saveData();
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
    saveData();
    updateUI();
  }
}

function underControl() {
  if (!isAdmin || !currentIncidentId) return;
  const inc = incidents.find(i => i.id === currentIncidentId);
  if (inc) inc.status = "UNDER CONTROL";
  saveData();
  updateUI();
}

function fireOut() {
  if (!isAdmin || !currentIncidentId) return;
  const idx = incidents.findIndex(i => i.id === currentIncidentId);
  if (idx === -1) return;
  const inc = incidents[idx];
  history.unshift({...inc, final: inc.status, respondersCount: inc.responders.length});
  incidents.splice(idx, 1);
  currentIncidentId = incidents.length ? incidents[0].id : null;
  saveData();
  updateUI();
}

function respond() {
  if (!currentIncidentId) return;
  const name = document.getElementById("callsign").value.trim();
  if (!name) return;
  const inc = incidents.find(i => i.id === currentIncidentId);
  if (inc && !inc.responders.includes(name)) {
    inc.responders.push(name);
    saveData();
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

window.onload = () => {
  initMap();
  fetchData();           // Initial load
  updateUI();
};
