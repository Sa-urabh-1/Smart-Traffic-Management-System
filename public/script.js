/**
 * SMART TRAFFIC AI - COMMAND CENTER CORE
 * Features: Auth System, Dynamic Signal AI, Smooth Continuous Movement
 */

let vehicleCount = 0;
let isEmergency = false;
let running = true;
let vehiclesGPS = []; 
let users = [{ u: "admin", p: "1234" }]; 
let map, chart;

const delay = ms => new Promise(res => setTimeout(res, ms));

// --- 1. AUTHENTICATION ---
function switchAuth(mode) {
    document.getElementById('loginForm').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('regForm').style.display = mode === 'reg' ? 'block' : 'none';
    document.getElementById('loginTab').classList.toggle('active', mode === 'login');
    document.getElementById('regTab').classList.toggle('active', mode === 'reg');
}

async function handleAuth(mode) {

    if (mode === 'reg') {
        const username = document.getElementById('regUser').value;
        const password = document.getElementById('regPass').value;

        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        alert(data.message);

        if (data.success) switchAuth('login');
    }

    else {
        const username = document.getElementById('userIn').value;
        const password = document.getElementById('passIn').value;

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.success) {
            document.getElementById('authPage').style.display = 'none';
            document.getElementById('sidePanel').style.display = 'flex';
            document.getElementById('mainPanel').style.display = 'block';
            initSystem();
        } else {
            alert(data.message);
        }
    }
}

// --- 2. TRAFFIC SIGNAL AI ---
async function autoSignalLoop() {
    while (true) {
        if (!running) { await delay(500); continue; }
        if (isEmergency) {
            updateLightUI("green");
            document.getElementById("timer").textContent = "PRIO";
            await delay(1000); continue;
        }
        let gTime = Math.min(30, Math.max(5, Math.floor(vehicleCount / 1.2)));
        await runSignal("green", gTime);
        await runSignal("yellow", 3);
        await runSignal("red", 10);
    }
}

async function runSignal(color, seconds) {
    if (!running || isEmergency) return;
    updateLightUI(color);
    for (let i = seconds; i >= 0; i--) {
        if (!running || isEmergency) return;
        document.getElementById("timer").textContent = i < 10 ? `0${i}` : i;
        await delay(1000);
    }
}

function updateLightUI(c) {
    document.querySelectorAll('.light').forEach(l => l.classList.remove('active'));
    document.getElementById(`${c}Light`).classList.add('active');
    const txt = document.getElementById("signalText");
    txt.textContent = c.toUpperCase();
    txt.style.color = c === 'red' ? '#ef4444' : (c === 'yellow' ? '#eab308' : '#22c55e');
}

// --- 3. MAP & MOVEMENT ENGINE ---
function initMap() {
    map = L.map('map').setView([28.6139, 77.2090], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
}

function addVehicle(type) {
    vehicleCount++;
    document.getElementById("count").textContent = vehicleCount;
    
    let b = map.getBounds();
    let lat = b.getSouthWest().lat + Math.random() * (b.getNorthEast().lat - b.getSouthWest().lat);
    let lng = b.getSouthWest().lng + Math.random() * (b.getNorthEast().lng - b.getSouthWest().lng);

    let iconHtml = '';
    if(type === 'car') iconHtml = '<i class="fas fa-car" style="color:#3b82f6; font-size:18px"></i>';
    else if(type === 'bus') iconHtml = '<i class="fas fa-bus-alt" style="color:#eab308; font-size:20px"></i>';
    else iconHtml = '<i class="fas fa-ambulance amb-icon" style="color:#ef4444; font-size:24px"></i>';

    let marker = L.marker([lat, lng], {
        icon: L.divIcon({ html: iconHtml, className: 'v-icon', iconSize: [30,30] })
    }).addTo(map);

    if (type === 'ambulance') {
        driveToHospital(marker, lat, lng);
    } else {
        // Start movement for regular cars/buses
        const vehicleData = {
            marker: marker,
            lat: lat,
            lng: lng,
            // Random direction and speed
            vLat: (Math.random() - 0.5) * 0.0001, 
            vLng: (Math.random() - 0.5) * 0.0001,
            type: type
        };
        vehiclesGPS.push(vehicleData);
        animateVehicle(vehicleData);
    }
}

/**
 * Continuous smooth movement for Cars and Buses
 */
async function animateVehicle(v) {
    while (vehiclesGPS.includes(v)) {
        if (!running) { await delay(500); continue; }
        
        // Logic: Stop if Signal is Red (unless it's an emergency)
        const currentSignal = document.getElementById("signalText").textContent;
        if (currentSignal === "RED" && !isEmergency) {
            await delay(500); 
            continue;
        }

        // Update Position
        v.lat += v.vLat;
        v.lng += v.vLng;
        v.marker.setLatLng([v.lat, v.lng]);

        // If vehicle goes off map, wrap it back or change direction
        let b = map.getBounds();
        if(!b.contains(v.marker.getLatLng())) {
            v.vLat *= -1; v.vLng *= -1; // Bounce back
        }

        await delay(50); // 20 frames per second
    }
}

/**
 * Priority movement for Ambulance
 */
async function driveToHospital(marker, sLat, sLng) {
    isEmergency = true;
    document.getElementById("emergencyBanner").style.display = "block";
    document.getElementById("mode").textContent = "PRIORITY";

    let dLat = sLat + (Math.random() - 0.5) * 0.06;
    let dLng = sLng + (Math.random() - 0.5) * 0.06;
    
    let hosp = L.marker([dLat, dLng], {
        icon: L.divIcon({ html: '<i class="fas fa-hospital-alt" style="color:#ef4444; font-size:32px"></i>', className: 'h-icon' })
    }).addTo(map).openPopup();

    let line = L.polyline([[sLat, sLng], [dLat, dLng]], {color:'#3b82f6', weight:2, dashArray:'5,5'}).addTo(map);

    const steps = 200; 
    for (let i = 0; i <= steps; i++) {
        let t = i / steps;
        marker.setLatLng([sLat + (dLat - sLat) * t, sLng + (dLng - sLng) * t]);
        if (i % 40 === 0) map.panTo(marker.getLatLng());
        await delay(30); 
    }

    addLog("✅ Mission complete.");
    await delay(1000);
    map.removeLayer(line); map.removeLayer(hosp); map.removeLayer(marker);
    isEmergency = false;
    document.getElementById("emergencyBanner").style.display = "none";
    document.getElementById("mode").textContent = "OPTIMIZED";
}

// --- 4. UTILS ---
function initChart() {
    const ctx = document.getElementById('trafficChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: '#3b82f6', tension: 0.4, fill: true, backgroundColor: 'rgba(59,130,246,0.1)' }] },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    setInterval(() => {
        if (running) {
            chart.data.labels.push("");
            chart.data.datasets[0].data.push(vehicleCount);
            if(chart.data.labels.length > 15) { chart.data.labels.shift(); chart.data.datasets[0].data.shift(); }
            chart.update();
        }
    }, 2000);
}

function initSystem() {
    initMap(); initChart(); autoSignalLoop();
    addLog("System Online.");
}

function addLog(m) {
    const l = document.getElementById("logs");
    const li = document.createElement("li");
    li.innerHTML = `<span>[${new Date().toLocaleTimeString()}]</span> ${m}`;
    l.prepend(li);
}

function showPage(p) {
    document.getElementById("homePage").style.display = p === 'home' ? 'block' : 'none';
    document.getElementById("junctionPage").style.display = p === 'map' ? 'block' : 'none';
    if(map) setTimeout(() => map.invalidateSize(), 400);
}

function resetSim() {
    vehicleCount = 0; 
    document.getElementById("count").textContent = 0;
    vehiclesGPS.forEach(v => map.removeLayer(v.marker));
    vehiclesGPS = []; 
    addLog("Grid reset.");
}