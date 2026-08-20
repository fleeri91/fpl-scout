import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'fpl-scout:recent-team-ids'
const MAX_RECENT = 6
// Same-tab writes don't trigger the native `storage` event, so we fire this
// ourselves to keep useSyncExternalStore subscribers in sync immediately.
const CHANGE_EVENT = 'fpl-scout:recent-team-ids-changed'

let cachedRaw: string | null = null
let cachedList: string[] = []

function readList(): string[] {
  if (typeof window === 'undefined') return []
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    raw = null
  }
  if (raw === cachedRaw) return cachedList
  cachedRaw = raw
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : []
    cachedList = Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string')
      : []
  } catch {
    cachedList = []
  }
  return cachedList
}

function persist(ids: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage unavailable (private browsing, quota) — history just won't persist.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', callback)
  window.addEventListener(CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}

const EMPTY: string[] = []

function getServerSnapshot(): string[] {
  return EMPTY
}

export function useRecentTeamIds(): string[] {
  return useSyncExternalStore(subscribe, readList, getServerSnapshot)
}

export function addRecentTeamId(id: string, current: string[]): void {
  persist([id, ...current.filter((v) => v !== id)].slice(0, MAX_RECENT))
}

export function removeRecentTeamId(id: string, current: string[]): void {
  persist(current.filter((v) => v !== id))
}
