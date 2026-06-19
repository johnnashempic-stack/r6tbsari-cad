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

let isAdmin = false;
let selected = null;

/* ADMIN */
function adminLogin(){
  const pass = document.getElementById("adminPass").value;

  if(pass === "IR6TB-018"){
    isAdmin = true;
    document.getElementById("adminBox").style.display="none";
    document.getElementById("dispatchControls").style.display="block";
  } else alert("DENIED");
}

function logoutAdmin(){
  isAdmin = false;
  document.getElementById("adminBox").style.display="block";
  document.getElementById("dispatchControls").style.display="none";
}

/* UNIT PANEL */
function toggleUnits(){
  let p = document.getElementById("unitsPanel");
  p.style.display = p.style.display === "block" ? "none" : "block";
}

function toggleChat(){
  let p = document.getElementById("chatPanel");
  p.style.display = p.style.display === "block" ? "none" : "block";
}

function setStatus(s){
  let u = units.find(x=>x.name===document.getElementById("unitSelect").value);
  if(u){
    u.status = s;
    saveData();
    updateUI();
  }
}

/* CHAT */
function sendMsg(){
  let u = document.getElementById("chatUnit").value;
  let m = document.getElementById("msg").value;
  if(!m) return;
  document.getElementById("log").innerHTML += `<div><b>${u}</b>: ${m}</div>`;
}

/* CALL SYSTEM */
function newCall(){
  if(!isAdmin) return alert("Admin only");

  incidents.unshift({
    id:Date.now().toString(),
    type:"Incident",
    address:"Unknown",
    time:new Date().toLocaleString(),
    responding:[]
  });

  saveData();
  updateUI();
}

function openIncident(id){
  selected = incidents.find(i=>i.id===id);
  document.getElementById("incidentPanel").style.display="block";

  document.getElementById("incTime").innerText=selected.time;
  document.getElementById("incAddress").innerText=selected.address;
}

function closeIncident(){
  document.getElementById("incidentPanel").style.display="none";
}

/* ATTACH */
function toggleAttach(id){
  let inc = incidents.find(i=>i.id===id);
  let unit = document.getElementById("unitSelect").value;

  if(!inc.responding) inc.responding=[];

  if(inc.responding.includes(unit)){
    inc.responding = inc.responding.filter(x=>x!==unit);
    units.find(u=>u.name===unit).status="available";
  } else {
    inc.responding.push(unit);
    units.find(u=>u.name===unit).status="responding";
  }

  saveData();
  updateUI();
}

/* UI */
function updateUI(){
  document.getElementById("activeIncidents").innerHTML =
    incidents.map(i=>`
      <div style="border:1px solid #444; padding:8px; margin:5px;">
        <b onclick="openIncident('${i.id}')">${i.type}</b><br>
        ${i.address}<br>
        <button onclick="toggleAttach('${i.id}')">ATTACH / LEAVE</button>
      </div>
    `).join("");

  document.getElementById("avail").innerText =
    units.filter(u=>u.status==="available").length;

  document.getElementById("resp").innerText =
    units.filter(u=>u.status==="responding").length;
}

/* SYNC */
function saveData(){
  fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`,{
    method:"PUT",
    headers:{
      "Content-Type":"application/json",
      "X-Master-Key":MASTER_KEY
    },
    body:JSON.stringify({incidents,units})
  });
}

function fetchData(){
  fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`,{
    headers:{"X-Master-Key":MASTER_KEY}
  })
  .then(r=>r.json())
  .then(d=>{
    incidents=d.record.incidents||[];
    units=d.record.units||units;
    updateUI();
  });
}

setInterval(fetchData,3000);
window.onload=fetchData;
