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

  const FADE_MS = 600;

  function renderToSlot(slotEl, idx) {
    const item = POPUPS_DATA[idx % POPUPS_DATA.length];
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.alt || '';
    img.className = 'popup-card fade-in-start';
    slotEl.innerHTML = '';
    slotEl.appendChild(img);
    return img;
  }

  function initSlot(slotId, startIdx, initialDelay) {
    const slotEl = document.getElementById(slotId);
    if (!slotEl) return;
    let idx = ((startIdx % POPUPS_DATA.length) + POPUPS_DATA.length) % POPUPS_DATA.length;

    // Show first card immediately
    const first = renderToSlot(slotEl, idx);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { first.classList.remove('fade-in-start'); });
    });

    function cycle() {
      const existing = slotEl.querySelector('.popup-card');
      if (!existing) return;
      slotEl.style.zIndex = '4';

      // Fade out old card, then immediately fade in new — no gap, no overlap
      existing.classList.add('fade-out');
      setTimeout(function () {
        idx = (idx + STEP) % POPUPS_DATA.length;
        const newCard = renderToSlot(slotEl, idx);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            newCard.classList.remove('fade-in-start');
            slotEl.style.zIndex = BASE_ZINDEX[slotId];
          });
        });
      }, FADE_MS);
    }

    setTimeout(function () { setInterval(cycle, CYCLE_MS); }, initialDelay);
  }

  initSlot('slot-0', 0, 0);
  initSlot('slot-1', 2, 2334);
  initSlot('slot-2', 4, 4667);
})();
