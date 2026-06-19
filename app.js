let map;
let units = [
  {id:1,name:"RESCUE 1",status:"available",panic:false,cooldown:0},
  {id:2,name:"RESCUE 2",status:"available",panic:false,cooldown:0},
  {id:3,name:"RESCUE 3",status:"available",panic:false,cooldown:0},
  {id:4,name:"RESCUE 4",status:"available",panic:false,cooldown:0},
  {id:5,name:"RESCUE 5",status:"available",panic:false,cooldown:0}
];

let incidents = [];
let messages = [];

function initMap(){
  map = L.map("map").setView([10.72,122.55],13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
}

function openUnitPanel(){
  document.getElementById("unitPanel").style.display="block";
  renderUnits();
}

function closeUnitPanel(){
  document.getElementById("unitPanel").style.display="none";
}

function openChat(){
  document.getElementById("chatPanel").style.display="block";
}

function closeChat(){
  document.getElementById("chatPanel").style.display="none";
}

function renderUnits(){
  document.getElementById("unitList").innerHTML =
  units.map(u=>`
    <div style="border:1px solid #333;padding:10px;margin:5px">
      <b>${u.name}</b><br>
      ${u.status}
      <select onchange="changeStatus(${u.id},this.value)">
        <option>available</option>
        <option>responding</option>
        <option>onscene</option>
        <option>busy</option>
      </select>
    </div>
  `).join("");
}

function changeStatus(id,status){
  let u = units.find(x=>x.id===id);
  if(u) u.status=status;
}

function sendMsg(){
  let sender=document.getElementById("sender").value;
  let msg=document.getElementById("msg").value;

  messages.push({sender,msg,time:new Date().toLocaleTimeString()});
  renderChat();
}

function renderChat(){
  document.getElementById("chatLog").innerHTML =
  messages.map(m=>`<div><b>${m.sender}</b>: ${m.msg}</div>`).join("");
}

/* 10 CODE */
function toggleCodes(){
  let box=document.getElementById("codeBox");
  box.style.display = box.style.display==="block"?"none":"block";

  box.innerHTML = `
    <div>10-4 Acknowledged</div>
    <div>10-17 En route</div>
    <div>10-20 Location</div>
    <div>10-23 Arrived</div>
    <div>10-50 Accident</div>
    <div>10-52 Medical</div>
    <div>10-70 Fire</div>
  `;
}

/* PANIC SYSTEM */
function panic(){
  let u = units.find(x=>x.name==="RESCUE 1"); // example unit

  if(u.cooldown > Date.now()){
    alert("Panic cooldown active");
    return;
  }

  let pos = map.getCenter();

  let marker = L.marker([pos.lat,pos.lng]).addTo(map)
  .bindPopup("🚨 PANIC ALERT: RESCUE UNIT");

  messages.push({
    sender:"SYSTEM",
    msg:"🚨 PANIC ALERT ACTIVATED",
    time:new Date().toLocaleTimeString()
  });

  u.cooldown = Date.now() + 300000; // 5 mins
  renderChat();
}

/* ACTIVE CALLS */
function addCall(type,desc,address){
  let call={
    type,
    desc,
    address,
    time:new Date().toLocaleTimeString(),
    status:"Active"
  };

  incidents.push(call);

  let marker = L.marker([10.72,122.55]).addTo(map)
  .bindPopup(type+"<br>"+address);
}

setInterval(()=>{
  document.getElementById("time").innerText =
  new Date().toLocaleTimeString();
},1000);

window.onload=()=>{
  initMap();
};
