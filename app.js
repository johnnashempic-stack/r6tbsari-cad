const ADMIN_PASS = "IR6TB-018";

let role = "responder";

let calls = [];
let history = [];
let chat = [];

let units = [
  {id:1,name:"RESCUE 1",status:"AVAILABLE",takenBy:null},
  {id:2,name:"RESCUE 2",status:"AVAILABLE",takenBy:null}
];

function isDispatch(){
  return role === "dispatch";
}

/* LOGIN */
function login(){
  if(pass.value === ADMIN_PASS){
    role = "dispatch";
    dispatchUI.style.display = "block";
  }
}

function logout(){
  role = "responder";
  dispatchUI.style.display = "none";
}

/* CALL SYSTEM */
const STATUS = {
  "🔥 Fire":["FOA","1st Alarm","Under Control","Fire Out"],
  "🚑 Medical":["Stable","Critical","Transporting"],
  "🛟 Rescue":["Search","Complete"],
  "🚗 MVA":["Minor","Road Cleared"]
};

const END = {
  "🔥 Fire":["Fire Out"],
  "🚑 Medical":["Transporting"],
  "🛟 Rescue":["Complete"],
  "🚗 MVA":["Road Cleared"]
};

function createCall(){
  if(!isDispatch()) return;

  calls.unshift({
    id:Date.now(),
    type:type.value,
    address:address.value,
    details:details.value,
    status:"ACTIVE"
  });

  renderCalls();
}

/* STATUS */
function setStatus(id,status){

  if(!isDispatch()) return;

  let c = calls.find(x=>x.id===id);
  if(!c) return;

  c.status = status;

  if(END[c.type]?.includes(status)){
    history.unshift(c);
    calls = calls.filter(x=>x.id!==id);
  }

  renderCalls();
}

/* REMOVE */
function removeCall(id){
  if(!isDispatch()) return;

  let c = calls.find(x=>x.id===id);
  if(!c) return;

  history.unshift({...c,status:"REMOVED"});
  calls = calls.filter(x=>x.id!==id);

  renderCalls();
}

/* RENDER CALLS */
function renderCalls(){

  const box = callsPanel;
  box.innerHTML = "";

  calls.forEach(c=>{

    let btn = "";

    if(isDispatch()){
      btn = (STATUS[c.type]||[])
        .map(s=>`<button onclick="setStatus(${c.id},'${s}')">${s}</button>`)
        .join("")
        + `<button onclick="removeCall(${c.id})">REMOVE</button>`;
    }

    box.innerHTML += `
      <div class="card">
        <b>${c.type}</b><br>
        ${c.address}<br>
        ${c.status}<br><br>
        ${btn}
      </div>
    `;
  });
}

/* UNITS */
const UNIT_STATUS = ["AVAILABLE","ENROUTE","ON SCENE","RETURNING","OOS"];

function selectUnit(id){

  if(role !== "responder") return;

  let u = units.find(x=>x.id===id);
  if(!u) return;

  if(u.takenBy && u.takenBy !== "YOU") return;

  units.forEach(x=>{
    if(x.takenBy==="YOU") x.takenBy=null;
  });

  u.takenBy="YOU";
}

function changeUnitStatus(id,status){

  if(role !== "responder") return;

  let u = units.find(x=>x.id===id);
  if(!u || u.takenBy!=="YOU") return;

  u.status = status;
}

function renderUnits(){

  const box = unitsPanel;
  box.innerHTML = "";

  units.forEach(u=>{

    let btn = "";

    if(!u.takenBy && role==="responder"){
      btn += `<button onclick="selectUnit(${u.id})">TAKE UNIT</button>`;
    }

    if(u.takenBy==="YOU"){
      btn += UNIT_STATUS.map(s=>
        `<button onclick="changeUnitStatus(${u.id},'${s}')">${s}</button>`
      ).join("");
    }

    box.innerHTML += `
      <div class="card">
        <b>${u.name}</b><br>
        ${u.status}<br>
        ${btn}
      </div>
    `;
  });
}

/* CHAT */
function renderChat(){
  const box = chatPanel;
  box.innerHTML = chat.map(m=>`<div>${m.msg}</div>`).join("");
}

/* VIEW SWITCH */
function view(v){

  callsPanel.style.display="none";
  unitsPanel.style.display="none";
  chatPanel.style.display="none";

  if(v==="calls") callsPanel.style.display="block";
  if(v==="units") unitsPanel.style.display="block";
  if(v==="chat") chatPanel.style.display="block";
}

/* INIT */
window.onload = ()=>{
  view("calls");
  renderCalls();
  renderUnits();
  renderChat();
};
