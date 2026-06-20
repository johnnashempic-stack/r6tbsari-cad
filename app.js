let map;
let role = "field";
let selectedUnit = null;
let calls = []; // CLEAN START

// ================= LOG =================
function log(msg){
    const el=document.getElementById("log");
    const t=new Date().toLocaleTimeString();
    el.innerHTML += `[${t}] ${msg}<br>`;
    el.scrollTop = el.scrollHeight;
}

// ================= MAP (ILOILO BASE) =================
function initMap(){
    map = L.map("map").setView([10.7202, 122.5621], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:"© OpenStreetMap"
    }).addTo(map);

    render();
    log("CAD ONLINE • ILOILO BASE ACTIVE");
}

// ================= RENDER =================
function render(){
    const side=document.getElementById("sidebar");
    side.innerHTML="<h3 style='color:#ffaa00'>ACTIVE CALLS</h3>";

    if(calls.length === 0){
        side.innerHTML += "<p>No active incidents</p>";
        return;
    }

    calls.forEach(c=>{
        const div=document.createElement("div");
        div.className="card"+(c.priority==="high"?" high":"");

        div.innerHTML=`
        <b>#${c.id} ${c.type}</b><br>
        📍 ${c.location}<br>
        STATUS: ${c.status}<br>
        UNIT: ${c.unit || "UNASSIGNED"}<br><br>

        <button onclick="setStatus(${c.id},'DISPATCHED')">DISPATCHED</button>
        <button onclick="setStatus(${c.id},'EN ROUTE')">EN ROUTE</button>
        <button onclick="setStatus(${c.id},'ON SCENE')">ON SCENE</button>
        <button onclick="closeCall(${c.id})">CLOSE</button>
        `;

        side.appendChild(div);
    });
}

// ================= CREATE CALL (DISPATCH ONLY) =================
function createCall(){
    if(role !== "dispatcher"){
        alert("DISPATCH ACCESS ONLY");
        return;
    }

    const type=prompt("CALL TYPE:");
    const location=prompt("LOCATION (ILOILO):");
    const priority=prompt("PRIORITY (high/medium/low):");

    if(!type || !location) return;

    calls.unshift({
        id:calls.length+1,
        type,
        location,
        priority:priority||"medium",
        status:"DISPATCHED",
        unit:null
    });

    render();
    log(`NEW CALL CREATED: #${calls.length} ${type}`);
}

// ================= STATUS CONTROL =================
function setStatus(id,status){
    const c=calls.find(x=>x.id===id);
    if(!c) return;

    c.status=status;
    render();
    log(`CALL #${id} → ${status}`);
}

// ================= CLOSE =================
function closeCall(id){
    calls=calls.filter(x=>x.id!==id);
    render();
    log(`CALL #${id} CLOSED`);
}

// ================= UNIT MENU =================
function openUnitMenu(){
    document.getElementById("unitScreen").style.display="flex";
}

function selectUnit(u){
    selectedUnit=u;
    document.getElementById("unitScreen").style.display="none";
    document.getElementById("roleText").innerText=`FIELD UNIT • ${u}`;
    log(`UNIT ASSIGNED: ${u}`);
}

// ================= FIELD STATUS =================
function updateStatus(s){
    if(!selectedUnit){
        alert("Select unit first");
        return;
    }

    log(`${selectedUnit} STATUS: ${s}`);
}

// ================= LOGIN =================
function openLogin(){
    document.getElementById("loginModal").style.display="flex";
}

function closeLogin(){
    document.getElementById("loginModal").style.display="none";
}

function login(){
    const u=document.getElementById("user").value;
    const p=document.getElementById("pass").value;

    if(u==="admin" && p==="dispatch123"){
        role="dispatcher";
        document.getElementById("loginModal").style.display="none";
        document.getElementById("loginBtn").style.display="none";
        document.getElementById("logoutBtn").style.display="block";
        document.getElementById("roleText").innerText="DISPATCH ACTIVE";
        log("DISPATCH LOGIN SUCCESS");
    } else {
        alert("INVALID");
    }
}

function logout(){
    role="field";
    selectedUnit=null;
    document.getElementById("loginBtn").style.display="block";
    document.getElementById("logoutBtn").style.display="none";
    document.getElementById("roleText").innerText="FIELD UNIT";
    log("LOGGED OUT");
}

// ================= INIT =================
window.onload=initMap;
