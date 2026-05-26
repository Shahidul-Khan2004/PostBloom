/**
 * PostBloom API client — mirrors docs/API.md
 */
(function (global) {
  function getApiBase() {
    return global.__POSTBLOOM_API_BASE__ || 'http://localhost:3000';
  }

  async function apiRequest(path, { method = 'GET', body, token, headers = {} } = {}) {
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
      const err = new Error(payload.error?.message || `Request failed with status ${res.status}`);
      err.code = payload.error?.code;
      err.details = payload.error?.details;
      err.status = res.status;
      throw err;
    }
    return payload.data;
  }

  function withToken(token) {
    return (path, opts = {}) => apiRequest(path, { ...opts, token });
  }

  const PostBloomApi = {
    request: apiRequest,
    getApiBase,

    health: () => apiRequest('/health'),

    auth: {
      register: (body) => apiRequest('/api/v1/auth/register', { method: 'POST', body }),
      login: (body) => apiRequest('/api/v1/auth/login', { method: 'POST', body }),
      me: (token) => apiRequest('/api/v1/auth/me', { token })
    },

    workspaces: {
      list: (token) => apiRequest('/api/v1/workspaces', { token }),
      create: (token, body) => apiRequest('/api/v1/workspaces', { method: 'POST', token, body }),
      get: (token, workspaceId) => apiRequest(`/api/v1/workspaces/${workspaceId}`, { token }),
      members: (token, workspaceId) => apiRequest(`/api/v1/workspaces/${workspaceId}/members`, { token })
    },

    analytics: {
      import: (token, workspaceId, file) => {
        const form = new FormData();
        form.append('file', file);
        return apiRequest(`/api/v1/workspaces/${workspaceId}/analytics/import`, {
          method: 'POST',
          token,
          body: form
        });
      },
      listImports: (token, workspaceId) =>
        apiRequest(`/api/v1/workspaces/${workspaceId}/analytics/imports`, { token }),
      getImport: (token, workspaceId, importId) =>
        apiRequest(`/api/v1/workspaces/${workspaceId}/analytics/imports/${importId}`, { token })
    },

    opportunities: {
      list: (token, workspaceId, sort = 'score') =>
        apiRequest(`/api/v1/workspaces/${workspaceId}/opportunities?sort=${sort}`, { token }),
      get: (token, workspaceId, opportunityId) =>
        apiRequest(`/api/v1/workspaces/${workspaceId}/opportunities/${opportunityId}`, { token }),
      enrich: (token, workspaceId, opportunityId, body) =>
        apiRequest(`/api/v1/workspaces/${workspaceId}/opportunities/${opportunityId}/enrich`, {
          method: 'PATCH',
          token,
          body
        })
    },

    platforms: {
      list: (token) => apiRequest('/api/v1/platforms', { token })
    },

    campaigns: {
      list: (token, workspaceId) =>
        apiRequest(`/api/v1/workspaces/${workspaceId}/campaigns`, { token }),
      create: (token, workspaceId, body) =>
        apiRequest(`/api/v1/workspaces/${workspaceId}/campaigns`, { method: 'POST', token, body }),
      get: (token, campaignId) => apiRequest(`/api/v1/campaigns/${campaignId}`, { token }),
      updateStatus: (token, campaignId, body) =>
        apiRequest(`/api/v1/campaigns/${campaignId}/status`, { method: 'POST', token, body }),
      listDeliverables: (token, campaignId) =>
        apiRequest(`/api/v1/campaigns/${campaignId}/deliverables`, { token }),
      addDeliverable: (token, campaignId, body) =>
        apiRequest(`/api/v1/campaigns/${campaignId}/deliverables`, { method: 'POST', token, body }),
      exportReady: (token, campaignId) =>
        apiRequest(`/api/v1/campaigns/${campaignId}/export-ready`, { token }),
      listStaffRequests: (token, campaignId) =>
        apiRequest(`/api/v1/campaigns/${campaignId}/staff-requests`, { token }),
      activity: (token, workspaceId, entity) => {
        const q = entity ? `?entity=${encodeURIComponent(entity)}` : '';
        return apiRequest(`/api/v1/workspaces/${workspaceId}/activity${q}`, { token });
      },
      myWork: (token, workspaceId) =>
        apiRequest(`/api/v1/workspaces/${workspaceId}/my-work`, { token }),
      reviewQueue: (token, workspaceId) =>
        apiRequest(`/api/v1/workspaces/${workspaceId}/review-queue`, { token })
    },

    deliverables: {
      submitVersion: (token, deliverableId, body) =>
        apiRequest(`/api/v1/deliverables/${deliverableId}/versions`, { method: 'POST', token, body }),
      review: (token, deliverableId, body) =>
        apiRequest(`/api/v1/deliverables/${deliverableId}/review`, { method: 'POST', token, body }),
      listComments: (token, deliverableId) =>
        apiRequest(`/api/v1/deliverables/${deliverableId}/comments`, { token }),
      addComment: (token, deliverableId, body) =>
        apiRequest(`/api/v1/deliverables/${deliverableId}/comments`, { method: 'POST', token, body }),
      listStaffRequests: (token, deliverableId) =>
        apiRequest(`/api/v1/deliverables/${deliverableId}/staff-requests`, { token }),
      createStaffRequest: (token, deliverableId, body = {}) =>
        apiRequest(`/api/v1/deliverables/${deliverableId}/staff-requests`, { method: 'POST', token, body }),
      cancelStaffRequest: (token, deliverableId, roleCode) =>
        apiRequest(`/api/v1/deliverables/${deliverableId}/staff-requests/${roleCode}`, {
          method: 'DELETE',
          token
        })
    },

    staffing: {
      listInbox: (token, status = 'pending') =>
        apiRequest(`/api/v1/specialist/staff-requests?status=${status}`, { token }),
      accept: (token, requestId) =>
        apiRequest(`/api/v1/staff-requests/${requestId}/accept`, { method: 'POST', token })
    },

    notifications: {
      list: (token, unreadOnly = false) =>
        apiRequest(`/api/v1/notifications${unreadOnly ? '?unread=true' : ''}`, { token }),
      markRead: (token, id) =>
        apiRequest(`/api/v1/notifications/${id}/read`, { method: 'PATCH', token })
    },

    admin: {
      assignRole: (token, userId, body) =>
        apiRequest(`/api/v1/admin/users/${userId}/role`, { method: 'POST', token, body }),
      addToWorkspace: (token, userId, workspaceId) =>
        apiRequest(`/api/v1/admin/users/${userId}/workspaces/${workspaceId}`, { method: 'POST', token }),
      specialistAnalytics: (token, role) =>
        apiRequest(`/api/v1/admin/analytics/specialists?role=${role}`, { token })
    }
  };

  global.PostBloomApi = PostBloomApi;
  global.apiRequest = apiRequest;
  global.getApiBase = getApiBase;
})(typeof window !== 'undefined' ? window : globalThis);
