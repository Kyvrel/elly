const API_BASE = 'http://localhost:23001'

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'API Request failed')
  }
  return res.json()
}

export const api = {
  threads: {
    getAll: () => fetchAPI<any[]>('/api/threads'),
    create: (data: { title: string; model: string }) =>
      fetchAPI('/api/threads', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/api/threads/${id}`, { method: 'DELETE' })
  },

  messages: {
    getByThread: (threadId: string) => fetchAPI(`/api/threads/${threadId}/messages`),
    send: (data: { threadId: string; message: string; model: string }) =>
      fetchAPI('/api/chat/completions', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  providers: {
    getAll: () => fetchAPI('/api/providers'),
    create: (data: any) =>
      fetchAPI('/api/providers', { method: 'POST', body: JSON.stringify(data) })
  },

  settings: {
    get: () => fetchAPI('/api/settings'),
    update: (data: any) => fetchAPI('/api/settings', { method: 'PUT', body: JSON.stringify(data) })
  }
}
