/**
 * AgriSense Dashboard — Client-Side Logic
 * Polls the Django API every 5 seconds, handles irrigation controls,
 * and simulates ESP32 sensor readings.
 */

'use strict';

/* ── CONFIG ───────────────────────────────────────────────────── */
const API = {
  sensorData:       '/api/sensor-data/',
  sensorLatest:     '/api/sensor-data/latest/',
  irrigation:       '/api/irrigation/',
  recommendation:   '/api/recommendation/',
};
const POLL_INTERVAL_MS = 5000;
const MOISTURE_TRACK_DEGREES = 270; // gauge arc spans 270°
const CIRCUIT_LEN = 400;            // stroke-dasharray on the gauge circle

/* ── DOM REFS ─────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

const dom = {
  // Connection
  statusDot:          $('statusDot'),
  statusText:         $('statusText'),
  lastUpdated:        $('lastUpdated'),

  // Moisture gauge
  gaugeArc:           $('gaugeArc'),
  gaugeCenterValue:   $('gaugeCenterValue'),
  temperatureValue:   $('temperatureValue'),

  // Irrigation
  pumpAnimation:      $('pumpAnimation'),
  irrigationStatusChip: $('irrigationStatusChip'),
  irrigationStatusWord: $('irrigationStatusWord'),
  irrigationUpdated:  $('irrigationUpdated'),
  btnOn:              $('btnOn'),
  btnOff:             $('btnOff'),

  // Recommendation
  recAction:          $('recAction'),
  recMessage:         $('recMessage'),
  recIconLarge:       $('recIconLarge'),
  moistureBarFill:    $('moistureBarFill'),
  moistureBarPct:     $('moistureBarPct'),

  // Simulation
  btnSimulate:        $('btnSimulate'),
  btnSimulateDry:     $('btnSimulateDry'),
  btnSimulateWet:     $('btnSimulateWet'),

  // History
  historyBody:        $('historyBody'),
  historyCount:       $('historyCount'),

  // Toast
  toast:              $('toast'),
};

/* ── TOAST ────────────────────────────────────────────────────── */
let toastTimer = null;

function showToast(message, type = 'info', duration = 3000) {
  dom.toast.textContent = message;
  dom.toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), duration);
}

/* ── CONNECTION STATUS ────────────────────────────────────────── */
function setConnected(isConnected) {
  dom.statusDot.className = `status-dot ${isConnected ? 'connected' : 'error'}`;
  dom.statusText.textContent = isConnected ? 'Live' : 'Disconnected';
}

/* ── CSRF TOKEN (for POST requests) ──────────────────────────── */
function getCsrfToken() {
  const cookie = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
  return cookie ? cookie.split('=')[1].trim() : '';
}

/* ── API HELPERS ──────────────────────────────────────────────── */
async function apiGet(url) {
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept':        'application/json',
      'X-CSRFToken':   getCsrfToken(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `POST ${url} → ${res.status}`);
  }
  return res.json();
}

/* ── GAUGE UPDATE ─────────────────────────────────────────────── */
function updateGauge(moisture) {
  if (moisture === null || moisture === undefined) {
    dom.gaugeCenterValue.textContent = '—';
    dom.gaugeArc.setAttribute('stroke-dashoffset', CIRCUIT_LEN);
    dom.gaugeArc.style.stroke = 'url(#gaugeGrad)';
    return;
  }

  const pct = Math.min(Math.max(moisture, 0), 100) / 100;
  // 270° arc: 0% = full offset, 100% = offset of (CIRCUIT_LEN - 300)
  // Track uses 300 of the 400 total dash length
  const trackLen = 300;
  const offset = CIRCUIT_LEN - pct * trackLen;

  dom.gaugeArc.setAttribute('stroke-dashoffset', offset);
  dom.gaugeCenterValue.textContent = moisture.toFixed(1);

  // Color: red/orange below threshold, green above
  if (moisture < 40) {
    dom.gaugeArc.style.stroke = 'url(#gaugeLowGrad)';
  } else {
    dom.gaugeArc.style.stroke = 'url(#gaugeGrad)';
  }
}

/* ── IRRIGATION UPDATE ───────────────────────────────────────── */
function updateIrrigation(data) {
  const isOn = data.status === 'ON';
  dom.irrigationStatusChip.textContent = data.status || '—';
  dom.irrigationStatusChip.className = `status-chip ${isOn ? 'on' : 'off'}`;
  dom.irrigationStatusWord.textContent = isOn ? 'active' : 'inactive';

  if (isOn) {
    dom.pumpAnimation.classList.add('active');
  } else {
    dom.pumpAnimation.classList.remove('active');
  }

  if (data.updated_at) {
    dom.irrigationUpdated.textContent = formatTime(data.updated_at);
  }
}

/* ── RECOMMENDATION UPDATE ────────────────────────────────────── */
const REC_ICONS = {
  irrigate: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="36" fill="rgba(249,115,22,0.1)" stroke="rgba(249,115,22,0.4)" stroke-width="1.5"/>
    <path d="M40 20C40 20 26 30 26 42a14 14 0 0 0 28 0C54 30 40 20 40 20z" fill="rgba(249,115,22,0.2)" stroke="#f97316" stroke-width="1.5"/>
    <path d="M40 34v14M33 48l7-7 7 7" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  ok: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="36" fill="rgba(74,222,128,0.08)" stroke="rgba(74,222,128,0.3)" stroke-width="1.5"/>
    <path d="M40 20C40 20 26 30 26 42a14 14 0 0 0 28 0C54 30 40 20 40 20z" fill="rgba(74,222,128,0.15)" stroke="#4ade80" stroke-width="1.5"/>
    <path d="M30 40l7 7 13-14" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  nodata: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="36" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
    <path d="M40 28v16M40 50v4" stroke="rgba(255,255,255,0.3)" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,
};

function updateRecommendation(data) {
  const action = data.action || 'No Data';

  if (action === 'Irrigate') {
    dom.recAction.textContent = '💧 Irrigate';
    dom.recAction.className = 'rec-action irrigate';
    dom.recIconLarge.innerHTML = REC_ICONS.irrigate;
  } else if (action === 'No Need') {
    dom.recAction.textContent = '✅ No Need';
    dom.recAction.className = 'rec-action ok';
    dom.recIconLarge.innerHTML = REC_ICONS.ok;
  } else {
    dom.recAction.textContent = '— No Data';
    dom.recAction.className = 'rec-action nodata';
    dom.recIconLarge.innerHTML = REC_ICONS.nodata;
  }

  dom.recMessage.textContent = data.message || '';

  const moisture = data.moisture;
  if (moisture !== null && moisture !== undefined) {
    const pct = Math.min(Math.max(moisture, 0), 100);
    dom.moistureBarFill.style.width = `${pct}%`;
    dom.moistureBarPct.textContent = `${pct.toFixed(1)}%`;
  } else {
    dom.moistureBarFill.style.width = '0%';
    dom.moistureBarPct.textContent = '—%';
  }
}

/* ── HISTORY TABLE UPDATE ────────────────────────────────────── */
let previousCount = 0;

function updateHistory(readings) {
  const tbody = dom.historyBody;
  const isNew = readings.length > previousCount;
  previousCount = readings.length;

  dom.historyCount.textContent = `${readings.length} reading${readings.length !== 1 ? 's' : ''}`;

  if (readings.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No sensor data yet. Click "Simulate Sensor Reading" to start!</td></tr>`;
    return;
  }

  tbody.innerHTML = readings.map((r, i) => {
    const m = r.moisture;
    let mClass = 'ok';
    let sDry = false;
    if (m < 25)      { mClass = 'low'; sDry = true; }
    else if (m < 40) { mClass = 'warn'; sDry = true; }

    const statusLabel = sDry
      ? `<span class="row-status dry">Dry</span>`
      : `<span class="row-status ok">OK</span>`;

    const temp = r.temperature !== null && r.temperature !== undefined
      ? `${r.temperature.toFixed(1)} °C`
      : '—';

    const rowClass = i === 0 && isNew ? 'new-row' : '';

    return `
      <tr class="${rowClass}">
        <td>${readings.length - i}</td>
        <td>${formatTime(r.created_at)}</td>
        <td class="moisture-cell ${mClass}">${m.toFixed(1)}%</td>
        <td>${temp}</td>
        <td>${statusLabel}</td>
      </tr>`;
  }).join('');
}

/* ── TIME FORMATTING ──────────────────────────────────────────── */
function formatTime(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/* ── MAIN POLL CYCLE ──────────────────────────────────────────── */
async function refresh() {
  try {
    const [latest, irrigation, rec, history] = await Promise.all([
      apiGet(API.sensorLatest),
      apiGet(API.irrigation),
      apiGet(API.recommendation),
      apiGet(API.sensorData),
    ]);

    setConnected(true);
    dom.lastUpdated.textContent = new Date().toLocaleTimeString();

    // Gauge
    updateGauge(latest.moisture);
    dom.temperatureValue.textContent =
      (latest.temperature !== null && latest.temperature !== undefined)
        ? `${latest.temperature.toFixed(1)} °C`
        : '— °C';

    // Irrigation
    updateIrrigation(irrigation);

    // Recommendation
    updateRecommendation(rec);

    // History
    updateHistory(history);

  } catch (err) {
    setConnected(false);
    console.error('[AgriSense] Refresh error:', err);
  }
}

/* ── IRRIGATION TOGGLE ────────────────────────────────────────── */
async function setIrrigation(status) {
  try {
    const data = await apiPost(API.irrigation, { status });
    updateIrrigation(data);
    showToast(
      `Irrigation turned ${status} ✓`,
      status === 'ON' ? 'success' : 'info'
    );
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
    console.error('[AgriSense] Irrigation error:', err);
  }
}

/* ── SENSOR SIMULATION ────────────────────────────────────────── */
async function simulateSensor(overrideMoisture = null) {
  const moisture = overrideMoisture !== null
    ? overrideMoisture
    : parseFloat((Math.random() * 90 + 5).toFixed(2));        // 5–95%

  const temperature = parseFloat((Math.random() * 20 + 15).toFixed(2)); // 15–35°C

  const btn = dom.btnSimulate;
  btn.disabled = true;
  btn.textContent = 'Sending…';

  try {
    await apiPost(API.sensorData, { moisture, temperature });
    showToast(`📡 Sensor: moisture=${moisture.toFixed(1)}%, temp=${temperature.toFixed(1)}°C`, 'success');
    await refresh(); // immediate refresh
  } catch (err) {
    showToast(`Simulation failed: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 10l2-2 2 2-2 2-2-2z" fill="currentColor"/></svg> Simulate Sensor Reading`;
  }
}

/* ── EVENT LISTENERS ──────────────────────────────────────────── */
dom.btnOn.addEventListener('click', () => setIrrigation('ON'));
dom.btnOff.addEventListener('click', () => setIrrigation('OFF'));

dom.btnSimulate.addEventListener('click', () => simulateSensor());

dom.btnSimulateDry.addEventListener('click', () => {
  const dry = parseFloat((Math.random() * 30 + 5).toFixed(2)); // 5–35%
  simulateSensor(dry);
});

dom.btnSimulateWet.addEventListener('click', () => {
  const wet = parseFloat((Math.random() * 30 + 60).toFixed(2)); // 60–90%
  simulateSensor(wet);
});

/* ── INIT ─────────────────────────────────────────────────────── */
refresh();
setInterval(refresh, POLL_INTERVAL_MS);

console.log('%cAgriSense Dashboard loaded ✓', 'color:#4ade80;font-weight:bold;font-size:14px;');
