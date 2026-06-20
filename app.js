// ================== NEW BIN CONFIG ==================
const BIN_ID = "6a36000ef5f4af5e29128246";
const MASTER_KEY = "$2a$10$9tAozl0KM.tjp5SiZrLhr.pLYpLlnk1p5Veo/I1t9Rlj1y6IBCL2q";

let map, marker;
let isAdmin = false;
const ADMIN_PASSWORD = "IR6TB-018";

let incidents = [];
let currentIncidentId = null;
let units = [
  {id:1, name: "RESCUE 1", status: "available"},
  {id:2, name: "RESCUE 2", status: "available"},
  {id:3, name: "RESCUE 3", status: "available"},
  {id:4, name: "RESCUE 4", status: "available"},
  {id:5, name: "RESCUE 5", status: "available"}
];

async function fetchData() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      headers: { "X-Master-Key": MASTER_KEY }
    });
    if (res.ok) {
      const data = await res.json();
      incidents = data.record.incidents || [];
      units = data.record.units || units;
      updateUI();
    }
  } catch(e) {
    console.log("Sync error");
  }
}

async function saveData() {
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": MASTER_KEY
      },
      body: JSON.stringify({ incidents, units })
    });
  } catch(e) {}
}

setInterval(fetchData, 4000);

// Rest of the code (initMap, newCall, toggleAttach, etc.)

function initMap() {
  map = L.map('map').setView([10.72, 122.55], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19}).addTo(map);
}

// ... (I will complete the full file when you send the new keys)

window.onload = () => {
  initMap();
  fetchData();
  updateUI();
};
