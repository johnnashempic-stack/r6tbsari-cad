let map;
let logged = false;
let messages = {};
let cooldown = {};

function init(){
  map = L.map("map").setView([10.72,122.55],13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  setInterval(()=>{
    document.getElementById("time").innerText =
    new Date().toLocaleTimeString();
  },1000);
}

function login(){
  if(document.getElementById("pass").value==="IR6TB-018"){
    logged=true;
    alert("ADMIN LOGGED IN");
  }
}

function dispatch(){
  if(!logged) return;

  let type=document.getElementById("type").value;
  let loc=document.getElementById("loc").value;

  document.getElementById("calls").innerHTML +=
  `<div>${type} - ${loc}</div>`;

  L.marker(map.getCenter())
    .addTo(map)
    .bindPopup(type+"<br>"+loc);
}

/* CHAT */
function openChat(){
  document.getElementById("chatPanel").style.display="block";
}

function closeChat(){
  document.getElementById("chatPanel").style.display="none";
}

function sendMsg(){
  let u=document.getElementById("unit").value;
  let m=document.getElementById("msg").value;

  messages[u]=(messages[u]||[]).concat(m);

  document.getElementById("log").innerHTML +=
  `<div><b>${u}</b>: ${m}</div>`;
}

/* 10 CODE */
function toggleCodes(){
  let c=document.getElementById("codes");
  c.style.display=c.style.display==="block"?"none":"block";
}

function code(c){
  document.getElementById("log").innerHTML +=
  `<div>SYSTEM: ${c}</div>`;
}

/* PANIC */
function panic(){
  let u=document.getElementById("unit").value;

  if(cooldown[u] && cooldown[u]>Date.now()){
    alert("COOLDOWN ACTIVE");
    return;
  }

  cooldown[u]=Date.now()+300000;

  document.getElementById("alarm").play();

  let pos=map.getCenter();

  L.marker([pos.lat,pos.lng])
    .addTo(map)
    .bindPopup("🚨 PANIC "+u)
    .openPopup();

  document.getElementById("log").innerHTML +=
  `<div style="color:red">PANIC: ${u}</div>`;
}

window.onload=init;
