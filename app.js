const BIN_ID = "6a36000ef5f4af5e29128246";
const MASTER_KEY = "$2a$10$xqh.MDd939MiRTFQpJ4GJebf7kSrK5dnmT/a8E0DG9bFNqdLW5vzS";
const ADMIN_PASSWORD = "IR6TB-018";

let map;
let incidents = [];
let history = [];
let units = [];
let chatLog = [];

let currentUser = { role: "viewer", name: "" };
let lastUpdate = 0;

// MAP
function initMap() {
  map = L.map('map').setView([10.72, 122.55], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

// FETCH
async function fetchData() {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    headers: { "X-Master-Key": MASTER_KEY }
  });

  if (!res.ok) return;

  const data = await res.json();
  const r = data.record;

  incidents = r.incidents || [];
  history = r.history || [];
  units = r.units || [];
  chatLog = r.chat || [];

  updateUI();
  updateHistory();
}

setInterval(fetchData, 1500);

// SAVE
async function saveData() {
  await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": MASTER_KEY
    },
    body: JSON.stringify({ incidents, history, units, chat: chatLog })
  });
}

// LOGIN
function adminLogin() {
  if (document.getElementById("adminPass").value === ADMIN_PASSWORD) {
    currentUser.role = "dispatch";
    document.getElementById("adminBox").style.display = "none";
    document.getElementById("dispatchControls").style.display = "block";
  }
}

function logoutAdmin() {
  currentUser.role = "viewer";
}

// CALL CREATE
async function newCall() {
  if (currentUser.role !== "dispatch") return;

  incidents.unshift({
    id: Date.now(),
    type: callType.value,
    address: address.value,
    details: details.value,
    status: "PENDING",
    incidentStatus: "FOA",
    attachedUnits: []
  });

  await saveData();
}

// STATUS (dispatch only)
async function changeStatus(id, status) {
  if (currentUser.role !== "dispatch") return;

  let c = incidents.find(i => i.id === id);
  if (!c) return;

  c.incidentStatus = status;

  if (status === "Fire Out" || status === "Road Cleared") {
    history.unshift(c);
    incidents = incidents.filter(i => i.id !== id);
  }

  await saveData();
}

// UI CALLS
function updateUI() {
  const box = document.getElementById("activeIncidents");
  box.innerHTML = "";

  incidents.forEach(c => {
    box.innerHTML += `
      <div class="call-card">
        <b>${c.type}</b><br>
        ${c.address}<br>
        ${c.incidentStatus}<br>

        ${currentUser.role === "dispatch" ? `
          <button onclick="changeStatus(${c.id},'Fire Out')">Fire Out</button>
          <button onclick="changeStatus(${c.id},'Under Control')">Under Control</button>
          <button onclick="changeStatus(${c.id},'1st Alarm')">1st Alarm</button>
        ` : ""}
      </div>
    `;
  });
}

// HISTORY
function updateHistory() {
  const box = document.getElementById("historyList");
  box.innerHTML = history.map(h => `
    <div class="call-card" style="border-left:5px solid gray">
      <b>${h.type}</b><br>
      ${h.address}<br>
      ${h.incidentStatus}
    </div>
  `).join("");
}

// CHAT
function sendMessage() {
  chatLog.push({
    name: document.getElementById("chatName").value || "UNIT",
    msg: chatInput.value,
    time: new Date().toLocaleTimeString()
  });

  chatInput.value = "";
  saveData();
}

// MOBILE VIEW SWITCH
function setView(view) {

  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));

  if (view === "calls") callsPage.classList.add("active");
  if (view === "units") unitsPage.classList.add("active");
  if (view === "chat") chatPage.classList.add("active");
  if (view === "history") historyPage.classList.add("active");
}

// INIT
window.onload = () => {
  initMap();
  fetchData();
  setView("calls");
};
