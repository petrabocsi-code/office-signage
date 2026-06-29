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

  const FADE_MS = 800;

  function makeCard(idx) {
    const item = POPUPS_DATA[idx % POPUPS_DATA.length];
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.alt || '';
    img.className = 'popup-card fade-in-start';
    return img;
  }

  function initSlot(slotId, startIdx, initialDelay) {
    const slotEl = document.getElementById(slotId);
    if (!slotEl) return;
    let idx = ((startIdx % POPUPS_DATA.length) + POPUPS_DATA.length) % POPUPS_DATA.length;

    // Show first card immediately
    const first = makeCard(idx);
    slotEl.appendChild(first);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { first.classList.remove('fade-in-start'); });
    });

    function cycle() {
      const existing = slotEl.querySelector('.popup-card');
      if (!existing) return;

      idx = (idx + STEP) % POPUPS_DATA.length;
      slotEl.style.zIndex = '4';

      // Add new card on top while old is still visible — true cross-fade
      const newCard = makeCard(idx);
      slotEl.appendChild(newCard);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { newCard.classList.remove('fade-in-start'); });
      });

      // Remove old card after fade completes
      setTimeout(function () {
        if (existing.parentNode === slotEl) slotEl.removeChild(existing);
        slotEl.style.zIndex = BASE_ZINDEX[slotId];
      }, FADE_MS + 50);
    }

    setTimeout(function () { setInterval(cycle, CYCLE_MS); }, initialDelay);
  }

  initSlot('slot-0', 0, 0);
  initSlot('slot-1', 2, 2334);
  initSlot('slot-2', 4, 4667);
})();
