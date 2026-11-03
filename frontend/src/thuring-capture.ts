// Sends this app's errors to Thuring (https://thuring.ai) so they show up in Needs work. Added by Thuring in a
// pull request you merged; delete this file to stop. Emails, addresses and keys are removed before anything is
// sent. The key below can only add errors to this one project: it can't read or change anything.

const endpoint = 'https://api.thuring.ai/v1/capture/tc_7bb8508d82726d6faa093a92fa949fde'
const scrub = (s: unknown): string =>
  String(s ?? '')
    .replace(/(https?:\/\/[^\s?#"'<>]*)[?#][^\s"'<>]*/g, '$1')
    .replace(/\bBearer\s+[\w.~+/=-]+/gi, 'Bearer [removed]')
    .replace(/\b(api[_-]?key|token|secret|password|authorization|session|cookie|key)(["']?\s*[=:]\s*["']?)[^\s"',;&}]+/gi, '$1$2[removed]')
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email]')
    .replace(/\b\d{1,3}(\.\d{1,3}){3}\b/g, '[address]')
    .replace(/\b(?:\d[ -]?){13,19}\b/g, '[number]')
    .replace(/\b[\w+/-]{32,}={0,2}/g, '[removed]')

let sent = 0
function send(type: string, message: unknown, stack: unknown) {
  if (typeof window === 'undefined' || sent >= 20) return // at most 20 errors a page view
  sent++
  const body = JSON.stringify({
    kind: 'browser',
    type: scrub(type).slice(0, 80),
    message: scrub(message).slice(0, 300),
    stack: scrub(stack).slice(0, 4000),
    url: location.origin + location.pathname
  })
  try {
    if (!navigator.sendBeacon?.(endpoint, body)) {
      void fetch(endpoint, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {})
    }
  } catch {
    // never let error reporting break the app
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => send(e.error?.name ?? 'Error', e.error?.message ?? e.message, e.error?.stack))
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason as { name?: string; message?: string; stack?: string } | undefined
    send(r?.name ?? 'UnhandledRejection', r?.message ?? r, r?.stack)
  })
}

export {}
