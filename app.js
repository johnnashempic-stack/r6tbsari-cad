// FD MDT Simulator - Strong MDT Theme - Educational Training Only
let currentRole = 'field';
let map, incidentMarkers = [], unitMarkers = [], hydrantMarkers = [];

let incidents = [
    { id: 1, type: 'STRUCTURE FIRE', location: '123 MAIN ST', status: 'En Route', units: ['E1','L2'], lat:45.783, lng:-108.505, priority:'high', notes:'Heavy smoke, preplan loaded' },
    { id: 2, type: 'MEDICAL', location: '456 OAK AVE', status: 'On Scene', units: ['A3'], lat:45.775, lng:-108.495, priority:'medium', notes:'CPR in progress' }
];

let units = [
    { name: 'E1', status: 'En Route', lat:45.780, lng:-108.510 },
    { name: 'L2', status: 'Dispatched', lat:45.770, lng:-108.520 },
    { name: 'A3', status: 'On Scene', lat:45.775, lng:-108.495 }
];

let hydrants = [{lat:45.782,lng:-108.502,id:'H1'},{lat:45.777,lng:-108.498,id:'H2'}];

function log(msg) {
    const logEl = document.getElementById('log');
    const time = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    logEl.innerHTML += `<div>[${time}] ${msg}</div>`;
    logEl.scrollTop = logEl.scrollHeight;
}

function initMap() {
    map = L.map('map').setView([45.78, -108.50], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap - Training Use' }).addTo(map);
    renderIncidentsOnMap();
    renderUnitsOnMap();
    renderHydrants();
}

function renderIncidentsOnMap() { /* same as previous */ }
function renderUnitsOnMap() { /* same as previous */ }
function renderHydrants() { /* same as previous */ }

function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = '<h2 style="color:#ffaa00">ACTIVE INCIDENTS</h2>';
    incidents.forEach(inc => {
        const div = document.createElement('div');
        div.className = `incident-card ${inc.priority === 'high' ? 'priority-high' : ''}`;
        div.innerHTML = `<strong>${inc.type} #${inc.id}</strong><br>📍 ${inc.location}<br>Status: ${inc.status}<br>Units: ${inc.units.join(', ')}`;
        div.onclick = () => { focusIncident(inc.id); };
        sidebar.appendChild(div);
    });
}

function updateStatus(status) {
    document.getElementById('unit-status').textContent = status;
    log(`Unit E1 status updated to ${status}`);
    renderSidebar();
}

function sendMessage() {
    const msg = prompt('Enter radio message to Dispatch:');
    if (msg) log(`📡 TO DISPATCH: ${msg}`);
}

function showPreplan() {
    log('PREPLAN LOADED - Hydrants & Building Info');
    alert('PREPLAN: 123 Main St\nHydrants: H1 (150ft), H2\nAccess: Rear alley • Hazmat: None');
}

function showLogin() { document.getElementById('login-screen').style.display = 'flex'; }
function cancelLogin() { document.getElementById('login-screen').style.display = 'none'; }

function attemptLogin() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (user === 'admin' && pass === 'dispatch123') {
        currentRole = 'dispatcher';
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'block';
        document.getElementById('role-indicator').textContent = 'DISPATCHER MODE - FULL ACCESS';
        log('🔐 DISPATCHER LOGGED IN - RBAC ELEVATED');
        // Add dispatcher toolbar if needed
    } else {
        alert('Invalid - Demo: admin / dispatch123');
    }
}

function logout() {
    currentRole = 'field';
    document.getElementById('login-btn').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'none';
    document.getElementById('role-indicator').textContent = 'FIELD UNIT MODE';
    log('👋 Dispatcher logged out');
}

function focusIncident(id) { /* map flyTo logic */ }

window.onload = () => {
    initMap();
    renderSidebar();
    log('✅ FD MDT CONNECTED - ACTIVE');
};
