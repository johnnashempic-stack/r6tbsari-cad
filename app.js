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

const alarms = ["1st Alarm", "2nd Alarm", "3rd Alarm", "4th Alarm", "5th Alarm"];

// Fetch data
async function fetchData() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      headers: { "X-Master-Key": MASTER_KEY }
    });
    if (res.ok) {
      const data = await res.json();
      incidents = data.record.incidents || [];
      units = data.record.units || units;
      if (incidents.length > 0 && !currentIncidentId) currentIncidentId = incidents[0].id;
      updateUI();
    }
  } catch(e) {}
}

// Save data
async function saveData() {
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": MASTER_KEY
      },
      body: JSON.stringify({ incidents, units })
    });
  } catch(e) {}
}

setInterval(fetchData, 4000);

function initMap() {
  map = L.map('map').setView([10.72, 122.55], 13); // Iloilo
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19}).addTo(map);
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
  } else {
    alert("Access Denied");
  }
}

function sendAlert() {
  if (!isAdmin) return;
  playSiren();

  const newIncident = {
    id: Date.now().toString(),
    type: document.getElementById("callType").value,
    address: document.getElementById("address").value.trim() || "Unknown Location",
    details: document.getElementById("details").value.trim(),
    status: "1st Alarm",
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

function changeUnitStatus(unitId, newStatus) {
  const unit = units.find(u => u.id === unitId);
  if (!unit) return;
  
  const oldStatus = unit.status;
  unit.status = newStatus;

  // Update responder count in active incident
  if (currentIncidentId) {
    const inc = incidents.find(i => i.id === currentIncidentId);
    if (inc) {
      if (newStatus === "responding" && oldStatus !== "responding") {
        if (!inc.responders.includes(unit.name)) inc.responders.push(unit.name);
      } 
      else if (newStatus === "available" && oldStatus === "responding") {
        inc.responders = inc.responders.filter(name => name !== unit.name);
      }
    }
  }

  saveData();
  updateUI();
}

function updateUI() {
  // Active Calls
  const active = document.getElementById("activeIncidents");
  active.innerHTML = incidents.map(inc => `
    <div class="box">
      <strong>${inc.type || 'Incident'}</strong><br>
      📍 ${inc.address}<br>
      <small>${inc.status} • ${inc.responders.length} units responding</small>
    </div>
  `).join("") || "<em>No active calls</em>";

  // Unit Status Board
  document.getElementById("unitList").innerHTML = units.map(u => `
    <div style="padding:10px; background:#1a1a1f; margin:6px 0; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
      <strong>${u.name}</strong>
      <select onchange="changeUnitStatus(${u.id}, this.value)">
        <option value="available" ${u.status==='available'?'selected':''}>AVAILABLE</option>
        <option value="responding" ${u.status==='responding'?'selected':''}>RESPONDING</option>
        <option value="onscene" ${u.status==='onscene'?'selected':''}>ON SCENE</option>
        <option value="busy" ${u.status==='busy'?'selected':''}>BUSY</option>
      </select>
    </div>
  `).join("");
}

window.onload = () => {
  initMap();
  fetchData();
  updateUI();
  // Live Clock
  setInterval(() => {
    document.getElementById("time").textContent = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  }, 1000);
};
