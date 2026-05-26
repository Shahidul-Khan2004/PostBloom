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
            <div class="page-kicker">Platform admin</div>
            <h1>Admin</h1>
            <p>Assign roles, add users to workspaces, and view specialist analytics.</p>
          </div>
        </header>

        <form id="adminRoleForm" class="form-card glass form-grid">
          <h2>Assign user role</h2>
          <div class="field">
            <label for="adminRoleUserId">User public UUID</label>
            <input id="adminRoleUserId" type="text" required>
          </div>
          <div class="field">
            <label for="adminRoleCode">Role</label>
            <select id="adminRoleCode">
              <option value="user">user</option>
              <option value="writer">writer</option>
              <option value="designer">designer</option>
              <option value="reviewer">reviewer</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div class="error-card" id="adminRoleError"></div>
          <button type="submit" class="btn btn-primary">Update role</button>
        </form>

        <section class="content-card glass" id="adminAnalytics">
          <h2>Specialist analytics</h2>
          <p class="muted">Loading…</p>
        </section>
      </main>
    </div>
  </div>`;

export default function Page() {
  return <LegacyPage bodyClass="app-body" page="admin" html={html} />;
}
