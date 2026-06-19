let map;

let messages = [];
let panicCooldown = {};

function initMap(){
  map = L.map("map").setView([10.72,122.55],13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
}

/* ================= CHAT ================= */

function openChat(){
  document.getElementById("unitChatPanel").style.display="block";
}

function closeChat(){
  document.getElementById("unitChatPanel").style.display="none";
}

function sendMsg(){
  let sender = document.getElementById("sender").value;
  let msg = document.getElementById("msg").value;

  if(!["RESCUE 1","RESCUE 2","RESCUE 3","RESCUE 4","RESCUE 5"].includes(sender)) return;

  messages.push({
    sender,
    msg,
    time:new Date().toLocaleTimeString()
  });

  renderChat();
}

function renderChat(){
  document.getElementById("chatLog").innerHTML =
  messages.map(m=>`<div><b>${m.sender}</b>: ${m.msg}</div>`).join("");
}

/* ================= 10 CODE ================= */

function toggleCodes(){
  let c = document.getElementById("codePanel");
  c.style.display = c.style.display==="block"?"none":"block";
}

function sendCode(code){
  messages.push({
    sender:"SYSTEM",
    msg:code,
    time:new Date().toLocaleTimeString()
  });

  renderChat();
}

/* ================= PANIC SYSTEM ================= */

function panicTrigger(){

  let unit = document.getElementById("sender").value;
  let now = Date.now();

  if(panicCooldown[unit] && panicCooldown[unit] > now){
    alert("PANIC COOLDOWN ACTIVE (5 MIN)");
    return;
  }

  panicCooldown[unit] = now + 300000;

  // SOUND
  document.getElementById("panicSound").play();

  // MAP MARKER
  let pos = map.getCenter();

  L.marker([pos.lat,pos.lng])
    .addTo(map)
    .bindPopup("🚨 PANIC: " + unit)
    .openPopup();

  // CHAT LOG
  messages.push({
    sender:"SYSTEM",
    msg:"🚨 PANIC ALERT FROM " + unit,
    time:new Date().toLocaleTimeString()
  });

  renderChat();
}

/* ================= CLOCK ================= */

setInterval(()=>{
  document.getElementById("time").innerText =
  new Date().toLocaleTimeString();
},1000);

window.onload = ()=>{
  initMap();
};
