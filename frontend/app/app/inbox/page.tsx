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
            <div class="page-kicker">Staffing</div>
            <h1>Staff Inbox</h1>
            <p>Accept open writer, designer, or reviewer requests.</p>
          </div>
        </header>
        <section id="inboxList" class="work-list"></section>
      </main>
    </div>
  </div>`;

export default function Page() {
  return <LegacyPage bodyClass="app-body" page="inbox" html={html} />;
}
