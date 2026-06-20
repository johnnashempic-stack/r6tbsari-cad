const BIN_ID = "6a36000ef5f4af5e29128246";
const API_KEY = "YOUR_KEY";
const URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

let role = null;
let calls = [];
let presence = {};
let map;

/* BOOT */
function adminLogin(){
    const pass = prompt("Dispatch Code:");

    if(pass === "IR6TBSARI"){
        role = "dispatcher";
        startSystem();
        document.getElementById("toolbar").style.display = "block";
    } else {
        alert("DENIED");
    }
}

function unitLogin(){
    const unit = prompt("Enter Unit (RESCUE 1-5):");
    if(!unit) return;

    role = "field";

    if(!presence.activeUnits) presence.activeUnits = {};
    presence.activeUnits[unit] = true;

    startSystem();
}

/* START SYSTEM */
function startSystem(){
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("main").style.display = "block";

    initMap();
    loadData();

    setInterval(loadData, 3000);
}

/* MAP INIT (FIXED SIZE ISSUE) */
function initMap(){
    setTimeout(() => {
        map = L.map("map").setView([10.7202,122.5621],13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
            attribution:"© OpenStreetMap"
        }).addTo(map);

        map.invalidateSize();
    }, 200);
}

/* LOAD */
async function loadData(){
    try{
        const res = await fetch(URL,{
            headers:{ "X-Master-Key":API_KEY }
        });

        const data = await res.json();

        calls = data.record.calls || [];
        presence = data.record.presence || { activeUnits:{} };

        render();
    } catch(e){
        console.log("LOAD ERROR", e);
    }
}

/* SAVE */
async function saveData(){
    await fetch(URL,{
        method:"PUT",
        headers:{
            "Content-Type":"application/json",
            "X-Master-Key":API_KEY
        },
        body: JSON.stringify({
            calls,
            presence
        })
    });
}

/* CREATE CALL */
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

/* RESPOND */
function respond(id){
    let c = calls.find(x => x.id === id);
    if(!c) return;

    c.assignedUnit = "FIELD UNIT";
    c.status = "RESPONDING";

    saveData();
    render();
}

/* RENDER (NOW WORKING) */
function render(){
    const panel = document.getElementById("panel");

    panel.innerHTML = "<h3>ACTIVE CALLS</h3>";

    if(calls.length === 0){
        panel.innerHTML += "<p>No active calls</p>";
        return;
    }

    calls.forEach(c => {
        const div = document.createElement("div");
        div.style.border = "1px solid #ffaa00";
        div.style.margin = "10px";
        div.style.padding = "10px";
        div.style.background = "#1a1a1a";

        div.innerHTML = `
        <b>${c.type}</b><br>
        📍 ${c.location}<br>
        STATUS: ${c.status}<br><br>

        <button onclick="respond(${c.id})">RESPOND</button>
        `;

        panel.appendChild(div);
    });
}
