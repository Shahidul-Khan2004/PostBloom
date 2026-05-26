const PostBloom = {
  team: [],
  opportunities: [],
  campaigns: []
};

const statusLabels = {
  draft: 'Draft',
  active: 'Active',
  in_review: 'In Review',
  ready_to_publish: 'Ready to Publish',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  submitted_for_review: 'Submitted for Review',
  revision_requested: 'Revision Requested',
  approved: 'Approved'
};

function formatNumber(value) {
  return new Intl.NumberFormat('en', { notation: value >= 10000 ? 'compact' : 'standard' }).format(value);
}

function statusBadge(status) {
  return `<span class="badge badge-${status}">${statusLabels[status] || status}</span>`;
}

function scoreClass(score) {
  if (score >= 70) return 'score-high';
  if (score >= 40) return 'score-mid';
  return 'score-low';
}

function scoreBadge(score) {
  return `<span class="score-badge ${scoreClass(score)}">${score} score</span>`;
}

const currentDemoUser = {
  name: 'You',
  initials: 'YO',
  role: 'Manager'
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function avatarTone(name) {
  const tones = ['tone-purple', 'tone-cyan', 'tone-amber', 'tone-green'];
  const total = String(name).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return tones[total % tones.length];
}

function renderComment(comment) {
  return `
    <div class="comment-row">
      <span class="avatar avatar-small ${avatarTone(comment.name)}">${escapeHtml(comment.initials)}</span>
      <div class="comment-content">
        <div class="comment-meta">
          <strong>${escapeHtml(comment.name)}</strong>
          <span class="role-badge role-badge-small">${escapeHtml(comment.role)}</span>
          <span class="activity-time">${escapeHtml(comment.time)}</span>
        </div>
        <p>${escapeHtml(comment.text)}</p>
      </div>
    </div>
  `;
}

function renderComments(comments) {
  if (!comments.length) {
    return '<p class="muted comment-empty">No comments yet. Be the first to leave feedback.</p>';
  }

  return comments.map(renderComment).join('');
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getApiBase() {
  return (typeof window !== 'undefined' && window.__POSTBLOOM_API_BASE__) || 'http://localhost:3000';
}

function isBackendWorkspaceId(value) {
  return Boolean(value && UUID_PATTERN.test(value));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem('postbloomSession') || '{}');
  } catch {
    return {};
  }
}

function saveSession(nextSession) {
  const session = { ...getSession(), ...nextSession };
  localStorage.setItem('postbloomSession', JSON.stringify(session));
  return session;
}

function getStoredProfile() {
  try {
    return JSON.parse(localStorage.getItem('postbloomProfile') || '{}');
  } catch {
    return {};
  }
}

function saveStoredProfile(nextProfile) {
  const profile = { ...getStoredProfile(), ...nextProfile };
  localStorage.setItem('postbloomProfile', JSON.stringify(profile));
  return profile;
}

function getProfileIdentity() {
  const session = getSession();
  const user = session.user || {};
  const stored = getStoredProfile();
  const name = user.displayName || user.name || 'Avery Khan';
  const email = user.email || 'avery@postbloom.co';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'AK';

  return {
    name,
    email,
    initials,
    phone: stored.phone || '',
    photo: stored.photo || ''
  };
}

function paintAvatar(node, profile) {
  if (!node) return;
  if (profile.photo) {
    node.textContent = '';
    node.classList.add('has-image');
    node.style.backgroundImage = `url("${profile.photo}")`;
  } else {
    node.textContent = profile.initials;
    node.classList.remove('has-image');
    node.style.backgroundImage = '';
  }
}

function updateShellProfile() {
  const profile = getProfileIdentity();
  document.querySelectorAll('.avatar-button').forEach((button) => paintAvatar(button, profile));
}

function readProfileImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.addEventListener('load', () => {
      const size = 320;
      const scale = Math.min(size / image.width, size / image.height, 1);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.86));
    });

    image.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read that image.'));
    });

    image.src = objectUrl;
  });
}

async function apiRequest(path, opts = {}) {
  if (typeof PostBloomApi !== 'undefined') {
    return PostBloomApi.request(path, opts);
  }
  const { method = 'GET', body, token, headers = {} } = opts;
  const res = await fetch(`${getApiBase()}${path}`, {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload.error?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return payload.data;
}

const PLATFORM_DEFAULT_ROLE = {
  instagram_carousel: 'writer',
  threads_thread: 'writer',
  youtube_short: 'designer',
  tiktok_reel: 'designer'
};

let cachedPlatforms = null;
let bootstrapPromise = null;

function getAccountRole(session = getSession()) {
  return session.user?.accountRole || 'user';
}

function isOperatorRole(role) {
  return role === 'user' || role === 'admin';
}

function isSpecialistRole(role) {
  return role === 'writer' || role === 'designer' || role === 'reviewer';
}

function api(token) {
  return typeof PostBloomApi !== 'undefined' ? PostBloomApi : null;
}

async function bootstrapSession({ redirectIfNoWorkspace = false } = {}) {
  const session = getSession();
  if (!session.token) return session;

  const A = api(session.token);
  if (!A) return session;

  try {
    const user = await A.auth.me(session.token);
    saveSession({ user });
  } catch {
    /* keep cached user */
  }

  let workspaces = [];
  try {
    workspaces = await A.workspaces.list(session.token);
  } catch {
    workspaces = [];
  }

  const current = getSession();
  let workspace = current.workspace;
  const list = Array.isArray(workspaces) ? workspaces : [];

  if (workspace?.publicUuid && isBackendWorkspaceId(workspace.publicUuid)) {
    const found = list.find((w) => w.publicUuid === workspace.publicUuid);
    if (found) workspace = { ...found, ...workspace };
  } else if (list.length === 1) {
    workspace = list[0];
  } else if (list.length > 0 && !workspace?.publicUuid) {
    workspace = list[0];
  }

  let setup = current.setup || {};
  if (workspace?.publicUuid && isBackendWorkspaceId(workspace.publicUuid)) {
    try {
      const detail = await A.workspaces.get(session.token, workspace.publicUuid);
      workspace = { ...workspace, ...detail, publicUuid: detail.publicUuid || workspace.publicUuid };
      setup = detail.setup || setup;
    } catch {
      /* ignore */
    }
  }

  saveSession({ workspace, setup, workspaces: list });
  if (redirectIfNoWorkspace && list.length === 0 && document.body.classList.contains('app-body')) {
    const page = document.body.dataset.page;
    if (page && !['auth', 'workspace-new', 'tutorial'].includes(page)) {
      window.location.href = '/app/workspace-new';
    }
  }
  return getSession();
}

function ensureBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapSession().finally(() => {
      bootstrapPromise = null;
    });
  }
  return bootstrapPromise;
}

function sidebarLinksForRole(role, path) {
  const active = (href) => (path === href || path.startsWith(`${href}/`) ? ' active' : '');
  const p = path.split('?')[0];
  const links = [];

  if (isOperatorRole(role)) {
    links.push({ href: '/app/dashboard', label: '📊 Dashboard', key: 'dashboard' });
    links.push({ href: '/app/opportunities', label: '🔥 Opportunity Feed', key: 'opportunities' });
    links.push({ href: '/app/campaign-new', label: '🗂️ Campaigns', key: 'campaign-new' });
    links.push({ href: '/app/team', label: '👥 Team', key: 'team' });
    links.push({ href: '/app/analyze', label: '⬆️ Import Analytics', key: 'analyze' });
  }
  if (isSpecialistRole(role)) {
    links.push({ href: '/app/work', label: '✍️ My Work', key: 'work' });
    links.push({ href: '/app/inbox', label: '📥 Staff Inbox', key: 'inbox' });
  }
  if (role === 'reviewer') {
    links.push({ href: '/app/work?tab=review', label: '✅ Review Queue', key: 'review' });
  }
  if (role === 'admin') {
    links.push({ href: '/app/admin', label: '⚙️ Admin', key: 'admin' });
  }

  return links.map((link) => {
    const isActive = p === link.href || (link.key === 'review' && p === '/app/work' && path.includes('tab=review'));
    return `<a class="sidebar-link${isActive ? ' active' : ''}" href="${link.href}">${link.label}</a>`;
  }).join('');
}

function paintWorkspaceChrome() {
  const session = getSession();
  const name = session.workspace?.name || 'Select workspace';
  document.querySelectorAll('.workspace-name').forEach((el) => {
    el.textContent = name;
  });

  const picker = document.getElementById('workspacePicker');
  const workspaces = session.workspaces || [];
  if (picker && workspaces.length > 1) {
    picker.innerHTML = workspaces.map((w) => (
      `<option value="${escapeHtml(w.publicUuid)}"${w.publicUuid === session.workspace?.publicUuid ? ' selected' : ''}>${escapeHtml(w.name)}</option>`
    )).join('');
    picker.hidden = false;
  } else if (picker) {
    picker.hidden = true;
  }

  const path = window.location.pathname + window.location.search;
  const role = getAccountRole(session);
  document.querySelectorAll('.sidebar-nav').forEach((nav) => {
    nav.innerHTML = sidebarLinksForRole(role, path);
  });
}

async function refreshNotifications() {
  const session = getSession();
  const badge = document.querySelector('.notification-badge');
  const A = api(session.token);
  if (!session.token || !A) {
    if (badge) badge.hidden = true;
    return [];
  }
  try {
    const items = await A.notifications.list(session.token, true);
    const count = Array.isArray(items) ? items.length : 0;
    if (badge) {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    }
    return Array.isArray(items) ? items : [];
  } catch {
    if (badge) badge.hidden = true;
    return [];
  }
}

function notificationNavigate(payload) {
  if (!payload || typeof payload !== 'object') return;
  if (payload.deliverablePublicUuid) {
    window.location.href = `/app/campaign-detail?id=${encodeURIComponent(payload.campaignPublicUuid || '')}&deliverable=${payload.deliverablePublicUuid}`;
    return;
  }
  if (payload.campaignPublicUuid) {
    window.location.href = `/app/campaign-detail?id=${encodeURIComponent(payload.campaignPublicUuid)}`;
  }
}

function initNotifications() {
  const buttons = document.querySelectorAll('[data-notifications-toggle]');
  if (!buttons.length) return;

  let panel = document.getElementById('notificationsPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'notificationsPanel';
    panel.className = 'notifications-panel glass';
    panel.hidden = true;
    document.body.appendChild(panel);
  }

  async function openPanel() {
    const session = getSession();
    const A = api(session.token);
    if (!A) return;
    panel.hidden = false;
    panel.innerHTML = '<p class="muted">Loading…</p>';
    try {
      const items = await A.notifications.list(session.token, false);
      if (!items.length) {
        panel.innerHTML = '<p class="muted">No notifications.</p>';
        return;
      }
      panel.innerHTML = items.slice(0, 20).map((n) => `
        <button type="button" class="notification-item" data-notification-id="${escapeHtml(n.publicUuid)}">
          <strong>${escapeHtml(n.type)}</strong>
          <span class="muted">${escapeHtml(new Date(n.createdAt).toLocaleString())}</span>
        </button>
      `).join('');
      panel.querySelectorAll('[data-notification-id]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.notificationId;
          const item = items.find((n) => n.publicUuid === id);
          try {
            await A.notifications.markRead(session.token, id);
          } catch { /* ignore */ }
          await refreshNotifications();
          panel.hidden = true;
          notificationNavigate(item?.payload);
        });
      });
    } catch (err) {
      panel.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
    }
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.hidden = !panel.hidden;
      if (!panel.hidden) openPanel();
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-notifications-toggle]') && !e.target.closest('#notificationsPanel')) {
      panel.hidden = true;
    }
  });
}

function initLogout() {
  document.querySelectorAll('[data-logout]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('postbloomSession');
      localStorage.removeItem('postbloomImportDone');
      window.location.href = '/app/auth';
    });
  });
}

function initWorkspacePicker() {
  const picker = document.getElementById('workspacePicker');
  if (!picker || picker.dataset.bound) return;
  picker.dataset.bound = 'true';
  picker.addEventListener('change', async () => {
    const session = getSession();
    const A = api(session.token);
    const id = picker.value;
    if (!A || !isBackendWorkspaceId(id)) return;
    try {
      const detail = await A.workspaces.get(session.token, id);
      saveSession({
        workspace: {
          publicUuid: detail.publicUuid,
          name: detail.name,
          slug: detail.slug
        },
        setup: detail.setup || {}
      });
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  });
}

function showInlineError(node, message) {
  if (!node) return;
  node.textContent = message;
  node.classList.add('is-visible');
}

function hideInlineError(node) {
  if (!node) return;
  node.textContent = '';
  node.classList.remove('is-visible');
}

function initTheme() {
  const toggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  const stored = localStorage.getItem('theme');

  if (stored === 'light') {
    html.setAttribute('data-theme', 'light');
    if (toggle) toggle.textContent = '☀️';
  }

  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const isLight = html.getAttribute('data-theme') === 'light';
    if (isLight) {
      html.removeAttribute('data-theme');
      toggle.textContent = '🌙';
      localStorage.setItem('theme', 'dark');
    } else {
      html.setAttribute('data-theme', 'light');
      toggle.textContent = '☀️';
      localStorage.setItem('theme', 'light');
    }
  });
}

function initClock() {
  const clock = document.getElementById('digitalClock');
  if (!clock) return;

  function updateClock() {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    clock.setAttribute('datetime', now.toISOString());
  }

  updateClock();
  window.setInterval(updateClock, 1000);
}

function initShell() {
  const avatarButton = document.querySelector('[data-avatar-menu]');
  const dropdown = document.querySelector('.dropdown-menu');
  const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.mobile-overlay');

  updateShellProfile();
  document.querySelectorAll('.app-nav-actions .icon-button').forEach((btn) => {
    if (btn.getAttribute('aria-label') === 'Notifications' || btn.textContent.includes('🔔')) {
      btn.setAttribute('data-notifications-toggle', '');
    }
  });
  document.querySelectorAll('.dropdown-menu a[href="/"]').forEach((a) => {
    if (a.textContent.trim().toLowerCase() === 'logout') a.setAttribute('data-logout', '');
  });
  initLogout();
  initNotifications();
  initWorkspacePicker();

  if (document.body.classList.contains('app-body')) {
    ensureBootstrap().then(() => {
      paintWorkspaceChrome();
      refreshNotifications();
    });
  }

  if (avatarButton && dropdown) {
    avatarButton.addEventListener('click', () => dropdown.classList.toggle('is-open'));
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.avatar-menu')) dropdown.classList.remove('is-open');
    });
  }

  if (sidebarToggle && sidebar && overlay) {
    const toggleSidebar = () => {
      sidebar.classList.toggle('is-open');
      overlay.classList.toggle('is-open');
    };
    sidebarToggle.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);
  }
}

function initProfile() {
  const form = document.getElementById('profileForm');
  const photoInput = document.getElementById('profilePhotoInput');
  const photoPreview = document.getElementById('profilePhotoPreview');
  const phoneInput = document.getElementById('profilePhone');
  const status = document.getElementById('profileSaveStatus');
  const nameNode = document.getElementById('profileName');
  const emailNode = document.getElementById('profileEmail');
  const profile = getProfileIdentity();

  if (nameNode) nameNode.textContent = profile.name;
  if (emailNode) emailNode.textContent = profile.email;
  if (phoneInput) phoneInput.value = profile.phone;
  paintAvatar(photoPreview, profile);

  if (photoInput) {
    photoInput.addEventListener('change', async () => {
      const file = photoInput.files && photoInput.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        if (status) status.textContent = 'Please choose an image file.';
        photoInput.value = '';
        return;
      }

      try {
        const photo = await readProfileImage(file);
        const updated = saveStoredProfile({ photo });
        paintAvatar(photoPreview, { ...profile, ...updated });
        updateShellProfile();
        if (status) status.textContent = 'Profile picture saved.';
      } catch (err) {
        if (status) status.textContent = err.message;
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const phone = phoneInput ? phoneInput.value.trim() : '';
      saveStoredProfile({ phone });
      if (status) status.textContent = phone ? 'Phone number saved.' : 'Phone number cleared.';
    });
  }
}

function initAuth() {
  const form = document.getElementById('authForm');
  const submit = document.getElementById('authSubmit');
  const error = document.getElementById('authError');
  const kicker = document.getElementById('authKicker');
  const heading = document.getElementById('authHeading');
  const modeText = document.getElementById('authModeText');
  const modeButtons = document.querySelectorAll('[data-auth-mode]');
  const registerFields = document.querySelectorAll('[data-register-only]');
  let mode = 'login';

  if (!form) return;

  function setMode(nextMode) {
    mode = nextMode;
    modeButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.authMode === mode);
    });
    registerFields.forEach((field) => {
      field.hidden = mode !== 'register';
    });
    document.getElementById('displayName')?.toggleAttribute('required', mode === 'register');
    document.getElementById('password')?.setAttribute(
      'autocomplete',
      mode === 'register' ? 'new-password' : 'current-password'
    );
    document.body.classList.toggle('register-mode', mode === 'register');
    document.body.classList.toggle('login-mode', mode === 'login');
    submit.textContent = mode === 'register' ? 'Create Account' : 'Login';
    if (kicker) kicker.textContent = mode === 'register' ? 'New workspace' : 'Welcome back';
    if (heading) heading.textContent = mode === 'register' ? 'Create your account' : 'Access PostBloom';
    if (modeText) {
      modeText.textContent = mode === 'register'
        ? 'Create your account to continue to the guided setup.'
        : 'Continue to your workspace and pick up your campaign workflow.';
    }
    hideInlineError(error);
  }

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.authMode));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideInlineError(error);
    submit.disabled = true;
    submit.textContent = mode === 'register' ? 'Creating account...' : 'Logging in...';

    const formData = new FormData(form);
    const body = {
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || '')
    };
    if (mode === 'register') {
      body.displayName = String(formData.get('displayName') || '').trim();
    }

    try {
      const data = await apiRequest(`/api/v1/auth/${mode}`, { method: 'POST', body });
      saveSession({ token: data.token, user: data.user, workspace: null });
      try {
        const me = await apiRequest('/api/v1/auth/me', { token: data.token });
        saveSession({ user: me });
      } catch { /* use register/login user */ }
      const workspaces = await apiRequest('/api/v1/workspaces', { token: data.token }).catch(() => []);
      if (Array.isArray(workspaces) && workspaces.length > 0) {
        saveSession({ workspaces, workspace: workspaces[0] });
        await bootstrapSession();
        window.location.href = '/app/dashboard';
      } else {
        window.location.href = '/app/workspace-new';
      }
    } catch (err) {
      showInlineError(error, `${err.message}. Make sure the backend is running at ${getApiBase()}.`);
    } finally {
      submit.disabled = false;
      submit.textContent = mode === 'register' ? 'Create Account' : 'Login';
    }
  });

  setMode('login');
}

function initTutorial() {
  const image = document.getElementById('tutorialImage');
  const title = document.getElementById('tutorialTitle');
  const text = document.getElementById('tutorialText');
  const step = document.getElementById('tutorialStep');
  const prev = document.getElementById('tutorialPrev');
  const next = document.getElementById('tutorialNext');
  const dots = document.getElementById('tutorialDots');

  if (!image || !title || !text || !step || !prev || !next || !dots) return;

  const slides = [
    {
      title: 'Understand your workspace',
      text: 'Your workspace keeps the creator team, imports, campaigns, and approvals in one shared place.',
      image: '/app/assets/ss1.png'
    },
    {
      title: 'Import creator analytics',
      text: 'Start with your LinkedIn analytics export so PostBloom can find posts worth expanding.',
      image: '/app/assets/ss2.png'
    },
    {
      title: 'Review opportunity scores',
      text: 'The opportunity feed ranks posts by reach and engagement signals so the strongest ideas rise first.',
      image: '/app/assets/ss3.png'
    },
    {
      title: 'Build campaign deliverables',
      text: 'Turn one winning post into platform-ready deliverables for writers, designers, and reviewers.',
      image: '/app/assets/ss4.png'
    },
    {
      title: 'Track review and export',
      text: 'Use the workflow to submit, review, approve, and prepare campaign assets for publishing.',
      image: '/app/assets/ss5.png'
    }
  ];
  let index = 0;

  dots.innerHTML = slides.map((_, dotIndex) => (
    `<button class="tutorial-dot" type="button" data-tutorial-dot="${dotIndex}" aria-label="Go to step ${dotIndex + 1}"></button>`
  )).join('');

  function draw() {
    const slide = slides[index];
    image.src = slide.image;
    title.textContent = slide.title;
    text.textContent = slide.text;
    step.textContent = `Step ${index + 1} of ${slides.length}`;
    prev.disabled = index === 0;
    next.textContent = index === slides.length - 1 ? 'I Understand' : 'Next';
    document.querySelectorAll('[data-tutorial-dot]').forEach((dot) => {
      dot.classList.toggle('active', Number(dot.dataset.tutorialDot) === index);
    });
  }

  prev.addEventListener('click', () => {
    index = Math.max(0, index - 1);
    draw();
  });

  next.addEventListener('click', () => {
    if (index === slides.length - 1) {
      localStorage.setItem('postbloomTutorialDone', 'true');
      window.location.href = '/app/analyze';
      return;
    }
    index += 1;
    draw();
  });

  document.querySelectorAll('[data-tutorial-dot]').forEach((dot) => {
    dot.addEventListener('click', () => {
      index = Number(dot.dataset.tutorialDot);
      draw();
    });
  });

  draw();
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getCurrentUserKey(session = getSession()) {
  if (session.token) {
    const user = session.user || {};
    return String(user.publicUuid || user.id || user.email || session.token).trim().toLowerCase();
  }

  return 'local';
}

function workspaceBelongsToCurrentUser(workspace, ownerKey) {
  if (!workspace) return false;
  if (workspace.ownerKey) return workspace.ownerKey === ownerKey;
  return ownerKey === 'local';
}

function scopeWorkspace(workspace, session = getSession()) {
  if (!workspace) return workspace;
  return {
    ...workspace,
    ownerKey: getCurrentUserKey(session)
  };
}

function getSavedWorkspaces() {
  const session = getSession();
  const ownerKey = getCurrentUserKey(session);
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem('postbloomWorkspaces') || '[]');
  } catch {
    saved = [];
  }

  saved = saved.filter((workspace) => workspaceBelongsToCurrentUser(workspace, ownerKey));

  if (
    (session.workspace?.name || session.workspace?.slug) &&
    workspaceBelongsToCurrentUser(session.workspace, ownerKey)
  ) {
    saved.push(session.workspace);
  }

  return saved.filter((workspace) => workspace && (workspace.name || workspace.slug));
}

function rememberWorkspace(workspace) {
  if (!workspace) return;
  const workspaces = getSavedWorkspaces();
  const nextSlug = workspace.slug || slugify(workspace.name || '');
  const ownerKey = workspace.ownerKey || getCurrentUserKey();
  const nextWorkspace = { name: workspace.name, slug: nextSlug, publicUuid: workspace.publicUuid, ownerKey };
  const next = [
    ...workspaces.filter((item) => {
      const itemSlug = item.slug || slugify(item.name || '');
      return itemSlug !== nextSlug || item.ownerKey !== ownerKey;
    }),
    nextWorkspace
  ];
  localStorage.setItem('postbloomWorkspaces', JSON.stringify(next));
}

const WORKSPACE_EXISTS_MESSAGE = 'Workspace already exists.';

function continueWithLocalWorkspace(body, session) {
  const workspace = scopeWorkspace({
    publicUuid: `local-${Date.now()}`,
    name: body.name,
    slug: body.slug
  }, session);
  saveSession({ workspace });
  rememberWorkspace(workspace);
  window.location.href = '/app/tutorial';
}

function initWorkspaceNew() {
  const form = document.getElementById('workspaceForm');
  const name = document.getElementById('workspaceName');
  const slug = document.getElementById('workspaceSlug');
  const error = document.getElementById('workspaceError');

  if (!form || !name) return;

  name.addEventListener('input', () => {
    hideInlineError(error);
    const button = form.querySelector('button[type="submit"]');
    if (button) button.textContent = 'Create Workspace & Start Tutorial';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideInlineError(error);
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Creating...';

    const session = getSession();
    const body = {
      name: name.value.trim(),
      slug: slug ? slug.value.trim() || slugify(name.value) : slugify(name.value)
    };
    const duplicate = getSavedWorkspaces().find((workspace) => {
      const workspaceSlug = workspace.slug || slugify(workspace.name || '');
      return workspaceSlug === body.slug || String(workspace.name || '').trim().toLowerCase() === body.name.toLowerCase();
    });

    if (duplicate) {
      showInlineError(error, WORKSPACE_EXISTS_MESSAGE);
      button.disabled = false;
      button.textContent = 'Create Workspace & Start Tutorial';
      return;
    }

    try {
      if (session.token) {
        const workspace = scopeWorkspace(await apiRequest('/api/v1/workspaces', {
          method: 'POST',
          token: session.token,
          body
        }), session);
        saveSession({ workspace });
        rememberWorkspace(workspace);
      } else {
        const workspace = scopeWorkspace({
          publicUuid: `local-${Date.now()}`,
          name: body.name,
          slug: body.slug
        }, session);
        saveSession({ workspace });
        rememberWorkspace(workspace);
      }
      window.location.href = '/app/tutorial';
    } catch (err) {
      if (/slug.*taken|taken.*slug/i.test(err.message)) {
        continueWithLocalWorkspace(body, session);
        return;
      }

      if (/already exists|duplicate|409/i.test(err.message)) {
        showInlineError(error, WORKSPACE_EXISTS_MESSAGE);
        return;
      }

      showInlineError(error, `${err.message}. Continuing with a local workspace.`);
      window.setTimeout(() => {
        continueWithLocalWorkspace(body, session);
      }, 1100);
    } finally {
      button.disabled = false;
      button.textContent = 'Create Workspace & Start Tutorial';
    }
  });
}

function splitCsvLine(line) {
  const cells = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase().trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] || '';
      return row;
    }, {});
  });
}

function normalizeHeader(value) {
  return String(value)
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function columnIndexFromRef(ref) {
  const letters = String(ref).match(/[A-Z]+/i)?.[0] || 'A';
  return letters.toUpperCase().split('').reduce((total, char) => (total * 26) + char.charCodeAt(0) - 64, 0) - 1;
}

async function inflateZipBytes(bytes, method) {
  if (method === 0) return bytes;
  if (method !== 8 || typeof DecompressionStream === 'undefined') {
    throw new Error('This browser cannot read this compressed XLSX file locally. Export it as CSV and try again.');
  }

  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function findZipEntries(buffer) {
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  let eocdOffset = -1;

  for (let offset = view.byteLength - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }

  if (eocdOffset === -1) throw new Error('Could not read the XLSX file.');

  const entryCount = view.getUint16(eocdOffset + 10, true);
  let directoryOffset = view.getUint32(eocdOffset + 16, true);
  const entries = new Map();

  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(directoryOffset, true) !== 0x02014b50) break;
    const method = view.getUint16(directoryOffset + 10, true);
    const compressedSize = view.getUint32(directoryOffset + 20, true);
    const nameLength = view.getUint16(directoryOffset + 28, true);
    const extraLength = view.getUint16(directoryOffset + 30, true);
    const commentLength = view.getUint16(directoryOffset + 32, true);
    const localOffset = view.getUint32(directoryOffset + 42, true);
    const name = decoder.decode(new Uint8Array(buffer, directoryOffset + 46, nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    entries.set(name, {
      method,
      bytes: new Uint8Array(buffer, dataOffset, compressedSize)
    });
    directoryOffset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

async function readZipText(entries, name) {
  const entry = entries.get(name);
  if (!entry) return '';
  const inflated = await inflateZipBytes(entry.bytes, entry.method);
  return new TextDecoder().decode(inflated);
}

async function parseXlsx(file) {
  const entries = findZipEntries(await file.arrayBuffer());
  const sharedXml = await readZipText(entries, 'xl/sharedStrings.xml');
  const sharedStrings = [];

  if (sharedXml) {
    const sharedDoc = new DOMParser().parseFromString(sharedXml, 'application/xml');
    sharedDoc.querySelectorAll('si').forEach((item) => {
      sharedStrings.push([...item.querySelectorAll('t')].map((node) => node.textContent || '').join(''));
    });
  }

  const sheetName = [...entries.keys()].find((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
  if (!sheetName) throw new Error('No worksheet found in this XLSX file.');
  const sheetXml = await readZipText(entries, sheetName);
  const sheetDoc = new DOMParser().parseFromString(sheetXml, 'application/xml');
  const table = [];

  sheetDoc.querySelectorAll('sheetData row').forEach((rowNode) => {
    const row = [];
    rowNode.querySelectorAll('c').forEach((cell) => {
      const column = columnIndexFromRef(cell.getAttribute('r'));
      const type = cell.getAttribute('t');
      let value = '';
      if (type === 's') {
        value = sharedStrings[Number(cell.querySelector('v')?.textContent || 0)] || '';
      } else if (type === 'inlineStr') {
        value = cell.querySelector('is t')?.textContent || '';
      } else {
        value = cell.querySelector('v')?.textContent || '';
      }
      row[column] = value;
    });
    if (row.some((value) => String(value || '').trim())) table.push(row);
  });

  const headerSignals = ['date', 'post date', 'impressions', 'views', 'reach', 'reactions', 'likes', 'comments', 'reposts', 'shares', 'text', 'content'];
  const headerIndex = table.findIndex((row) => row.some((cell) => headerSignals.includes(normalizeHeader(cell))));
  const headers = (table[headerIndex >= 0 ? headerIndex : 0] || []).map(normalizeHeader);
  return table.slice((headerIndex >= 0 ? headerIndex : 0) + 1).map((row) => (
    headers.reduce((record, header, index) => {
      if (header) record[header] = row[index] || '';
      return record;
    }, {})
  )).filter((row) => Object.values(row).some((value) => String(value || '').trim()));
}

function numberFromRow(row, keys) {
  const key = keys.find((item) => row[normalizeHeader(item)] != null && row[normalizeHeader(item)] !== '');
  if (!key) return 0;
  return Number(String(row[normalizeHeader(key)]).replace(/[^0-9.-]/g, '')) || 0;
}

function textFromRow(row, keys, fallback = '') {
  const key = keys.find((item) => row[normalizeHeader(item)] != null && String(row[normalizeHeader(item)]).trim() !== '');
  return key ? String(row[normalizeHeader(key)]).trim() : fallback;
}

function formatAnalysisDate(value) {
  if (!value) return 'No date';
  if (/^\d+(\.\d+)?$/.test(String(value))) {
    const serial = Number(value);
    if (serial > 20000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      excelEpoch.setUTCDate(excelEpoch.getUTCDate() + serial);
      return excelEpoch.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

function recommendationForScore(score) {
  if (score >= 80) return { label: 'Prioritize', className: 'recommendation-high' };
  if (score >= 60) return { label: 'Strong Fit', className: 'recommendation-good' };
  if (score >= 40) return { label: 'Review', className: 'recommendation-mid' };
  return { label: 'Low Priority', className: 'recommendation-low' };
}

function previewDomain(url) {
  if (!url) return 'www.linkedin.com';
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^m\./, 'www.');
  } catch {
    return String(url).replace(/^https?:\/\//, '').split('/')[0] || 'www.linkedin.com';
  }
}

function buildCsvAnalysis(rows) {
  const analyzed = rows.map((row, index) => {
    const reach = numberFromRow(row, ['reach', 'impressions', 'views', 'total reach', 'total impressions', 'total views']);
    const reactions = numberFromRow(row, ['reactions', 'likes', 'total reactions', 'total likes']);
    const comments = numberFromRow(row, ['comments']);
    const reposts = numberFromRow(row, ['reposts', 'shares', 'reshares']);
    const engagements = reactions + comments + reposts;
    const score = Math.min(100, Math.round((Math.log10(reach + 1) * 12) + (engagements / Math.max(reach, 1) * 180)));
    const preview = textFromRow(row, ['text', 'post', 'post text', 'content', 'caption', 'copy', 'share commentary', 'title'], `Imported post ${index + 1}`);
    const url = textFromRow(row, ['url', 'post url', 'linkedinposturl', 'linkedin post url', 'link']);
    const image = textFromRow(row, ['image', 'image url', 'thumbnail', 'thumbnail url', 'media', 'media url', 'photo']);
    const date = textFromRow(row, ['date', 'post date', 'created', 'created at', 'published at']);
    return { preview, url, image, date, reach, engagements, score };
  }).sort((a, b) => b.score - a.score);

  const totals = analyzed.reduce((sum, row) => ({
    impressions: sum.impressions + row.reach,
    engagements: sum.engagements + row.engagements
  }), { impressions: 0, engagements: 0 });

  return {
    rowCount: analyzed.length,
    topScore: analyzed[0]?.score || 0,
    impressions: totals.impressions,
    engagements: totals.engagements,
    rows: analyzed.slice(0, 8)
  };
}

function renderAnalysis(analysis) {
  const results = document.getElementById('analysisResults');
  const metrics = document.getElementById('analysisMetrics');
  const rows = document.getElementById('analysisRows');

  if (!results || !metrics || !rows) return;

  metrics.innerHTML = [
    ['Rows Analyzed', analysis.rowCount],
    ['Total Impressions', formatNumber(analysis.impressions)],
    ['Total Engagements', formatNumber(analysis.engagements)],
    ['Best Score', analysis.topScore]
  ].map(([label, value]) => `
    <article class="metric-panel glass">
      <div class="metric-label">${label}</div>
      <div class="metric-value">${value}</div>
    </article>
  `).join('');

  rows.innerHTML = analysis.rows.map((row, index) => {
    const recommendation = recommendationForScore(row.score);
    const preview = row.preview || 'LinkedIn post preview';
    const domain = previewDomain(row.url);
    return `
    <tr>
      <td><span class="rank-badge">#${index + 1}</span></td>
      <td>
        <div class="analysis-preview-card">
          ${row.image ? `<img class="analysis-preview-image" src="${escapeHtml(row.image)}" alt="">` : '<div class="analysis-preview-image analysis-preview-placeholder">LinkedIn</div>'}
          <div class="analysis-preview-body">
            <strong>${escapeHtml(preview)}</strong>
            <span>${escapeHtml(domain)}</span>
          </div>
        </div>
      </td>
      <td>${escapeHtml(formatAnalysisDate(row.date))}</td>
      <td><strong>${formatNumber(row.reach || row.impressions || 0)}</strong></td>
      <td>${scoreBadge(row.score)}</td>
      <td><span class="recommendation-badge ${recommendation.className}">${recommendation.label}</span></td>
    </tr>
  `;
  }).join('');

  localStorage.setItem('postbloomImportDone', 'true');
  results.hidden = false;
}

function initAnalyze() {
  const dropzone = document.getElementById('analysisDropzone');
  const input = document.getElementById('analysisFile');
  const fileSummary = document.getElementById('analysisFileSummary');
  const fileName = document.getElementById('analysisFileName');
  const fileSize = document.getElementById('analysisFileSize');
  const error = document.getElementById('analysisError');
  const generate = document.getElementById('generateAnalysis');
  let currentFile = null;

  if (!dropzone || !input || !generate) return;

  function handleFile(file) {
    currentFile = file;
    hideInlineError(error);
    if (!file || (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx'))) {
      currentFile = null;
      fileSummary.classList.remove('is-visible');
      showInlineError(error, 'Upload a .csv file for instant analysis or a .xlsx LinkedIn export for backend import.');
      return;
    }
    fileName.textContent = file.name;
    fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    fileSummary.classList.add('is-visible');
  }

  dropzone.addEventListener('click', () => input.click());
  input.addEventListener('change', () => handleFile(input.files[0]));
  dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropzone.classList.add('is-dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
  dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropzone.classList.remove('is-dragover');
    handleFile(event.dataTransfer.files[0]);
  });

  generate.addEventListener('click', async () => {
    if (!currentFile) return;
    hideInlineError(error);
    generate.disabled = true;
    generate.textContent = 'Generating...';

    try {
      if (currentFile.name.endsWith('.csv')) {
        const text = await currentFile.text();
        const rows = parseCsv(text);
        if (rows.length === 0) throw new Error('The CSV needs a header row and at least one data row.');
        renderAnalysis(buildCsvAnalysis(rows));
      } else {
        const rows = await parseXlsx(currentFile);
        if (rows.length === 0) throw new Error('The XLSX needs a header row and at least one data row.');
        renderAnalysis(buildCsvAnalysis(rows));
      }
    } catch (err) {
      showInlineError(error, err.message);
    } finally {
      generate.disabled = false;
      generate.textContent = 'Generate';
    }
  });
}

async function renderDashboard() {
  const metrics = document.getElementById('dashboardMetrics');
  const table = document.getElementById('campaignRows');
  const activity = document.getElementById('recentActivity');
  const empty = document.getElementById('dashboardEmpty');
  const banner = document.getElementById('dashboardSetupBanner');
  const healthEl = document.getElementById('apiHealthStatus');

  await ensureBootstrap();
  const session = getSession();
  const A = api(session.token);
  const workspaceId = session.workspace?.publicUuid;

  if (healthEl && A) {
    A.health().then((h) => {
      healthEl.textContent = h?.status === 'ok' ? 'API connected' : 'API degraded';
      healthEl.classList.add('is-visible');
    }).catch(() => {
      healthEl.textContent = 'API offline';
      healthEl.classList.add('is-visible', 'is-error');
    });
  }

  if (banner) {
    const setup = session.setup || {};
    if (session.token && isBackendWorkspaceId(workspaceId) && !setup.canCreateCampaign) {
      banner.hidden = false;
      banner.innerHTML = `
        <p class="muted">Import LinkedIn analytics before creating campaigns.</p>
        <a class="btn btn-primary btn-small" href="/app/analyze">Import Analytics</a>
      `;
    } else {
      banner.hidden = true;
    }
  }

  let campaigns = [];
  let auditEvents = [];
  let memberCount = 0;

  if (session.token && A && isBackendWorkspaceId(workspaceId)) {
    try {
      [campaigns, auditEvents, memberCount] = await Promise.all([
        A.campaigns.list(session.token, workspaceId),
        A.campaigns.activity(session.token, workspaceId).catch(() => []),
        A.workspaces.members(session.token, workspaceId).then((m) => (Array.isArray(m) ? m.length : 0)).catch(() => 0)
      ]);
    } catch {
      campaigns = [];
    }
  }

  PostBloom.campaigns = (campaigns || []).map((c) => ({
    id: c.publicUuid,
    name: c.name,
    source: c.enrichmentTitle || 'LinkedIn source post',
    status: c.statusCode,
    created: c.createdAt ? formatPublishDate(c.createdAt) : '—'
  }));

  if (metrics) {
    metrics.innerHTML = [
      ['Total Campaigns', PostBloom.campaigns.length],
      ['Workspace Members', memberCount],
      ['Audit Events', (auditEvents || []).length],
      ['Import Ready', session.setup?.canCreateCampaign ? 'Yes' : 'No']
    ].map(([label, value]) => `
      <article class="metric-panel glass">
        <div class="metric-label">${label}</div>
        <div class="metric-value">${value}</div>
      </article>
    `).join('');
  }

  if (table) {
    table.innerHTML = PostBloom.campaigns.map((campaign) => `
      <tr>
        <td><strong>${escapeHtml(campaign.name)}</strong></td>
        <td class="source-snippet">${escapeHtml(campaign.source)}</td>
        <td>${statusBadge(campaign.status)}</td>
        <td>${escapeHtml(campaign.created)}</td>
        <td><a class="btn btn-secondary" href="/app/campaign-detail?id=${encodeURIComponent(campaign.id)}">Open</a></td>
      </tr>
    `).join('');
  }

  if (activity) {
    const items = (auditEvents || []).slice(0, 8);
    activity.innerHTML = items.length ? items.map((item) => `
        <div class="activity-item">
          <span class="activity-dot"></span>
          <div>
            <div class="activity-text">${escapeHtml(item.action)} · ${escapeHtml(item.entityType || '')}</div>
            <div class="activity-time">${escapeHtml(item.actorName || 'System')} · ${escapeHtml(formatPublishDate(item.createdAt))}</div>
          </div>
        </div>
      `).join('') : '<p class="muted">No workspace activity yet.</p>';
  }

  if (empty) {
    empty.hidden = PostBloom.campaigns.length > 0;
  }
}

function hostFromUrl(url) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'linkedin.com';
  }
}

function formatPublishDate(value) {
  if (!value) return 'Unknown date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatEngagementRate(rate) {
  const value = Number(rate);
  if (Number.isNaN(value)) return '0';
  return (value <= 1 ? value * 100 : value).toFixed(1);
}

function mapApiOpportunityToFeedItem(opp) {
  const snippet = opp.enrichmentExcerpt
    || opp.recommendationLabel
    || (opp.linkedinPostUrl ? `LinkedIn post · ${hostFromUrl(opp.linkedinPostUrl)}` : '')
    || '[No text available — enrich to add source copy]';
  const engagements = opp.engagements != null ? Number(opp.engagements) : 0;

  return {
    id: opp.publicUuid,
    publicUuid: opp.publicUuid,
    date: formatPublishDate(opp.publishDate),
    snippet,
    impressions: opp.impressions != null ? Number(opp.impressions) : 0,
    reactions: engagements,
    comments: 0,
    reposts: 0,
    engagementRate: opp.engagementRate != null ? Number(opp.engagementRate) : null,
    score: opp.score != null ? Number(opp.score) : 0,
    evidenceType: opp.evidenceType,
    recommendationLabel: opp.recommendationLabel,
    rankWithinEvidenceType: opp.rankWithinEvidenceType,
    linkedinPostUrl: opp.linkedinPostUrl,
    enrichmentTitle: opp.enrichmentTitle || '',
    enrichmentExcerpt: opp.enrichmentExcerpt || '',
    enrichmentNotes: opp.enrichmentNotes || ''
  };
}

async function loadOpportunitiesFromApi(sort = 'score') {
  const session = getSession();
  const workspaceId = session.workspace?.publicUuid;

  if (!session.token) {
    return { ok: false, reason: 'auth' };
  }
  if (!isBackendWorkspaceId(workspaceId)) {
    return { ok: false, reason: 'workspace' };
  }

  try {
    const apiSort = sort === 'date' ? 'date' : 'score';
    const data = await apiRequest(`/api/v1/workspaces/${workspaceId}/opportunities?sort=${apiSort}`, {
      token: session.token
    });
    const items = Array.isArray(data) ? data.map(mapApiOpportunityToFeedItem) : [];
    PostBloom.opportunities = items;
    if (items.length > 0) {
      localStorage.setItem('postbloomImportDone', 'true');
    }
    return { ok: true, items };
  } catch (err) {
    return { ok: false, reason: 'error', message: err.message };
  }
}

function setOpportunitiesEmptyState({ title, message, ctaHref, ctaLabel }) {
  const empty = document.getElementById('opportunitiesEmpty');
  if (!empty) return;
  const heading = empty.querySelector('h3');
  const paragraph = empty.querySelector('.muted');
  const button = empty.querySelector('.btn');
  if (heading) heading.textContent = title;
  if (paragraph) paragraph.textContent = message;
  if (button) {
    if (ctaHref) {
      button.href = ctaHref;
      button.textContent = ctaLabel || 'Continue';
      button.hidden = false;
    } else {
      button.hidden = true;
    }
  }
}

function updateOpportunitySummary(items) {
  const summary = document.querySelector('.opportunity-filter-summary');
  if (!summary) return;
  if (!items.length) {
    summary.innerHTML = '<span>No scored posts</span><strong>Import analytics</strong>';
    return;
  }
  const topScore = Math.max(...items.map((item) => item.score || 0));
  summary.innerHTML = `<span>${items.length} scored posts</span><strong>Top score ${topScore}</strong>`;
}

async function renderOpportunities() {
  const grid = document.getElementById('opportunityGrid');
  const sort = document.getElementById('sortOpportunities');
  const empty = document.getElementById('opportunitiesEmpty');
  const hasImportFlag = localStorage.getItem('postbloomImportDone') === 'true';

  if (grid) {
    grid.innerHTML = '<p class="muted opportunity-loading">Loading opportunities…</p>';
  }
  if (empty) empty.hidden = true;

  const initialSort = sort?.value === 'recent' ? 'date' : 'score';
  let loadResult = await loadOpportunitiesFromApi(initialSort);

  function orderedItems() {
    const items = [...PostBloom.opportunities];
    const mode = sort ? sort.value : 'score';
    if (mode === 'impressions') return items.sort((a, b) => b.impressions - a.impressions);
    if (mode === 'engagement') {
      return items.sort(
        (a, b) => (b.reactions + b.comments + b.reposts) - (a.reactions + a.comments + a.reposts)
      );
    }
    if (mode === 'recent') return [...items].reverse();
    return items.sort((a, b) => b.score - a.score);
  }

  function draw() {
    if (!grid) return;

    if (!loadResult.ok) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      if (loadResult.reason === 'auth') {
        setOpportunitiesEmptyState({
          title: 'Sign in required',
          message: 'Sign in and select a workspace to load your opportunity feed from the backend.',
          ctaHref: '/app/auth',
          ctaLabel: 'Sign in'
        });
      } else if (loadResult.reason === 'workspace') {
        setOpportunitiesEmptyState({
          title: 'Backend workspace required',
          message: 'Create or select a backend workspace before viewing scored opportunities.',
          ctaHref: '/app/workspace-new',
          ctaLabel: 'Workspace setup'
        });
      } else {
        setOpportunitiesEmptyState({
          title: 'Could not load opportunities',
          message: `${loadResult.message}. Make sure the backend is running at ${getApiBase()}.`,
          ctaHref: '/app/analyze',
          ctaLabel: 'Import Analytics'
        });
      }
      updateOpportunitySummary([]);
      return;
    }

    if (!PostBloom.opportunities.length) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      if (hasImportFlag) {
        setOpportunitiesEmptyState({
          title: 'No scored posts found',
          message: 'Your import completed, but no scored opportunities are available for this workspace yet.',
          ctaHref: '/app/analyze',
          ctaLabel: 'Import Analytics'
        });
      } else {
        setOpportunitiesEmptyState({
          title: 'No analytics import yet',
          message: 'Import your LinkedIn spreadsheet to generate scored content opportunities.',
          ctaHref: '/app/analyze',
          ctaLabel: 'Import Analytics'
        });
      }
      updateOpportunitySummary([]);
      return;
    }

    if (empty) empty.hidden = true;
    updateOpportunitySummary(PostBloom.opportunities);

    grid.innerHTML = orderedItems().map((item, index) => {
      const engagement = item.reactions + item.comments + item.reposts;
      const engagementRate = item.engagementRate != null
        ? formatEngagementRate(item.engagementRate)
        : item.impressions > 0
          ? ((engagement / item.impressions) * 100).toFixed(1)
          : '0';
      const needsEnrichment = !item.enrichmentTitle;
      const title = item.recommendationLabel
        || (needsEnrichment ? 'Enrichment-ready source post' : 'High performer for campaign expansion');

      return `
      <article class="opportunity-card glass ${index === 0 ? 'opportunity-card-featured' : ''}">
        <div class="opportunity-card-glow"></div>
        <div class="opportunity-top">
          <div class="opportunity-rank">
            <span>#${index + 1}</span>
            <strong>${scoreBadge(item.score)}</strong>
          </div>
          <span class="opportunity-date">${item.date}</span>
        </div>
        <div class="opportunity-title-row">
          <h3>${escapeHtml(title)}</h3>
          <span class="opportunity-status">${needsEnrichment ? 'Needs text' : 'Ready'}</span>
        </div>
        <div class="opportunity-stats">
          <div class="mini-stat"><span>Impressions</span><strong>${formatNumber(item.impressions)}</strong></div>
          <div class="mini-stat"><span>Engagements</span><strong>${formatNumber(item.reactions)}</strong></div>
          <div class="mini-stat"><span>Evidence</span><strong>${escapeHtml(item.evidenceType || '—')}</strong></div>
          <div class="mini-stat"><span>Eng. Rate</span><strong>${engagementRate}%</strong></div>
        </div>
        <p class="opportunity-snippet">${escapeHtml(item.snippet)}</p>
        <div class="action-row">
          <a class="btn btn-primary" href="/app/enrich?opportunity=${item.id}">${needsEnrichment ? 'Enrich Source' : 'Create Campaign'} →</a>
          <span class="opportunity-meta">${formatNumber(engagement)} total engagements</span>
        </div>
      </article>
    `;
    }).join('');
  }

  if (sort) {
    sort.addEventListener('change', async () => {
      const mode = sort.value;
      if (mode === 'recent' || mode === 'score') {
        loadResult = await loadOpportunitiesFromApi(mode === 'recent' ? 'date' : 'score');
      }
      draw();
    });
  }

  draw();
}

function initialsFromName(name) {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';
}

function mapApiDeliverableToUi(deliverable) {
  const assignee = deliverable.assigneeName || deliverable.designerName || 'Awaiting specialist';
  const role = deliverable.designerName
    ? 'Designer'
    : deliverable.assigneeName
      ? 'Writer'
      : 'Specialist needed';

  return {
    publicUuid: deliverable.publicUuid,
    platformCode: deliverable.platformCode,
    platform: deliverable.platformName || deliverable.platformCode,
    role,
    assignee,
    initials: assignee === 'Awaiting specialist' ? 'AS' : initialsFromName(assignee),
    status: deliverable.statusCode,
    updated: deliverable.dueDate ? formatPublishDate(deliverable.dueDate) : 'Recently',
    brief: deliverable.title || 'No brief yet.',
    versions: [],
    comments: []
  };
}

function mapApiCommentToUi(comment) {
  return {
    name: comment.authorName || 'User',
    role: comment.authorRole || '',
    initials: initialsFromName(comment.authorName || 'U'),
    text: comment.body,
    time: formatPublishDate(comment.createdAt)
  };
}

async function loadPlatforms(token) {
  if (cachedPlatforms) return cachedPlatforms;
  const A = api(token);
  if (!A) return [];
  cachedPlatforms = await A.platforms.list(token);
  return cachedPlatforms;
}

function platformFieldSchema(platformCode, platforms) {
  const p = (platforms || []).find((x) => x.code === platformCode);
  return p?.fieldSchema || [];
}

function mapApiCampaignDetail(api) {
  const createdLabel = api.createdAt ? formatPublishDate(api.createdAt) : 'Unknown';

  return {
    id: api.publicUuid,
    opportunityUuid: api.opportunityUuid,
    name: api.name,
    source: api.enrichmentTitle || 'LinkedIn source post',
    statusLabel: api.statusName || api.statusCode,
    status: api.statusCode,
    created: createdLabel,
    deliverables: (api.deliverables || []).map(mapApiDeliverableToUi),
    activity: [[`${createdLabel}`, `Campaign "${api.name}" created`]]
  };
}

async function loadCampaignDetailFromApi(campaignId) {
  const session = getSession();
  if (!session.token) {
    return { ok: false, reason: 'auth' };
  }

  try {
    const data = await apiRequest(`/api/v1/campaigns/${campaignId}`, { token: session.token });
    return { ok: true, campaign: mapApiCampaignDetail(data) };
  } catch (err) {
    return { ok: false, reason: 'error', message: err.message };
  }
}

function setCampaignDetailEmptyState({
  title,
  message,
  ctaHref,
  ctaLabel
}) {
  const header = document.getElementById('campaignHeader');
  const deliverables = document.getElementById('deliverablesList');
  const activity = document.getElementById('campaignActivity');
  const overview = document.getElementById('campaignOverview');
  const cta = ctaHref
    ? `<a class="btn btn-primary" href="${escapeHtml(ctaHref)}">${escapeHtml(ctaLabel || 'Continue')}</a>`
    : '';

  if (header) {
    header.innerHTML = `
      <div>
        <div class="page-kicker">Campaign detail</div>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(message)}</p>
        ${cta ? `<div class="action-row" style="margin-top: 16px;">${cta}</div>` : ''}
      </div>
    `;
  }
  if (overview) overview.innerHTML = '';
  if (deliverables) {
    deliverables.innerHTML = '<div class="empty-state glass"><h3>No deliverables</h3><p class="muted">Deliverables will appear once a campaign is loaded.</p></div>';
  }
  if (activity) activity.innerHTML = '<p class="muted">No campaign activity yet.</p>';
}

async function loadCampaignActivity(campaignId) {
  const session = getSession();
  const A = api(session.token);
  const workspaceId = session.workspace?.publicUuid;
  if (!A || !isBackendWorkspaceId(workspaceId)) return [];
  const events = await A.campaigns.activity(session.token, workspaceId, 'campaign').catch(() => []);
  return (events || []).filter((e) => e.entityPublicUuid === campaignId).slice(0, 20);
}

async function paintCampaignDetailView(campaign) {
  const session = getSession();
  const A = api(session.token);
  const role = getAccountRole(session);
  const canManage = isOperatorRole(role);
  const canReview = role === 'reviewer' || role === 'admin';
  const canSubmit = ['writer', 'designer', 'admin'].includes(role);
  const platforms = session.token ? await loadPlatforms(session.token) : [];

  const header = document.getElementById('campaignHeader');
  const deliverablesEl = document.getElementById('deliverablesList');
  const activity = document.getElementById('campaignActivity');
  const overview = document.getElementById('campaignOverview');
  const exportPanel = document.getElementById('exportReadyList');

  const statusOptions = ['active', 'in_review', 'partially_approved', 'ready_to_publish', 'completed', 'cancelled'];

  if (header) {
    const statusSelect = canManage ? `
      <select id="campaignStatusSelect" class="status-select">
        ${statusOptions.map((s) => `<option value="${s}"${s === campaign.status ? ' selected' : ''}>${statusLabels[s] || s}</option>`).join('')}
      </select>
      <button type="button" class="btn btn-secondary btn-small" id="campaignStatusSave">Update status</button>
    ` : statusBadge(campaign.status);

    header.innerHTML = `
      <div class="campaign-title-row">
        <div>
          <div class="page-kicker">${escapeHtml(campaign.statusLabel)}</div>
          <h1>${escapeHtml(campaign.name)}</h1>
          <p>${escapeHtml(campaign.source)}</p>
        </div>
        <div class="action-row">
          ${statusSelect}
          <a class="btn btn-secondary" href="/app/opportunities">Opportunities</a>
        </div>
      </div>
      ${canManage && campaign.status === 'active' ? `
        <form class="add-deliverable-form content-card glass" id="addDeliverableForm">
          <h3>Add deliverable</h3>
          <div class="form-grid-inline">
            <select id="addDeliverablePlatform" required>
              <option value="">Platform…</option>
              ${(platforms || []).map((p) => `<option value="${escapeHtml(p.code)}">${escapeHtml(p.name)}</option>`).join('')}
            </select>
            <input id="addDeliverableTitle" placeholder="Title (optional)">
            <button type="submit" class="btn btn-primary btn-small">Add</button>
          </div>
          <div class="error-card" id="addDeliverableError"></div>
        </form>
      ` : ''}
    `;

    const statusBtn = document.getElementById('campaignStatusSave');
    if (statusBtn && A) {
      statusBtn.addEventListener('click', async () => {
        const code = document.getElementById('campaignStatusSelect')?.value;
        try {
          await A.campaigns.updateStatus(session.token, campaign.id, { statusCode: code });
          window.location.reload();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    const addForm = document.getElementById('addDeliverableForm');
    if (addForm && A) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('addDeliverableError');
        hideInlineError(errEl);
        try {
          await A.campaigns.addDeliverable(session.token, campaign.id, {
            platformCode: document.getElementById('addDeliverablePlatform').value,
            title: document.getElementById('addDeliverableTitle').value.trim() || undefined
          });
          window.location.reload();
        } catch (err) {
          showInlineError(errEl, err.message);
        }
      });
    }
  }

  if (overview) {
    overview.innerHTML = `
      <div class="metrics-grid">
        <article class="metric-panel glass"><div class="metric-label">Source</div><div class="metric-value">${escapeHtml(campaign.source)}</div></article>
        <article class="metric-panel glass"><div class="metric-label">Deliverables</div><div class="metric-value">${campaign.deliverables.length}</div></article>
        <article class="metric-panel glass"><div class="metric-label">Created</div><div class="metric-value">${escapeHtml(campaign.created)}</div></article>
        <article class="metric-panel glass"><div class="metric-label">Status</div><div>${statusBadge(campaign.status)}</div></article>
      </div>
    `;
  }

  if (exportPanel && A) {
    try {
      const ready = await A.campaigns.exportReady(session.token, campaign.id);
      exportPanel.innerHTML = (ready || []).length ? (ready || []).map((row) => `
        <article class="content-card glass">
          <h3>${escapeHtml(row.title || row.platformCode)}</h3>
          <p class="muted">${escapeHtml(row.platformCode)} · v${row.latestVersion || 1}</p>
          <pre class="export-payload">${escapeHtml(JSON.stringify(row.payload || {}, null, 2))}</pre>
        </article>
      `).join('') : '<p class="muted">No export-ready deliverables yet.</p>';
    } catch (err) {
      exportPanel.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
    }
  }

  if (deliverablesEl) {
    if (!campaign.deliverables.length) {
      deliverablesEl.innerHTML = '<div class="empty-state glass"><h3>No deliverables yet</h3></div>';
    } else {
      deliverablesEl.innerHTML = campaign.deliverables.map((item, index) => {
        const schema = platformFieldSchema(item.platformCode, platforms);
        const fieldsHtml = schema.map((f) => `
          <div class="field">
            <label>${escapeHtml(f.label)}${f.required ? ' *' : ''}</label>
            ${f.type === 'textarea'
              ? `<textarea data-submit-field="${escapeHtml(f.key)}" rows="3"></textarea>`
              : `<input data-submit-field="${escapeHtml(f.key)}" type="text">`}
          </div>
        `).join('');

        return `
      <article class="deliverable-card glass ${index === 0 ? 'is-expanded' : ''}" data-deliverable-id="${escapeHtml(item.publicUuid)}">
        <div class="deliverable-summary" data-expand-deliverable>
          <div>
            <h3>${escapeHtml(item.platform)}</h3>
            <p class="muted">${escapeHtml(item.role)} · ${escapeHtml(item.updated)}</p>
          </div>
          <div class="assignee">
            <span class="avatar">${escapeHtml(item.initials)}</span>
            <strong>${escapeHtml(item.assignee)}</strong>
            ${statusBadge(item.status)}
          </div>
        </div>
        <div class="deliverable-body">
          <p>${escapeHtml(item.brief)}</p>
          <div class="staff-requests-block" data-staff-list="${index}"><p class="muted">Loading staff requests…</p></div>
          ${canManage ? `<button type="button" class="btn btn-secondary btn-small" data-request-staff="${index}">Request specialist</button>` : ''}
          <section class="comment-section">
            <h4>Comments</h4>
            <div class="comment-list" data-comment-list="${index}">${renderComments(item.comments)}</div>
            <div class="comment-composer">
              <textarea maxlength="5000" rows="3" data-comment-input="${index}"></textarea>
              <button class="btn btn-primary btn-small" type="button" data-post-comment="${index}" disabled>Post Comment</button>
            </div>
          </section>
          ${canSubmit ? `
            <div class="submit-panel content-card glass" data-submit-panel="${index}">
              <h4>Submit version</h4>
              ${role === 'designer' ? `
                <div class="field"><label>External URL (HTTPS)</label><input type="url" data-external-url="${index}" placeholder="https://…"></div>
              ` : `
                ${fieldsHtml || '<p class="muted">No field schema for this platform.</p>'}
              `}
              <button type="button" class="btn btn-primary btn-small" data-submit-version="${index}">Submit</button>
            </div>
          ` : ''}
          ${canReview ? `
            <div class="action-row">
              <button type="button" class="btn btn-secondary btn-small" data-review-action="${index}" data-action="request_revision">Request revision</button>
              <button type="button" class="btn btn-primary btn-small" data-review-action="${index}" data-action="approve">Approve</button>
            </div>
          ` : ''}
        </div>
      </article>`;
      }).join('');

      document.querySelectorAll('[data-expand-deliverable]').forEach((button) => {
        button.addEventListener('click', () => button.closest('.deliverable-card').classList.toggle('is-expanded'));
      });

      for (let index = 0; index < campaign.deliverables.length; index += 1) {
        const item = campaign.deliverables[index];
        if (A && item.publicUuid) {
          try {
            const comments = await A.deliverables.listComments(session.token, item.publicUuid);
            item.comments = (comments || []).map(mapApiCommentToUi);
            const list = document.querySelector(`[data-comment-list="${index}"]`);
            if (list) list.innerHTML = renderComments(item.comments);

            const staff = await A.deliverables.listStaffRequests(session.token, item.publicUuid);
            const staffEl = document.querySelector(`[data-staff-list="${index}"]`);
            if (staffEl) {
              staffEl.innerHTML = (staff || []).length
                ? (staff || []).map((r) => `<span class="pill-tag">${escapeHtml(r.roleCode)}: ${escapeHtml(r.status)}</span>`).join(' ')
                : '<span class="muted">No staff requests</span>';
            }
          } catch { /* ignore */ }
        }

        const input = document.querySelector(`[data-comment-input="${index}"]`);
        const postBtn = document.querySelector(`[data-post-comment="${index}"]`);
        if (input && postBtn) {
          input.addEventListener('input', () => { postBtn.disabled = !input.value.trim(); });
          postBtn.addEventListener('click', async () => {
            const text = input.value.trim();
            if (!text || !A || !item.publicUuid) return;
            try {
              await A.deliverables.addComment(session.token, item.publicUuid, { body: text });
              const comments = await A.deliverables.listComments(session.token, item.publicUuid);
              item.comments = (comments || []).map(mapApiCommentToUi);
              document.querySelector(`[data-comment-list="${index}"]`).innerHTML = renderComments(item.comments);
              input.value = '';
              postBtn.disabled = true;
            } catch (err) {
              alert(err.message);
            }
          });
        }

        const submitBtn = document.querySelector(`[data-submit-version="${index}"]`);
        if (submitBtn && A) {
          submitBtn.addEventListener('click', async () => {
            const body = {};
            if (role === 'designer') {
              body.externalUrl = document.querySelector(`[data-external-url="${index}"]`)?.value?.trim();
            } else {
              const payload = {};
              const panel = document.querySelector(`[data-submit-panel="${index}"]`);
              panel?.querySelectorAll('[data-submit-field]').forEach((el) => {
                payload[el.dataset.submitField] = el.value;
              });
              body.payload = payload;
            }
            try {
              await A.deliverables.submitVersion(session.token, item.publicUuid, body);
              window.location.reload();
            } catch (err) {
              alert(err.message);
            }
          });
        }

        document.querySelectorAll(`[data-review-action="${index}"]`).forEach((btn) => {
          btn.addEventListener('click', async () => {
            if (!A) return;
            try {
              await A.deliverables.review(session.token, item.publicUuid, {
                action: btn.dataset.action,
                notes: ''
              });
              window.location.reload();
            } catch (err) {
              alert(err.message);
            }
          });
        });

        const reqStaff = document.querySelector(`[data-request-staff="${index}"]`);
        if (reqStaff && A) {
          reqStaff.addEventListener('click', async () => {
            try {
              await A.deliverables.createStaffRequest(session.token, item.publicUuid, {});
              window.location.reload();
            } catch (err) {
              alert(err.message);
            }
          });
        }
      }
    }
  }

  if (activity) {
    const events = await loadCampaignActivity(campaign.id);
    activity.innerHTML = events.length ? events.map((item) => `
      <div class="activity-item">
        <span class="activity-dot"></span>
        <div><div class="activity-text">${escapeHtml(item.action)}</div><div class="activity-time">${escapeHtml(formatPublishDate(item.createdAt))}</div></div>
      </div>
    `).join('') : '<p class="muted">No campaign activity yet.</p>';
  }
}

async function renderCampaignDetail() {
  const campaignId = new URLSearchParams(window.location.search).get('id');
  const header = document.getElementById('campaignHeader');

  if (!campaignId) {
    setCampaignDetailEmptyState({
      title: 'No campaign selected',
      message: 'Open a campaign from your workflow or create one from an enriched opportunity.',
      ctaHref: '/app/opportunities',
      ctaLabel: 'Go to opportunities'
    });
    return;
  }

  if (header) {
    header.innerHTML = '<div><h1>Loading campaign…</h1><p class="muted">Fetching deliverables…</p></div>';
  }

  await ensureBootstrap();
  const result = await loadCampaignDetailFromApi(campaignId);
  if (!result.ok) {
    setCampaignDetailEmptyState({
      title: 'Campaign unavailable',
      message: result.reason === 'auth' ? 'Sign in to view this campaign.' : (result.message || 'Could not load.'),
      ctaHref: '/app/opportunities',
      ctaLabel: 'Back to opportunities'
    });
    return;
  }

  await paintCampaignDetailView(result.campaign);
}

function initTabs() {
  document.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach((item) => {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
        item.setAttribute('tabindex', '-1');
      });
      document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      tab.removeAttribute('tabindex');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
}

function initImport() {
  const dropzone = document.getElementById('dropzone');
  const input = document.getElementById('analyticsFile');
  const fileSummary = document.getElementById('fileSummary');
  const error = document.getElementById('importError');
  const summary = document.getElementById('importSummary');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const importButton = document.getElementById('importButton');

  if (!dropzone || !input) return;

  let currentFile = null;

  function showErrorMsg(msg) {
    if (error) {
      error.textContent = msg;
      error.classList.add('is-visible');
    }
    fileSummary?.classList.remove('is-visible');
    summary?.classList.remove('is-visible');
  }

  function handleFile(file) {
    currentFile = file;
    if (!file || !file.name.endsWith('.xlsx')) {
      currentFile = null;
      showErrorMsg('Upload a LinkedIn analytics .xlsx export.');
      return;
    }
    error?.classList.remove('is-visible');
    fileName.textContent = file.name;
    fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    fileSummary.classList.add('is-visible');
  }

  dropzone.addEventListener('click', () => input.click());
  input.addEventListener('change', () => handleFile(input.files[0]));
  dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropzone.classList.add('is-dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
  dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropzone.classList.remove('is-dragover');
    handleFile(event.dataTransfer.files[0]);
  });

  if (importButton) {
    importButton.addEventListener('click', async () => {
      if (!currentFile) {
        showErrorMsg('Choose an .xlsx file first.');
        return;
      }
      await ensureBootstrap();
      const session = getSession();
      const A = api(session.token);
      const workspaceId = session.workspace?.publicUuid;
      if (!session.token || !A || !isBackendWorkspaceId(workspaceId)) {
        window.location.href = '/app/analyze';
        return;
      }
      importButton.disabled = true;
      importButton.textContent = 'Importing…';
      try {
        await A.analytics.import(session.token, workspaceId, currentFile);
        localStorage.setItem('postbloomImportDone', 'true');
        summary?.classList.add('is-visible');
        window.location.href = '/app/opportunities';
      } catch (err) {
        showErrorMsg(err.message);
      } finally {
        importButton.disabled = false;
        importButton.textContent = 'Validate & Import';
      }
    });
  }
}

function initEnrichForm(opportunityId) {
  const form = document.getElementById('enrichForm');
  const errorEl = document.getElementById('enrichFormError');
  if (!form || form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideInlineError(errorEl);

    const session = getSession();
    const workspaceId = session.workspace?.publicUuid;
    const title = document.getElementById('enrichmentTitle')?.value?.trim();
    const excerpt = document.getElementById('enrichmentExcerpt')?.value?.trim() || undefined;
    const notes = document.getElementById('enrichmentNotes')?.value?.trim() || undefined;

    if (!title) {
      showInlineError(errorEl, 'Source title is required.');
      return;
    }
    if (!session.token || !isBackendWorkspaceId(workspaceId) || !opportunityId) {
      showInlineError(errorEl, 'Sign in and select a workspace to save enrichment.');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      await apiRequest(
        `/api/v1/workspaces/${workspaceId}/opportunities/${opportunityId}/enrich`,
        { method: 'PATCH', token: session.token, body: { title, excerpt, notes } }
      );
      window.location.href = `/app/campaign-new?opportunity=${encodeURIComponent(opportunityId)}`;
    } catch (err) {
      showInlineError(errorEl, err.message);
      if (submitButton) submitButton.disabled = false;
    }
  });
}

async function loadOpportunityById(opportunityId) {
  const session = getSession();
  const workspaceId = session.workspace?.publicUuid;
  const A = api(session.token);
  if (!session.token || !A || !isBackendWorkspaceId(workspaceId) || !opportunityId) {
    return { ok: false, reason: 'auth' };
  }
  try {
    const opp = await A.opportunities.get(session.token, workspaceId, opportunityId);
    return { ok: true, item: mapApiOpportunityToFeedItem(opp) };
  } catch (err) {
    return { ok: false, reason: 'error', message: err.message };
  }
}

async function renderEnrich() {
  const params = new URLSearchParams(window.location.search);
  const opportunityId = params.get('opportunity');
  const metrics = document.getElementById('enrichMetrics');
  const titleInput = document.getElementById('enrichmentTitle');
  const excerptInput = document.getElementById('enrichmentExcerpt');
  const notesInput = document.getElementById('enrichmentNotes');

  if (metrics) {
    metrics.innerHTML = '<p class="muted">Loading opportunity…</p>';
  }

  await ensureBootstrap();
  let loadResult = opportunityId
    ? await loadOpportunityById(opportunityId)
    : await loadOpportunitiesFromApi('score').then((r) => ({
      ok: r.ok,
      item: PostBloom.opportunities[0],
      reason: r.reason,
      message: r.message
    }));

  const item = loadResult.item;

  if (!loadResult.ok || !item) {
    const message = !loadResult.ok
      ? (loadResult.reason === 'auth'
        ? 'Sign in to load this opportunity.'
        : loadResult.reason === 'workspace'
          ? 'Select a backend workspace to load this opportunity.'
          : loadResult.message)
      : 'No opportunity found. Import analytics or pick a post from the feed.';

    if (metrics) {
      metrics.innerHTML = `
        <div class="empty-state glass">
          <h3>Opportunity unavailable</h3>
          <p class="muted">${escapeHtml(message)}</p>
          <a class="btn btn-primary" href="/app/opportunities">Back to Opportunity Feed</a>
        </div>
      `;
    }
    if (titleInput) titleInput.value = '';
    if (excerptInput) excerptInput.value = '';
    if (notesInput) notesInput.value = '';
    return;
  }

  const linkedinLink = item.linkedinPostUrl
    ? `<article class="metric-panel glass"><div class="metric-label">LinkedIn post</div><div class="metric-value"><a href="${escapeHtml(item.linkedinPostUrl)}" target="_blank" rel="noreferrer">View original</a></div></article>`
    : '';

  if (metrics) {
    metrics.innerHTML = `
      <article class="metric-panel glass"><div class="metric-label">Opportunity Score</div><div class="metric-value">${item.score}</div></article>
      <article class="metric-panel glass"><div class="metric-label">Impressions</div><div class="metric-value">${formatNumber(item.impressions)}</div></article>
      <article class="metric-panel glass"><div class="metric-label">Engagements</div><div class="metric-value">${formatNumber(item.reactions)}</div></article>
      <article class="metric-panel glass"><div class="metric-label">Post Date</div><div class="metric-value">${escapeHtml(item.date.split(',')[0])}</div></article>
      ${linkedinLink}
    `;
  }

  if (titleInput) {
    titleInput.value = item.enrichmentTitle || item.recommendationLabel || '';
  }
  if (excerptInput) {
    excerptInput.value = item.enrichmentExcerpt || (item.snippet.startsWith('[') ? '' : item.snippet);
  }
  if (notesInput) {
    notesInput.value = item.enrichmentNotes || '';
  }

  initEnrichForm(item.id);
}

function initCampaignNew() {
  const platformContainer = document.getElementById('platformCheckboxes');
  const assignmentList = document.getElementById('assignmentList');
  const form = document.getElementById('campaignForm');
  const errorEl = document.getElementById('campaignFormError');
  const gateBanner = document.getElementById('campaignSetupGate');

  let platformList = [];

  function getChecks() {
    return document.querySelectorAll('[data-platform-check]');
  }

  function drawAssignments() {
    if (!assignmentList) return;
    const checks = getChecks();
    const selected = [...checks].filter((c) => c.checked);
    if (!selected.length) {
      assignmentList.innerHTML = '<p class="muted">Select at least one target platform to request specialists.</p>';
      return;
    }

    assignmentList.innerHTML = selected.map((check) => {
      const code = check.value;
      const name = check.dataset.platformName || code;
      const role = PLATFORM_DEFAULT_ROLE[code] || 'writer';
      const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
      return `
      <div class="assignment-row">
        <strong>${escapeHtml(name)}</strong>
        <label class="assignment-request">
          <input type="checkbox" data-request-specialist data-platform-code="${escapeHtml(code)}" checked>
          Request ${escapeHtml(roleLabel)} specialist
        </label>
        <span class="role-badge">${escapeHtml(roleLabel)}</span>
      </div>
    `;
    }).join('');
  }

  async function loadPlatformCheckboxes() {
    const session = getSession();
    const A = api(session.token);
    if (!platformContainer || !A || !session.token) return;

    if (gateBanner) {
      const setup = session.setup || {};
      if (!setup.canCreateCampaign) {
        gateBanner.hidden = false;
        gateBanner.innerHTML = '<p class="muted">Import analytics before creating campaigns.</p><a class="btn btn-primary btn-small" href="/app/analyze">Import</a>';
        form?.querySelector('button[type="submit"]')?.setAttribute('disabled', 'true');
      } else {
        gateBanner.hidden = true;
        form?.querySelector('button[type="submit"]')?.removeAttribute('disabled');
      }
    }

    try {
      platformList = await loadPlatforms(session.token);
      platformContainer.innerHTML = (platformList || []).map((p) => `
        <label class="platform-check">
          <input type="checkbox" data-platform-check value="${escapeHtml(p.code)}" data-platform-name="${escapeHtml(p.name)}">
          <span>${escapeHtml(p.name)}</span>
        </label>
      `).join('');
      getChecks().forEach((check) => check.addEventListener('change', drawAssignments));
      drawAssignments();
    } catch (err) {
      platformContainer.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
    }
  }

  ensureBootstrap().then(loadPlatformCheckboxes);

  if (!form || form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideInlineError(errorEl);

    const session = getSession();
    const workspaceId = session.workspace?.publicUuid;
    const opportunityUuid = new URLSearchParams(window.location.search).get('opportunity');
    const name = document.getElementById('campaignName')?.value?.trim();
    const platformCodes = [...getChecks()]
      .filter((check) => check.checked)
      .map((check) => check.value)
      .filter(Boolean);
    const requestPlatformCodes = new Set(
      [...form.querySelectorAll('[data-request-specialist]:checked')]
        .map((input) => input.dataset.platformCode)
        .filter(Boolean)
    );

    if (!name) {
      showInlineError(errorEl, 'Campaign name is required.');
      return;
    }
    if (!platformCodes.length) {
      showInlineError(errorEl, 'Select at least one target platform.');
      return;
    }
    if (!session.token || !isBackendWorkspaceId(workspaceId)) {
      showInlineError(errorEl, 'Sign in and select a workspace to create a campaign.');
      return;
    }
    if (!opportunityUuid) {
      showInlineError(errorEl, 'Open this page from an enriched opportunity to link the source post.');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const created = await apiRequest(`/api/v1/workspaces/${workspaceId}/campaigns`, {
        method: 'POST',
        token: session.token,
        body: { opportunityUuid, name, platformCodes }
      });

      if (requestPlatformCodes.size > 0) {
        const detail = await apiRequest(`/api/v1/campaigns/${created.publicUuid}`, {
          token: session.token
        });
        const deliverables = Array.isArray(detail?.deliverables) ? detail.deliverables : [];
        await Promise.all(
          deliverables
            .filter((deliverable) => requestPlatformCodes.has(deliverable.platformCode))
            .map((deliverable) => apiRequest(
              `/api/v1/deliverables/${deliverable.publicUuid}/staff-requests`,
              { method: 'POST', token: session.token, body: {} }
            ))
        );
      }

      window.location.href = `/app/campaign-detail?id=${encodeURIComponent(created.publicUuid)}`;
    } catch (err) {
      showInlineError(errorEl, err.message);
      if (submitButton) submitButton.disabled = false;
    }
  });
}

async function renderTeam() {
  const grid = document.getElementById('teamGrid');
  const adminBlock = document.getElementById('adminTeamBlock');
  const addForm = document.getElementById('adminAddMemberForm');

  await ensureBootstrap();
  const session = getSession();
  const A = api(session.token);
  const workspaceId = session.workspace?.publicUuid;

  if (grid && session.token && A && isBackendWorkspaceId(workspaceId)) {
    try {
      const members = await A.workspaces.members(session.token, workspaceId);
      PostBloom.team = (members || []).map((m) => ({
        publicUuid: m.user?.publicUuid,
        name: m.user?.displayName || 'Member',
        email: m.user?.email || '',
        role: m.accountRole || m.roleCode,
        initials: initialsFromName(m.user?.displayName || 'M'),
        active: '—'
      }));
      grid.innerHTML = PostBloom.team.length ? PostBloom.team.map((member) => `
      <article class="member-card glass">
        <div class="member-top">
          <span class="avatar">${escapeHtml(member.initials)}</span>
          <div>
            <h3>${escapeHtml(member.name)}</h3>
            <p class="muted">${escapeHtml(member.email)}</p>
          </div>
        </div>
        <span class="role-badge">${escapeHtml(member.role)}</span>
      </article>
    `).join('') : '<div class="empty-state glass"><h3>No members</h3></div>';
    } catch (err) {
      grid.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
    }
  }

  if (adminBlock && getAccountRole() === 'admin') {
    adminBlock.hidden = false;
    if (addForm && !addForm.dataset.bound) {
      addForm.dataset.bound = 'true';
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('adminAddUserId')?.value?.trim();
        const errEl = document.getElementById('adminAddError');
        hideInlineError(errEl);
        if (!userId || !A) return;
        try {
          await A.admin.addToWorkspace(session.token, userId, workspaceId);
          await renderTeam();
        } catch (err) {
          showInlineError(errEl, err.message);
        }
      });
    }
  } else if (adminBlock) {
    adminBlock.hidden = true;
  }
}

function mapMyWorkItem(row) {
  return {
    id: row.public_uuid || row.publicUuid,
    title: row.title,
    status: row.status_code || row.statusCode,
    platform: row.platform_name || row.platformName,
    campaignId: row.campaign_public_uuid || row.campaignPublicUuid,
    campaignName: row.campaign_name || row.campaignName
  };
}

async function renderWork() {
  const list = document.getElementById('workList');
  const tab = new URLSearchParams(window.location.search).get('tab') || 'my-work';
  if (!list) return;

  await ensureBootstrap();
  const session = getSession();
  const A = api(session.token);
  const workspaceId = session.workspace?.publicUuid;
  list.innerHTML = '<p class="muted">Loading…</p>';

  if (!session.token || !A || !isBackendWorkspaceId(workspaceId)) {
    list.innerHTML = '<p class="muted">Sign in with a workspace to view work.</p>';
    return;
  }

  try {
    const items = tab === 'review'
      ? await A.campaigns.reviewQueue(session.token, workspaceId)
      : await A.campaigns.myWork(session.token, workspaceId);
    const mapped = (items || []).map(mapMyWorkItem);
    list.innerHTML = mapped.length ? mapped.map((item) => `
      <article class="content-card glass">
        <h3>${escapeHtml(item.title)}</h3>
        <p class="muted">${escapeHtml(item.platform)} · ${escapeHtml(item.campaignName)}</p>
        ${statusBadge(item.status)}
        <a class="btn btn-secondary btn-small" href="/app/campaign-detail?id=${encodeURIComponent(item.campaignId)}">Open campaign</a>
      </article>
    `).join('') : '<p class="muted">Nothing in this queue.</p>';
  } catch (err) {
    list.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
  }

  document.querySelectorAll('[data-work-tab]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.workTab === tab);
  });
}

async function renderInbox() {
  const list = document.getElementById('inboxList');
  if (!list) return;

  await ensureBootstrap();
  const session = getSession();
  const A = api(session.token);
  list.innerHTML = '<p class="muted">Loading…</p>';

  if (!session.token || !A) {
    list.innerHTML = '<p class="muted">Sign in as a specialist.</p>';
    return;
  }

  try {
    const items = await A.staffing.listInbox(session.token, 'pending');
    list.innerHTML = (items || []).length ? (items || []).map((req) => `
      <article class="content-card glass">
        <h3>${escapeHtml(req.campaignName || 'Campaign')}</h3>
        <p class="muted">${escapeHtml(req.roleCode)} · ${escapeHtml(req.deliverableTitle || 'Campaign scope')}</p>
        <button type="button" class="btn btn-primary btn-small" data-accept-request="${escapeHtml(req.publicUuid)}">Accept</button>
      </article>
    `).join('') : '<p class="muted">No pending requests.</p>';

    list.querySelectorAll('[data-accept-request]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await A.staffing.accept(session.token, btn.dataset.acceptRequest);
          await renderInbox();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  } catch (err) {
    list.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
  }
}

async function renderAdmin() {
  await ensureBootstrap();
  const roleForm = document.getElementById('adminRoleForm');
  const analyticsEl = document.getElementById('adminAnalytics');
  const session = getSession();
  const A = api(session.token);

  if (getAccountRole() !== 'admin') {
    if (analyticsEl) analyticsEl.innerHTML = '<p class="muted">Admin access required.</p>';
    return;
  }

  if (roleForm && !roleForm.dataset.bound) {
    roleForm.dataset.bound = 'true';
    roleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('adminRoleError');
      hideInlineError(errEl);
      try {
        await A.admin.assignRole(session.token, document.getElementById('adminRoleUserId').value.trim(), {
          roleCode: document.getElementById('adminRoleCode').value
        });
        alert('Role updated.');
      } catch (err) {
        showInlineError(errEl, err.message);
      }
    });
  }

  if (analyticsEl && A) {
    try {
      const roles = ['writer', 'designer', 'reviewer'];
      const results = await Promise.all(roles.map((r) => A.admin.specialistAnalytics(session.token, r).catch(() => [])));
      analyticsEl.innerHTML = roles.map((role, i) => {
        const rows = results[i] || [];
        return `<h3>${escapeHtml(role)}</h3>${rows.length ? rows.map((u) => `
          <p>${escapeHtml(u.displayName)} — ${(u.completionRate * 100).toFixed(0)}% (${u.campaignsCompleted}/${u.campaignsParticipated})</p>
        `).join('') : '<p class="muted">No data</p>'}`;
      }).join('');
    } catch (err) {
      analyticsEl.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
    }
  }
}

async function initWorkspaceList() {
  const listEl = document.getElementById('existingWorkspaces');
  const session = getSession();
  const A = api(session.token);
  if (!listEl || !session.token || !A) return;

  try {
    const workspaces = await A.workspaces.list(session.token);
    if (!workspaces?.length) return;
    listEl.innerHTML = `
      <h3>Continue with an existing workspace</h3>
      ${workspaces.map((w) => `
        <button type="button" class="btn btn-secondary workspace-pick" data-workspace-id="${escapeHtml(w.publicUuid)}">${escapeHtml(w.name)}</button>
      `).join('')}
    `;
    listEl.querySelectorAll('.workspace-pick').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const detail = await A.workspaces.get(session.token, btn.dataset.workspaceId);
        saveSession({ workspace: detail, setup: detail.setup });
        window.location.href = '/app/dashboard';
      });
    });
    listEl.hidden = false;
  } catch { /* ignore */ }
}

function initPostBloomApp() {
  initTheme();
  initClock();
  initShell();
  initTabs();

  const page = document.body.dataset.page || document.querySelector('[data-postbloom-page]')?.dataset.postbloomPage;
  if (page === 'auth') initAuth();
  if (page === 'tutorial') initTutorial();
  if (page === 'workspace-new') {
    initWorkspaceNew();
    void initWorkspaceList();
  }
  if (page === 'analyze') initAnalyze();
  if (page === 'dashboard') void renderDashboard();
  if (page === 'opportunities') void renderOpportunities();
  if (page === 'campaign-detail') void renderCampaignDetail();
  if (page === 'import') initImport();
  if (page === 'enrich') void renderEnrich();
  if (page === 'campaign-new') initCampaignNew();
  if (page === 'team') void renderTeam();
  if (page === 'work') void renderWork();
  if (page === 'inbox') void renderInbox();
  if (page === 'admin') void renderAdmin();
  if (page === 'profile') initProfile();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPostBloomApp);
} else {
  initPostBloomApp();
}
