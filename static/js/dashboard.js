'use strict';

const API = {
  sensorData: '/api/sensor-data/',
  sensorLatest: '/api/sensor-data/latest/',
  irrigation: '/api/irrigation/',
  recommendation: '/api/recommendation/',
  analytics: '/api/recommendation/analytics/',
};

const POLL_INTERVAL_MS = 5000;
const CIRCUIT_LEN = 400;

const $ = id => document.getElementById(id);

const dom = {
  statusDot: $('statusDot'),
  statusText: $('statusText'),
  lastUpdated: $('lastUpdated'),

  gaugeArc: $('gaugeArc'),
  gaugeCenterValue: $('gaugeCenterValue'),
  temperatureValue: $('temperatureValue'),

  pumpAnimation: $('pumpAnimation'),
  irrigationStatusChip: $('irrigationStatusChip'),
  irrigationStatusWord: $('irrigationStatusWord'),
  irrigationUpdated: $('irrigationUpdated'),
  btnOn: $('btnOn'),
  btnOff: $('btnOff'),

  recAction: $('recAction'),
  recMessage: $('recMessage'),
  recIconLarge: $('recIconLarge'),
  moistureBarFill: $('moistureBarFill'),
  moistureBarPct: $('moistureBarPct'),
  weatherMode: $('weatherMode'),
  rainExpected: $('rainExpected'),

  btnSimulate: $('btnSimulate'),
  btnSimulateDry: $('btnSimulateDry'),
  btnSimulateWet: $('btnSimulateWet'),

  historyBody: $('historyBody'),
  historyCount: $('historyCount'),

  analyticsStatus: $('analyticsStatus'),
  analyticsTotal: $('analyticsTotal'),
  analyticsAvgMoisture: $('analyticsAvgMoisture'),
  analyticsMinMoisture: $('analyticsMinMoisture'),
  analyticsMaxMoisture: $('analyticsMaxMoisture'),
  analyticsAvgTemp: $('analyticsAvgTemp'),
  analyticsDryCount: $('analyticsDryCount'),
  analyticsChange: $('analyticsChange'),
  analyticsTrend: $('analyticsTrend'),

  toast: $('toast'),
};

let toastTimer = null;
let previousCount = 0;

function showToast(message, type = 'info', duration = 3000) {
  dom.toast.textContent = message;
  dom.toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), duration);
}

function setConnected(isConnected) {
  dom.statusDot.className = `status-dot ${isConnected ? 'connected' : 'error'}`;
  dom.statusText.textContent = isConnected ? 'Live' : 'Disconnected';
}

function getCsrfToken() {
  const cookie = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
  return cookie ? cookie.split('=')[1].trim() : '';
}

async function apiGet(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `POST ${url} → ${res.status}`);
  }

  return res.json();
}

function formatTime(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return (
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    ' ' +
    d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  );
}

function updateGauge(moisture) {
  if (moisture === null || moisture === undefined) {
    dom.gaugeCenterValue.textContent = '—';
    dom.gaugeArc.setAttribute('stroke-dashoffset', CIRCUIT_LEN);
    dom.gaugeArc.style.stroke = 'url(#gaugeGrad)';
    return;
  }

  const pct = Math.min(Math.max(moisture, 0), 100) / 100;
  const trackLen = 300;
  const offset = CIRCUIT_LEN - pct * trackLen;

  dom.gaugeArc.setAttribute('stroke-dashoffset', offset);
  dom.gaugeCenterValue.textContent = moisture.toFixed(1);
  dom.gaugeArc.style.stroke = moisture < 40 ? 'url(#gaugeLowGrad)' : 'url(#gaugeGrad)';
}

function updateIrrigation(data) {
  const isOn = data.status === 'ON';

  dom.irrigationStatusChip.textContent = data.status || '—';
  dom.irrigationStatusChip.className = `status-chip ${isOn ? 'on' : 'off'}`;
  dom.irrigationStatusWord.textContent = isOn ? 'active' : 'inactive';

  dom.pumpAnimation.classList.toggle('active', isOn);

  dom.btnOn.classList.toggle('active', isOn);
  dom.btnOff.classList.toggle('active', !isOn);

  dom.irrigationUpdated.textContent = data.updated_at ? formatTime(data.updated_at) : '—';
}

const REC_ICONS = {
  irrigate: `
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="36" fill="rgba(249,115,22,0.1)" stroke="rgba(249,115,22,0.4)" stroke-width="1.5"/>
      <path d="M40 20C40 20 26 30 26 42a14 14 0 0 0 28 0C54 30 40 20 40 20z" fill="rgba(249,115,22,0.2)" stroke="#f97316" stroke-width="1.5"/>
      <path d="M40 34v14M33 48l7-7 7 7" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
  ok: `
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="36" fill="rgba(74,222,128,0.08)" stroke="rgba(74,222,128,0.3)" stroke-width="1.5"/>
      <path d="M40 20C40 20 26 30 26 42a14 14 0 0 0 28 0C54 30 40 20 40 20z" fill="rgba(74,222,128,0.15)" stroke="#4ade80" stroke-width="1.5"/>
      <path d="M30 40l7 7 13-14" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
  wait: `
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="36" fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.3)" stroke-width="1.5"/>
      <path d="M40 20C40 20 26 30 26 42a14 14 0 0 0 28 0C54 30 40 20 40 20z" fill="rgba(56,189,248,0.18)" stroke="#38bdf8" stroke-width="1.5"/>
      <circle cx="40" cy="43" r="10" stroke="#38bdf8" stroke-width="2"/>
      <path d="M40 37v7l5 3" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
  nodata: `
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="36" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
      <path d="M40 28v16M40 50v4" stroke="rgba(255,255,255,0.3)" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `,
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
  } else if (action === 'Wait') {
    dom.recAction.textContent = '⏳ Wait';
    dom.recAction.className = 'rec-action ok';
    dom.recIconLarge.innerHTML = REC_ICONS.wait;
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

  if (dom.weatherMode) {
    dom.weatherMode.textContent = `Weather: ${data.weather?.weather_mode ?? '—'}`;
  }

  if (dom.rainExpected) {
    dom.rainExpected.textContent = `Rain soon: ${data.weather?.rain_expected ? 'Yes' : 'No'}`;
  }
}

function updateAnalytics(data) {
  if (!dom.analyticsTotal) return;

  if (data.message) {
    dom.analyticsStatus.textContent = 'Not enough data';
    dom.analyticsTotal.textContent = '—';
    dom.analyticsAvgMoisture.textContent = '—';
    dom.analyticsMinMoisture.textContent = '—';
    dom.analyticsMaxMoisture.textContent = '—';
    dom.analyticsAvgTemp.textContent = '—';
    dom.analyticsDryCount.textContent = '—';
    dom.analyticsChange.textContent = '—';
    dom.analyticsTrend.textContent = data.message;
    return;
  }

  dom.analyticsStatus.textContent = 'Live analytics';
  dom.analyticsTotal.textContent = data.total_readings ?? '—';
  dom.analyticsAvgMoisture.textContent = data.moisture_stats?.average != null ? `${data.moisture_stats.average}%` : '—';
  dom.analyticsMinMoisture.textContent = data.moisture_stats?.min != null ? `${data.moisture_stats.min}%` : '—';
  dom.analyticsMaxMoisture.textContent = data.moisture_stats?.max != null ? `${data.moisture_stats.max}%` : '—';
  dom.analyticsAvgTemp.textContent = data.temperature_stats?.average != null ? `${data.temperature_stats.average} °C` : '—';
  dom.analyticsDryCount.textContent = data.dry_readings_count ?? '—';
  dom.analyticsChange.textContent = data.moisture_change_24h != null ? `${data.moisture_change_24h}%` : '—';
  dom.analyticsTrend.textContent = data.trend || '—';
}

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

    if (m < 25) {
      mClass = 'low';
      sDry = true;
    } else if (m < 40) {
      mClass = 'warn';
      sDry = true;
    }

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
      </tr>
    `;
  }).join('');
}

async function refresh() {
  try {
    const [latest, irrigation, rec, history, analytics] = await Promise.all([
      apiGet(API.sensorLatest),
      apiGet(API.irrigation),
      apiGet(API.recommendation),
      apiGet(API.sensorData),
      apiGet(API.analytics),
    ]);

    setConnected(true);
    dom.lastUpdated.textContent = new Date().toLocaleTimeString();

    updateGauge(latest.moisture);

    dom.temperatureValue.textContent =
      latest.temperature !== null && latest.temperature !== undefined
        ? `${latest.temperature.toFixed(1)} °C`
        : '— °C';

    updateIrrigation(irrigation);
    updateRecommendation(rec);
    updateHistory(history);
    updateAnalytics(analytics);
  } catch (err) {
    setConnected(false);
    console.error('[AgriSense] Refresh error:', err);
  }
}

async function setIrrigation(status) {
  try {
    const data = await apiPost(API.irrigation, { status });
    updateIrrigation(data);
    showToast(
      `Irrigation turned ${status} ✓`,
      status === 'ON' ? 'success' : 'info'
    );
    await refresh();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
    console.error('[AgriSense] Irrigation error:', err);
  }
}

function setSimButtonsDisabled(disabled) {
  dom.btnSimulate.disabled = disabled;
  dom.btnSimulateDry.disabled = disabled;
  dom.btnSimulateWet.disabled = disabled;
}

async function simulateSensor(overrideMoisture = null) {
  const moisture = overrideMoisture !== null
    ? overrideMoisture
    : parseFloat((Math.random() * 90 + 5).toFixed(2));

  const temperature = parseFloat((Math.random() * 20 + 15).toFixed(2));

  setSimButtonsDisabled(true);
  const originalMain = dom.btnSimulate.innerHTML;
  dom.btnSimulate.textContent = 'Sending…';

  try {
    await apiPost(API.sensorData, { moisture, temperature });
    showToast(
      `📡 Sensor: moisture=${moisture.toFixed(1)}%, temp=${temperature.toFixed(1)}°C`,
      'success'
    );
    await refresh();
  } catch (err) {
    showToast(`Simulation failed: ${err.message}`, 'error');
  } finally {
    setSimButtonsDisabled(false);
    dom.btnSimulate.innerHTML = originalMain;
  }
}

dom.btnOn.addEventListener('click', () => setIrrigation('ON'));
dom.btnOff.addEventListener('click', () => setIrrigation('OFF'));

dom.btnSimulate.addEventListener('click', () => simulateSensor());

dom.btnSimulateDry.addEventListener('click', () => {
  const dry = parseFloat((Math.random() * 30 + 5).toFixed(2));
  simulateSensor(dry);
});

dom.btnSimulateWet.addEventListener('click', () => {
  const wet = parseFloat((Math.random() * 30 + 60).toFixed(2));
  simulateSensor(wet);
});

refresh();
setInterval(refresh, POLL_INTERVAL_MS);

console.log('%cAgriSense Dashboard loaded ✓', 'color:#4ade80;font-weight:bold;font-size:14px;');
