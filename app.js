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

async function fetchData() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      headers: { "X-Master-Key": MASTER_KEY }
    });
    if (res.ok) {
      const data = await res.json();
      incidents = data.record.incidents || [];
      units = data.record.units || units;
      updateUI();
    }
  } catch(e) {}
}

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
  map = L.map('map').setView([10.72, 122.55], 13); // Iloilo City
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19}).addTo(map);
}

function playSiren() {
  const audio = document.getElementById("alarmSound");
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// ADMIN
function adminLogin() {
  const pass = document.getElementById("adminPass").value;
  if (pass === ADMIN_PASSWORD) {
    isAdmin = true;
    document.getElementById("adminBox").style.display = "none";
    document.getElementById("dispatchControls").style.display = "block";
  } else {
    alert("Access Denied");
  }
}

function logoutAdmin() {
  isAdmin = false;
  document.getElementById("adminBox").style.display = "block";
  document.getElementById("dispatchControls").style.display = "none";
}

// NEW CALL
function newCall() {
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

// OPEN INCIDENT
function openIncident(id) {
  currentIncidentId = id;
  const inc = incidents.find(i => i.id === id);
  if (!inc) return;

  document.getElementById("incTitle").innerText = inc.type;
  document.getElementById("incAddress").innerText = "📍 " + inc.address;
  document.getElementById("incTime").innerText = inc.time;
  document.getElementById("incidentPanel").style.display = "block";
  updateUI();
}

function closeIncident() {
  document.getElementById("incidentPanel").style.display = "none";
}

// ATTACH / LEAVE
function toggleAttach() {
  if (!currentIncidentId) return;
  const inc = incidents.find(i => i.id === currentIncidentId);
  const unitName = prompt("Enter Unit Name (RESCUE 1, RESCUE 2, etc):");
  if (!unitName) return;

  const unit = units.find(u => u.name === unitName);
  if (!unit) return alert("Unit not found!");

  if (inc.responders.includes(unitName)) {
    // LEAVE
    inc.responders = inc.responders.filter(u => u !== unitName);
    unit.status = "available";
  } else {
    // ATTACH
    inc.responders.push(unitName);
    unit.status = "busy";   // Busy when attached
  }

  saveData();
  updateUI();
}

// UNIT PANEL
function toggleUnits() {
  const panel = document.getElementById("unitsPanel");
  panel.style.display = panel.style.display === "block" ? "none" : "block";
  updateUnitControl();
}

function updateUnitControl() {
  let html = "";
  units.forEach(u => {
    html += `
      <div style="margin:8px 0; padding:10px; background:#1a1a1f; border-radius:6px;">
        <strong>${u.name}</strong> - ${u.status.toUpperCase()}<br>
        <button onclick="changeUnitStatus(${u.id}, 'available')">AVAILABLE</button>
        <button onclick="changeUnitStatus(${u.id}, 'responding')">RESPONDING</button>
        <button onclick="changeUnitStatus(${u.id}, 'onscene')">ON SCENE</button>
        <button onclick="changeUnitStatus(${u.id}, 'busy')">BUSY</button>
      </div>`;
  });
  document.getElementById("unitControlList").innerHTML = html;
}

function changeUnitStatus(unitId, newStatus) {
  const unit = units.find(u => u.id === unitId);
  if (unit) {
    unit.status = newStatus;
    saveData();
    updateUI();
  }
}

// CHAT
function toggleChat() {
  const panel = document.getElementById("chatPanel");
  panel.style.display = panel.style.display === "block" ? "none" : "block";
}

function sendMsg() {
  const unit = document.getElementById("chatUnit").value;
  const msg = document.getElementById("msg").value.trim();
  if (!msg) return;

  const log = document.getElementById("chatLog");
  log.innerHTML += `<div><strong>${unit}:</strong> ${msg}</div>`;
  log.scrollTop = log.scrollHeight;
  document.getElementById("msg").value = "";
}

// UI UPDATE
function updateUI() {
  const activeHTML = incidents.map(inc => `
    <div class="call-card" onclick="openIncident('${inc.id}')">
      <strong>${inc.type}</strong><br>
      📍 ${inc.address}<br>
      <small>${inc.status} • ${inc.responders ? inc.responders.length : 0} responding</small>
    </div>
  `).join("") || "<em>No active calls</em>";
  document.getElementById("activeIncidents").innerHTML = activeHTML;
}

window.onload = () => {
  initMap();
  fetchData();
  updateUI();
};
