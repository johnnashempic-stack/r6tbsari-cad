const BIN_ID = "6a36000ef5f4af5e29128246";
const MASTER_KEY = "$2a$10$xqh.MDd939MiRTFQpJ4GJebf7kSrK5dnmT/a8E0DG9bFNqdLW5vzS";
const ADMIN_PASSWORD = "IR6TB-018";

let map;

let incidents = [];
let history = [];
let units = [];
let chatLog = [];

let currentUser = { role: "responder", name: "" };

function isDispatch() {
  return currentUser.role === "dispatch";
}

/* STATUS PER TYPE */
const STATUS_BY_TYPE = {
  "🔥 Structure Fire": [
    "FOA",
    "1st Alarm",
    "2nd Alarm",
    "Under Control",
    "Fire Out"
  ],
  "🚑 Medical": [
    "Stable",
    "Serious",
    "Critical",
    "Transporting"
  ],
  "🛟 Rescue": [
    "Search",
    "Extraction",
    "Complete"
  ],
  "🚗 MVA": [
    "Minor",
    "Severe",
    "Entrapment",
    "Road Cleared"
  ]
};

/* MAP */
function initMap() {
  map = L.map('map').setView([10.72, 122.55], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

/* FETCH */
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

/* SAVE */
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

/* LOGIN */
function adminLogin() {
  if (adminPass.value === ADMIN_PASSWORD) {
    currentUser.role = "dispatch";
    adminBox.style.display = "none";
    dispatchControls.style.display = "block";
  }
}

function logoutAdmin() {
  currentUser.role = "responder";
  adminBox.style.display = "block";
  dispatchControls.style.display = "none";
}

/* NEW CALL */
function newCall() {
  if (!isDispatch()) return;

  incidents.unshift({
    id: Date.now(),
    type: callType.value,
    address: address.value,
    details: details.value,
    incidentStatus: "ACTIVE"
  });

  saveData();
}

/* STATUS */
function setStatus(id, status) {
  if (!isDispatch()) return;

  const call = incidents.find(c => c.id === id);
  if (!call) return;

  call.incidentStatus = status;

  if (status === "Fire Out" || status === "Road Cleared" || status === "Complete") {
    history.unshift(call);
    incidents = incidents.filter(c => c.id !== id);
  }

  saveData();
}

/* UI */
function updateUI() {
  const box = document.getElementById("activeIncidents");
  box.innerHTML = "";

  incidents.forEach(c => {

    const buttons = (STATUS_BY_TYPE[c.type] || [])
      .map(s => `<button onclick="setStatus(${c.id},'${s}')">${s}</button>`)
      .join("");

    box.innerHTML += `
      <div class="call-card">
        <b>${c.type}</b><br>
        ${c.address}<br>
        ${c.incidentStatus}<br><br>
        ${isDispatch() ? buttons : ""}
      </div>
    `;
  });
}

/* HISTORY */
function updateHistory() {
  const box = document.getElementById("historyList");
  box.innerHTML = history.map(h => `
    <div class="call-card">
      <b>${h.type}</b><br>
      ${h.address}<br>
      ${h.incidentStatus}
    </div>
  `).join("");
}

/* CHAT */
function sendMessage() {
  chatLog.push({
    name: chatName.value || "UNIT",
    msg: chatInput.value,
    time: new Date().toLocaleTimeString()
  });

  chatInput.value = "";
  saveData();
}

/* VIEW SWITCH */
function setView(v) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.getElementById(v + "Page").classList.add("active");
}

/* INIT */
window.onload = () => {
  initMap();
  fetchData();
  setView("calls");
};
