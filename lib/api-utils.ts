/**
 * Utility function to fetch data with timeout and retry capabilities
 */
export async function fetchWithTimeout<T>(
  fetchFn: () => Promise<T>,
  options: {
    timeout?: number
    retries?: number
    retryDelay?: number
    fallbackValue?: T
  } = {},
): Promise<T> {
  const { timeout = 10000, retries = 3, retryDelay = 1000, fallbackValue } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timed out after ${timeout}ms`))
        }, timeout)
      })

      // Race the fetch against the timeout
      return await Promise.race([fetchFn(), timeoutPromise])
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`Request failed (attempt ${attempt + 1}/${retries}):`, lastError.message)

      // If this is not the last attempt, wait before retrying
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)))
      }
    }
  }

  // If we have a fallback value, return it instead of throwing
  if (fallbackValue !== undefined) {
    console.error("All retry attempts failed, using fallback value")
    return fallbackValue
  }

  // Otherwise throw the last error
  throw lastError || new Error("Request failed for unknown reason")
}

/**
 * Debounce function to prevent too many API calls
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>): void => {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

