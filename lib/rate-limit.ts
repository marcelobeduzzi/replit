interface RateLimitInfo {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitInfo>()
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS = 100 // Maximum number of requests per window

export function rateLimit(ip: string): boolean {
  const now = Date.now()
  const info = rateLimitStore.get(ip)

  if (!info) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    })
    return true
  }

  if (now > info.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    })
    return true
  }

  if (info.count >= MAX_REQUESTS) {
    return false
  }

  info.count++
  return true
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, info] of rateLimitStore.entries()) {
    if (now > info.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
}, WINDOW_MS)

