/* ALERTIFY — shared front-end behaviour */
(function () {
  'use strict';
  var csrf = (document.querySelector('meta[name="csrf-token"]') || {}).content || '';
  window.ALERTIFY = window.ALERTIFY || {};
  ALERTIFY.csrf = csrf;

  ALERTIFY.postJSON = function (url, body) {
    return fetch(url, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify(body || {})
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) { var e = new Error(data.error || 'Something went wrong. Please try again.'); e.data = data; throw e; }
        return data;
      });
    });
  };

  ALERTIFY.toast = function (msg, kind) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var t = document.createElement('div');
    t.className = 'toast toast-' + (kind || 'info');
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 3200);
    setTimeout(function () { t.remove(); }, 3700);
  };

  ALERTIFY.esc = function (s) {
    var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML;
  };

  // --- sidebar (mobile)
  var sidebar = document.getElementById('sidebar'), scrim = document.getElementById('scrim'),
      menuBtn = document.getElementById('menu-btn');
  function setNav(open) {
    if (!sidebar) return;
    sidebar.classList.toggle('open', open);
    if (scrim) scrim.hidden = !open;
    if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('nav-open', open);
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setNav(!sidebar.classList.contains('open')); });
  if (scrim) scrim.addEventListener('click', function () { setNav(false); });

  // --- dropdowns
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-dropdown]');
    document.querySelectorAll('.menu.open').forEach(function (m) {
      if (!trigger || m.id !== trigger.dataset.dropdown) m.classList.remove('open');
    });
    if (trigger) {
      e.preventDefault();
      document.getElementById(trigger.dataset.dropdown).classList.toggle('open');
    } else if (!e.target.closest('.menu')) {
      document.querySelectorAll('.menu.open').forEach(function (m) { m.classList.remove('open'); });
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.menu.open').forEach(function (m) { m.classList.remove('open'); });
      setNav(false);
    }
  });

  // --- mark notifications read
  var markBtn = document.getElementById('mark-read');
  if (markBtn) markBtn.addEventListener('click', function () {
    ALERTIFY.postJSON('/notifications/read-all').then(function () {
      document.querySelectorAll('.notif-item.unread').forEach(function (n) { n.classList.remove('unread'); });
      var dc = document.querySelector('.dot-count'); if (dc) dc.remove();
      markBtn.remove();
    }).catch(function (err) { ALERTIFY.toast(err.message, 'error'); });
  });

  // --- confirm dialogs
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.dataset.confirm && !window.confirm(f.dataset.confirm)) { e.preventDefault(); return; }
    if (f.hasAttribute('data-logout')) {
      try { localStorage.removeItem('alertify_last_report'); } catch (x) {}
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'clear-private' });
      }
    }
    if (f.hasAttribute('data-validate') && !f.checkValidity()) {
      e.preventDefault();
      var bad = f.querySelector(':invalid');
      if (bad) { bad.focus(); bad.reportValidity && bad.reportValidity(); }
    }
  }, true);

  // --- auto-dismiss success flashes
  setTimeout(function () {
    document.querySelectorAll('.flash-success, .flash-info').forEach(function (f) { f.classList.add('fade'); });
  }, 6000);

  // --- online / offline indicator
  var pill = document.getElementById('net-pill');
  function net() { if (pill) pill.hidden = navigator.onLine; }
  window.addEventListener('online', net); window.addEventListener('offline', net); net();

  // --- cache contacts for offline use
  if (navigator.onLine) {
    fetch('/api/contacts', { credentials: 'same-origin' }).then(function (r) { return r.json(); })
      .then(function (d) { try { localStorage.setItem('alertify_contacts', JSON.stringify(d.contacts)); } catch (e) {} })
      .catch(function () {});
  }

  // --- base map shared by every Leaflet map in the app (one place to change it).
  // OpenStreetMap's tile servers require a Referer header; app.py sends the site
  // origin via "Referrer-Policy: strict-origin-when-cross-origin" so tiles load.
  ALERTIFY.addBaseMap = function (map) {
    return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  };

  // --- service worker
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {}); });
  }
})();
