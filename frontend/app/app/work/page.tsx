import { LegacyPage } from '../../../components/LegacyPage';

const html = `<div class="mobile-overlay"></div>
  <nav class="app-nav">
    <div class="app-nav-inner">
      <div class="app-brand">
        <button class="sidebar-toggle" data-sidebar-toggle aria-label="Open navigation">☰</button>
        <a class="app-logo" href="/app/dashboard" aria-label="PostBloom home"></a>
        <span class="workspace-name">Workspace</span>
      </div>
      <div class="app-nav-actions">
        <button class="icon-button" aria-label="Notifications">🔔<span class="notification-badge" hidden>0</span></button>
        <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">🌙</button>
        <div class="avatar-menu">
          <button class="avatar-button" data-avatar-menu aria-label="Open user menu">AK</button>
          <div class="dropdown-menu">
            <a href="/app/profile">Profile</a>
            <a href="/" data-logout>Logout</a>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <div class="app-shell">
    <div class="app-layout">
      <aside class="sidebar glass">
        <div class="sidebar-nav"></div>
      </aside>
      <main class="app-main">
        <header class="page-header">
          <div>
            <div class="page-kicker">Specialist workflow</div>
            <h1>My Work</h1>
            <p>Deliverables assigned to you and items awaiting review.</p>
          </div>
        </header>
        <div class="tab-bar">
          <a class="tab-button active" data-work-tab="my-work" href="/app/work">My Work</a>
          <a class="tab-button" data-work-tab="review" href="/app/work?tab=review">Review Queue</a>
        </div>
        <section id="workList" class="work-list"></section>
      </main>
    </div>
  </div>`;

export default function Page() {
  return <LegacyPage bodyClass="app-body" page="work" html={html} />;
}
