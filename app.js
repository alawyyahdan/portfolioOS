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
    { target: 20, delay: 100 },
    { target: 45, delay: 150 },
    { target: 70, delay: 200 },
    { target: 90, delay: 250 }
  ];

  let stepIdx = 0;
  let isFinished = false;

  function finishBoot() {
    if (isFinished) return;
    isFinished = true;
    bar.style.width = '100%';
    setTimeout(() => {
      bootScreen.classList.add('fade-out');
      desktop.classList.remove('hidden');
      // Open About window by default after boot
      setTimeout(() => openWindow('win-about'), 400);
      setTimeout(() => showNotification('Welcome to Portfolio OS! Double-click any icon to open.'), 1200);
      setTimeout(() => showNotification('Love web scraping? Try our brand new tool. Just click on <strong>Scraptor</strong>!', '✨ New Tool!'), 6500);
      setTimeout(() => { bootScreen.style.display = 'none'; }, 900);
    }, 400);
  }

  function runStep() {
    if (stepIdx >= steps.length) {
      // WaitFor REAL loading
      if (document.readyState === 'complete') {
        finishBoot();
      } else {
        window.addEventListener('load', finishBoot);
        // Fallback timeout in case some image hangs
        setTimeout(finishBoot, 5000);
      }
      return;
    }
    const step = steps[stepIdx++];
    pct = step.target;
    bar.style.width = pct + '%';
    setTimeout(runStep, step.delay);
  }

  setTimeout(runStep, 300);
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
  'win-explorer': { title: 'Documents', icon: 'icons/folder.svg' },
  'win-redirect-warning': { title: 'Warning', icon: null },
  'win-scraptor-warning': { title: 'Warning', icon: null },
  'win-donate': { title: 'Donate', icon: null },
  'win-notepad1': { title: 'readme.txt', icon: null },
  'win-notepad2': { title: 'notes.txt', icon: null },
  'win-notepad3': { title: 'scratch.txt', icon: null },
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
    startT = parseInt(win.style.top) || 0;
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
    win.style.top = newT + 'px';
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
  document.addEventListener('mouseup', dragEnd);

  /* Touch */
  titlebar.addEventListener('touchstart', (e) => {
    if (e.target.closest('.win-btn')) return;
    if (e.touches.length > 1) return; // ignore multi-touch
    const t = e.touches[0];
    dragStart(t.clientX, t.clientY);
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    dragMove(t.clientX, t.clientY);
    e.preventDefault(); // Stop mobile browser from scrolling the page
  }, { passive: false });

  document.addEventListener('touchend', dragEnd);

  /* Double-tap/click title to maximize */
  titlebar.addEventListener('dblclick', (e) => {
    if (!e.target.closest('.win-btn')) maximizeWindow(win.id);
  });

  let lastTap = 0;
  titlebar.addEventListener('touchend', (e) => {
    if (e.target.closest('.win-btn')) return;
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
    win.style.width = Math.max(200, startW + (clientX - startX)) + 'px';
    win.style.height = Math.max(120, startH + (clientY - startY)) + 'px';
  }

  /* Mouse */
  handle.addEventListener('mousedown', (e) => {
    resizeStart(e.clientX, e.clientY);
    e.preventDefault(); e.stopPropagation();
  });
  document.addEventListener('mousemove', (e) => resizeMove(e.clientX, e.clientY));
  document.addEventListener('mouseup', () => { resizing = false; });

  /* Touch */
  handle.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) return;
    const t = e.touches[0];
    resizeStart(t.clientX, t.clientY);
    e.stopPropagation();
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (!resizing) return;
    const t = e.touches[0];
    resizeMove(t.clientX, t.clientY);
    e.preventDefault(); // Stop mobile browser scrolling
  }, { passive: false });

  document.addEventListener('touchend', () => { resizing = false; });
}


/* ──────────────────────────────── DESKTOP ICONS (drag + click) ── */
document.querySelectorAll('.desktop-icon').forEach(icon => {
  let dragging = false, moved = false;
  let startX, startY, startL, startT;
  let clickCount = 0, clickTimer;

  function activate() {
    if (icon.id === 'icon-recycle') {
      if (typeof triggerBSOD === 'function') triggerBSOD();
      return;
    }
    if (icon.dataset.window) openWindow(icon.dataset.window);
  }

  function dragStart(cx, cy) {
    dragging = true; moved = false;
    startX = cx; startY = cy;
    startL = parseInt(icon.style.left) || 0;
    startT = parseInt(icon.style.top) || 0;
    icon.style.zIndex = 50;
  }

  function dragMove(cx, cy) {
    if (!dragging) return;
    if (Math.abs(cx - startX) > 4 || Math.abs(cy - startY) > 4) moved = true;
    if (!moved) return; // don't reposition until clearly dragging
    const deskH = window.innerHeight - 40;
    icon.style.left = Math.max(0, Math.min(window.innerWidth - icon.offsetWidth, startL + cx - startX)) + 'px';
    icon.style.top = Math.max(0, Math.min(deskH - icon.offsetHeight, startT + cy - startY)) + 'px';
  }

  function dragEnd() {
    if (!dragging) return;
    dragging = false;
    icon.style.zIndex = '';

    if (!moved) {
      // Treat as click: single = select, double = open
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(() => { clickCount = 0; }, 400);
      } else {
        clearTimeout(clickTimer);
        clickCount = 0;
        activate();
      }
    }
  }

  // Mouse
  icon.addEventListener('mousedown', e => {
    dragStart(e.clientX, e.clientY);
    e.stopPropagation();
  });
  document.addEventListener('mousemove', e => dragMove(e.clientX, e.clientY));
  document.addEventListener('mouseup', dragEnd);

  // Touch — tap to select/open, drag to move
  let lastTap = 0;
  icon.addEventListener('touchstart', e => {
    const t = e.touches[0];
    dragStart(t.clientX, t.clientY);
    e.stopPropagation();
  }, { passive: true });

  icon.addEventListener('touchmove', e => {
    const t = e.touches[0];
    dragMove(t.clientX, t.clientY);
    if (moved) e.preventDefault();
  }, { passive: false });

  icon.addEventListener('touchend', e => {
    dragEnd();
    if (!moved) {
      const now = Date.now();
      if (now - lastTap < 400) activate();
      lastTap = now;
    }
  });

  // Keyboard
  icon.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
  });
});

// Deselect on bare desktop click
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
function showNotification(text, title = '📬 New Message') {
  const balloon = document.getElementById('notif-balloon');
  const titleEl = document.getElementById('notif-title');
  if (titleEl) titleEl.innerHTML = title;
  document.getElementById('notif-text').innerHTML = text;
  balloon.classList.remove('hidden');

  if (balloon.hideTimeout) clearTimeout(balloon.hideTimeout);
  balloon.hideTimeout = setTimeout(() => balloon.classList.add('hidden'), 5000);
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


/* ──────────────────────────────── NOTEPAD ─────────────── */
(function initNotepads() {
  // Readonly pads — just compute word count when content is set
  ['notepad1-area', 'notepad2-area'].forEach(id => {
    const area = document.getElementById(id);
    const words = document.getElementById(id.replace('-area', '-words'));
    if (!area || !words) return;
    const count = () => {
      const w = area.value.trim() === '' ? 0 : area.value.trim().split(/\s+/).length;
      words.textContent = `${w} word${w !== 1 ? 's' : ''}`;
    };
    count();
    new MutationObserver(count).observe(area, { characterData: true, subtree: true });
  });

  // Editable pad — full status tracking
  const area = document.getElementById('notepad3-area');
  const status = document.getElementById('notepad3-status');
  const words = document.getElementById('notepad3-words');
  const title = document.getElementById('notepad3-title');
  if (!area) return;

  let dirty = false;
  function updateStatus() {
    const text = area.value.substring(0, area.selectionStart);
    const ln = text.split('\n').length;
    const col = text.split('\n').pop().length + 1;
    if (status) status.textContent = `Ln ${ln}, Col ${col}`;
    const w = area.value.trim() === '' ? 0 : area.value.trim().split(/\s+/).length;
    if (words) words.textContent = `${w} word${w !== 1 ? 's' : ''}`;
    if (!dirty && area.value.length > 0) {
      dirty = true;
      if (title) title.textContent = `*scratch.txt \u2014 Notepad`;
    } else if (area.value.length === 0) {
      dirty = false;
      if (title) title.textContent = `scratch.txt \u2014 Notepad`;
    }
  }
  area.addEventListener('input', updateStatus);
  area.addEventListener('keyup', updateStatus);
  area.addEventListener('click', updateStatus);
  area.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'a') e.stopPropagation(); });
})();


/* ──────────────────────────────── EXPLORER & PDF ─────────────── */
// ADD YOUR PDF LINKS HERE!
// Note: if your server forces download (like drive.bica.ca api usually does),
// the browser will download it automatically. We use Google Docs Viewer to force it to show up.
const MY_PDFS = [
  { name: "MLT_Akhir_5.pdf", url: "https://drive.bica.ca/api/raw?path=/coolyeah/SMT%205/ML%20Teo/MLT_Akhir_5.docx.pdf", forceViewer: true },
  { name: "Project_Akhir_Computer_Vision_Kelompok_8.pdf", url: "https://drive.bica.ca/api/raw?path=/coolyeah/SMT%205/Comvis/Project%20Akhir%20Computer%20Vision%20Kelompok%208.pdf", forceViewer: true },
  { name: "Implementation_of_A-Star_Algorithm_for_Shortest_Path_Logistic_Problem.pdf", url: "https://drive.bica.ca/api/raw?path=/coolyeah/SMT%204/AI/AI%20TUGAS%20AKHIR/Implementation%20of%20A-Star%20Algorithm%20for%20Shortest%20Path%20Logistic%20Problem.pdf", forceViewer: true },
  { name: "Eksbot_Final_Project.pdf", url: "https://drive.bica.ca/api/raw?path=/coolyeah/SMT%204/EksBot/Eksbot%20Final%20Project.pdf", forceViewer: true },
  { name: "Final_Project_IoT.pdf", url: "https://drive.bica.ca/api/raw?path=/coolyeah/SMT%204/IoT/Final%20Project%20IoT.pdf", forceViewer: true },
  { name: "Tugas_Makalah_Sensor.pdf", url: "https://drive.bica.ca/api/raw?path=/coolyeah/SMT%204/Sensor/Tugas%20Makalah.pdf", forceViewer: true },
  { name: "Laporan_Akhir_Siskon.pdf", url: "https://drive.bica.ca/coolyeah/SMT%204/SisKon/Laporan%20Akhir%20Siskon_163231048_163231092_163221023_163231053.pdf", forceViewer: true },
  { name: "FinalProjectSislin.pdf", url: "https://drive.bica.ca/api/raw?path=/coolyeah/SMT%203/SisLin/tugas%20akhir/FINAL%20PROJECT%20REPORT%20PART%202.pdf", forceViewer: true }
];

(function initExplorer() {
  const explorerFiles = document.getElementById('explorer-files');
  const explorerStatus = document.getElementById('explorer-status');
  if (!explorerFiles) return;

  // Render icons (replace underscores with spaces for cleaner word-wrap)
  explorerFiles.innerHTML = MY_PDFS.map((pdf, idx) => `
    <div class="explorer-item" data-idx="${idx}" tabindex="0">
      <img src="icons/pdf.svg" alt="PDF">
      <span>${pdf.name.replace(/_/g, ' ')}</span>
    </div>
  `).join('');

  if (explorerStatus) {
    explorerStatus.textContent = `${MY_PDFS.length} object(s)`;
  }

  // Handle click/selection and double-click to open
  const items = explorerFiles.querySelectorAll('.explorer-item');
  let clickCount = 0;
  let clickTimer;

  function openPdf(idx) {
    const pdf = MY_PDFS[idx];
    const winId = `win-pdfviewer-${idx}`;

    if (!document.getElementById(winId)) {
      // Build Google Docs Wrapper if forced
      let finalUrl = pdf.url;
      if (pdf.forceViewer) {
        finalUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdf.url)}&embedded=true`;
      }

      // Generate dynamic window HTML
      const winHTML = `
        <div class="win95-window" id="${winId}" style="top:${120 + (idx * 25)}px;left:${160 + (idx * 25)}px;width:600px;height:450px;" hidden>
          <div class="win-titlebar">
            <div class="win-title-left">
              <img src="icons/pdf.svg" class="win-icon" alt="" />
              <span>${pdf.name} \u2014 PDF Viewer</span>
            </div>
            <div class="win-controls">
              <button class="win-btn btn-min" aria-label="Minimize">_</button>
              <button class="win-btn btn-max" aria-label="Maximize">□</button>
              <button class="win-btn btn-close" aria-label="Close">✕</button>
            </div>
          </div>
          <div class="win-menubar">
            <span>File</span><span>View</span><span>Help</span>
          </div>
          
          <!-- Thin Progress Bar at the top of the viewer -->
          <div id="${winId}-loader" style="height: 4px; background: var(--btn-face); border-bottom: 1px solid var(--btn-sh); width: 100%;">
            <div style="height: 100%; background: linear-gradient(90deg, var(--accent), #1084d0); animation: pdfLoadSweep 1.5s infinite linear;"></div>
          </div>
          
          <div class="win-content" style="padding:0; overflow:hidden;">
            <!-- Actual PDF Frame -->
            <iframe id="${winId}-iframe" src="${finalUrl}" style="width:100%; height:100%; border:none;" title="PDF Viewer"></iframe>
          </div>
          <div class="resize-handle"></div>
        </div>
      `;

      // Insert directly into DOM
      const taskbar = document.getElementById('taskbar');
      if (taskbar) taskbar.insertAdjacentHTML('beforebegin', winHTML);

      // Register dynamically into the OS
      WINDOW_META[winId] = { title: pdf.name, icon: 'icons/pdf.svg' };
      registerWindow(winId);

      // Listen for the iframe completing its load
      const iframeEl = document.getElementById(`${winId}-iframe`);
      const loaderEl = document.getElementById(`${winId}-loader`);
      if (iframeEl && loaderEl) {
        iframeEl.addEventListener('load', () => {
          loaderEl.style.display = 'none';
        });

        // failsafe hiding the loader
        setTimeout(() => {
          if (loaderEl.style.display !== 'none') {
            loaderEl.style.display = 'none';
          }
        }, 8000);
      }
    }

    // Open the unique window
    openWindow(winId);
  }

  // Handle Drive Redirect logic
  const redirectYesBtn = document.getElementById('btn-redirect-yes');
  if (redirectYesBtn) {
    redirectYesBtn.addEventListener('click', () => {
      window.open('https://drive.bica.ca', '_blank');
      closeWindow('win-redirect-warning');
    });
  }

  // Handle Scraptor Redirect logic
  const scraptorYesBtn = document.getElementById('btn-scraptor-yes');
  if (scraptorYesBtn) {
    scraptorYesBtn.addEventListener('click', () => {
      window.open('https://scraptor.bica.ca', '_blank');
      closeWindow('win-scraptor-warning');
    });
  }

  // Handle TEEP Redirect logic
  const teepYesBtn = document.getElementById('btn-teep-yes');
  if (teepYesBtn) {
    teepYesBtn.addEventListener('click', () => {
      window.open('https://teep.bica.ca', '_blank');
      closeWindow('win-teep-warning');
    });
  }

  // Handle AIPrep Redirect logic
  const aiprepYesBtn = document.getElementById('btn-aiprep-yes');
  if (aiprepYesBtn) {
    aiprepYesBtn.addEventListener('click', () => {
      window.open('https://aiprep.bica.ca', '_blank');
      closeWindow('win-aiprep-warning');
    });
  }

  items.forEach(item => {
    item.addEventListener('click', () => {
      // Single click selection
      items.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');

      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(() => { clickCount = 0; }, 400);
      } else {
        clearTimeout(clickTimer);
        clickCount = 0;
        openPdf(item.dataset.idx);
      }
    });

    // Keyboard support
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter') openPdf(item.dataset.idx);
    });
  });

  /* ──────────────────────────────── DONATE API LOGIC ─────────────── */
  // UBAH URL INI JIKA BACKEND DI-DEPLOY KE HOSTING/IP PUBLIC LAIN
  const QRIS_BACKEND_URL = 'https://apiqris.bica.ca';

  window.currentTransactionId = null;
  window.pollInterval = null;

  window.generateQRIS = async function () {
    const amount = document.getElementById('donate-amount-custom').value;
    const username = document.getElementById('donate-username').value || 'AnonymousVisitor';

    if (!amount || amount < 10000) {
      showNotification('Minimum donation is Rp 10.000', '⚠️ Invalid Amount');
      return;
    }

    document.getElementById('qris-image').classList.add('hidden');
    document.getElementById('qris-image-container').classList.add('hidden');
    document.getElementById('qris-loading-text').classList.remove('hidden');
    document.getElementById('qris-loading-text').innerText = 'LOADING...';

    // Hide standard elements
    const instr = document.getElementById('qris-instruction');
    if (instr) instr.classList.add('hidden');

    const awaitEl = document.getElementById('qris-awaiting');
    if (awaitEl) awaitEl.classList.add('hidden');
    const chkEl = document.getElementById('qris-status-check');
    if (chkEl) chkEl.classList.add('hidden');

    document.getElementById('donate-form').classList.add('hidden');
    document.getElementById('donate-result').classList.remove('hidden');

    try {
      const response = await fetch(`${QRIS_BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, player_username: username })
      });
      const resData = await response.json();

      if (resData.success && resData.data) {
        window.currentTransactionId = resData.data.transaction_id;

        document.getElementById('qris-loading-text').classList.add('hidden');

        const img = document.getElementById('qris-image');
        img.src = resData.data.qris_image;
        img.classList.remove('hidden');
        document.getElementById('qris-image-container').classList.remove('hidden');

        const awaitEl = document.getElementById('qris-awaiting');
        if (awaitEl) awaitEl.classList.remove('hidden');
        const chkEl = document.getElementById('qris-status-check');
        if (chkEl) chkEl.classList.remove('hidden');

        if (window.pollInterval) clearInterval(window.pollInterval);
        window.pollInterval = setInterval(() => {
          checkQRISStatus(window.currentTransactionId);
        }, 5000);

      } else {
        throw new Error(resData.message || 'Generation failed');
      }
    } catch (e) {
      document.getElementById('qris-loading-text').innerText = 'API Backend Error/Offline.';
      console.error(e);
      setTimeout(() => {
        document.getElementById('qris-loading-text').classList.add('hidden');
        const img = document.getElementById('qris-image');
        img.src = 'icons/qris.jpg';
        img.classList.remove('hidden');
        document.getElementById('qris-image-container').classList.remove('hidden');

        const awaitEl = document.getElementById('qris-awaiting');
        if (awaitEl) awaitEl.classList.remove('hidden');
        const chkEl = document.getElementById('qris-status-check');
        if (chkEl) chkEl.classList.remove('hidden');
      }, 2000);
    }
  };

  window.checkQRISStatus = async function (trx_id) {
    if (!trx_id) return;
    try {
      const response = await fetch(`${QRIS_BACKEND_URL}/api/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: trx_id })
      });
      const resData = await response.json();
      if (resData.success && resData.data && resData.data.status === 'success') {
        if (window.pollInterval) {
          clearInterval(window.pollInterval);
          window.pollInterval = null;
        }
        triggerPaymentSuccess();
      }
    } catch (e) {
      console.error('Polling error', e);
    }
  };

  window.resetDonateForm = function () {
    if (window.pollInterval) clearInterval(window.pollInterval);
    document.getElementById('donate-result').classList.add('hidden');
    document.getElementById('donate-form').classList.remove('hidden');
    document.getElementById('qris-image').src = '';
  };

  window.triggerPaymentSuccess = function () {
    if (window.pollInterval) {
      clearInterval(window.pollInterval);
      window.pollInterval = null;
    }

    // Attempt closing window and resetting form
    resetDonateForm();

    // Attempt closing window
    const donateWin = document.getElementById('win-donate');
    if (donateWin && !donateWin.hidden) {
      donateWin.hidden = true;
      document.getElementById('icon-donate').classList.remove('selected');
    }

    showNotification('Payment verified! Get ready to party!', '🎉 Thank You');

    const partyOverlay = document.getElementById('party-overlay');
    partyOverlay.classList.remove('hidden');

    document.body.classList.add('shake-it');
    document.body.classList.add('rainbow-it');

    let confettiCount = 0;
    const spawnParty = setInterval(() => {
      // Spawn Confetti
      const conf = document.createElement('div');
      conf.className = 'confetti-piece';
      conf.style.left = Math.random() * 100 + 'vw';
      conf.style.background = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'][Math.floor(Math.random() * 6)];
      partyOverlay.appendChild(conf);

      // Spawn Balloons sporadically
      if (Math.random() > 0.6) {
        const bal = document.createElement('div');
        bal.className = 'balloon-piece';
        bal.style.left = Math.random() * 90 + 'vw';
        bal.style.background = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'][Math.floor(Math.random() * 6)];
        partyOverlay.appendChild(bal);
        setTimeout(() => { if (bal.parentNode) bal.parentNode.removeChild(bal); }, 5000);
      }

      confettiCount++;
      if (confettiCount > 60) clearInterval(spawnParty);
      setTimeout(() => { if (conf.parentNode) conf.parentNode.removeChild(conf); }, 3000);
    }, 50);

    setTimeout(() => {
      partyOverlay.classList.add('hidden');
      document.body.classList.remove('shake-it');
      document.body.classList.remove('rainbow-it');
      partyOverlay.innerHTML = '<div class="party-text">THANK YOU FOR YOUR DONATION!<br><span style="font-size:4vmax; color:white; text-shadow:2px 2px 0 #000;">YOU ARE AWESOME!</span></div>';
    }, 5000);
  };

  // Deselect when clicking empty space
  explorerFiles.addEventListener('click', (e) => {
    if (!e.target.closest('.explorer-item')) {
      items.forEach(i => i.classList.remove('selected'));
    }
  });
})();

/* ──────────────────────────────── EASTER EGG (BSOD) ─────────── */
let keyBuffer = '';
document.addEventListener('keydown', (e) => {
  if (e.key && e.key.length === 1) {
    keyBuffer += e.key.toLowerCase();
    if (keyBuffer.length > 4) keyBuffer = keyBuffer.slice(1);
    // Secret code: typing 'bsod'
    if (keyBuffer === 'bsod') {
      triggerBSOD();
    }
  }
});

let bsodActive = false;
function triggerBSOD() {
  if (bsodActive) return;
  bsodActive = true;
  const bsodScreen = document.getElementById('bsod-screen');
  if (bsodScreen) bsodScreen.classList.remove('hidden');

  const desk = document.getElementById('desktop');
  if (desk) desk.style.pointerEvents = 'none';

  setTimeout(() => {
    const rebootKeyHandler = (e) => {
      e.preventDefault();
      document.removeEventListener('keydown', rebootKeyHandler);
      document.removeEventListener('click', rebootKeyHandler);
      document.removeEventListener('touchstart', rebootKeyHandler);

      if (bsodScreen) bsodScreen.classList.add('hidden');
      bsodActive = false;
      if (desk) desk.style.pointerEvents = '';

      if (typeof showShutdown === 'function') showShutdown();
    };
    document.addEventListener('keydown', rebootKeyHandler);
    document.addEventListener('click', rebootKeyHandler);
    document.addEventListener('touchstart', rebootKeyHandler, { once: true });
  }, 1000);
}
