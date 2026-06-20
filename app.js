let map;
let currentRole = "field";
let selectedUnit = null;

let incidents = [
    { id:1, type:"FIRE", location:"123 MAIN ST", status:"DISPATCHED", units:[], priority:"high" },
    { id:2, type:"MEDICAL", location:"456 OAK AVE", status:"ON SCENE", units:["A3"], priority:"medium" }
];

let units = [
    { name:"E1", status:"AVAILABLE" },
    { name:"L2", status:"AVAILABLE" },
    { name:"A3", status:"AVAILABLE" }
];

// ================= LOG =================
function log(msg){
    const el=document.getElementById("log");
    const t=new Date().toLocaleTimeString();
    el.innerHTML+=`[${t}] ${msg}<br>`;
    el.scrollTop=el.scrollHeight;
}

// ================= MAP =================
function initMap(){
    map=L.map("map").setView([45.78,-108.50],14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    render();
    log("CAD SYSTEM ONLINE");
}

// ================= RENDER =================
function render(){
    const side=document.getElementById("sidebar");
    side.innerHTML="<h3 style='color:#ffaa00'>ACTIVE CALLS</h3>";

    incidents.forEach(i=>{
        const div=document.createElement("div");
        div.className="incident-card"+(i.priority==="high"?" priority-high":"");

        div.innerHTML=`
        <b>#${i.id} ${i.type}</b><br>
        ${i.location}<br>
        STATUS: ${i.status}<br>
        UNITS: ${i.units.join(", ")||"NONE"}<br><br>

        <button onclick="setStatus(${i.id},'DISPATCHED')">DISPATCHED</button>
        <button onclick="setStatus(${i.id},'EN ROUTE')">EN ROUTE</button>
        <button onclick="setStatus(${i.id},'ON SCENE')">ON SCENE</button>
        <button onclick="setStatus(${i.id},'CLOSED')">CLOSE</button>
        <button onclick="assignUnit(${i.id})">ASSIGN UNIT</button>
        `;

        side.appendChild(div);
    });
}

// ================= INCIDENT CREATION =================
function createIncident(){
    const type=prompt("Type:");
    const location=prompt("Location:");
    const priority=prompt("Priority (high/medium/low):");

    if(!type||!location)return;

    const inc={
        id:incidents.length+1,
        type,
        location,
        status:"DISPATCHED",
        units:[],
        priority:priority||"medium"
    };

    incidents.unshift(inc);
    render();
    log(`NEW CALL CREATED: #${inc.id} ${type}`);
}

// ================= STATUS =================
function setStatus(id,status){
    const i=incidents.find(x=>x.id===id);
    if(!i)return;
    i.status=status;
    render();
    log(`CALL #${id} STATUS: ${status}`);
}

// ================= UNIT ASSIGN =================
function assignUnit(id){
    const unit=prompt("Assign Unit (E1, L2, A3):");
    const i=incidents.find(x=>x.id===id);
    if(!i||!unit)return;

    i.units.push(unit);
    render();
    log(`UNIT ${unit} ASSIGNED TO CALL #${id}`);
}

// ================= FIELD MODE =================
function enterFieldMode(){
    const unit=prompt("Select Unit (E1/L2/A3):");
    if(!unit){
        alert("Unit required");
        return;
    }

    selectedUnit=unit;
    document.getElementById("current-unit").textContent=unit;
    log(`FIELD MODE ACTIVE: ${unit}`);
}

// ================= STATUS UPDATE =================
function updateStatus(s){
    if(!selectedUnit){
        alert("Select unit first");
        return;
    }

    document.getElementById("unit-status").textContent=s;
    log(`UNIT ${selectedUnit}: ${s}`);
}

// ================= RADIO =================
function sendMessage(){
    const msg=prompt("RADIO:");
    if(msg)log(`RADIO: ${msg}`);
}

// ================= LOGIN =================
function showLogin(){document.getElementById("login-screen").style.display="flex";}
function cancelLogin(){document.getElementById("login-screen").style.display="none";}

function attemptLogin(){
    const u=document.getElementById("username").value;
    const p=document.getElementById("password").value;

    if(u==="admin"&&p==="dispatch123"){
        currentRole="dispatcher";
        document.getElementById("login-screen").style.display="none";
        document.getElementById("login-btn").style.display="none";
        document.getElementById("logout-btn").style.display="block";
        document.getElementById("role-indicator").textContent="DISPATCH ACTIVE";
        log("DISPATCH LOGIN SUCCESS");
    } else alert("INVALID");
}

function logout(){
    currentRole="field";
    selectedUnit=null;
    document.getElementById("current-unit").textContent="NONE";
    document.getElementById("login-btn").style.display="block";
    document.getElementById("logout-btn").style.display="none";
    document.getElementById("role-indicator").textContent="FIELD UNIT";
    log("LOGGED OUT");
}

window.onload=initMap;
