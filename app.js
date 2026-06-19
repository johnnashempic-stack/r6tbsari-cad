const BIN_ID = "6a35088cf5f4af5e290dfd57";
const MASTER_KEY = "$2a$10$9tAozl0KM.tjp5SiZrLhr.pLYpLlnk1p5Veo/I1t9Rlj1y6IBCL2q";

let map;
let isAdmin = false;
const ADMIN_PASSWORD = "IR6TB-018";

let incidents = [];
let currentIncidentId = null;

let units = [
  {id:1, name:"RESCUE 1", status:"available"},
  {id:2, name:"RESCUE 2", status:"available"},
  {id:3, name:"RESCUE 3", status:"available"},
  {id:4, name:"RESCUE 4", status:"available"},
  {id:5, name:"RESCUE 5", status:"available"}
];

// FETCH
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
  } catch {}
}

// SAVE
async function saveData() {
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method:"PUT",
      headers:{
        "Content-Type":"application/json",
        "X-Master-Key":MASTER_KEY
      },
      body: JSON.stringify({ incidents, units })
    });
  } catch {}
}

setInterval(fetchData, 4000);

// MAP
function initMap() {
  map = L.map('map').setView([10.72,122.55],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

// SIREN
function playSiren() {
  const a = document.getElementById("alarmSound");
  a.currentTime = 0;
  a.play().catch(()=>{});
}

// ADMIN
function loginAdmin() {
  const pass = prompt("Enter Admin Password:");
  if(pass === ADMIN_PASSWORD){
    isAdmin = true;
    document.getElementById("adminPanel").style.display="block";
  }
}

// ALERT
function sendAlert() {
  if(!isAdmin) return;

  playSiren();

  const inc = {
    id: Date.now().toString(),
    type: document.getElementById("callType").value,
    address: document.getElementById("address").value,
    details: document.getElementById("details").value,
    status:"1st Alarm",
    responders:[]
  };

  incidents.unshift(inc);
  currentIncidentId = inc.id;

  saveData();
  updateUI();
}

// UNIT STATUS CHANGE
function changeUnitStatus(id, status) {
  const u = units.find(x => x.id === id);
  if(!u) return;

  u.status = status;
  saveData();
  updateUI();
}

// UNIT PANEL OPEN
function openUnitPanel() {
  document.getElementById("unitPanel").style.display="block";
  renderUnitPanel();
}

// CLOSE
function closeUnitPanel() {
  document.getElementById("unitPanel").style.display="none";
}

// UNIT PANEL RENDER
function renderUnitPanel() {
  const box = document.getElementById("unitPanelList");

  box.innerHTML = units.map(u => `
    <div style="background:#1f1f24;padding:12px;margin:10px 0;border:1px solid #333;display:flex;justify-content:space-between;">
      <div>
        <strong>${u.name}</strong><br>
        <small>${u.status}</small>
      </div>

      <select onchange="changeUnitStatus(${u.id}, this.value)">
        <option value="available" ${u.status==="available"?"selected":""}>AVAILABLE</option>
        <option value="responding" ${u.status==="responding"?"selected":""}>RESPONDING</option>
        <option value="onscene" ${u.status==="onscene"?"selected":""}>ON SCENE</option>
        <option value="busy" ${u.status==="busy"?"selected":""}>BUSY</option>
      </select>
    </div>
  `).join("");
}

// UI
function updateUI() {

  document.getElementById("activeIncidents").innerHTML =
    incidents.map(i=>`
      <div class="box">
        <strong>${i.type}</strong><br>
        ${i.address}<br>
        <small>${i.status}</small>
      </div>
    `).join("") || "<em>No calls</em>";

  document.getElementById("unitList").innerHTML =
    units.map(u=>`
      <div style="margin:5px 0;padding:8px;background:#111;">
        ${u.name}
        <select onchange="changeUnitStatus(${u.id},this.value)">
          <option value="available" ${u.status==="available"?"selected":""}>A</option>
          <option value="responding" ${u.status==="responding"?"selected":""}>R</option>
          <option value="onscene" ${u.status==="onscene"?"selected":""}>S</option>
          <option value="busy" ${u.status==="busy"?"selected":""}>B</option>
        </select>
      </div>
    `).join("");

  const available = units.filter(u=>u.status==="available").length;
  document.getElementById("availableCount").textContent = available;

  if(document.getElementById("unitPanel").style.display==="block"){
    renderUnitPanel();
  }
}

// CLOCK
setInterval(()=>{
  document.getElementById("time").textContent =
    new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
},1000);

// START
window.onload = ()=>{
  initMap();
  fetchData();
  updateUI();
};
