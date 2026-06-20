const BIN_ID = "6a36000ef5f4af5e29128246";
const API_KEY = "YOUR_KEY";
const URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

let map;
let calls = [];
let role = "field";
let selectedUnit = null;

/* LOG */
function log(msg){
    const el=document.getElementById("log");
    const t=new Date().toLocaleTimeString();
    el.innerHTML += `[${t}] ${msg}<br>`;
    el.scrollTop = el.scrollHeight;
}

/* LOAD */
async function loadData(){
    const res = await fetch(URL,{
        headers: {"X-Master-Key":API_KEY}
    });

    const data = await res.json();
    calls = data.record.calls || [];
    render();
}

/* SAVE */
async function saveData(){
    await fetch(URL,{
        method:"PUT",
        headers:{
            "Content-Type":"application/json",
            "X-Master-Key":API_KEY
        },
        body: JSON.stringify({ calls })
    });
}

/* MAP ILOILO */
function initMap(){
    map = L.map("map").setView([10.7202,122.5621],13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
        attribution:"© OpenStreetMap"
    }).addTo(map);

    setTimeout(()=>map.invalidateSize(),200);
}

/* UNIT SELECT (NO PASSWORD) */
function selectUnit(unit){
    selectedUnit = unit;

    document.getElementById("unitScreen").style.display="none";
    document.getElementById("main").style.display="flex";
    document.getElementById("toolbar").style.display="flex";

    document.getElementById("roleText").innerText = unit;

    initMap();
    loadData();

    log(`UNIT ONLINE: ${unit}`);
}

/* DISPATCH LOGIN ONLY */
function dispatchLogin(){
    const pass = prompt("Dispatch Access Code:");

    if(pass === "IR6TBSARI"){
        role = "dispatcher";
        alert("DISPATCH MODE ENABLED");
        log("Dispatcher logged in");
    } else {
        alert("ACCESS DENIED");
    }
}

/* CREATE CALL (DISPATCH ONLY) */
function createCall(){
    if(role !== "dispatcher"){
        alert("DISPATCH ONLY");
        return;
    }

    const type = prompt("CALL TYPE:");
    const loc = prompt("LOCATION:");

    if(!type || !loc) return;

    calls.unshift({
        id: Date.now(),
        type,
        location: loc,
        status: "DISPATCHED",
        assignedUnit: null
    });

    saveData();
    render();
}

/* FIELD RESPOND */
function respond(id){
    let c = calls.find(x=>x.id===id);
    if(!c) return;

    c.assignedUnit = selectedUnit;
    c.status = "RESPONDING";

    saveData();
    render();

    log(`${selectedUnit} RESPONDING`);
}

/* STATUS */
function setStatus(status){
    if(!selectedUnit) return;

    log(`${selectedUnit} → ${status}`);
}

/* END INCIDENT */
function endIncident(id){
    if(role !== "dispatcher"){
        alert("DISPATCH ONLY");
        return;
    }

    calls = calls.filter(c=>c.id!==id);

    saveData();
    render();

    log(`INCIDENT CLOSED #${id}`);
}

/* RENDER */
function render(){
    const s=document.getElementById("sidebar");
    s.innerHTML="<h3>ACTIVE CALLS</h3>";

    if(calls.length===0){
        s.innerHTML+="No calls";
        return;
    }

    calls.forEach(c=>{
        let div=document.createElement("div");
        div.style.border="2px solid #ffaa00";
        div.style.margin="10px";
        div.style.padding="10px";
        div.style.background="#1a1a1a";

        div.innerHTML=`
        <b>#${c.id} ${c.type}</b><br>
        📍 ${c.location}<br>
        STATUS: ${c.status}<br>
        UNIT: ${c.assignedUnit || "NONE"}<br><br>

        <button onclick="respond(${c.id})">RESPOND</button>
        <button onclick="endIncident(${c.id})">END</button>
        `;

        s.appendChild(div);
    });
}

/* SYNC */
setInterval(loadData,3000);
