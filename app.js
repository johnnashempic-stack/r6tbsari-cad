// Rsix Tigers Brigade - Iloilo
// Orange/Black | Active/History | Report with Map | JSONBin | Realtime Clock | FD Tones

let currentRole = 'field';
let currentCategory = 'active';
let map = null;
let reportMap = null;
let hubMap = null;
let markers = [];
let reportMarker = null;
let reportLat = 10.7202;
let reportLng = 122.5621;
let selectedTone = 'classic';
let jsonBinId = localStorage.getItem('rsix_jsonbin_id') || '';
let jsonBinKey = localStorage.getItem('rsix_jsonbin_key') || '';

// Start empty active. One history example.
let alerts = [
    {
        id: 1,
        type: 'Structure Fire',
        location: 'Barangay Mandurriao, Iloilo City',
        status: 'Fire Out',
        statusClass: 'fire-out',
        time: '2026-08-07 22:15:00',
        units: ['Rescue 1', 'Rescue 2'],
        lat: 10.7167,
        lng: 122.5500,
        area: 'Iloilo City',
        details: 'Previous incident - training history'
    }
];

let units = [
    { name: 'Rescue 1', status: 'Available', lat: 10.7202, lng: 122.5621 },
    { name: 'Rescue 2', status: 'Available', lat: 10.7050, lng: 122.5450 },
    { name: 'Rescue 3', status: 'Available', lat: 10.7300, lng: 122.5750 },
    { name: 'Rescue 4', status: 'Available', lat: 10.6900, lng: 122.5300 },
    { name: 'Rescue 5', status: 'Available', lat: 10.7400, lng: 122.5600 }
];

// Sample hydrants around Iloilo
let hydrants = [
    { lat: 10.7210, lng: 122.5630, id: 'H-001' },
    { lat: 10.7180, lng: 122.5580, id: 'H-002' },
    { lat: 10.7250, lng: 122.5700, id: 'H-003' },
    { lat: 10.7100, lng: 122.5400, id: 'H-004' },
    { lat: 10.7350, lng: 122.5550, id: 'H-005' }
];

// ========== CLOCK ==========
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-PH', { hour12: false, timeZone: 'Asia/Manila' });
    const dateStr = now.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
    document.getElementById('live-clock').textContent = timeStr;
    document.getElementById('live-date').textContent = dateStr + ' • ILOILO';
}

// ========== TOAST & TONES ==========
function showToast(msg, duration = 3500) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
}

function setTone(tone) {
    selectedTone = tone;
    localStorage.setItem('rsix_tone', tone);
}

function playTone(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.value = 0.3;

        if (type === 'classic') {
            osc.frequency.value = 800;
            osc.start();
            setTimeout(() => { osc.frequency.value = 1000; }, 200);
            setTimeout(() => { osc.frequency.value = 800; }, 400);
            setTimeout(() => { osc.frequency.value = 1000; }, 600);
            setTimeout(() => { osc.stop(); ctx.close(); }, 900);
        } else if (type === 'dispatch') {
            osc.frequency.value = 600;
            osc.start();
            setTimeout(() => { osc.frequency.value = 900; }, 150);
            setTimeout(() => { osc.frequency.value = 600; }, 300);
            setTimeout(() => { osc.frequency.value = 1200; }, 450);
            setTimeout(() => { osc.stop(); ctx.close(); }, 700);
        } else if (type === 'beep') {
            osc.frequency.value = 1000;
            osc.start();
            setTimeout(() => { osc.stop(); ctx.close(); }, 200);
        } else if (type === 'radio') {
            osc.type = 'square';
            osc.frequency.value = 400;
            osc.start();
            setTimeout(() => { osc.frequency.value = 700; }, 100);
            setTimeout(() => { osc.frequency.value = 300; }, 250);
            setTimeout(() => { osc.stop(); ctx.close(); }, 400);
        }
    } catch (e) {
        console.log('Audio not available');
    }
}

function previewTone() {
    playTone(selectedTone);
    showToast('Playing: ' + selectedTone);
}

// ========== NOTIFICATIONS ==========
function showLocalNotification(title, body) {
    playTone(selectedTone);
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'https://via.placeholder.com/128/F97316/000000?text=RSIX',
            tag: 'rsix-alert',
            requireInteraction: true
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}

function enablePush() {
    if (!('Notification' in window)) {
        showToast('Not supported');
        return;
    }
    Notification.requestPermission().then(p => {
        const status = document.getElementById('push-status');
        const btn = document.getElementById('enable-push-btn');
        if (p === 'granted') {
            status.textContent = 'Status: ✅ Enabled';
            btn.textContent = 'Enabled';
            showToast('Notifications Enabled');
            if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
        } else {
            status.textContent = 'Status: ❌ Denied';
        }
    });
}

// ========== JSONBIN ==========
function saveJsonBinConfig() {
    jsonBinId = document.getElementById('jsonbin-id').value.trim();
    jsonBinKey = document.getElementById('jsonbin-key').value.trim();
    localStorage.setItem('rsix_jsonbin_id', jsonBinId);
    localStorage.setItem('rsix_jsonbin_key', jsonBinKey);
    showToast('JSONBin config saved');
}

async function syncFromJsonBin() {
    if (!jsonBinId || !jsonBinKey) {
        showToast('Set Bin ID and Master Key in Settings first');
        return;
    }
    try {
        showToast('Syncing from JSONBin...');
        const res = await fetch(`https://api.jsonbin.io/v3/b/${jsonBinId}/latest`, {
            headers: { 'X-Master-Key': jsonBinKey }
        });
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        if (data && data.record && Array.isArray(data.record.alerts)) {
            alerts = data.record.alerts;
            renderAlerts();
            showToast('✅ Synced ' + alerts.length + ' alerts');
        } else {
            showToast('No alerts array found in bin');
        }
    } catch (e) {
        showToast('Sync error: ' + e.message);
        console.error(e);
    }
}

async function pushToJsonBin() {
    if (!jsonBinId || !jsonBinKey) return;
    try {
        await fetch(`https://api.jsonbin.io/v3/b/${jsonBinId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': jsonBinKey
            },
            body: JSON.stringify({ alerts: alerts, updated: new Date().toISOString() })
        });
    } catch (e) {
        console.log('Push to JSONBin failed', e);
    }
}

// Auto poll every 12 seconds if configured
setInterval(() => {
    if (jsonBinId && jsonBinKey) syncFromJsonBin();
}, 12000);

// ========== CATEGORY ==========
function getActiveAlerts() {
    return alerts.filter(a => a.status !== 'Fire Out');
}
function getHistoryAlerts() {
    return alerts.filter(a => a.status === 'Fire Out');
}

function switchCategory(cat) {
    currentCategory = cat;
    document.getElementById('tab-active').classList.toggle('active', cat === 'active');
    document.getElementById('tab-history').classList.toggle('active', cat === 'history');
    renderAlerts();
}

// ========== RENDER ALERTS ==========
function renderAlerts() {
    const container = document.getElementById('alerts-list');
    container.innerHTML = '';
    const list = currentCategory === 'active' ? getActiveAlerts() : getHistoryAlerts();

    if (list.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">${currentCategory === 'active' ? '✅' : '📜'}</div>
                <h3 style="color:var(--orange);margin-bottom:8px;">
                    ${currentCategory === 'active' ? 'No Active Fires' : 'No History Yet'}
                </h3>
                <p>${currentCategory === 'active' 
                    ? 'All clear in Iloilo. New reports will appear here.' 
                    : 'Completed (Fire Out) incidents appear here.'}</p>
            </div>`;
        return;
    }

    list.slice().reverse().forEach(alert => {
        const card = document.createElement('div');
        card.className = `alert-card ${alert.statusClass}`;
        card.innerHTML = `
            <div class="alert-badge">${currentCategory === 'active' ? 'FIRE ALERT' : 'HISTORY'}</div>
            <div class="alert-body">
                <h3>🔥 ${alert.type}</h3>
                <p><strong>${alert.location}</strong></p>
                <p>Status: <strong>${alert.status}</strong></p>
                <p style="font-size:12px;">Area: ${alert.area || 'Iloilo'}</p>
                ${alert.units && alert.units.length ? `<p style="font-size:12px;margin-top:4px;">Units: ${alert.units.join(', ')}</p>` : ''}
                <div class="alert-time">${alert.time} (ILOILO)</div>
            </div>
        `;
        card.onclick = () => {
            switchTab('hub');
            setTimeout(() => showHubMap('active'), 200);
        };
        container.appendChild(card);
    });
}

// ========== REPORT MAP ==========
function initReportMap() {
    if (reportMap) {
        reportMap.invalidateSize();
        return;
    }
    reportMap = L.map('report-map').setView([10.7202, 122.5621], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OSM | Rsix Tigers'
    }).addTo(reportMap);

    reportMarker = L.marker([reportLat, reportLng], { draggable: true }).addTo(reportMap);
    reportMarker.on('dragend', e => {
        const pos = e.target.getLatLng();
        reportLat = pos.lat;
        reportLng = pos.lng;
        document.getElementById('report-coords').textContent = 
            `Lat: ${reportLat.toFixed(5)}, Lng: ${reportLng.toFixed(5)}`;
    });

    reportMap.on('click', e => {
        reportLat = e.latlng.lat;
        reportLng = e.latlng.lng;
        reportMarker.setLatLng(e.latlng);
        document.getElementById('report-coords').textContent = 
            `Lat: ${reportLat.toFixed(5)}, Lng: ${reportLng.toFixed(5)}`;
    });
}

function useMyLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation not supported');
        return;
    }
    navigator.geolocation.getCurrentPosition(pos => {
        reportLat = pos.coords.latitude;
        reportLng = pos.coords.longitude;
        if (reportMap) {
            reportMap.setView([reportLat, reportLng], 16);
            reportMarker.setLatLng([reportLat, reportLng]);
        }
        document.getElementById('report-coords').textContent = 
            `GPS: ${reportLat.toFixed(5)}, ${reportLng.toFixed(5)}`;
        showToast('📍 Location set from GPS');
    }, () => showToast('Unable to get GPS location'));
}

function submitReport() {
    const type = document.getElementById('report-type').value;
    const location = document.getElementById('report-location').value.trim();
    const details = document.getElementById('report-details').value.trim();

    if (!location) {
        showToast('Please enter location');
        return;
    }

    const newAlert = {
        id: Date.now(),
        type: type,
        location: location,
        status: 'For Verification',
        statusClass: 'verification',
        time: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
        units: [],
        lat: reportLat,
        lng: reportLng,
        area: 'Iloilo',
        details: details
    };

    alerts.push(newAlert);
    currentCategory = 'active';
    switchCategory('active');
    renderAlerts();
    pushToJsonBin();

    showToast('🚨 Report submitted → ACTIVE');
    showLocalNotification('🔥 NEW FIRE REPORT - ILOILO', type + ' @ ' + location);

    document.getElementById('report-location').value = '';
    document.getElementById('report-details').value = '';
}

// ========== HUB MAPS ==========
function showHubMap(mode) {
    document.getElementById('blood-buddy').style.display = 'none';
    document.getElementById('hub-map-container').style.display = 'block';

    setTimeout(() => {
        if (!hubMap) {
            hubMap = L.map('hub-map').setView([10.7202, 122.5621], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OSM | Rsix Tigers Iloilo'
            }).addTo(hubMap);
        } else {
            hubMap.invalidateSize();
            hubMap.eachLayer(l => { if (l instanceof L.Marker || l instanceof L.CircleMarker) hubMap.removeLayer(l); });
        }

        const legend = document.getElementById('hub-legend');

        if (mode === 'active') {
            legend.innerHTML = '<strong style="color:var(--orange)">Active Fires - Iloilo</strong>';
            getActiveAlerts().forEach(a => {
                const m = L.circleMarker([a.lat, a.lng], {
                    color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.8, radius: 10
                }).addTo(hubMap);
                m.bindPopup(`<b>\( {a.location}</b><br> \){a.status}<br>${a.type}`);
            });
            units.forEach(u => {
                L.marker([u.lat, u.lng]).addTo(hubMap).bindPopup(`${u.name}: ${u.status}`);
            });
        } else if (mode === 'hydrant') {
            legend.innerHTML = '<strong style="color:var(--orange)">Fire Hydrants - Iloilo Area</strong>';
            hydrants.forEach(h => {
                const m = L.circleMarker([h.lat, h.lng], {
                    color: '#0EA5E9', fillColor: '#0EA5E9', fillOpacity: 0.9, radius: 8
                }).addTo(hubMap);
                m.bindPopup(`Hydrant ${h.id}`);
            });
        }
    }, 150);
}

function showBloodBuddy() {
    document.getElementById('hub-map-container').style.display = 'none';
    document.getElementById('blood-buddy').style.display = 'block';
}

// ========== NAV ==========
function switchTab(tab) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const mapSec = { home: 0, report: 1, hub: 2, settings: 3 };
    document.getElementById(tab + '-section').classList.add('active');
    document.querySelectorAll('.nav-item')[mapSec[tab]].classList.add('active');

    if (tab === 'report') {
        setTimeout(initReportMap, 200);
    }
}

// ========== DISPATCHER ==========
function showLogin() { document.getElementById('login-modal').classList.add('show'); }
function hideLogin() { document.getElementById('login-modal').classList.remove('show'); }

function attemptLogin() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (user === 'admin' && pass === 'tigers123') {
        currentRole = 'dispatcher';
        document.getElementById('role-indicator').textContent = 'DISPATCHER • ILOILO';
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'inline-block';
        document.getElementById('dispatcher-bar').classList.add('show');
        hideLogin();
        showToast('🔐 Dispatcher logged in');
    } else {
        showToast('Invalid credentials');
    }
}

function logout() {
    currentRole = 'field';
    document.getElementById('role-indicator').textContent = 'Field Unit Mode';
    document.getElementById('login-btn').style.display = 'inline-block';
    document.getElementById('logout-btn').style.display = 'none';
    document.getElementById('dispatcher-bar').classList.remove('show');
    showToast('Logged out');
}

function createNewAlert() {
    if (currentRole !== 'dispatcher') {
        showToast('⛔ Dispatcher only');
        return;
    }
    const location = prompt('Location (Iloilo):', 'Barangay City Proper, Iloilo City');
    if (!location) return;
    const type = prompt('Type:', 'Structure Fire') || 'Structure Fire';
    const status = prompt('Status:', 'For Verification') || 'For Verification';

    let statusClass = 'verification';
    if (status.toLowerCase().includes('false')) statusClass = 'false-alarm';
    else if (status.toLowerCase().includes('positive') || status.toLowerCase().includes('alarm')) statusClass = 'positive';
    else if (status.toLowerCase().includes('control')) statusClass = 'under-control';
    else if (status.toLowerCase().includes('out')) statusClass = 'fire-out';

    const newAlert = {
        id: Date.now(),
        type, location, status, statusClass,
        time: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
        units: [],
        lat: 10.7202 + (Math.random()-0.5)*0.05,
        lng: 122.5621 + (Math.random()-0.5)*0.05,
        area: 'Iloilo'
    };
    alerts.push(newAlert);
    switchCategory('active');
    renderAlerts();
    pushToJsonBin();
    showToast('🚨 New Alert → ACTIVE');
    showLocalNotification('🔥 NEW ALERT - ILOILO', location);
}

function assignUnit() {
    if (currentRole !== 'dispatcher') return;
    const active = getActiveAlerts();
    if (!active.length) { showToast('No active alerts'); return; }
    const unitName = prompt('Unit (Rescue 1-5):', 'Rescue 1');
    const alertId = prompt('Alert ID:', active[active.length-1].id.toString());
    const alert = alerts.find(a => a.id == alertId);
    if (alert && unitName) {
        if (!alert.units.includes(unitName)) {
            alert.units.push(unitName);
            const u = units.find(x => x.name === unitName);
            if (u) { u.status = 'Dispatched'; u.lat = alert.lat; u.lng = alert.lng; }
            renderAlerts();
            pushToJsonBin();
            showToast(unitName + ' assigned');
        }
    }
}

function markFireOut() {
    if (currentRole !== 'dispatcher') return;
    const active = getActiveAlerts();
    if (!active.length) { showToast('No active fires'); return; }
    const alertId = prompt('Alert ID to mark Fire Out:', active[active.length-1].id.toString());
    const alert = alerts.find(a => a.id == alertId);
    if (alert) {
        alert.status = 'Fire Out';
        alert.statusClass = 'fire-out';
        alert.units.forEach(name => {
            const u = units.find(x => x.name === name);
            if (u) u.status = 'Available';
        });
        renderAlerts();
        pushToJsonBin();
        showToast('✅ Moved to HISTORY');
        showLocalNotification('Fire Out', alert.location);
    }
}

// ========== INIT ==========
window.onload = function() {
    document.getElementById('jsonbin-id').value = jsonBinId;
    document.getElementById('jsonbin-key').value = jsonBinKey;
    const savedTone = localStorage.getItem('rsix_tone');
    if (savedTone) {
        selectedTone = savedTone;
        const radio = document.querySelector(`input[name="tone"][value="${savedTone}"]`);
        if (radio) radio.checked = true;
    }

    renderAlerts();
    updateClock();
    setInterval(updateClock, 1000);

    if (Notification.permission === 'granted') {
        document.getElementById('push-status').textContent = 'Status: ✅ Enabled';
        document.getElementById('enable-push-btn').textContent = 'Enabled';
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(()=>{});
    }

    if (jsonBinId && jsonBinKey) setTimeout(syncFromJsonBin, 1500);

    console.log('Rsix Tigers Brigade Iloilo ready');
};
