// FD MDT - Fire Rescue SAR (Orange & Black) - Fresh + Real-Time
const users = [
    { username: "DISPATCH", password: "BASE22", role: "Dispatch", name: "DISPATCH", badge: "FD-001" },
    { username: "RESCUE1", password: "RESCUER", role: "Responder", name: "RESCUE1", badge: "FD-101" },
    { username: "RESCUE2", password: "RESCUER", role: "Responder", name: "RESCUE2", badge: "FD-102" },
    { username: "RESCUE3", password: "RESCUER", role: "Responder", name: "RESCUE3", badge: "FD-103" },
    { username: "RESCUE4", password: "RESCUER", role: "Responder", name: "RESCUE4", badge: "FD-104" },
    { username: "RESCUE5", password: "RESCUER", role: "Responder", name: "RESCUE5", badge: "FD-105" }
];

let units = [
    {id: "Rescue-1", status: "Available", location: "Station 1"},
    {id: "Rescue-2", status: "Available", location: "Station 2"},
    {id: "SAR-3", status: "Available", location: "Heli Base"},
    {id: "Heavy-4", status: "Available", location: "Station 3"},
    {id: "Rescue-5", status: "Available", location: "Station 4"}
];

let calls = [];
let logEntries = [];
let commMessages = [];
let currentUser = null;

function populateLogin() {
    const select = document.getElementById("login-user");
    select.innerHTML = '<option value="">-- Select Unit --</option>';
    users.forEach(user => {
        const opt = document.createElement("option");
        opt.value = user.username;
        opt.textContent = `\( {user.name} ( \){user.badge})`;
        select.appendChild(opt);
    });
}

function updateClock() {
    const clockEl = document.getElementById("clock");
    setInterval(() => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }, 1000);
}

function login() {
    const selected = document.getElementById("login-user").value;
    const pass = document.getElementById("login-pass").value.trim();
    
    if (!selected) return alert("Please select a unit.");
    
    const user = users.find(u => u.username === selected);
    if (user && user.password === pass) {
        currentUser = user;
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("main-ui").style.display = "flex";
        document.getElementById("user-info").style.display = "block";
        
        document.getElementById("username").textContent = user.name;
        document.getElementById("badge").textContent = user.badge;
        document.getElementById("role").textContent = user.role;

        renderUnits();
        renderCalls();
        addLog("System", `${user.name} logged in`);
        addComm(`${user.name} joined the channel`);
    } else {
        alert("Invalid password.");
        document.getElementById("login-pass").value = "";
    }
}

function logout() {
    document.getElementById("main-ui").style.display = "none";
    document.getElementById("login-screen").style.display = "block";
    document.getElementById("login-pass").value = "";
    calls = [];
    logEntries = [];
    commMessages = [];
    currentUser = null;
}

function switchTab(n) {
    document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', i===n));
    document.querySelectorAll('.panel').forEach((p,i) => p.classList.toggle('active', i===n));
}

function addLog(user, message) {
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    logEntries.unshift(`[${time}] ${user}: ${message}`);
    if (logEntries.length > 50) logEntries.pop();
    document.getElementById("dispatch-log").innerHTML = logEntries.join("<br>");
}

function addComm(message) {
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    commMessages.unshift(`[${time}] ${message}`);
    if (commMessages.length > 30) commMessages.pop();
    document.getElementById("comm-log").innerHTML = commMessages.join("<br>");
}

function sendComm() {
    const input = document.getElementById("comm-input");
    const msg = input.value.trim();
    if (msg && currentUser) {
        addComm(`${currentUser.name}: ${msg}`);
        input.value = "";
    }
}

function renderUnits() {
    let html = "";
    units.forEach(u => {
        html += `<div class="unit">
            <strong>${u.id}</strong> - ${u.status} @ ${u.location}
            \( {currentUser && currentUser.role === "Dispatch" ? `<button onclick="assignUnit(' \){u.id}')">Assign</button>` : ''}
        </div>`;
    });
    document.getElementById("units-list").innerHTML = html;
}

function renderCalls() {
    let html = calls.length ? "" : "<p style='color:#ffaa00;'>No active calls. Dispatch can create new ones.</p>";
    calls.forEach((c, i) => {
        html += `<div class="call">
            <strong>${c.type}</strong> | \( {c.location} | Status: <span class="status- \){c.status.toLowerCase().replace(' ','-')}">${c.status}</span><br>
            Units: ${c.units.join(", ") || "None"}<br>
            <button onclick="updateCallStatus(${i}, 'Enroute')">Enroute</button>
            <button onclick="updateCallStatus(${i}, 'Arrived')">Arrived</button>
            <button onclick="updateCallStatus(${i}, 'Cleared')">Clear</button>
            \( {currentUser && currentUser.role === "Dispatch" ? `<button onclick="removeCall( \){i})">Remove</button>` : ''}
        </div>`;
    });
    document.getElementById("calls-list").innerHTML = html;
}

function createCall() {
    if (!currentUser || currentUser.role !== "Dispatch") return alert("Only Dispatch can create calls.");
    const type = prompt("Call Type:", "MVC with Entrapment");
    const loc = prompt("Location:", "Highway 101 @ Mile 45");
    if (type && loc) {
        calls.push({ type: type, location: loc, status: "Pending", units: [] });
        addLog("DISPATCH", `New call: ${type} at ${loc}`);
        addComm(`New call dispatched: ${type}`);
        renderCalls();
    }
}

function updateCallStatus(index, newStatus) {
    if (calls[index]) {
        calls[index].status = newStatus;
        addLog(currentUser.username, `Call updated → ${newStatus}`);
        renderCalls();
    }
}

function removeCall(index) {
    if (currentUser.role === "Dispatch" && confirm("Remove call?")) {
        addLog("DISPATCH", `Call cleared: ${calls[index].type}`);
        addComm(`Call cleared: ${calls[index].type}`);
        calls.splice(index, 1);
        renderCalls();
    }
}

function assignUnit(unitId) {
    if (currentUser.role !== "Dispatch") return;
    if (calls.length === 0) return alert("Create a call first.");
    
    const callIndex = parseInt(prompt("Assign to call index (0 = first):", "0"));
    if (calls[callIndex]) {
        calls[callIndex].units.push(unitId);
        const unit = units.find(u => u.id === unitId);
        if (unit) unit.status = "Assigned";
        addLog("DISPATCH", `Assigned ${unitId} to call`);
        addComm(`${unitId} assigned to call`);
        renderUnits();
        renderCalls();
    }
}

// Initialize
window.onload = function() {
    populateLogin();
    updateClock();
    console.log("%cFD MDT Ready - Real-Time Clock Active", "color:#ff8800; font-size:16px; font-weight:bold");
};
