const BIN_ID = "6a35088cf5f4af5e290dfd57";
const MASTER_KEY = "$2a$10$9tAozl0KM.tjp5SiZrLhr.pLYpLlnk1p5Veo/I1t9Rlj1y6IBCL2q";

let incidents = [];
let units = [
  {name:"RESCUE 1", status:"available"},
  {name:"RESCUE 2", status:"available"},
  {name:"RESCUE 3", status:"available"},
  {name:"RESCUE 4", status:"available"},
  {name:"RESCUE 5", status:"available"}
];

let map;
let selected = null;

function toggleChat(){
  let p = document.getElementById("chatPanel");
  p.style.display = p.style.display === "block" ? "none" : "block";
}

function sendMsg(){
  let u = document.getElementById("chatUnit").value;
  let m = document.getElementById("msg").value;
  if(!m) return;

  document.getElementById("log").innerHTML += `<div><b>${u}</b>: ${m}</div>`;
  document.getElementById("msg").value = "";
}

function openIncident(id){
  selected = incidents.find(i => i.id === id);
  if(!selected) return;

  document.getElementById("incidentPanel").style.display = "block";

  document.getElementById("incTime").innerText = selected.time;
  document.getElementById("incAddress").innerText = selected.address;
  document.getElementById("incDesc").innerText = selected.details || "";

  renderIncident();
}

function renderIncident(){
  if(!selected) return;

  document.getElementById("respList").innerHTML =
    (selected.responding || []).map(u => `<div>${u}</div>`).join("");

  document.getElementById("sceneList").innerHTML =
    (selected.scene || []).map(u => `<div>${u}</div>`).join("");
}

function closeIncident(){
  document.getElementById("incidentPanel").style.display = "none";
  selected = null;
}

function attachUnit(unitName){
  let u = units.find(x => x.name === unitName);
  if(!u || !selected) return;

  u.status = "responding";

  if(!selected.responding) selected.responding = [];
  selected.responding.push(unitName);

  saveData();
}

function setOnScene(unitName){
  let u = units.find(x => x.name === unitName);
  if(!u || !selected) return;

  u.status = "onscene";

  selected.responding = (selected.responding || []).filter(x => x !== unitName);

  if(!selected.scene) selected.scene = [];
  selected.scene.push(unitName);

  saveData();
}

function updateUI(){
  document.getElementById("activeIncidents").innerHTML =
    incidents.map(i => `
      <div onclick="openIncident('${i.id}')"
        style="border:1px solid #444; padding:5px; margin:5px; cursor:pointer;">
        <b>${i.type}</b><br>
        ${i.address}<br>
        ${i.time}
      </div>
    `).join("");

  let avail = units.filter(u => u.status === "available").length;
  let resp = units.filter(u => u.status === "responding").length;

  document.getElementById("avail").innerText = avail;
  document.getElementById("resp").innerText = resp;
}

function saveData(){
  fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method:"PUT",
    headers:{
      "Content-Type":"application/json",
      "X-Master-Key":MASTER_KEY
    },
    body: JSON.stringify({incidents, units})
  });
}

function fetchData(){
  fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    headers:{ "X-Master-Key": MASTER_KEY }
  })
  .then(r=>r.json())
  .then(d=>{
    incidents = d.record.incidents || [];
    units = d.record.units || units;
    updateUI();
    renderIncident();
  });
}

function initMap(){
  map = L.map('map').setView([10.72,122.55], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

setInterval(fetchData, 4000);

window.onload = () => {
  initMap();
  fetchData();
};
