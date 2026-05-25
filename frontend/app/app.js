const page = document.body ? document.body.dataset.page : '';
const authFreePages = ['login', 'register'];
const user = JSON.parse(localStorage.getItem('postbloom_user'));

function appUrl(fileName) {
  if (window.location.pathname.includes('/frontend/app/')) {
    return fileName;
  }

  return `/app/${fileName}`;
}

function landingUrl() {
  if (window.location.pathname.includes('/frontend/app/')) {
    return '../index.html';
  }

  return '/index.html';
}

if (!authFreePages.includes(page) && !user) {
  window.location.href = appUrl('login.html');
}

const PostBloom = {
  team: [
    { id: 'm1', name: 'Avery Khan', email: 'avery@postbloom.co', role: 'Owner', initials: 'AK', active: 4 },
    { id: 'm2', name: 'Maya Chen', email: 'maya@postbloom.co', role: 'Manager', initials: 'MC', active: 6 },
    { id: 'm3', name: 'Jon Bell', email: 'jon@postbloom.co', role: 'Writer', initials: 'JB', active: 3 },
    { id: 'm4', name: 'Priya Shah', email: 'priya@postbloom.co', role: 'Designer', initials: 'PS', active: 2 },
    { id: 'm5', name: 'Leo Martin', email: 'leo@postbloom.co', role: 'Reviewer', initials: 'LM', active: 5 },
    { id: 'm6', name: 'Sara Ahmed', email: 'sara@postbloom.co', role: 'Writer', initials: 'SA', active: 1 }
  ],
  opportunities: [
    {
      id: 'opp-1',
      score: 92,
      date: 'May 20, 2026',
      impressions: 184200,
      reactions: 9200,
      comments: 684,
      reposts: 1100,
      snippet: 'A tactical breakdown of how small creator teams can turn one strong founder insight into a multi-channel campaign.'
    },
    {
      id: 'opp-2',
      score: 86,
      date: 'May 18, 2026',
      impressions: 141800,
      reactions: 7400,
      comments: 512,
      reposts: 884,
      snippet: 'The best teams do not publish more. They compound sharper ideas with better workflows and clearer ownership.'
    },
    {
      id: 'opp-3',
      score: 73,
      date: 'May 16, 2026',
      impressions: 96600,
      reactions: 5100,
      comments: 294,
      reposts: 420,
      snippet: '[No text - click to enrich]'
    },
    {
      id: 'opp-4',
      score: 68,
      date: 'May 12, 2026',
      impressions: 80300,
      reactions: 3600,
      comments: 241,
      reposts: 330,
      snippet: 'A behind-the-scenes look at the approval checklist we use before turning LinkedIn posts into short-form scripts.'
    },
    {
      id: 'opp-5',
      score: 59,
      date: 'May 10, 2026',
      impressions: 61200,
      reactions: 2900,
      comments: 190,
      reposts: 204,
      snippet: 'Three content formats that consistently help B2B creators earn saves, shares, and qualified inbound.'
    },
    {
      id: 'opp-6',
      score: 47,
      date: 'May 7, 2026',
      impressions: 42500,
      reactions: 1700,
      comments: 122,
      reposts: 98,
      snippet: 'Creator teams need campaign systems, not more disconnected documents and status meetings.'
    },
    {
      id: 'opp-7',
      score: 39,
      date: 'May 4, 2026',
      impressions: 31100,
      reactions: 860,
      comments: 64,
      reposts: 44,
      snippet: 'A quick note on why analytics reviews should happen before creative ideation, not after.'
    },
    {
      id: 'opp-8',
      score: 35,
      date: 'May 1, 2026',
      impressions: 24400,
      reactions: 700,
      comments: 38,
      reposts: 27,
      snippet: '[No text - click to enrich]'
    }
  ],
  campaigns: [
    {
      id: 'camp-1',
      name: 'Creator Ops Flywheel',
      source: 'A tactical breakdown of how small creator teams can turn one strong founder insight into a multi-channel campaign.',
      status: 'active',
      created: 'May 21, 2026',
      score: 92,
      activity: [
        ['Today, 10:32 AM', 'Writer submitted draft for Instagram Carousel'],
        ['Today, 9:14 AM', 'Manager assigned YouTube Short to Sara Ahmed'],
        ['Yesterday, 4:48 PM', 'Reviewer approved Threads/X Thread outline'],
        ['Yesterday, 1:20 PM', 'Designer uploaded carousel cover concept'],
        ['May 21, 2026', 'Campaign created from LinkedIn opportunity score 92']
      ],
      deliverables: [
        {
          platform: '📸 Instagram Carousel',
          role: 'Designer',
          assignee: 'Priya Shah',
          initials: 'PS',
          status: 'submitted_for_review',
          updated: 'Today, 10:32 AM',
          brief: 'Turn the source post into an 8-slide carousel with a strong first-slide promise, tactical middle slides, and a CTA for creator teams.',
          versions: [
            ['v2', 'Priya Shah', 'Today, 10:32 AM'],
            ['v1', 'Priya Shah', 'Yesterday, 3:18 PM']
          ],
          comments: [
            { name: 'Maya Chen', initials: 'MC', role: 'Manager', text: 'The structure is strong. Tighten slide 3 and add the workflow screenshot callout.', time: 'Today, 11:02 AM' },
            { name: 'Leo Martin', initials: 'LM', role: 'Reviewer', text: 'The hook on slide 1 needs to be punchier. Try leading with a stat instead.', time: 'Today, 10:54 AM' },
            { name: 'Priya Shah', initials: 'PS', role: 'Designer', text: 'Updated the hook and swapped slide 3 for the workflow visual. Please re-review.', time: 'Today, 10:41 AM' }
          ]
        },
        {
          platform: '🎬 YouTube Short',
          role: 'Writer',
          assignee: 'Sara Ahmed',
          initials: 'SA',
          status: 'in_progress',
          updated: 'Today, 9:14 AM',
          brief: 'Write a 45-second script that frames the post as a before/after story for creator team workflow chaos.',
          versions: [['v1 outline', 'Sara Ahmed', 'Today, 9:42 AM']],
          comments: [
            { name: 'Avery Khan', initials: 'AK', role: 'Owner', text: 'Lead with the spreadsheet pain. That will land faster.', time: 'Today, 9:58 AM' },
            { name: 'Sara Ahmed', initials: 'SA', role: 'Writer', text: 'Updated the opening beat and tightened the midpoint transition.', time: 'Today, 9:51 AM' },
            { name: 'Leo Martin', initials: 'LM', role: 'Reviewer', text: 'Keep the CTA specific to campaign approvals, not general content planning.', time: 'Today, 9:46 AM' }
          ]
        },
        {
          platform: '🧵 Threads/X Thread',
          role: 'Writer',
          assignee: 'Jon Bell',
          initials: 'JB',
          status: 'approved',
          updated: 'Yesterday, 4:48 PM',
          brief: 'Expand into a 7-post thread with metrics, workflow steps, and a final CTA.',
          versions: [['v1', 'Jon Bell', 'Yesterday, 3:40 PM']],
          comments: [
            { name: 'Leo Martin', initials: 'LM', role: 'Reviewer', text: 'Approved. The sequence is clear and actionable.', time: 'Yesterday, 4:48 PM' },
            { name: 'Jon Bell', initials: 'JB', role: 'Writer', text: 'Added a stronger post 2 transition and cleaned up the final CTA.', time: 'Yesterday, 4:21 PM' },
            { name: 'Maya Chen', initials: 'MC', role: 'Manager', text: 'This is ready after Leo signs off on the final phrasing.', time: 'Yesterday, 4:08 PM' }
          ]
        }
      ]
    },
    {
      id: 'camp-2',
      name: 'Approval Workflow Sprint',
      source: 'A behind-the-scenes look at the approval checklist we use before turning LinkedIn posts into short-form scripts.',
      status: 'in_review',
      created: 'May 18, 2026',
      score: 68,
      activity: [
        ['Today, 8:30 AM', 'Reviewer requested revision on TikTok/Reel'],
        ['Yesterday, 5:25 PM', 'Writer submitted YouTube Short script'],
        ['Yesterday, 2:10 PM', 'Manager updated campaign description'],
        ['May 19, 2026', 'Designer accepted Instagram Carousel assignment'],
        ['May 18, 2026', 'Campaign created from opportunity feed']
      ],
      deliverables: [
        {
          platform: '🎵 TikTok/Reel',
          role: 'Writer',
          assignee: 'Jon Bell',
          initials: 'JB',
          status: 'revision_requested',
          updated: 'Today, 8:30 AM',
          brief: 'Create a fast-paced script on the approval checklist that keeps projects moving.',
          versions: [['v1', 'Jon Bell', 'Yesterday, 5:25 PM']],
          comments: [
            { name: 'Leo Martin', initials: 'LM', role: 'Reviewer', text: 'Good angle, but the ending needs a clearer campaign management CTA.', time: 'Today, 8:30 AM' },
            { name: 'Jon Bell', initials: 'JB', role: 'Writer', text: 'I can revise the last three seconds around approvals and handoffs.', time: 'Today, 8:37 AM' },
            { name: 'Maya Chen', initials: 'MC', role: 'Manager', text: 'Please keep the hook under five seconds so the pacing stays sharp.', time: 'Today, 8:44 AM' }
          ]
        },
        {
          platform: '📸 Instagram Carousel',
          role: 'Designer',
          assignee: 'Priya Shah',
          initials: 'PS',
          status: 'assigned',
          updated: 'May 19, 2026',
          brief: 'Design a checklist-style carousel with clear approval stages.',
          versions: [],
          comments: [
            { name: 'Maya Chen', initials: 'MC', role: 'Manager', text: 'Use the same visual system from the Creator Ops campaign.', time: 'May 19, 2026' },
            { name: 'Priya Shah', initials: 'PS', role: 'Designer', text: 'Got it. I will keep the same card rhythm and color cues.', time: 'May 19, 2026' },
            { name: 'Leo Martin', initials: 'LM', role: 'Reviewer', text: 'Make sure the approval states are readable at mobile size.', time: 'May 19, 2026' }
          ]
        }
      ]
    },
    {
      id: 'camp-3',
      name: 'Analytics Before Ideation',
      source: 'A quick note on why analytics reviews should happen before creative ideation, not after.',
      status: 'ready_to_publish',
      created: 'May 14, 2026',
      score: 39,
      activity: [
        ['Yesterday, 6:05 PM', 'Manager marked Instagram Carousel ready to publish'],
        ['Yesterday, 3:44 PM', 'Reviewer approved carousel version v3'],
        ['May 17, 2026', 'Designer uploaded final carousel deck'],
        ['May 16, 2026', 'Writer submitted revised hook options'],
        ['May 14, 2026', 'Campaign created manually from enriched source post']
      ],
      deliverables: [
        {
          platform: '📸 Instagram Carousel',
          role: 'Designer',
          assignee: 'Priya Shah',
          initials: 'PS',
          status: 'ready_to_publish',
          updated: 'Yesterday, 6:05 PM',
          brief: 'Educational carousel explaining how analytics guide campaign expansion decisions.',
          versions: [
            ['v3', 'Priya Shah', 'May 17, 2026'],
            ['v2', 'Priya Shah', 'May 16, 2026'],
            ['v1', 'Priya Shah', 'May 15, 2026']
          ],
          comments: [
            { name: 'Maya Chen', initials: 'MC', role: 'Manager', text: 'Ready to publish. Strong final CTA.', time: 'Yesterday, 6:05 PM' },
            { name: 'Leo Martin', initials: 'LM', role: 'Reviewer', text: 'Approved after the v3 headline update.', time: 'Yesterday, 3:44 PM' },
            { name: 'Priya Shah', initials: 'PS', role: 'Designer', text: 'Uploaded the final carousel deck and export-ready PNGs.', time: 'May 17, 2026' }
          ]
        }
      ]
    }
  ]
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
  role: user ? user.role : 'Manager'
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function initialsForName(name) {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
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

function initShell() {
  const avatarButton = document.querySelector('[data-avatar-menu]');
  const dropdown = document.querySelector('.dropdown-menu');
  const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.mobile-overlay');

  if (avatarButton && dropdown) {
    if (user) {
      avatarButton.textContent = initialsForName(user.name);
      dropdown.insertAdjacentHTML('afterbegin', `
        <div class="user-menu-summary">
          <strong>${escapeHtml(user.name)}</strong>
          <span>${escapeHtml(user.role)}</span>
        </div>
      `);
    }

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

  document.querySelectorAll('[data-logout], .dropdown-menu a').forEach((link) => {
    if (link.textContent.trim() !== 'Logout') return;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem('postbloom_user');
      window.location.href = appUrl('login.html');
    });
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
        <td><a class="btn btn-secondary" href="campaign-detail.html?id=${campaign.id}">Open</a></td>
      </tr>
    `).join('');
  }

  if (activity) {
    activity.innerHTML = PostBloom.campaigns.flatMap((campaign) => campaign.activity.slice(0, 2)
      .map(([time, text]) => ({ time, text, campaign: campaign.name })))
      .slice(0, 6)
      .map((item) => `
        <div class="activity-item">
          <span class="activity-dot"></span>
          <div>
            <div class="activity-text">${item.text}</div>
            <div class="activity-time">${item.time} · ${item.campaign}</div>
          </div>
        </div>
      `).join('');
  }

  if (empty) {
    empty.hidden = PostBloom.campaigns.length > 0;
  }
}

function renderOpportunities() {
  const grid = document.getElementById('opportunityGrid');
  const sort = document.getElementById('sortOpportunities');
  const empty = document.getElementById('opportunitiesEmpty');
  const hasImport = localStorage.getItem('postbloomImportDone') !== 'false';

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
    if (!hasImport) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    grid.innerHTML = orderedItems().map((item) => `
      <article class="opportunity-card glass">
        <div class="opportunity-top">
          ${scoreBadge(item.score)}
          <span class="muted">${item.date}</span>
        </div>
        <h3>High performer · Strong candidate for expansion</h3>
        <div class="opportunity-stats">
          <div class="mini-stat"><span>Impressions</span><strong>${formatNumber(item.impressions)}</strong></div>
          <div class="mini-stat"><span>Reactions</span><strong>${formatNumber(item.reactions)}</strong></div>
          <div class="mini-stat"><span>Comments</span><strong>${formatNumber(item.comments)}</strong></div>
          <div class="mini-stat"><span>Reposts</span><strong>${formatNumber(item.reposts)}</strong></div>
        </div>
        <p>${item.snippet}</p>
        <div class="action-row">
          <a class="btn btn-primary" href="enrich.html?opportunity=${item.id}">Create Campaign →</a>
        </div>
      </article>
    `).join('');
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
          <a class="btn btn-secondary" href="campaign-new.html">Edit</a>
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
          ${PostBloom.team.map((member) => `<option>${member.name}</option>`).join('')}
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
      window.location.href = 'campaign-detail.html';
    });
  }
}

function renderTeam() {
  const grid = document.getElementById('teamGrid');
  const modal = document.getElementById('inviteModal');
  const open = document.getElementById('openInviteModal');
  const close = document.querySelectorAll('[data-close-modal]');

  if (grid) {
    grid.innerHTML = PostBloom.team.map((member) => `
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
    `).join('');
  }

  if (modal && open) {
    open.addEventListener('click', () => modal.classList.add('is-open'));
    close.forEach((button) => button.addEventListener('click', () => modal.classList.remove('is-open')));
  }
}

function setFieldError(field, message) {
  const error = document.querySelector(`[data-error-for="${field.id}"]`);
  if (error) error.textContent = message;
  field.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const credentials = {
    'manager@postbloom.com': { password: 'demo1234', name: 'Maya Chen', role: 'Manager' },
    'writer@postbloom.com': { password: 'demo1234', name: 'Jon Bell', role: 'Writer' },
    'designer@postbloom.com': { password: 'demo1234', name: 'Priya Shah', role: 'Designer' },
    'reviewer@postbloom.com': { password: 'demo1234', name: 'Leo Martin', role: 'Reviewer' }
  };
  const email = document.getElementById('loginEmail');
  const password = document.getElementById('loginPassword');
  const error = document.getElementById('loginError');
  const button = document.getElementById('loginButton');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    let isValid = true;
    error.classList.remove('is-visible');

    if (!email.value.trim()) {
      setFieldError(email, 'Email is required');
      isValid = false;
    } else {
      setFieldError(email, '');
    }

    if (!password.value.trim()) {
      setFieldError(password, 'Password is required');
      isValid = false;
    } else {
      setFieldError(password, '');
    }

    if (!isValid) return;

    const record = credentials[email.value.trim().toLowerCase()];
    if (!record || record.password !== password.value) {
      error.classList.add('is-visible');
      return;
    }

    button.disabled = true;
    button.textContent = 'Signing in…';
    localStorage.setItem('postbloom_user', JSON.stringify({
      name: record.name,
      email: email.value.trim().toLowerCase(),
      role: record.role
    }));

    setTimeout(() => {
      window.location.href = landingUrl();
    }, 800);
  });
}

function passwordStrength(value) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return score;
}

function initRegister() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const name = document.getElementById('registerName');
  const email = document.getElementById('registerEmail');
  const password = document.getElementById('registerPassword');
  const confirm = document.getElementById('confirmPassword');
  const terms = document.getElementById('terms');
  const success = document.getElementById('registerSuccess');
  const strengthSegments = document.querySelectorAll('[data-strength-segment]');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  password.addEventListener('input', () => {
    const score = passwordStrength(password.value);
    strengthSegments.forEach((segment, index) => {
      segment.className = `strength-segment ${index < score ? `strength-${score}` : ''}`;
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    let isValid = true;
    success.classList.remove('is-visible');

    if (!name.value.trim()) {
      setFieldError(name, 'Full name is required');
      isValid = false;
    } else {
      setFieldError(name, '');
    }

    if (!email.value.trim() || !emailPattern.test(email.value.trim())) {
      setFieldError(email, email.value.trim() ? 'Enter a valid email address' : 'Email is required');
      isValid = false;
    } else {
      setFieldError(email, '');
    }

    if (password.value.length < 8 || !/\d/.test(password.value)) {
      setFieldError(password, 'Password must be at least 8 characters and include a number');
      isValid = false;
    } else {
      setFieldError(password, '');
    }

    if (confirm.value !== password.value) {
      setFieldError(confirm, 'Passwords must match');
      isValid = false;
    } else {
      setFieldError(confirm, '');
    }

    if (!terms.checked) {
      setFieldError(terms, 'You must agree to the Terms of Service');
      isValid = false;
    } else {
      setFieldError(terms, '');
    }

    if (!isValid) return;

    success.classList.add('is-visible');
    setTimeout(() => {
      window.location.href = appUrl('login.html');
    }, 1500);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initShell();
  initTabs();

  if (page === 'dashboard') renderDashboard();
  if (page === 'opportunities') renderOpportunities();
  if (page === 'campaign-detail') renderCampaignDetail();
  if (page === 'import') initImport();
  if (page === 'enrich') renderEnrich();
  if (page === 'campaign-new') initCampaignNew();
  if (page === 'team') renderTeam();
  if (page === 'login') initLogin();
  if (page === 'register') initRegister();
});
