const BIN_ID = "6a36000ef5f4af5e29128246";
const KEY = "$2a$10$xqh.MDd939MiRTFQpJ4GJebf7kSrK5dnmT/a8E0DG9bFNqdLW5vzS";
const PASS = "IR6TB-018";

let role = "responder";

let calls = [];
let chat = [];
let units = [];
let history = [];

let lastCallId = null;

let map;
let markers = {};

/* LOGIN */
function login(){
  if(pass.value === PASS){
    role = "dispatch";
    dispatchUI.style.display = "block";
  }
}

/* SYNC */
async function sync(){

  try{

    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`,{
      headers:{ "X-Master-Key":KEY }
    });

    if(!res.ok) return;

    const data = await res.json();
    const r = data.record || {};

    calls = r.calls || [];
    chat = r.chat || [];
    units = r.units || [];

    if(calls.length && calls[0].id !== lastCallId){

      lastCallId = calls[0].id;

      document.getElementById("alarm")?.play();

      chat.unshift({
        user:"SYSTEM",
        role:"system",
        msg:`NEW INCIDENT: ${calls[0].type} | ${calls[0].address}`
      });

      save();
    }

    render();

  }catch(e){
    console.log("SYNC ERROR");
  }
}

setInterval(sync,3000);

/* SAVE */
function save(){
  fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`,{
    method:"PUT",
    headers:{
      "Content-Type":"application/json",
      "X-Master-Key":KEY
    },
    body:JSON.stringify({calls,chat,units,history})
  });
}

/* CALL */
function createCall(){

  if(role !== "dispatch") return;

  const c = {
    id: Date.now(),
    type: type.value,
    address: address.value,
    details: details.value,
    status: "ACTIVE"
  };

  calls.unshift(c);

  save();
}

/* CHAT */
function sendChat(msg){

  chat.unshift({
    user:"USER",
    role,
    msg
  });

  save();
}

/* UNITS */
function selectUnit(id){

  let u = units.find(x=>x.id===id);
  if(!u) return;

  if(u.takenBy && u.takenBy !== role) return;

  units.forEach(x=>{
    if(x.takenBy === role) x.takenBy = null;
  });

  u.takenBy = role;

  save();
}

/* RENDER */
function render(){
  renderCalls();
  renderChat();
  renderUnits();
  updateMap();
}

/* CALLS */
function renderCalls(){
  callsPanel.innerHTML = "";
  calls.forEach(c=>{
    callsPanel.innerHTML += `<div class="card"><b>${c.type}</b><br>${c.address}</div>`;
  });
}

/* CHAT */
function renderChat(){
  chatPanel.innerHTML = "";
  chat.forEach(m=>{
    chatPanel.innerHTML += `<div class="card"><b>${m.user}</b><br>${m.msg}</div>`;
  });
}

/* UNITS */
function renderUnits(){
  unitsPanel.innerHTML = "";
  units.forEach(u=>{
    unitsPanel.innerHTML += `
      <div class="card">
        <b>${u.name}</b><br>
        ${u.status}<br>
        ${!u.takenBy ? `<button onclick="selectUnit(${u.id})">TAKE</button>` : ""}
      </div>
    `;
  });
}

/* MAP */
function initMap(){
  map = L.map('map').setView([10.72,122.55],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

function updateMap(){

  units.forEach(u=>{

    if(!markers[u.id]){
      markers[u.id] = L.marker([u.lat,u.lng]).addTo(map);
    } else {
      markers[u.id].setLatLng([u.lat,u.lng]);
    }

  });
}

/* VIEW */
function view(v){

  callsPanel.style.display="none";
  unitsPanel.style.display="none";
  chatPanel.style.display="none";

  if(v==="calls") callsPanel.style.display="block";
  if(v==="units") unitsPanel.style.display="block";
  if(v==="chat") chatPanel.style.display="block";
}

/* INIT */
window.onload=()=>{
  view("calls");
  initMap();
  sync();
};
