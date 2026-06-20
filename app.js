const BIN_ID = "YOUR_BIN_ID";
const KEY = "YOUR_KEY";
const ADMIN_PASS = "IR6TB-018";

let role = "responder";

let calls = [];
let chat = [];
let units = [];
let history = [];

let lastCall = null;
let map;
let markers = {};

let currentUser = {
  id: "u"+Math.random().toString(16).slice(2),
  name:"Responder",
  role:"responder"
};

/* ---------------- SYNC ---------------- */
async function sync(){

  let r = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`,{
    headers:{ "X-Master-Key":KEY }
  });

  if(!r.ok) return;

  let d = await r.json();
  let data = d.record;

  calls = data.calls || [];
  chat = data.chat || [];
  units = data.units || [];

  if(lastCall !== calls[0]?.id){
    lastCall = calls[0]?.id;
    document.getElementById("alarm").play();
  }

  renderCalls();
  renderChat();
  renderUnits();
  updateMap();
}

setInterval(sync,3000);

/* ---------------- SAVE ---------------- */
function save(){

  fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`,{
    method:"PUT",
    headers:{
      "Content-Type":"application/json",
      "X-Master-Key":KEY
    },
    body: JSON.stringify({calls,chat,units,history})
  });
}

/* ---------------- LOGIN ---------------- */
function login(){
  if(pass.value === ADMIN_PASS){
    role = "dispatch";
    dispatchUI.style.display="block";
  }
}

/* ---------------- CALL ---------------- */
function createCall(){

  if(role!=="dispatch") return;

  let c = {
    id:Date.now(),
    type:type.value,
    address:address.value,
    details:details.value,
    status:"ACTIVE"
  };

  calls.unshift(c);

  chat.unshift({
    user:"SYSTEM",
    role:"system",
    msg:`NEW INCIDENT: ${c.type} | ${c.address}`
  });

  save();
}

/* ---------------- CHAT ---------------- */
function send(msg){

  chat.unshift({
    user:currentUser.name,
    role:role,
    msg
  });

  save();
}

function renderChat(){

  chatPanel.innerHTML="";

  chat.forEach(m=>{
    chatPanel.innerHTML += `<div class="card">
      <b>${m.user}</b> (${m.role})<br>${m.msg}
    </div>`;
  });
}

/* ---------------- CALLS ---------------- */
function renderCalls(){

  callsPanel.innerHTML="";

  calls.forEach(c=>{
    callsPanel.innerHTML += `<div class="card">
      <b>${c.type}</b><br>
      ${c.address}<br>
      ${c.status}
    </div>`;
  });
}

/* ---------------- UNITS ---------------- */
function selectUnit(id){

  let u = units.find(x=>x.id===id);
  if(!u) return;

  if(u.takenBy && u.takenBy!==currentUser.id) return;

  units.forEach(x=>{
    if(x.takenBy===currentUser.id) x.takenBy=null;
  });

  u.takenBy=currentUser.id;
  save();
}

function renderUnits(){

  unitsPanel.innerHTML="";

  units.forEach(u=>{

    if(u.takenBy && u.takenBy!==currentUser.id) return;

    let btn="";

    if(!u.takenBy){
      btn=`<button onclick="selectUnit(${u.id})">TAKE</button>`;
    }

    unitsPanel.innerHTML += `<div class="card">
      <b>${u.name}</b><br>${u.status}<br>${btn}
    </div>`;
  });
}

/* ---------------- MAP ---------------- */
function initMap(){
  map = L.map('map').setView([10.72,122.55],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

function updateMap(){

  units.forEach(u=>{

    if(!u.lat){ u.lat=10.72; u.lng=122.55; }

    if(!markers[u.id]){
      markers[u.id]=L.marker([u.lat,u.lng]).addTo(map);
    }else{
      markers[u.id].setLatLng([u.lat,u.lng]);
    }

  });
}

/* ---------------- VIEW ---------------- */
function view(v){

  callsPanel.style.display="none";
  unitsPanel.style.display="none";
  chatPanel.style.display="none";

  if(v==="calls") callsPanel.style.display="block";
  if(v==="units") unitsPanel.style.display="block";
  if(v==="chat") chatPanel.style.display="block";
}

/* ---------------- INIT ---------------- */
window.onload=()=>{
  view("calls");
  initMap();
  sync();
};
