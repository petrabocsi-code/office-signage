// Template logic for "popups" slides. Reads one global the slide defines:
//   POPUPS = [ { src, alt }, ... ]
// Fills three overlapping slots and cross-fades each to the next image on a
// staggered loop. Logo + clock + 30-min reload come from chrome.js (shared).

(function () {
  const POPUPS_DATA = (typeof POPUPS !== 'undefined') ? POPUPS : [];
  if (!POPUPS_DATA.length) return;

  const STEP = 3;
  const CYCLE_MS = 7000;
  const BASE_ZINDEX = { 'slot-0': 1, 'slot-1': 2, 'slot-2': 3 };

  function renderToSlot(slotEl, idx) {
    const item = POPUPS_DATA[idx % POPUPS_DATA.length];
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.alt || '';
    img.className = 'popup-card';
    slotEl.innerHTML = '';
    slotEl.appendChild(img);
    return img;
  }

  function initSlot(slotId, startIdx, initialDelay) {
    const slotEl = document.getElementById(slotId);
    if (!slotEl) return;
    let idx = ((startIdx % POPUPS_DATA.length) + POPUPS_DATA.length) % POPUPS_DATA.length;
    renderToSlot(slotEl, idx);

    function cycle() {
      const existing = slotEl.querySelector('.popup-card');
      if (!existing) return;
      slotEl.style.zIndex = '10'; // bring to front during transition
      existing.classList.add('fade-out');
      setTimeout(function () {
        idx = (idx + STEP) % POPUPS_DATA.length;
        const newCard = renderToSlot(slotEl, idx);
        newCard.classList.add('fade-in-start');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { newCard.classList.remove('fade-in-start'); });
        });
        setTimeout(function () { slotEl.style.zIndex = BASE_ZINDEX[slotId]; }, 700);
      }, 650);
    }

    setTimeout(function () { setInterval(cycle, CYCLE_MS); }, initialDelay);
  }

  initSlot('slot-0', 0, 0);
  initSlot('slot-1', 2, 2334);
  initSlot('slot-2', 4, 4667);
})();
