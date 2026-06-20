// ================== CONFIG ==================
const BIN_ID = "6a36000ef5f4af5e29128246";
const MASTER_KEY = "$2a$10$xqh.MDd939MiRTFQpJ4GJebf7kSrK5dnmT/a8E0DG9bFNqdLW5vzS";
const ADMIN_PASSWORD = "IR6TB-018";

// ================== STATE ==================
let map;

let incidents = [];
let units = [
  { id: 1, name: "RESCUE 1", status: "available" },
  { id: 2, name: "RESCUE 2", status: "available" },
  { id: 3, name: "RESCUE 3", status: "available" },
  { id: 4, name: "RESCUE 4", status: "available" },
  { id: 5, name: "RESCUE 5", status: "available" }
];

let chatLog = [];
let isAdmin = false;
let lastUpdate = 0;

// ================== INIT ==================
window.onload = () => {
  initMap();
  fetchData();
  updateUI();
  updateUnitsUI();
  updateChatUI();
};

// ================== MAP ==================
function initMap() {
  map = L.map('map').setView([10.72, 122.55], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);
}

// ================== SYNC ==================
async function fetchData() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      headers: { "X-Master-Key": MASTER_KEY }
    });

    if (!res.ok) return;

    const data = await res.json();
    const record = data.record;

    if (record.lastUpdate && record.lastUpdate <= lastUpdate) return;

    lastUpdate = record.lastUpdate || Date.now();

    incidents = record.incidents || [];
    units = record.units || units;
    chatLog = record.chat || [];

    updateUI();
    updateUnitsUI();
    updateChatUI();

  } catch (e) {}
}

setInterval(fetchData, 1500);

// ================== SAVE ==================
async function saveData() {
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": MASTER_KEY
      },
      body: JSON.stringify({
        incidents,
        units,
        chat: chatLog,
        lastUpdate: Date.now()
      })
    });
  } catch (e) {}
}

// ================== ADMIN ==================
function adminLogin() {
  const pass = document.getElementById("adminPass").value;

  if (pass === ADMIN_PASSWORD) {
    isAdmin = true;
    document.getElementById("adminBox").style.display = "none";
    document.getElementById("dispatchControls").style.display = "block";
  } else {
    alert("Wrong password");
  }
}

function logoutAdmin() {
  isAdmin = false;
  document.getElementById("adminBox").style.display = "block";
  document.getElementById("dispatchControls").style.display = "none";
}

// ================== NEW CALL ==================
async function newCall() {
  if (!isAdmin) return;

  const type = document.getElementById("callType").value;
  const address = document.getElementById("address").value;
  const details = document.getElementById("details").value;

  if (!address || !details) return;

  incidents.unshift({
    id: Date.now(),
    type,
    address,
    details,
    status: "PENDING",
    created: Date.now(),
    attachedUnits: []
  });

  await saveData();

  document.getElementById("address").value = "";
  document.getElementById("details").value = "";
}

// ================== STATUS ==================
async function changeStatus(id, status) {
  const call = incidents.find(i => i.id === id);
  if (!call) return;

  call.status = status;
  await saveData();
}

// ================== ATTACH ==================
async function attachUnit(id, unitName) {
  const call = incidents.find(c => c.id === id);
  if (!call) return;

  if (!call.attachedUnits.includes(unitName)) {
    call.attachedUnits.push(unitName);
  }

  if (call.status === "PENDING") call.status = "ENROUTE";

  await saveData();
}

// ================== LEAVE ==================
async function leaveUnit(id, unitName) {
  const call = incidents.find(c => c.id === id);
  if (!call) return;

  call.attachedUnits = call.attachedUnits.filter(u => u !== unitName);

  await saveData();
}

// ================== UI CALLS ==================
function updateUI() {
  const container = document.getElementById("activeIncidents");
  container.innerHTML = "";

  incidents.forEach(call => {

    let color = "#ef4444";
    if (call.status === "ENROUTE") color = "orange";
    if (call.status === "ON SCENE") color = "yellow";
    if (call.status === "CLEARED") color = "green";

    container.innerHTML += `
      <div class="call-card" style="border-left:5px solid ${color}">
        <b>${call.type}</b><br>
        ${call.address}<br>
        <small>${call.details}</small><br><br>

        <b>Status:</b> ${call.status}<br>
        <b>Units:</b> ${call.attachedUnits.join(", ") || "None"}<br><br>

        <button onclick="changeStatus(${call.id},'ENROUTE')">ENROUTE</button>
        <button onclick="changeStatus(${call.id},'ON SCENE')">ON SCENE</button>
        <button onclick="changeStatus(${call.id},'CLEARED')">CLEARED</button>

        <button onclick="attachUnit(${call.id},'RESCUE 1')">ATTACH</button>
        <button onclick="leaveUnit(${call.id},'RESCUE 1')">LEAVE</button>
      </div>
    `;
  });
}

// ================== UNITS ==================
function updateUnitsUI() {
  const container = document.getElementById("unitsList");
  if (!container) return;

  container.innerHTML = units.map(u => `
    <div class="call-card">
      <b>${u.name}</b><br>
      Status: ${u.status}<br>

      <select onchange="setUnitStatus('${u.name}', this.value)">
        <option value="available">available</option>
        <option value="enroute">enroute</option>
        <option value="on scene">on scene</option>
        <option value="returning">returning</option>
        <option value="out of service">out of service</option>
      </select>
    </div>
  `).join("");
}

async function setUnitStatus(name, status) {
  const unit = units.find(u => u.name === name);
  if (!unit) return;

  unit.status = status;
  await saveData();
}

// ================== CHAT ==================
function sendMessage() {
  const msg = document.getElementById("chatInput").value;
  const name = document.getElementById("chatName").value || "UNIT";

  if (!msg) return;

  chatLog.push({
    name,
    msg,
    time: new Date().toLocaleTimeString()
  });

  document.getElementById("chatInput").value = "";

  saveData();
  updateChatUI();
}

function updateChatUI() {
  const box = document.getElementById("chatMessages");
  if (!box) return;

  box.innerHTML = chatLog.map(c => `
    [${c.time}] <b>${c.name}:</b> ${c.msg}
  `).join("");

  box.scrollTop = box.scrollHeight;
}

// ================== NAV ==================
function showCalls() {
  document.getElementById("callsPage").style.display = "block";
  document.getElementById("unitsPage").style.display = "none";
  document.getElementById("chatPage").style.display = "none";
}

function showUnits() {
  document.getElementById("callsPage").style.display = "none";
  document.getElementById("unitsPage").style.display = "block";
  document.getElementById("chatPage").style.display = "none";
}

function showChat() {
  document.getElementById("callsPage").style.display = "none";
  document.getElementById("unitsPage").style.display = "none";
  document.getElementById("chatPage").style.display = "block";
}
