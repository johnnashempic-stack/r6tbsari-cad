const BIN_ID = "6a36000ef5f4af5e29128246";
const API_KEY = "YOUR_KEY";
const URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

let role = null;
let calls = [];
let presence = {};
let map;
let started = false;

/* SAFE LOG */
function log(msg){
    console.log(msg);
}

/* BOOT CHECK (CRITICAL FIX) */
window.onload = () => {
    console.log("CAD LOADED OK");
};

/* LOGIN SYSTEM */
function adminLogin(){
    const pass = prompt("Dispatch Access Code:");

    if(pass === "IR6TBSARI"){
        role = "dispatcher";
        startSystem();
    } else {
        alert("ACCESS DENIED");
    }
}

function unitLogin(){
    role = "field";
    startSystem();
}

/* MAIN START (FIXED FLOW) */
function startSystem(){
    if(started) return;
    started = true;

    document.getElementById("startScreen").style.display = "none";
    document.getElementById("main").style.display = "block";

    if(role === "dispatcher"){
        document.getElementById("toolbar").style.display = "block";
    }

    setTimeout(initMap, 200);
    loadData();

    setInterval(loadData, 3000);
}

/* MAP FIX (IMPORTANT) */
function initMap(){
    if(map) return;

    map = L.map("map").setView([10.7202, 122.5621], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
    }).addTo(map);

    setTimeout(() => map.invalidateSize(), 300);
}

/* LOAD DATA (SAFE) */
async function loadData(){
    try{
        const res = await fetch(URL, {
            headers: { "X-Master-Key": API_KEY }
        });

        const data = await res.json();

        calls = data.record.calls || [];
        presence = data.record.presence || {};

        render();
    } catch(err){
        console.log("LOAD ERROR:", err);
    }
}

/* SAVE DATA */
async function saveData(){
    await fetch(URL, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-Master-Key": API_KEY
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
        status: "DISPATCHED"
    });

    saveData();
    render();
}

/* RESPOND */
function respond(id){
    let c = calls.find(x => x.id === id);
    if(!c) return;

    c.status = "RESPONDING";

    saveData();
    render();
}

/* RENDER UI */
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
