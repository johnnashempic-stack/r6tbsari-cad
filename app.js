const BIN_ID = "6a35088cf5f4af5e290dfd57";
const MASTER_KEY = "$2a$10$9tAozl0KM.tjp5SiZrLhr.pLYpLlnk1p5Veo/I1t9Rlj1y6IBCL2q";

let map;
let isAdmin = false;
const ADMIN_PASSWORD = "IR6TB-018";

let incidents = [];
let units = [
  {id:1,name:"RESCUE 1",status:"available"},
  {id:2,name:"RESCUE 2",status:"available"},
  {id:3,name:"RESCUE 3",status:"available"},
  {id:4,name:"RESCUE 4",status:"available"},
  {id:5,name:"RESCUE 5",status:"available"}
];

// FETCH
async function fetchData(){
  try{
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`,{
      headers:{"X-Master-Key":MASTER_KEY}
    });

    const data = await res.json();
    incidents = data.record.incidents || [];
    units = data.record.units || units;

    updateUI();
  }catch(e){}
}

// SAVE
async function saveData(){
  try{
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`,{
      method:"PUT",
      headers:{
        "Content-Type":"application/json",
        "X-Master-Key":MASTER_KEY
      },
      body:JSON.stringify({incidents,units})
    });
  }catch(e){}
}

// MAP
function initMap(){
  map = L.map('map').setView([10.72,122.55],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

// ADMIN
function loginAdmin(){
  const pass = prompt("Password:");
  if(pass===ADMIN_PASSWORD){
    isAdmin=true;
    document.getElementById("adminPanel").style.display="block";
  }
}

// ALERT
function sendAlert(){
  if(!isAdmin) return;

  const inc = {
    id:Date.now().toString(),
    type:document.getElementById("callType").value,
    address:document.getElementById("address").value,
    details:document.getElementById("details").value,
    status:"1st Alarm",
    responders:[]
  };

  incidents.unshift(inc);
  saveData();
  updateUI();
}

// UNIT STATUS
function changeUnitStatus(id,status){
  const u = units.find(x=>x.id===id);
  if(u) u.status=status;

  saveData();
  updateUI();
}

// OPEN UNIT PANEL
function openUnitPanel(){
  document.getElementById("unitPanel").style.display="block";
  renderUnitPanel();
}

// CLOSE
function closeUnitPanel(){
  document.getElementById("unitPanel").style.display="none";
}

// RENDER UNIT PANEL
function renderUnitPanel(){
  const box=document.getElementById("unitPanelList");

  box.innerHTML=units.map(u=>`
    <div style="background:#1f1f24;padding:12px;margin:10px 0;display:flex;justify-content:space-between;">
      <div>
        <strong>${u.name}</strong><br>
        <small>${u.status}</small>
      </div>

      <select onchange="changeUnitStatus(${u.id},this.value)">
        <option value="available" ${u.status==="available"?"selected":""}>AVAILABLE</option>
        <option value="responding" ${u.status==="responding"?"selected":""}>RESPONDING</option>
        <option value="onscene" ${u.status==="onscene"?"selected":""}>ON SCENE</option>
        <option value="busy" ${u.status==="busy"?"selected":""}>BUSY</option>
      </select>
    </div>
  `).join("");
}

// UI
function updateUI(){

  document.getElementById("activeIncidents").innerHTML =
    incidents.map(i=>`
      <div class="box">
        <strong>${i.type}</strong><br>
        ${i.address}
      </div>
    `).join("") || "<em>No calls</em>";

  document.getElementById("availableCount").textContent =
    units.filter(u=>u.status==="available").length;

  if(document.getElementById("unitPanel").style.display==="block"){
    renderUnitPanel();
  }
}

// CLOCK
setInterval(()=>{
  document.getElementById("time").textContent=
    new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
},1000);

window.onload=()=>{
  initMap();
  fetchData();
  updateUI();
};
