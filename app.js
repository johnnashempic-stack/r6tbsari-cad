const BIN_ID = "6a36000ef5f4af5e29128246";
const API_KEY = "$2a$10$xqh.MDd939MiRTFQpJ4GJebf7kSrK5dnmT/a8E0DG9bFNqdLW5vzS";
const URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

let map;
let role = "field";
let selectedUnit = null;
let calls = [];

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

/* MAP (ILOILO) */
function initMap(){
    map = L.map("map").setView([10.7202,122.5621],13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
        attribution:"© OpenStreetMap"
    }).addTo(map);

    setTimeout(()=>map.invalidateSize(),200);
}

/* UNIT SELECT + PASSWORD */
function selectUnit(unit){
    const pass = prompt("Dispatch Access Code:");

    if(pass !== "IR6TBSARI"){
        alert("ACCESS DENIED");
        return;
    }

    selectedUnit = unit;

    document.getElementById("unitScreen").style.display="none";
    document.getElementById("main").style.display="flex";
    document.getElementById("toolbar").style.display="flex";

    document.getElementById("roleText").innerText = unit;

    initMap();
    loadData();
    render();

    log(`UNIT ONLINE: ${unit}`);
}

/* CREATE CALL (DISPATCH ONLY OPTIONAL) */
function createCall(){
    let type = prompt("CALL TYPE:");
    let loc = prompt("LOCATION:");

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

    log(`${selectedUnit} RESPONDING #${id}`);
}

/* STATUS */
function setStatus(status){
    if(!selectedUnit) return alert("No unit");

    log(`${selectedUnit} → ${status}`);
}

/* END INCIDENT */
function endIncident(id){
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
        <button onclick="setStatus('ON SCENE')">ON SCENE</button>
        <button onclick="endIncident(${c.id})">END</button>
        `;

        s.appendChild(div);
    });
}
