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

const API_BASE = 'http://localhost:3000';

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

async function apiRequest(path, { method = 'GET', body, token, headers = {} } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
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
      window.location.href = '/app/workspace-new';
    } catch (err) {
      showInlineError(error, `${err.message}. Make sure the backend is running at ${API_BASE}.`);
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

function renderDashboard() {
  const metrics = document.getElementById('dashboardMetrics');
  const table = document.getElementById('campaignRows');
  const activity = document.getElementById('recentActivity');
  const empty = document.getElementById('dashboardEmpty');

  if (metrics) {
    const activeDeliverables = PostBloom.campaigns.flatMap((campaign) => campaign.deliverables)
      .filter((item) => !['approved', 'ready_to_publish'].includes(item.status)).length;
    const pendingApprovals = PostBloom.campaigns.flatMap((campaign) => campaign.deliverables)
      .filter((item) => ['submitted_for_review', 'in_review'].includes(item.status)).length;
    metrics.innerHTML = [
      ['Total Campaigns', PostBloom.campaigns.length],
      ['Active Deliverables', activeDeliverables],
      ['Pending Approvals', pendingApprovals],
      ['Team Members', PostBloom.team.length]
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
        <td><strong>${campaign.name}</strong></td>
        <td class="source-snippet">${campaign.source}</td>
        <td>${statusBadge(campaign.status)}</td>
        <td>${campaign.created}</td>
        <td><a class="btn btn-secondary" href="/app/campaign-detail?id=${campaign.id}">Open</a></td>
      </tr>
    `).join('');
  }

  if (activity) {
    const items = PostBloom.campaigns.flatMap((campaign) => campaign.activity.slice(0, 2)
      .map(([time, text]) => ({ time, text, campaign: campaign.name })))
      .slice(0, 6);
    activity.innerHTML = items.length ? items.map((item) => `
        <div class="activity-item">
          <span class="activity-dot"></span>
          <div>
            <div class="activity-text">${item.text}</div>
            <div class="activity-time">${item.time} · ${item.campaign}</div>
          </div>
        </div>
      `).join('') : '<p class="muted">No workspace activity yet.</p>';
  }

  if (empty) {
    empty.hidden = PostBloom.campaigns.length > 0;
  }
}

function renderOpportunities() {
  const grid = document.getElementById('opportunityGrid');
  const sort = document.getElementById('sortOpportunities');
  const empty = document.getElementById('opportunitiesEmpty');
  const hasImport = localStorage.getItem('postbloomImportDone') === 'true';

  function orderedItems() {
    const items = [...PostBloom.opportunities];
    const mode = sort ? sort.value : 'score';
    if (mode === 'recent') return items.reverse();
    if (mode === 'impressions') return items.sort((a, b) => b.impressions - a.impressions);
    if (mode === 'engagement') return items.sort((a, b) => (b.reactions + b.comments + b.reposts) - (a.reactions + a.comments + a.reposts));
    return items.sort((a, b) => b.score - a.score);
  }

  function draw() {
    if (!grid) return;
    if (!hasImport || !PostBloom.opportunities.length) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    grid.innerHTML = orderedItems().map((item, index) => {
      const engagement = item.reactions + item.comments + item.reposts;
      const engagementRate = ((engagement / item.impressions) * 100).toFixed(1);
      const needsEnrichment = item.snippet.startsWith('[No text');

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
          <h3>${needsEnrichment ? 'Enrichment-ready source post' : 'High performer for campaign expansion'}</h3>
          <span class="opportunity-status">${needsEnrichment ? 'Needs text' : 'Ready'}</span>
        </div>
        <div class="opportunity-stats">
          <div class="mini-stat"><span>Impressions</span><strong>${formatNumber(item.impressions)}</strong></div>
          <div class="mini-stat"><span>Reactions</span><strong>${formatNumber(item.reactions)}</strong></div>
          <div class="mini-stat"><span>Comments</span><strong>${formatNumber(item.comments)}</strong></div>
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

  if (sort) sort.addEventListener('change', draw);
  draw();
}

function renderCampaignDetail() {
  const params = new URLSearchParams(window.location.search);
  const campaign = PostBloom.campaigns.find((item) => item.id === params.get('id')) || PostBloom.campaigns[0];
  const header = document.getElementById('campaignHeader');
  const deliverables = document.getElementById('deliverablesList');
  const activity = document.getElementById('campaignActivity');
  const overview = document.getElementById('campaignOverview');

  if (!campaign) {
    if (header) {
      header.innerHTML = `
        <div>
          <div class="page-kicker">Campaign detail</div>
          <h1>No campaign selected</h1>
          <p>Create a campaign from imported LinkedIn opportunities to view deliverables here.</p>
        </div>
      `;
    }
    if (overview) overview.innerHTML = '';
    if (deliverables) deliverables.innerHTML = '<div class="empty-state glass"><h3>No campaign data</h3><p class="muted">Campaign details will appear after a campaign exists.</p></div>';
    if (activity) activity.innerHTML = '<p class="muted">No campaign activity yet.</p>';
    return;
  }

  if (header) {
    header.innerHTML = `
      <div class="campaign-title-row">
        <div>
          <div class="page-kicker">Opportunity score ${campaign.score}</div>
          <h1>${campaign.name}</h1>
          <p>${campaign.source}</p>
        </div>
        <div class="action-row">
          ${statusBadge(campaign.status)}
          <a class="btn btn-secondary" href="/app/campaign-new">Edit</a>
        </div>
      </div>
    `;
  }

  if (overview) {
    overview.innerHTML = `
      <div class="metrics-grid">
        <article class="metric-panel glass"><div class="metric-label">Source Score</div><div class="metric-value">${campaign.score}</div></article>
        <article class="metric-panel glass"><div class="metric-label">Deliverables</div><div class="metric-value">${campaign.deliverables.length}</div></article>
        <article class="metric-panel glass"><div class="metric-label">Created</div><div class="metric-value">${campaign.created.split(',')[0]}</div></article>
        <article class="metric-panel glass"><div class="metric-label">Status</div><div>${statusBadge(campaign.status)}</div></article>
      </div>
    `;
  }

  if (deliverables) {
    deliverables.innerHTML = campaign.deliverables.map((item, index) => `
      <article class="deliverable-card glass ${index === 0 ? 'is-expanded' : ''}">
        <div class="deliverable-summary" data-expand-deliverable>
          <div>
            <h3>${item.platform}</h3>
            <p class="muted">${item.role} · Last updated ${item.updated}</p>
          </div>
          <div class="assignee">
            <span class="avatar">${item.initials}</span>
            <strong>${item.assignee}</strong>
            ${statusBadge(item.status)}
          </div>
        </div>
        <div class="deliverable-body">
          <p>${item.brief}</p>
          <h4>Submitted Versions</h4>
          <div class="version-list">
            ${(item.versions.length ? item.versions : [['No versions yet', item.assignee, item.updated]]).map(([version, submitter, time]) => `
              <div class="version-row"><strong>${version}</strong> · ${submitter} · <span class="muted">${time}</span> · <a href="#">View</a></div>
            `).join('')}
          </div>
          <section class="comment-section" data-comment-section="${index}">
            <h4>Comments</h4>
            <div class="comment-list" data-comment-list="${index}">
              ${renderComments(item.comments)}
            </div>
            <div class="comment-composer">
              <textarea maxlength="500" rows="3" placeholder="Leave feedback or a note for the team…" data-comment-input="${index}"></textarea>
              <div class="comment-composer-footer">
                <span class="comment-count" data-comment-count="${index}">0 / 500</span>
                <button class="btn btn-primary btn-small" type="button" data-post-comment="${index}" disabled>Post Comment</button>
              </div>
            </div>
          </section>
          <div class="action-row">
            <button class="btn btn-secondary">Submit Draft</button>
            <button class="btn btn-secondary">Request Revision</button>
            <button class="btn btn-secondary">Approve</button>
            <button class="btn btn-primary">Mark Ready to Publish</button>
          </div>
        </div>
      </article>
    `).join('');

    document.querySelectorAll('[data-expand-deliverable]').forEach((button) => {
      button.addEventListener('click', () => button.closest('.deliverable-card').classList.toggle('is-expanded'));
    });

    campaign.deliverables.forEach((item, index) => {
      const input = document.querySelector(`[data-comment-input="${index}"]`);
      const count = document.querySelector(`[data-comment-count="${index}"]`);
      const button = document.querySelector(`[data-post-comment="${index}"]`);
      const list = document.querySelector(`[data-comment-list="${index}"]`);

      if (!input || !count || !button || !list) return;

      input.addEventListener('input', () => {
        const length = input.value.length;
        count.textContent = `${length} / 500`;
        button.disabled = input.value.trim().length === 0;
      });

      button.addEventListener('click', () => {
        const text = input.value.trim();
        if (!text) return;

        item.comments.unshift({
          ...currentDemoUser,
          text,
          time: 'Just now'
        });
        list.innerHTML = renderComments(item.comments);
        input.value = '';
        count.textContent = '0 / 500';
        button.disabled = true;
      });
    });
  }

  if (activity) {
    activity.innerHTML = campaign.activity.map(([time, text]) => `
      <div class="activity-item">
        <span class="activity-dot"></span>
        <div><div class="activity-text">${text}</div><div class="activity-time">${time}</div></div>
      </div>
    `).join('');
  }
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

  function showError() {
    error.classList.add('is-visible');
    fileSummary.classList.remove('is-visible');
    summary.classList.remove('is-visible');
  }

  function handleFile(file) {
    if (!file || !file.name.endsWith('.xlsx')) {
      showError();
      return;
    }
    error.classList.remove('is-visible');
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
  importButton.addEventListener('click', () => {
    localStorage.setItem('postbloomImportDone', 'true');
    summary.classList.add('is-visible');
  });
}

function renderEnrich() {
  const params = new URLSearchParams(window.location.search);
  const item = PostBloom.opportunities.find((opportunity) => opportunity.id === params.get('opportunity')) || PostBloom.opportunities[0];
  const metrics = document.getElementById('enrichMetrics');
  const text = document.getElementById('postText');

  if (metrics) {
    metrics.innerHTML = `
      <article class="metric-panel glass"><div class="metric-label">Opportunity Score</div><div class="metric-value">${item.score}</div></article>
      <article class="metric-panel glass"><div class="metric-label">Impressions</div><div class="metric-value">${formatNumber(item.impressions)}</div></article>
      <article class="metric-panel glass"><div class="metric-label">Reactions</div><div class="metric-value">${formatNumber(item.reactions)}</div></article>
      <article class="metric-panel glass"><div class="metric-label">Post Date</div><div class="metric-value">${item.date.split(',')[0]}</div></article>
    `;
  }

  if (text && !item.snippet.startsWith('[')) text.value = item.snippet;
}

function initCampaignNew() {
  const assignmentList = document.getElementById('assignmentList');
  const checks = document.querySelectorAll('[data-platform-check]');
  const form = document.getElementById('campaignForm');
  const roleMap = {
    '📸 Instagram Carousel': 'Designer',
    '🎬 YouTube Short': 'Writer',
    '🎵 TikTok/Reel': 'Writer',
    '🧵 Threads/X Thread': 'Writer'
  };

  function drawAssignments() {
    if (!assignmentList) return;
    const selected = [...checks].filter((check) => check.checked).map((check) => check.value);
    assignmentList.innerHTML = selected.map((platform) => `
      <div class="assignment-row">
        <strong>${platform}</strong>
        <select aria-label="Assign ${platform}">
          ${PostBloom.team.length
            ? PostBloom.team.map((member) => `<option>${member.name}</option>`).join('')
            : '<option>No team members yet</option>'}
        </select>
        <span class="role-badge">${roleMap[platform]}</span>
      </div>
    `).join('');
  }

  checks.forEach((check) => check.addEventListener('change', drawAssignments));
  drawAssignments();
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      window.location.href = '/app/campaign-detail';
    });
  }
}

function renderTeam() {
  const grid = document.getElementById('teamGrid');
  const modal = document.getElementById('inviteModal');
  const open = document.getElementById('openInviteModal');
  const close = document.querySelectorAll('[data-close-modal]');

  if (grid) {
    grid.innerHTML = PostBloom.team.length ? PostBloom.team.map((member) => `
      <article class="member-card glass">
        <div class="member-top">
          <span class="avatar">${member.initials}</span>
          <div>
            <h3>${member.name}</h3>
            <p class="muted">${member.email}</p>
          </div>
        </div>
        <span class="role-badge">${member.role}</span>
        <div class="member-actions">
          <span class="muted">${member.active} active deliverables</span>
          <button class="btn btn-secondary">Remove</button>
        </div>
      </article>
    `).join('') : '<div class="empty-state glass"><h3>No team members yet</h3><p class="muted">Invite a teammate to start building your workspace team.</p></div>';
  }

  if (modal && open) {
    open.addEventListener('click', () => modal.classList.add('is-open'));
    close.forEach((button) => button.addEventListener('click', () => modal.classList.remove('is-open')));
  }
}

function initPostBloomApp() {
  initTheme();
  initClock();
  initShell();
  initTabs();

  const page = document.body.dataset.page || document.querySelector('[data-postbloom-page]')?.dataset.postbloomPage;
  if (page === 'auth') initAuth();
  if (page === 'tutorial') initTutorial();
  if (page === 'workspace-new') initWorkspaceNew();
  if (page === 'analyze') initAnalyze();
  if (page === 'dashboard') renderDashboard();
  if (page === 'opportunities') renderOpportunities();
  if (page === 'campaign-detail') renderCampaignDetail();
  if (page === 'import') initImport();
  if (page === 'enrich') renderEnrich();
  if (page === 'campaign-new') initCampaignNew();
  if (page === 'team') renderTeam();
  if (page === 'profile') initProfile();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPostBloomApp);
} else {
  initPostBloomApp();
}
