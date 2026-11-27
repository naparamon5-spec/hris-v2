// Notifications (docs/BACKEND.md §13): GET /auth/notifications, POST /:id/read, /read-all.
// Shared by the header bell (polled every 60 s — the web has no push) and the page.
export const useNotifications = () => {
  const api = useApi()
  const items = useState('notifications', () => [])
  const unread = useState('notifications-unread', () => 0)
  const loaded = useState('notifications-loaded', () => false)
  const error = useState('notifications-error', () => '')

  const toItem = (n) => ({
    id: n.id, title: n.title, body: n.body, when: n.time, unread: !!n.unread,
    // created_at is not sent yet (G21): newest first falls back to id order.
    at: n.created_at || null,
    kind: n.kind, icon: n.icon, requestType: n.request_type, requestId: n.request_id
  })

  const refresh = async () => {
    try {
      const r = await api('/auth/notifications')
      items.value = (r.data || []).map(toItem)
      unread.value = r.unread ?? items.value.filter(n => n.unread).length
      error.value = ''
    } catch (e) {
      error.value = apiError(e, 'Unable to load notifications.')
    } finally {
      loaded.value = true
    }
  }
  const markRead = async (n) => {
    if (!n.unread) return
    n.unread = false
    unread.value = Math.max(0, unread.value - 1)
    try { await api(`/auth/notifications/${n.id}/read`, { method: 'POST' }) } catch { /* shown read anyway */ }
  }
  const markAllRead = async () => {
    items.value.forEach(n => { n.unread = false })
    unread.value = 0
    try { await api('/auth/notifications/read-all', { method: 'POST' }) } catch { /* fine */ }
  }
  return { items, unread, loaded, error, refresh, markRead, markAllRead }
}
