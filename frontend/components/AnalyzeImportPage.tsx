'use client';

import type { DragEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Session = {
  token?: string;
  workspace?: {
    name?: string;
    publicUuid?: string;
    slug?: string;
  };
  user?: {
    displayName?: string;
    name?: string;
    email?: string;
  };
  importPublicUuid?: string;
};

type ImportOpportunity = {
  linkedinPostUrl?: string;
  score?: number;
  rankWithinEvidenceType?: number;
  evidenceType?: string;
  recommendationLabel?: string;
  recommendationReasons?: string[];
};

type ImportResponseData = {
  importPublicUuid?: string;
  postsImported?: number;
  metricsCoverage?: {
    postsImported?: number;
    engagementValidatedPosts?: number;
    reachOnlyPosts?: number;
  };
  notices?: string[];
  warnings?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  discovery?: {
    dateRange?: string;
    impressions?: number;
    membersReached?: number;
  };
  topPosts?: ImportOpportunity[];
  topReachSignals?: ImportOpportunity[];
};

function getSession(): Session {
  try {
    return JSON.parse(localStorage.getItem('postbloomSession') || '{}');
  } catch {
    return {};
  }
}

function saveSessionImport(importPublicUuid?: string) {
  if (!importPublicUuid) return;
  const session = getSession();
  localStorage.setItem('postbloomSession', JSON.stringify({ ...session, importPublicUuid }));
}

function formatNumber(value?: number) {
  return Number(value || 0).toLocaleString();
}

function formatScore(value?: number) {
  if (value == null) return '0';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatDateRange(data?: ImportResponseData) {
  if (data?.discovery?.dateRange) return data.discovery.dateRange;
  const start = data?.dateRange?.start;
  const end = data?.dateRange?.end;
  return start && end ? `${start} - ${end}` : 'No range';
}

function getErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Import failed.';
  if (/VALIDATION_ERROR.*invalid params|invalid params data/i.test(message)) {
    return 'Create or select a backend workspace before importing LinkedIn analytics.';
  }
  if (/INVALID_XLSX|xlsx/i.test(message)) return 'Upload a LinkedIn analytics .xlsx export.';
  return message;
}

function isBackendWorkspaceId(value?: string) {
  return Boolean(value && UUID_PATTERN.test(value));
}

function hostFromUrl(url?: string) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'linkedin.com';
  }
}

function AppChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mobile-overlay" />
      <nav className="app-nav">
        <div className="app-nav-inner">
          <div className="app-brand">
            <button className="sidebar-toggle" data-sidebar-toggle aria-label="Open navigation">☰</button>
            <a className="app-logo" href="/app/dashboard" aria-label="PostBloom home" />
            <span className="workspace-name">Bloom Labs Creator Team</span>
          </div>
          <div className="app-nav-actions">
            <button className="icon-button" aria-label="Notifications">🔔<span className="notification-badge">6</span></button>
            <button className="theme-toggle" id="themeToggle" aria-label="Toggle theme">🌙</button>
            <div className="avatar-menu">
              <button className="avatar-button" data-avatar-menu aria-label="Open user menu">AK</button>
              <div className="dropdown-menu">
                <a href="/app/profile">Profile</a>
                <a href="#">Settings</a>
                <a href="/">Logout</a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="app-shell">
        <div className="app-layout">
          <aside className="sidebar glass">
            <div className="sidebar-nav">
              <a className="sidebar-link" href="/app/dashboard">📊 Dashboard</a>
              <a className="sidebar-link" href="/app/opportunities">🔥 Opportunity Feed</a>
              <a className="sidebar-link" href="/app/campaign-new">🗂️ Campaigns</a>
              <a className="sidebar-link" href="/app/team">👥 Team</a>
              <a className="sidebar-link active" href="/app/analyze">⬆️ Import Analytics</a>
            </div>
          </aside>
          <main className="app-main analyze-page">{children}</main>
        </div>
      </div>
    </>
  );
}

function SetupRequired({ hasToken, hasWorkspace, hasBackendWorkspace }: { hasToken: boolean; hasWorkspace: boolean; hasBackendWorkspace: boolean }) {
  const needsBackendWorkspace = hasToken && hasWorkspace && !hasBackendWorkspace;

  return (
    <section className="analyze-setup-card glass">
      <div>
        <div className="page-kicker">{needsBackendWorkspace ? 'Backend workspace required' : 'Workspace required'}</div>
        <h2>{needsBackendWorkspace ? 'This local workspace cannot import analytics.' : 'Connect a workspace before importing analytics.'}</h2>
        <p className="muted">
          {needsBackendWorkspace
            ? 'LinkedIn XLSX imports must be attached to a real workspace UUID from the backend. Create or select a backend workspace, then upload again.'
            : 'LinkedIn XLSX imports use the authenticated workspace API. Sign in and create or select a workspace first.'}
        </p>
      </div>
      <div className="action-row">
        {!hasToken ? <a className="btn btn-primary" href="/app/auth">Sign in</a> : null}
        <a className={hasToken ? 'btn btn-primary' : 'btn btn-secondary'} href="/app/workspace-new">Workspace setup</a>
      </div>
    </section>
  );
}

function OpportunityCard({ item, index }: { item: ImportOpportunity; index: number }) {
  const hasUrl = Boolean(item.linkedinPostUrl);
  return (
    <article className="linkedin-result-card">
      <div className="linkedin-result-score">
        <strong>{formatScore(item.score)}</strong>
        <span>#{item.rankWithinEvidenceType || index + 1}</span>
      </div>
      <div className="linkedin-result-body">
        <div className="linkedin-result-heading">
          <h3>{item.recommendationLabel || 'LinkedIn opportunity'}</h3>
          <span className="recommendation-badge recommendation-good">{item.evidenceType || 'linkedin'}</span>
        </div>
        {hasUrl ? (
          <a className="linkedin-url-preview" href={item.linkedinPostUrl} target="_blank" rel="noreferrer">
            <span>LinkedIn post</span>
            <strong>{hostFromUrl(item.linkedinPostUrl)}</strong>
            <small>{item.linkedinPostUrl}</small>
          </a>
        ) : null}
        {item.recommendationReasons?.length ? (
          <ul>
            {item.recommendationReasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

function OpportunitySection({ title, caption, items }: { title: string; caption: string; items?: ImportOpportunity[] }) {
  return (
    <section className="analyze-results-section">
      <div className="card-header">
        <div>
          <h2>{title}</h2>
          <p className="muted">{caption}</p>
        </div>
      </div>
      {items?.length ? (
        <div className="linkedin-results-grid">
          {items.map((item, index) => (
            <OpportunityCard
              item={item}
              index={index}
              key={`${item.evidenceType || title}-${item.rankWithinEvidenceType || index}-${item.linkedinPostUrl || item.recommendationLabel}`}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state analyze-empty-state">
          <h3>No posts in this group</h3>
          <p className="muted">The import completed, but LinkedIn did not provide matching records for this evidence type.</p>
        </div>
      )}
    </section>
  );
}

function Results({ data }: { data: ImportResponseData }) {
  const coverage = data.metricsCoverage || {};
  const notices = data.notices || [];
  const warnings = data.warnings || [];

  return (
    <section className="analyze-results">
      <div className="analyze-summary-band glass">
        <div>
          <span className="metric-label">Import ID</span>
          <strong>{data.importPublicUuid || 'Local import'}</strong>
        </div>
        <div>
          <span className="metric-label">Reporting Window</span>
          <strong>{formatDateRange(data)}</strong>
        </div>
        <div>
          <span className="metric-label">Posts Imported</span>
          <strong>{formatNumber(data.postsImported ?? coverage.postsImported)}</strong>
        </div>
      </div>

      <div className="metrics-grid analyze-metrics">
        <article className="metric-panel glass">
          <div className="metric-label">Validated Posts</div>
          <div className="metric-value">{formatNumber(coverage.engagementValidatedPosts)}</div>
        </article>
        <article className="metric-panel glass">
          <div className="metric-label">Reach-Only Signals</div>
          <div className="metric-value">{formatNumber(coverage.reachOnlyPosts)}</div>
        </article>
        <article className="metric-panel glass">
          <div className="metric-label">Impressions</div>
          <div className="metric-value">{formatNumber(data.discovery?.impressions)}</div>
        </article>
        <article className="metric-panel glass">
          <div className="metric-label">Members Reached</div>
          <div className="metric-value">{formatNumber(data.discovery?.membersReached)}</div>
        </article>
      </div>

      {(notices.length || warnings.length) ? (
        <div className="analyze-alert-grid">
          {notices.map((notice) => <div className="analyze-alert notice" key={notice}>{notice}</div>)}
          {warnings.map((warning) => <div className="analyze-alert warning" key={warning}>{warning}</div>)}
        </div>
      ) : null}

      <p className="analyze-tier-note">Scores are ranked within each evidence tier. Engagement-validated posts and reach-only signals are not directly comparable.</p>

      <OpportunitySection
        title="Engagement-validated opportunities"
        caption="Posts with measured engagement signals from LinkedIn."
        items={data.topPosts}
      />
      <OpportunitySection
        title="Reach-only signals"
        caption="Posts with measurable reach but unavailable engagement metrics."
        items={data.topReachSignals}
      />
    </section>
  );
}

export function AnalyzeImportPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResponseData | null>(null);

  const workspaceId = session?.workspace?.publicUuid;
  const hasToken = Boolean(session?.token);
  const hasWorkspace = Boolean(workspaceId);
  const hasBackendWorkspace = isBackendWorkspaceId(workspaceId);
  const canUpload = Boolean(hasToken && hasBackendWorkspace);

  useEffect(() => {
    document.body.className = 'app-body';
    document.body.dataset.page = 'analyze-import';
    setSession(getSession());
    setHasLoadedSession(true);
  }, []);

  const fileMeta = useMemo(() => {
    if (!file) return '';
    return `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  }, [file]);

  function handleFile(nextFile?: File) {
    setResult(null);
    setError('');
    if (!nextFile) return;
    if (!nextFile.name.toLowerCase().endsWith('.xlsx')) {
      setFile(null);
      setError('Upload a LinkedIn analytics .xlsx export.');
      return;
    }
    setFile(nextFile);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  }

  async function uploadFile() {
    if (!file || !session?.token) return;
    if (!isBackendWorkspaceId(workspaceId)) {
      setError('Create or select a backend workspace before importing LinkedIn analytics.');
      return;
    }
    setError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE}/api/v1/workspaces/${workspaceId}/analytics/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`
        },
        body: formData
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const code = payload.error?.code ? `${payload.error.code}: ` : '';
        throw new Error(`${code}${payload.error?.message || `Request failed with status ${response.status}`}`);
      }
      const data = payload.data as ImportResponseData;
      localStorage.setItem('postbloomImportDone', 'true');
      saveSessionImport(data.importPublicUuid);
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <AppChrome>
      <header className="page-header analyze-header">
        <div>
          <div className="page-kicker">LinkedIn analytics import</div>
          <h1>Analyze your LinkedIn export.</h1>
          <p>Currently PostBloom supports LinkedIn analytics exports only. Upload the `.xlsx` file from LinkedIn to generate opportunity recommendations.</p>
        </div>
        <a className="btn btn-secondary" href="/app/tutorial">Export Guide</a>
      </header>

      {!hasLoadedSession ? (
        <section className="analyze-setup-card glass">
          <div>
            <div className="page-kicker">Loading workspace</div>
            <h2>Checking your import access.</h2>
            <p className="muted">PostBloom is loading your current workspace session.</p>
          </div>
        </section>
      ) : !canUpload ? (
        <SetupRequired hasToken={hasToken} hasWorkspace={hasWorkspace} hasBackendWorkspace={hasBackendWorkspace} />
      ) : (
        <>
          <section className="analyze-upload-grid">
            <div className="form-card glass">
              <div
                className={`dropzone analyze-dropzone ${isDragging ? 'is-dragover' : ''}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
              >
                <div>
                  <div className="empty-illustration">.xlsx</div>
                  <h2>Drop LinkedIn analytics here</h2>
                  <p className="muted">Only LinkedIn Excel exports are supported right now.</p>
                </div>
                <input
                  accept=".xlsx"
                  hidden
                  onChange={(event) => handleFile(event.target.files?.[0])}
                  ref={inputRef}
                  type="file"
                />
              </div>

              {error ? <div className="error-card is-visible">{error}</div> : null}

              {file ? (
                <div className="file-summary content-card glass is-visible">
                  <div className="card-header">
                    <div>
                      <h2>{file.name}</h2>
                      <p className="muted">{fileMeta}</p>
                    </div>
                    <button className="btn btn-primary" disabled={isUploading} onClick={uploadFile} type="button">
                      {isUploading ? 'Uploading...' : 'Upload & Analyze'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="content-card glass analyze-doc-card">
              <div className="card-header">
                <h2>What this import returns</h2>
              </div>
              <div className="pill-list">
                <span className="pill-tag">Coverage</span>
                <span className="pill-tag">Discovery</span>
                <span className="pill-tag">Top posts</span>
                <span className="pill-tag">Reach signals</span>
              </div>
              <p className="muted">The frontend follows the Analytics Import contract in docs/API.md and displays the response without changing backend behavior.</p>
            </aside>
          </section>

          {result ? <Results data={result} /> : null}
        </>
      )}
    </AppChrome>
  );
}
