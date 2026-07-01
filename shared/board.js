// Template logic for "board" slides. Reads two globals the slide defines:
//   EVENTS    = [{ icon, date, label, time, dateObj }]
//   BIRTHDAYS = [{ name, date, dateObj }]
// Renders the upcoming list, next-event countdown, and month badge.
// Row reveal/stagger animation lives in board.css (driven by the --i index).

(function () {
  const events = (typeof EVENTS !== 'undefined') ? EVENTS : [];
  const birthdays = (typeof BIRTHDAYS !== 'undefined') ? BIRTHDAYS : [];

  function today() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function upcomingFrom(items) {
    const now = today();
    return items.filter(function (item) { return item.dateObj >= now; });
  }

  function renderEvents() {
    const upcoming = upcomingFrom(events);
    const list = document.getElementById('events-list');
    if (list) {
      list.innerHTML = upcoming.map(function (ev, i) {
        return '' +
          '<div class="event-row' + (i === 0 ? ' next' : '') + '" style="--i:' + i + '">' +
          '<span class="event-icon">' + ev.icon + '</span>' +
          '<span class="event-date">' + ev.date + '</span>' +
          '<div class="event-divider"></div>' +
          '<div class="event-info">' +
            '<div class="event-name">' + ev.label + '</div>' +
            (ev.time ? '<div class="event-time">' + ev.time + '</div>' : '') +
          '</div>' +
          (i === 0 ? '<span class="event-tag">Next up</span>' : '') +
          '</div>';
      }).join('');
    }

    if (upcoming.length) {
      const todayStr = new Date().toDateString();
      const todayEvents = upcoming.filter(function (ev) { return ev.dateObj.toDateString() === todayStr; });
      const name = document.getElementById('cd-name');
      const days = document.getElementById('cd-days');
      const unit = document.getElementById('cd-unit');
      const label = document.querySelector('.countdown-label');

      if (todayEvents.length > 1) {
        if (label) label.textContent = 'Next event';
        if (name) {
          name.style.whiteSpace = 'normal';
          name.innerHTML = todayEvents.map(function (ev) { return '<div style="margin-bottom:10px">' + ev.icon + ' ' + ev.label + '</div>'; }).join('');
        }
        if (days) days.textContent = 'Today';
        if (unit) unit.textContent = '';
      } else {
        const next = upcoming[0];
        const diff = Math.round((next.dateObj - today()) / 86400000);
        if (name) name.textContent = next.icon + ' ' + next.label;
        if (days) days.textContent = diff === 0 ? 'Today' : diff;
        if (unit) unit.textContent = diff === 0 ? '' : diff === 1 ? 'day to go' : 'days to go';
      }
    }
  }

  function renderBirthdays() {
    const upcoming = upcomingFrom(birthdays);
    const section = document.getElementById('bdays-section');
    const list = document.getElementById('bdays-list');
    if (!upcoming.length) { if (section) section.style.display = 'none'; return; }
    if (list) {
      const now = today();
      list.innerHTML = upcoming.map(function (b, i) {
        const isToday = b.dateObj.toDateString() === now.toDateString();
        return '<div class="bday-row" style="--i:' + i + '">' +
          '<span class="bday-icon">🎂</span>' +
          '<span class="bday-name">' + b.name + '</span>' +
          (isToday ? '<span class="bday-today">Today!</span>' : '<span class="bday-date">' + b.date + '</span>') +
          '</div>';
      }).join('');
    }
  }

  const badge = document.getElementById('month-badge');
  if (badge) badge.textContent = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  renderEvents();
  renderBirthdays();
})();
