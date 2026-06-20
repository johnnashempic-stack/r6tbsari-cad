// FD MDT - Fire Rescue SAR (Orange & Black Theme)
let units = [
    {id: "Rescue-1", status: "Available", location: "Station 1"},
    {id: "Rescue-2", status: "Available", location: "Station 2"},
    {id: "SAR-3", status: "Available", location: "Heli Base"},
    {id: "Heavy-4", status: "Available", location: "Station 3"}
];

let calls = [];
let logEntries = [];
let currentUser = {name: "", role: ""};

function login() {
    const user = document.getElementById("login-user").value || "User";
    const role = document.getElementById("login-role").value;
    currentUser = {name: user, role: role};
    
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("main-ui").style.display = "flex";
    document.getElementById("user-info").style.display = "block";
    document.getElementById("username").textContent = user;
    document.getElementById("role").textContent = role;
    
    renderUnits();
    renderCalls();
    addLog("System", `\( {user} ( \){role}) logged in`);
}

function logout() {
    document.getElementById("main-ui").style.display = "none";
    document.getElementById("login-screen").style.display = "block";
    calls = [];
    logEntries = [];
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

function renderUnits() {
    let html = "";
    units.forEach(u => {
        html += `<div class="unit">
            <strong>${u.id}</strong> - ${u.status} @ ${u.location}
            \( {currentUser.role === "Dispatch" ? `<button onclick="assignUnit(' \){u.id}')">Assign</button>` : ''}
        </div>`;
    });
    document.getElementById("units-list").innerHTML = html;
}

function renderCalls() {
    let html = calls.length ? "" : "<p style='color:#ffaa00;'>No active calls. Dispatch can create one.</p>";
    calls.forEach((c, i) => {
        html += `<div class="call">
            <strong>${c.type}</strong> | \( {c.location} | Status: <span class="status- \){c.status.toLowerCase().replace(' ','-')}">${c.status}</span><br>
            Units: ${c.units.join(", ") || "None"}<br>
            <button onclick="updateCallStatus(${i}, 'Enroute')">Enroute</button>
            <button onclick="updateCallStatus(${i}, 'Arrived')">Arrived</button>
            <button onclick="updateCallStatus(${i}, 'Cleared')">Clear</button>
            \( {currentUser.role === "Dispatch" ? `<button onclick="removeCall( \){i})">Remove</button>` : ''}
        </div>`;
    });
    document.getElementById("calls-list").innerHTML = html;
}

function createCall() {
    if (currentUser.role !== "Dispatch") {
        alert("Only Dispatch can create calls.");
        return;
    }
    const type = prompt("Call Type:", "MVC with Entrapment");
    const loc = prompt("Location:", "Highway 101 @ Mile 45");
    if (type && loc) {
        calls.push({ type: type, location: loc, status: "Pending", units: [] });
        addLog("Dispatch", `New call: ${type} at ${loc}`);
        renderCalls();
    }
}

function updateCallStatus(index, newStatus) {
    if (calls[index]) {
        calls[index].status = newStatus;
        addLog(currentUser.name, `Call updated to ${newStatus}`);
        renderCalls();
    }
}

function removeCall(index) {
    if (currentUser.role === "Dispatch" && confirm("Remove this call?")) {
        addLog("Dispatch", `Call cleared: ${calls[index].type}`);
        calls.splice(index, 1);
        renderCalls();
    }
}

function assignUnit(unitId) {
    if (currentUser.role !== "Dispatch") return;
    if (calls.length === 0) { alert("Create a call first."); return; }
    
    const callIndex = parseInt(prompt("Assign to call index (0 = first call):", "0"));
    if (calls[callIndex]) {
        calls[callIndex].units.push(unitId);
        const unit = units.find(u => u.id === unitId);
        if (unit) unit.status = "Assigned";
        addLog("Dispatch", `Assigned ${unitId} to call`);
        renderUnits();
        renderCalls();
    }
}

console.log("%cFD MDT Orange & Black Theme Loaded", "color:#ff8800; font-size:16px; font-weight:bold");
