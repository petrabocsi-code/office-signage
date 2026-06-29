// Template logic for "map" slides. Reads one global the slide defines:
//   CLIENTS = [ { name, city, lat, lon, color }, ... ]
// Projects each lat/lon onto a US Albers map, draws the states, lists the
// clients in the left rail, and cycles a highlighted pin every few seconds.
// Logo + clock + 30-min reload come from chrome.js (shared) — not here.

(function () {
  const CLIENTS_DATA = (typeof CLIENTS !== 'undefined') ? CLIENTS : [];
  if (!CLIENTS_DATA.length) return;

  const CYCLE_MS = 2000;
  let activeIdx = 0;

  const FIPS = {
    '01':'AL','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE',
    '12':'FL','13':'GA','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS',
    '21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN',
    '28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ',
    '35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR',
    '42':'PA','44':'RI','45':'SC','46':'SD','47':'TN','48':'TX','49':'UT',
    '50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY'
  };

  const proj = d3.geoAlbers()
    .center([-0.6, 38.7])
    .rotate([96, 0])
    .parallels([29.5, 45.5])
    .scale(1070)
    .translate([480, 250]);
  const pathGen = d3.geoPath().projection(proj);

  // Resolve each client's pixel position from its lat/lon.
  CLIENTS_DATA.forEach(function (br) {
    const pt = proj([br.lon, br.lat]);
    if (pt) { br.x = Math.round(pt[0]); br.y = Math.round(pt[1]); }
  });

  const SVGNS = 'http://www.w3.org/2000/svg';

  function renderList() {
    document.getElementById('brand-list').innerHTML = CLIENTS_DATA.map(function (br, i) {
      return '<div class="brand-item' + (i === activeIdx ? ' active' : '') + '">' +
        '<div class="brand-dot" style="background:' + br.color + '"></div>' +
        '<div class="brand-name-lbl">' + br.name + '</div>' +
        '<div class="brand-city-lbl">' + br.city + '</div>' +
      '</div>';
    }).join('');
  }

  function renderPins() {
    const g = document.getElementById('pins');
    g.innerHTML = '';
    CLIENTS_DATA.forEach(function (br, i) {
      const isActive = i === activeIdx;
      const grp = document.createElementNS(SVGNS, 'g');
      if (isActive) {
        const r = document.createElementNS(SVGNS, 'circle');
        r.setAttribute('cx', br.x); r.setAttribute('cy', br.y); r.setAttribute('r', '6');
        r.setAttribute('fill', 'none'); r.setAttribute('stroke', br.color); r.setAttribute('stroke-width', '1.5');
        r.innerHTML = '<animate attributeName="r" from="7" to="22" dur="1.8s" repeatCount="indefinite"/>' +
                      '<animate attributeName="opacity" from="0.7" to="0" dur="1.8s" repeatCount="indefinite"/>';
        grp.appendChild(r);
      }
      const c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('cx', br.x); c.setAttribute('cy', br.y);
      c.setAttribute('r', isActive ? '8' : '5');
      c.setAttribute('fill', br.color);
      c.setAttribute('opacity', isActive ? '1' : '0.6');
      grp.appendChild(c);
      const ci = document.createElementNS(SVGNS, 'circle');
      ci.setAttribute('cx', br.x); ci.setAttribute('cy', br.y);
      ci.setAttribute('r', isActive ? '3' : '2');
      ci.setAttribute('fill', '#fff');
      grp.appendChild(ci);
      if (isActive) {
        const pillW = Math.max(br.name.length * 7 + 20, br.city.length * 6 + 16);
        const rect = document.createElementNS(SVGNS, 'rect');
        rect.setAttribute('x', br.x - pillW / 2); rect.setAttribute('y', br.y - 52);
        rect.setAttribute('width', pillW); rect.setAttribute('height', 36);
        rect.setAttribute('rx', '5'); rect.setAttribute('fill', br.color); rect.setAttribute('opacity', '0.95');
        grp.appendChild(rect);
        const tn = document.createElementNS(SVGNS, 'text');
        tn.setAttribute('x', br.x); tn.setAttribute('y', br.y - 34);
        tn.setAttribute('text-anchor', 'middle'); tn.setAttribute('fill', '#fff');
        tn.setAttribute('font-size', '11'); tn.setAttribute('font-weight', '900');
        tn.setAttribute('font-family', 'Inter,sans-serif');
        tn.textContent = br.name;
        grp.appendChild(tn);
        const tc = document.createElementNS(SVGNS, 'text');
        tc.setAttribute('x', br.x); tc.setAttribute('y', br.y - 20);
        tc.setAttribute('text-anchor', 'middle'); tc.setAttribute('fill', 'rgba(255,255,255,0.85)');
        tc.setAttribute('font-size', '9'); tc.setAttribute('font-weight', '600');
        tc.setAttribute('font-family', 'Inter,sans-serif');
        tc.textContent = br.city;
        grp.appendChild(tc);
      }
      g.appendChild(grp);
    });
  }

  function renderAll() { renderList(); renderPins(); }

  fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
    .then(function (r) { return r.json(); })
    .then(function (us) {
      const SKIP = new Set(['02', '15']); // Alaska, Hawaii
      const features = topojson.feature(us, us.objects.states).features
        .filter(function (f) { return !SKIP.has(f.id.toString().padStart(2, '0')); });

      const statesG = document.getElementById('states');
      features.forEach(function (f) {
        const p = document.createElementNS(SVGNS, 'path');
        p.setAttribute('d', pathGen(f));
        statesG.appendChild(p);
      });

      const labelsG = document.getElementById('state-labels');
      features.forEach(function (f) {
        const abbr = FIPS[f.id.toString().padStart(2, '0')];
        if (!abbr) return;
        const c = pathGen.centroid(f);
        if (!c || isNaN(c[0])) return;
        const t = document.createElementNS(SVGNS, 'text');
        t.setAttribute('x', c[0]); t.setAttribute('y', c[1] + 4);
        t.textContent = abbr;
        labelsG.appendChild(t);
      });

      renderAll();
      setInterval(function () { activeIdx = (activeIdx + 1) % CLIENTS_DATA.length; renderAll(); }, CYCLE_MS);
    });
})();
