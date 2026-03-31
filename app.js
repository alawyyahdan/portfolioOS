/* ═══════════════════════════════════════════════════════════════
   Portfolio OS — App Logic
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────── BOOT SEQUENCE ─────────────── */
(function bootSequence() {
  const bootScreen = document.getElementById('boot-screen');
  const bar = document.getElementById('boot-bar');
  const desktop = document.getElementById('desktop');

  let pct = 0;
  const steps = [
    { target: 12, delay: 180 },
    { target: 28, delay: 220 },
    { target: 45, delay: 160 },
    { target: 60, delay: 280 },
    { target: 72, delay: 200 },
    { target: 85, delay: 240 },
    { target: 95, delay: 180 },
    { target: 100, delay: 300 },
  ];

  let stepIdx = 0;

  function runStep() {
    if (stepIdx >= steps.length) {
      // Boot done — reveal desktop
      setTimeout(() => {
        bootScreen.classList.add('fade-out');
        desktop.classList.remove('hidden');
        // Open About window by default after boot
        setTimeout(() => openWindow('win-about'), 400);
        setTimeout(() => showNotification('Welcome to Portfolio OS! Double-click any icon to open.'), 1200);
        setTimeout(() => { bootScreen.style.display = 'none'; }, 900);
      }, 300);
      return;
    }
    const step = steps[stepIdx++];
    pct = step.target;
    bar.style.width = pct + '%';
    setTimeout(runStep, step.delay);
  }

  setTimeout(runStep, 600);
})();


/* ──────────────────────────────── CLOCK ─────────────── */
function updateClock() {
  const el = document.getElementById('taskbar-clock');
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  el.textContent = h + ':' + m;
}
updateClock();
setInterval(updateClock, 5000);


/* ──────────────────────────────── WINDOW MANAGER ─────────────── */
const windows = {};   // id → { el, minimized, maximized, prevRect }
const taskbarEl = document.getElementById('taskbar-items');
let zCounter = 20;

const WINDOW_META = {
  'win-about': { title: 'About Me', icon: 'icons/user.svg' },
  'win-projects': { title: 'Projects', icon: 'icons/folder.svg' },
  'win-skills': { title: 'Skills', icon: 'icons/skills.svg' },
  'win-contact': { title: 'Contact', icon: 'icons/mail.svg' },
  'win-error': { title: 'Fatal Error', icon: null },
  'win-sent': { title: 'Message Sent', icon: null },
};

function registerWindow(id) {
  const el = document.getElementById(id);
  if (!el) return;
  windows[id] = { el, minimized: false, maximized: false, prevRect: null };
  attachTitlebarDrag(el);
  attachResize(el);
  attachWindowControls(el, id);
}

document.querySelectorAll('.win95-window').forEach(w => registerWindow(w.id));


function openWindow(id) {
  const meta = windows[id];
  if (!meta) return;
  const el = meta.el;

  meta.minimized = false;
  el.removeAttribute('hidden');
  el.classList.remove('win-minimized');
  focusWindow(id);
  addTaskbarItem(id);
  animateWindowOpen(el);
}

function focusWindow(id) {
  // Deactivate all
  Object.keys(windows).forEach(wid => {
    windows[wid].el.classList.remove('active');
    const tb = document.querySelector(`.taskbar-item[data-win="${wid}"]`);
    if (tb) tb.classList.remove('active');
  });
  // Activate this one
  const el = windows[id].el;
  el.classList.add('active');
  el.style.zIndex = ++zCounter;
  const tb = document.querySelector(`.taskbar-item[data-win="${id}"]`);
  if (tb) tb.classList.add('active');
}

function closeWindow(id) {
  const meta = windows[id];
  if (!meta) return;
  meta.el.setAttribute('hidden', '');
  meta.minimized = false;
  meta.maximized = false;
  removeTaskbarItem(id);
}

function minimizeWindow(id) {
  const meta = windows[id];
  if (!meta) return;
  meta.el.setAttribute('hidden', '');
  meta.minimized = true;
  const tb = document.querySelector(`.taskbar-item[data-win="${id}"]`);
  if (tb) tb.classList.remove('active');
}

function maximizeWindow(id) {
  const meta = windows[id];
  if (!meta) return;
  const el = meta.el;
  if (!meta.maximized) {
    meta.prevRect = { top: el.style.top, left: el.style.left, width: el.style.width, height: el.style.height };
    el.classList.add('win-maximized');
    meta.maximized = true;
  } else {
    el.classList.remove('win-maximized');
    const r = meta.prevRect;
    el.style.top = r.top;
    el.style.left = r.left;
    el.style.width = r.width;
    el.style.height = r.height;
    meta.maximized = false;
  }
}

function animateWindowOpen(el) {
  el.style.animation = 'none';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.animation = 'winOpen 0.15s ease-out';
    });
  });
}

/* Controls (min/max/close) */
function attachWindowControls(el, id) {
  el.querySelector('.btn-close')?.addEventListener('click', () => closeWindow(id));
  el.querySelector('.btn-min')?.addEventListener('click', () => minimizeWindow(id));
  el.querySelector('.btn-max')?.addEventListener('click', () => maximizeWindow(id));
  el.addEventListener('mousedown', () => focusWindow(id), true);
}


/* ──────────────────────────────── TASKBAR ITEMS ─────────────── */
function addTaskbarItem(id) {
  if (document.querySelector(`.taskbar-item[data-win="${id}"]`)) return;
  const meta = WINDOW_META[id] || { title: id, icon: null };
  const item = document.createElement('button');
  item.className = 'taskbar-item';
  item.dataset.win = id;
  item.setAttribute('aria-label', 'Window: ' + meta.title);
  if (meta.icon) {
    const img = document.createElement('img');
    img.src = meta.icon; img.alt = '';
    item.appendChild(img);
  }
  item.appendChild(document.createTextNode(meta.title));
  item.addEventListener('click', () => {
    const m = windows[id];
    if (m.minimized) {
      openWindow(id);
    } else if (m.el.classList.contains('active')) {
      minimizeWindow(id);
    } else {
      focusWindow(id);
    }
  });
  taskbarEl.appendChild(item);
}

function removeTaskbarItem(id) {
  document.querySelector(`.taskbar-item[data-win="${id}"]`)?.remove();
}


/* ──────────────────────────────── DRAG (mouse + touch) ─────── */
function attachTitlebarDrag(win) {
  const titlebar = win.querySelector('.win-titlebar');
  if (!titlebar) return;

  let startX, startY, startL, startT, dragging = false;

  function dragStart(clientX, clientY) {
    if (windows[win.id]?.maximized) return;
    dragging = true;
    startX = clientX;
    startY = clientY;
    startL = parseInt(win.style.left) || 0;
    startT = parseInt(win.style.top)  || 0;
    win.classList.add('dragging');
  }

  function dragMove(clientX, clientY) {
    if (!dragging) return;
    let newL = startL + (clientX - startX);
    let newT = startT + (clientY - startY);
    const deskH = window.innerHeight - 40;
    newL = Math.max(-win.offsetWidth + 80, Math.min(window.innerWidth - 80, newL));
    newT = Math.max(0, Math.min(deskH - 30, newT));
    win.style.left = newL + 'px';
    win.style.top  = newT + 'px';
  }

  function dragEnd() {
    if (dragging) {
      dragging = false;
      win.classList.remove('dragging');
    }
  }

  /* Mouse */
  titlebar.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('win-btn')) return;
    dragStart(e.clientX, e.clientY);
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => dragMove(e.clientX, e.clientY));
  document.addEventListener('mouseup',   dragEnd);

  /* Touch */
  titlebar.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('win-btn')) return;
    const t = e.touches[0];
    dragStart(t.clientX, t.clientY);
    e.preventDefault();
  }, { passive: false });

  titlebar.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    dragMove(t.clientX, t.clientY);
    e.preventDefault();
  }, { passive: false });

  titlebar.addEventListener('touchend', dragEnd);

  /* Double-tap/click title to maximize */
  titlebar.addEventListener('dblclick', (e) => {
    if (!e.target.classList.contains('win-btn')) maximizeWindow(win.id);
  });

  let lastTap = 0;
  titlebar.addEventListener('touchend', (e) => {
    if (e.target.classList.contains('win-btn')) return;
    const now = Date.now();
    if (now - lastTap < 350) maximizeWindow(win.id);
    lastTap = now;
  });
}


/* ──────────────────────────────── RESIZE (mouse + touch) ────── */
function attachResize(win) {
  const handle = win.querySelector('.resize-handle');
  if (!handle) return;

  let resizing = false, startX, startY, startW, startH;

  function resizeStart(clientX, clientY) {
    if (windows[win.id]?.maximized) return;
    resizing = true;
    startX = clientX; startY = clientY;
    startW = win.offsetWidth; startH = win.offsetHeight;
  }

  function resizeMove(clientX, clientY) {
    if (!resizing) return;
    win.style.width  = Math.max(200, startW + (clientX - startX)) + 'px';
    win.style.height = Math.max(120, startH + (clientY - startY)) + 'px';
  }

  /* Mouse */
  handle.addEventListener('mousedown', (e) => {
    resizeStart(e.clientX, e.clientY);
    e.preventDefault(); e.stopPropagation();
  });
  document.addEventListener('mousemove', (e) => resizeMove(e.clientX, e.clientY));
  document.addEventListener('mouseup',   () => { resizing = false; });

  /* Touch */
  handle.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    resizeStart(t.clientX, t.clientY);
    e.preventDefault(); e.stopPropagation();
  }, { passive: false });

  handle.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    resizeMove(t.clientX, t.clientY);
    e.preventDefault();
  }, { passive: false });

  handle.addEventListener('touchend', () => { resizing = false; });
}


/* ──────────────────────────────── DESKTOP ICONS ─────────────── */
document.querySelectorAll('.desktop-icon[data-window]').forEach(icon => {
  let clicks = 0, clickTimer;
  const open = () => {
    const winId = icon.dataset.window;
    openWindow(winId);
  };
  icon.addEventListener('click', () => {
    clicks++;
    if (clicks === 1) {
      clickTimer = setTimeout(() => { clicks = 0; }, 400);
    } else {
      clearTimeout(clickTimer);
      clicks = 0;
      open();
    }
  });
  icon.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
  // Single click = select
  icon.addEventListener('click', () => {
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    icon.classList.add('selected');
  });
});

// Deselect icons on desktop click
document.getElementById('desktop').addEventListener('click', (e) => {
  if (!e.target.closest('.desktop-icon') && !e.target.closest('.win95-window') && !e.target.closest('#taskbar') && !e.target.closest('#start-menu')) {
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
  }
});


/* ──────────────────────────────── START MENU ─────────────── */
const startBtn = document.getElementById('start-btn');
const startMenu = document.getElementById('start-menu');

startBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = startMenu.classList.contains('hidden');
  startMenu.classList.toggle('hidden');
  startBtn.classList.toggle('active', open);
  startBtn.setAttribute('aria-expanded', String(open));
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
    startMenu.classList.add('hidden');
    startBtn.classList.remove('active');
    startBtn.setAttribute('aria-expanded', 'false');
  }
});

document.querySelectorAll('#start-menu li[data-window]').forEach(item => {
  item.addEventListener('click', () => {
    startMenu.classList.add('hidden');
    startBtn.classList.remove('active');
    openWindow(item.dataset.window);
  });
});

document.getElementById('start-error')?.addEventListener('click', () => {
  startMenu.classList.add('hidden');
  startBtn.classList.remove('active');
  openWindow('win-error');
});

document.getElementById('start-shutdown')?.addEventListener('click', () => {
  startMenu.classList.add('hidden');
  startBtn.classList.remove('active');
  showShutdown();
});

document.getElementById('err-ok')?.addEventListener('click', () => closeWindow('win-error'));
document.getElementById('sent-ok')?.addEventListener('click', () => closeWindow('win-sent'));


/* ──────────────────────────────── PROJECTS ─────────────── */
const projGrid = document.getElementById('proj-grid');
const projInfo = document.getElementById('proj-info');
const projStatus = document.getElementById('proj-status');

document.querySelectorAll('.proj-view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.proj-view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (btn.dataset.view === 'list') {
      projGrid.classList.add('list-view');
    } else {
      projGrid.classList.remove('list-view');
    }
  });
});

document.querySelectorAll('.proj-item').forEach(item => {
  let clickCount = 0, timer;
  item.addEventListener('click', () => {
    document.querySelectorAll('.proj-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    projStatus.textContent = item.querySelector('span').textContent + ' selected';
    clickCount++;
    if (clickCount === 1) {
      timer = setTimeout(() => { clickCount = 0; }, 400);
    } else {
      clearTimeout(timer);
      clickCount = 0;
      // Show description
      projInfo.innerHTML = '📁 ' + item.dataset.info;
      // Show/hide Visit Project button
      const visitRow = document.getElementById('proj-visit-row');
      const visitLink = document.getElementById('proj-visit-link');
      if (item.dataset.url) {
        visitLink.href = item.dataset.url;
        visitRow.style.display = 'flex';
      } else {
        visitRow.style.display = 'none';
      }
    }
  });
});


/* ──────────────────────────────── SKILLS TABS ─────────────── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const panel = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + panel)?.classList.add('active');
    // Animate bars
    document.querySelectorAll('#tab-' + panel + ' .skill-bar').forEach(bar => {
      const w = bar.style.width;
      bar.style.width = '0%';
      setTimeout(() => { bar.style.width = w; }, 50);
    });
  });
});


/* ──────────────────────────────── CONTACT FORM ─────────────── */
/* ── GANTI INI dengan endpoint Formspree kamu ──────────────────── */
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mykbjwwj';
/* ────────────────────────────────────────────────────────────────── */

document.getElementById('btn-send')?.addEventListener('click', async () => {
  const name = document.getElementById('c-name').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const subject = document.getElementById('c-subject').value.trim();
  const message = document.getElementById('c-msg').value.trim();

  if (!name || !email || !message) {
    showAlert('Please fill in Name, Email, and Message.');
    return;
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAlert('Please enter a valid email address.');
    return;
  }

  // Show sending state
  const sendBtn = document.getElementById('btn-send');
  const origText = sendBtn.textContent;
  sendBtn.textContent = '⏳ Sending…';
  sendBtn.disabled = true;

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message, _replyto: email }),
    });

    if (res.ok) {
      // Success — show Win95 dialog & clear form
      openWindow('win-sent');
      document.getElementById('c-name').value = '';
      document.getElementById('c-email').value = '';
      document.getElementById('c-subject').value = '';
      document.getElementById('c-msg').value = '';
    } else {
      const data = await res.json().catch(() => ({}));
      const errMsg = data?.errors?.map(e => e.message).join(', ') || 'Server error. Please try again.';
      showAlert('Failed to send: ' + errMsg);
    }
  } catch (err) {
    showAlert('Network error. Please check your connection and try again.');
  } finally {
    sendBtn.textContent = origText;
    sendBtn.disabled = false;
  }
});

document.getElementById('btn-clear')?.addEventListener('click', () => {
  ['c-name', 'c-email', 'c-subject', 'c-msg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
});


/* ──────────────────────────────── NOTIFICATION BALLOON ─────── */
function showNotification(text) {
  const balloon = document.getElementById('notif-balloon');
  document.getElementById('notif-text').textContent = text;
  balloon.classList.remove('hidden');
  setTimeout(() => balloon.classList.add('hidden'), 4500);
}


/* ──────────────────────────────── ALERT (Win95-style) ────────── */
function showAlert(msg) {
  const errText = document.querySelector('#win-error .error-text');
  if (errText) {
    errText.innerHTML = `<p><strong>⚠️ Warning</strong></p><p>${msg}</p>`;
  }
  openWindow('win-error');
}


/* ──────────────────────────────── SHUTDOWN ─────────────── */
function showShutdown() {
  const bootScreen = document.getElementById('boot-screen');
  const bar = document.getElementById('boot-bar');
  const desktop = document.getElementById('desktop');

  desktop.style.opacity = '0';
  desktop.style.transition = 'opacity 0.5s ease';

  setTimeout(() => {
    desktop.classList.add('hidden');
    bootScreen.style.display = 'flex';
    bootScreen.style.opacity = '1';
    bootScreen.classList.remove('fade-out');
    // Change boot screen to shutdown message
    document.querySelector('.boot-subtitle').textContent = 'It is now safe to turn off your computer.';
    document.querySelector('.boot-bar-wrap').style.display = 'none';
    // Restart after 3s
    setTimeout(() => {
      document.querySelector('.boot-subtitle').textContent = 'Starting Portfolio OS…';
      document.querySelector('.boot-bar-wrap').style.display = '';
      bar.style.width = '0%';
      desktop.classList.remove('hidden');
      desktop.style.opacity = '1';
      bootScreen.classList.add('fade-out');
      setTimeout(() => { bootScreen.style.display = 'none'; }, 900);
    }, 2800);
  }, 600);
}


/* ──────────────────────────────── KEYBOARD SHORTCUTS ─────────── */
document.addEventListener('keydown', (e) => {
  // Escape closes start menu
  if (e.key === 'Escape') {
    startMenu.classList.add('hidden');
    startBtn.classList.remove('active');
  }
});


/* ──────────────────────────────── MOBILE WALL ─────────────── */
(function mobileWall() {
  const wall = document.getElementById('mobile-wall');
  const btn = document.getElementById('mobile-continue');
  if (!wall || !btn) return;

  btn.addEventListener('click', () => {
    wall.classList.add('dismissed');
  });

  // Re-show if resized back to mobile (unless already dismissed in this session)
  let dismissed = false;
  btn.addEventListener('click', () => { dismissed = true; });

  window.addEventListener('resize', () => {
    if (!dismissed && window.innerWidth < 768) {
      wall.classList.remove('dismissed');
    }
  });
})();
