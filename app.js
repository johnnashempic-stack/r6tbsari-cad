let map;
let selectedUnit = null;
let role = "field";
let calls = []; // FRESH START

function log(msg){
    const el=document.getElementById("log");
    const t=new Date().toLocaleTimeString();
    el.innerHTML += `[${t}] ${msg}<br>`;
    el.scrollTop = el.scrollHeight;
}

/* INIT MAP (ILOILO) */
function initMap(){
    map = L.map("map").setView([10.7202, 122.5621], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:"© OpenStreetMap"
    }).addTo(map);
}

/* START AFTER UNIT SELECT */
function selectUnit(unit){
    selectedUnit = unit;

    document.getElementById("unitScreen").style.display = "none";
    document.getElementById("main").style.display = "flex";
    document.getElementById("toolbar").style.display = "flex";
    document.getElementById("roleText").innerText = unit;

    initMap();
    render();

    log(`UNIT LOADED: ${unit}`);
}

/* DISPATCH ONLY CALL CREATION */
function createCall(){
    if(role !== "dispatcher"){
        alert("DISPATCH ONLY");
        return;
    }

    let type = prompt("CALL TYPE:");
    let location = prompt("LOCATION (ILOILO):");

    if(!type || !location) return;

    calls.unshift({
        id: calls.length + 1,
        type,
        location,
        status:"DISPATCHED",
        unit:null
    });

    render();
    log(`NEW CALL: ${type}`);
}

/* STATUS */
function setStatus(status){
    if(!selectedUnit){
        alert("No unit selected");
        return;
    }

    log(`${selectedUnit} → ${status}`);
}

/* RENDER CALLS */
function render(){
    const side=document.getElementById("sidebar");
    side.innerHTML="<h3>ACTIVE CALLS</h3>";

    if(calls.length === 0){
        side.innerHTML += "<p>No active calls</p>";
        return;
    }

    calls.forEach(c=>{
        let div=document.createElement("div");
        div.className="card";

        div.innerHTML=`
        <b>#${c.id} ${c.type}</b><br>
        ${c.location}<br>
        STATUS: ${c.status}
        `;

        side.appendChild(div);
    });
}
