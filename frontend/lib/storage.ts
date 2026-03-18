/**
 * User-scoped localStorage so each account only sees its own data.
 * Keys are prefixed with the current user id (e.g. user_<uuid>_businessInfo).
 */

export type StoredUser = {
  id: string
  email: string
  name: string
  business_type: string
  created_at?: string
}

function getStoredUserRaw(): StoredUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const data = JSON.parse(raw) as StoredUser
    return data?.id ? data : null
  } catch {
    return null
  }
}

/** Current logged-in user from localStorage (used for scoping data). */
export function getStoredUser(): StoredUser | null {
  return getStoredUserRaw()
}

/** Prefix for user-specific keys. Empty if no user (e.g. public template pages). */
export function getStoragePrefix(): string {
  const user = getStoredUserRaw()
  if (!user?.id) return ''
  return getPrefixForUserId(String(user.id))
}

/** Prefix for a given user id (e.g. for saving orders when customer checks out and site owner is in session). */
export function getPrefixForUserId(userId: string): string {
  if (!userId) return ''
  return `user_${userId}_`
}

/** Get the localStorage key for the current user. Use for all user-specific data. */
export function prefixKey(key: string): string {
  const prefix = getStoragePrefix()
  return prefix ? `${prefix}${key}` : key
}

/** Get item from user-scoped storage. Returns null if no user. */
export function getScopedItem(key: string): string | null {
  if (typeof window === 'undefined') return null
  const scoped = prefixKey(key)
  if (scoped === key) return null // no user, don't read global key
  return localStorage.getItem(scoped)
}

/** Set item in user-scoped storage. No-op if no user. */
export function setScopedItem(key: string, value: string): void {
  if (typeof window === 'undefined') return
  const scoped = prefixKey(key)
  if (scoped === key) return
  
  try {
    localStorage.setItem(scoped, value)
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Clearing old data...')
      // Try to clear some space by removing old user data
      try {
        const keys = Object.keys(localStorage)
        keys.forEach(k => {
          if (k.startsWith('user_') && k !== scoped) {
            localStorage.removeItem(k)
          }
        })
        // Try again after cleanup
        localStorage.setItem(scoped, value)
      } catch (retryError) {
        console.error('Failed to save to localStorage even after cleanup:', retryError)
      }
    } else {
      console.error('Failed to save to localStorage:', error)
    }
  }
}

/** Remove item from user-scoped storage. */
export function removeScopedItem(key: string): void {
  if (typeof window === 'undefined') return
  const scoped = prefixKey(key)
  if (scoped === key) return
  localStorage.removeItem(scoped)
}

const SITE_OWNER_KEY = 'pharmacySiteOwnerId'

/** Set the current site owner id (when owner visits their pharmacy template). Used so customer checkouts can save orders to the right account. */
export function setSiteOwnerId(userId: string | null): void {
  if (typeof window === 'undefined') return
  if (userId) sessionStorage.setItem(SITE_OWNER_KEY, userId)
  else sessionStorage.removeItem(SITE_OWNER_KEY)
}

/** Get the site owner id from session (e.g. for checkout when customer is not logged in). */
export function getSiteOwnerId(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(SITE_OWNER_KEY)
}

/** Get/set item for a specific user (e.g. when customer places order and we have site owner id). */
export function getItemForUser(userId: string, key: string): string | null {
  if (typeof window === 'undefined' || !userId) return null
  return localStorage.getItem(getPrefixForUserId(userId) + key)
}

export function setItemForUser(userId: string, key: string, value: string): void {
  if (typeof window === 'undefined' || !userId) return
  localStorage.setItem(getPrefixForUserId(userId) + key, value)
}

/** Read key for "site" data: scoped when logged in, else global. Use on template pages so owner sees their data and visitors get fallback. */
export function getSiteItem(key: string): string | null {
  if (typeof window === 'undefined') return null
  const scoped = getScopedItem(key)
  if (scoped !== null) return scoped
  return localStorage.getItem(key)
}

/** Write key for "site" data: scoped when logged in, else global. */
export function setSiteItem(key: string, value: string): void {
  if (typeof window === 'undefined') return
  const prefix = getStoragePrefix()
  if (prefix) setScopedItem(key, value)
  else localStorage.setItem(key, value)
}

/** Remove site item. */
export function removeSiteItem(key: string): void {
  if (typeof window === 'undefined') return
  const prefix = getStoragePrefix()
  if (prefix) removeScopedItem(key)
  else localStorage.removeItem(key)
}
