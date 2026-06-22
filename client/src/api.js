const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const isDownload = path.includes('/export');
  if (isDownload && res.ok) return res;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function downloadExport(path, title, ext) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Export failed');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9-_]/gi, '_')}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getDocuments: (q = '') =>
    request(`/documents${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  getDocument: (id) => request(`/documents/${id}`),

  createDocument: (title) =>
    request('/documents', { method: 'POST', body: JSON.stringify({ title }) }),

  updateDocument: (id, payload) =>
    request(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),

  shareDocument: (id, email, permission) =>
    request(`/documents/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ email, permission }),
    }),

  revokeShare: (id, userId) =>
    request(`/documents/${id}/share/${userId}`, { method: 'DELETE' }),

  importFile: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/documents/import', { method: 'POST', body: form });
  },

  importIntoDocument: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return request(`/documents/${id}/import`, { method: 'POST', body: form });
  },

  getUsers: () => request('/auth/users'),

  getVersions: (id) => request(`/documents/${id}/versions`),

  restoreVersion: (id, versionId) =>
    request(`/documents/${id}/versions/${versionId}/restore`, { method: 'POST' }),

  pingPresence: (id) => request(`/documents/${id}/presence`, { method: 'POST' }),

  getPresence: (id) => request(`/documents/${id}/presence`),

  getComments: (id) => request(`/documents/${id}/comments`),

  addComment: (id, payload) =>
    request(`/documents/${id}/comments`, { method: 'POST', body: JSON.stringify(payload) }),

  updateCommentStatus: (id, commentId, status) =>
    request(`/documents/${id}/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteComment: (id, commentId) =>
    request(`/documents/${id}/comments/${commentId}`, { method: 'DELETE' }),

  exportMarkdown: (id, title) => downloadExport(`/documents/${id}/export`, title, 'md'),

  exportPdf: (id, title) => downloadExport(`/documents/${id}/export/pdf`, title, 'pdf'),
};
