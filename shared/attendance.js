// Template logic for "attendance" slides. Reads one global the slide defines:
//   ATTENDANCE = { sheetId, dataGid, configGid, refreshMinutes?, fallbackWorkingDays? }
// Fetches a Google Sheet (published CSV), scores this month's attendance vs the
// board minimum, and draws a fractal tree whose leaves fill in and shift color
// with the score. Logic mirrors the original office-tree slide.

(function () {
  const cfg = (typeof ATTENDANCE !== 'undefined') ? ATTENDANCE : {};
  if (!cfg.sheetId) return;

  const base = 'https://docs.google.com/spreadsheets/d/' + cfg.sheetId + '/gviz/tq?tqx=out:csv&gid=';
  const DATA_URL = base + cfg.dataGid;
  const CONFIG_URL = base + cfg.configGid;
  const REFRESH_MS = (cfg.refreshMinutes || 5) * 60 * 1000;
  const FALLBACK_WORKING_DAYS = cfg.fallbackWorkingDays || 20;

  const canvas = document.getElementById('treeCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, leaves = [], branches = [];
  let targetColor = { r: 93, g: 202, b: 165 };
  let currentColor = { r: 93, g: 202, b: 165 };
  let pct = 0;

  const COLORS = {
    thriving:  { r: 29,  g: 158, b: 117, badge: 'rgba(29,158,117,0.15)', btext: '#1D9E75', border: 'rgba(29,158,117,0.4)' },
    ontrack:   { r: 93,  g: 202, b: 165, badge: 'rgba(93,202,165,0.15)', btext: '#5DCAA5', border: 'rgba(93,202,165,0.3)' },
    slipping:  { r: 239, g: 159, b: 39,  badge: 'rgba(239,159,39,0.15)', btext: '#EF9F27', border: 'rgba(239,159,39,0.3)' },
    attention: { r: 216, g: 90,  b: 48,  badge: 'rgba(216,90,48,0.15)',  btext: '#D85A30', border: 'rgba(216,90,48,0.3)' },
    critical:  { r: 226, g: 75,  b: 74,  badge: 'rgba(226,75,74,0.15)',  btext: '#E24B4A', border: 'rgba(226,75,74,0.3)' },
  };

  function getState(s) {
    if (s >= 90) return 'thriving';
    if (s >= 75) return 'ontrack';
    if (s >= 55) return 'slipping';
    if (s >= 35) return 'attention';
    return 'critical';
  }
  function getBadge(s) {
    if (s >= 90) return 'Thriving';
    if (s >= 75) return 'On Track';
    if (s >= 55) return 'Falling Behind';
    if (s >= 35) return 'Needs Attention';
    return 'Below Target';
  }
  function getMsg(s) {
    if (s >= 90) return 'The office is fully alive this month.';
    if (s >= 75) return 'The month is going well — keep it up.';
    if (s >= 55) return 'Attendance is slipping a little.';
    if (s >= 35) return 'The team needs more office days.';
    return 'Significantly below the board minimum.';
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = rect.width;
    H = canvas.height = rect.height;
    buildTree();
  }

  function buildTree() {
    leaves = []; branches = [];
    addBranch(W * 0.58, H * 0.97, -Math.PI / 2, H * 0.30, 9, 0);
  }

  function addBranch(x, y, angle, len, thickness, depth) {
    if (len < H * 0.022 || depth > 6) return;
    const ex = x + Math.cos(angle) * len;
    const ey = y + Math.sin(angle) * len;
    branches.push({ x1: x, y1: y, x2: ex, y2: ey, t: thickness });
    if (depth >= 4) {
      const numLeaves = depth >= 5 ? 3 : 2;
      for (let i = 0; i < numLeaves; i++) {
        leaves.push({
          baseX: ex + (Math.random() - 0.5) * len * 0.3,
          baseY: ey + (Math.random() - 0.5) * len * 0.3,
          size: H * (0.032 + Math.random() * 0.02),
          angle: angle + (Math.random() - 0.5) * 1.2,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 0.35 + Math.random() * 0.5,
          swayAmp: 1.2 + Math.random() * 2.0,
          alpha: 0.8 + Math.random() * 0.2,
        });
      }
    }
    const spread = 0.48 + Math.random() * 0.12;
    const lean = (Math.random() - 0.5) * 0.15;
    const shrink = 0.66 + Math.random() * 0.08;
    addBranch(ex, ey, angle - spread + lean, len * shrink, thickness * 0.65, depth + 1);
    addBranch(ex, ey, angle + spread + lean, len * shrink, thickness * 0.65, depth + 1);
    if (depth < 2) addBranch(ex, ey, angle + (Math.random() - 0.5) * 0.2, len * (0.58 + Math.random() * 0.08), thickness * 0.58, depth + 1);
  }

  function drawLeaf(cx, cy, size, angle, r, g, b, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.52);
    ctx.bezierCurveTo(size * 0.5, -size * 0.3, size * 0.5, size * 0.3, 0, size * 0.52);
    ctx.bezierCurveTo(-size * 0.5, size * 0.3, -size * 0.5, -size * 0.3, 0, -size * 0.52);
    ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    ctx.fill();
    ctx.strokeStyle = 'rgba(' + Math.max(0, r - 25) + ',' + Math.max(0, g - 25) + ',' + Math.max(0, b - 25) + ',' + (alpha * 0.35) + ')';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.restore();
  }

  let t = 0;
  function draw() {
    t += 0.011;
    currentColor.r = lerp(currentColor.r, targetColor.r, 0.03);
    currentColor.g = lerp(currentColor.g, targetColor.g, 0.03);
    currentColor.b = lerp(currentColor.b, targetColor.b, 0.03);
    const r = Math.round(currentColor.r);
    const g = Math.round(currentColor.g);
    const b = Math.round(currentColor.b);
    ctx.clearRect(0, 0, W, H);
    branches.forEach(function (br) {
      ctx.beginPath();
      ctx.moveTo(br.x1, br.y1);
      ctx.lineTo(br.x2, br.y2);
      ctx.strokeStyle = '#4a3420';
      ctx.lineWidth = Math.max(0.5, br.t);
      ctx.lineCap = 'round';
      ctx.stroke();
    });
    leaves.forEach(function (lf) {
      const swx = Math.sin(t * lf.swaySpeed + lf.sway) * lf.swayAmp;
      const swy = Math.cos(t * lf.swaySpeed * 0.6 + lf.sway) * lf.swayAmp * 0.35;
      const fa = lf.alpha * Math.min(1, pct * 1.5);
      if (fa < 0.04) return;
      drawLeaf(lf.baseX + swx, lf.baseY + swy, lf.size, lf.angle + swx * 0.035, r, g, b, fa);
    });
    requestAnimationFrame(draw);
  }

  function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(function (h) { return h.trim().replace(/"/g, '').toLowerCase(); });
    return lines.slice(1).map(function (line) {
      const vals = line.split(',').map(function (v) { return v.trim().replace(/"/g, ''); });
      const obj = {};
      headers.forEach(function (h, i) { obj[h] = vals[i]; });
      return obj;
    }).filter(function (r) { return r[headers[0]]; });
  }

  // Match a config row to the current month — handles both "2026-06" and "6/1/2026".
  function matchesCurrentMonth(val) {
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    const clean = (val || '').trim();
    if (/^\d{4}-\d{2}$/.test(clean)) {
      const parts = clean.split('-').map(Number);
      return parts[0] === y && parts[1] === m;
    }
    const d = new Date(clean);
    if (!isNaN(d)) return d.getMonth() + 1 === m && d.getFullYear() === y;
    return false;
  }

  async function fetchWorkingDays() {
    try {
      const res = await fetch(CONFIG_URL);
      const text = await res.text();
      const rows = parseCSV(text);
      const row = rows.find(function (r) {
        const key = r.month || r[Object.keys(r)[0]] || '';
        return matchesCurrentMonth(key);
      });
      if (row) {
        const wd = parseInt(row.working_days || row[Object.keys(row)[1]]);
        if (!isNaN(wd)) return wd;
      }
    } catch (e) {}
    return FALLBACK_WORKING_DAYS;
  }

  function calcScore(rows, totalWorkingDays) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthRows = rows.filter(function (r) {
      const d = new Date(r.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && d <= today;
    });

    if (monthRows.length === 0) return { score: 0, totalCheckins: 0, fullMonthMin: 0, daysLogged: 0, daysRemaining: totalWorkingDays };

    let totalCheckins = 0, loggedMin = 0, lastHeadcount = 0;
    monthRows.forEach(function (r) {
      const hc = parseFloat(r.headcount);
      const ci = parseFloat(r.checkins);
      if (!isNaN(hc) && !isNaN(ci)) {
        totalCheckins += ci;
        loggedMin += hc * 0.48;
        lastHeadcount = hc;
      }
    });

    const daysLogged = monthRows.length;
    const daysRemaining = Math.max(0, totalWorkingDays - daysLogged);
    const fullMonthMin = loggedMin + (daysRemaining * lastHeadcount * 0.48);
    const score = Math.round((totalCheckins / fullMonthMin) * 100);
    return { score: score, totalCheckins: Math.round(totalCheckins), fullMonthMin: Math.round(fullMonthMin), daysLogged: daysLogged, daysRemaining: daysRemaining };
  }

  function updateUI(d) {
    pct = d.score / 100;
    const c = COLORS[getState(d.score)];
    targetColor = { r: c.r, g: c.g, b: c.b };
    const num = document.getElementById('treeNum');
    num.textContent = d.score + '%';
    num.style.color = c.btext;
    const badge = document.getElementById('treeBadge');
    badge.textContent = getBadge(d.score);
    badge.style.background = c.badge;
    badge.style.color = c.btext;
    badge.style.border = '0.5px solid ' + c.border;
    document.getElementById('treeMsg').textContent = getMsg(d.score);
    document.getElementById('treeStats').textContent =
      d.totalCheckins + ' check-ins · min ' + d.fullMonthMin + ' · ' + d.daysLogged + ' days logged · ' + d.daysRemaining + ' remaining';
    const now = new Date();
    document.getElementById('treeUpdated').textContent =
      'Connected to sheet · updated ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  }

  async function fetchAndUpdate() {
    try {
      const results = await Promise.all([fetch(DATA_URL).then(function (r) { return r.text(); }), fetchWorkingDays()]);
      const rows = parseCSV(results[0]);
      updateUI(calcScore(rows, results[1]));
    } catch (e) {
      document.getElementById('treeUpdated').textContent = 'Could not reach sheet — retrying...';
    }
  }

  window.addEventListener('resize', resize);
  resize(); draw();
  fetchAndUpdate();
  setInterval(fetchAndUpdate, REFRESH_MS);
})();
