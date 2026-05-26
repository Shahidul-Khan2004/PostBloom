import { LegacyPage } from '../../../components/LegacyPage';

const html = "<main class=\"onboarding-shell auth-shell\">\n    <a class=\"app-logo auth-logo\" href=\"/\" aria-label=\"PostBloom home\"></a>\n    <section class=\"auth-layout\">\n      <div class=\"auth-copy\">\n        <div class=\"page-kicker\">Workspace setup</div>\n        <h1>Create a new workspace.</h1>\n        <p>This becomes the home for your analytics import, opportunity feed, campaigns, and creator team workflow. The tutorial starts next.</p>\n      </div>\n\n      <form class=\"form-card glass form-grid auth-card\" id=\"workspaceForm\">\n        <div class=\"field\">\n          <label for=\"workspaceName\">Workspace name</label>\n          <input id=\"workspaceName\" name=\"name\" required placeholder=\"Bloom Labs Creator Team\">\n        </div>\n        <div class=\"error-card\" id=\"workspaceError\"></div>\n        <button class=\"btn btn-primary\" type=\"submit\">Create Workspace & Start Tutorial</button>\n      </form>\n    </section>\n  </main>\n\n  ";

export default function Page() {
  return (
    <LegacyPage
      bodyClass="app-body"
      page="workspace-new"
      html={html}
    />
  );
}
