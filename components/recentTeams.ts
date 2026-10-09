import { useSyncExternalStore } from 'react'

export interface RecentTeam {
  id: string
  // Known once the team has loaded at least once; a freshly typed ID is
  // only known by its number until then.
  name: string | null
  rank: number | null
}

const STORAGE_KEY = 'fpl-scout:recent-team-ids'
const MAX_RECENT = 4
// Same-tab writes don't trigger the native `storage` event, so we fire this
// ourselves to keep useSyncExternalStore subscribers in sync immediately.
const CHANGE_EVENT = 'fpl-scout:recent-team-ids-changed'

let cachedRaw: string | null = null
let cachedList: RecentTeam[] = []

function parseEntry(v: unknown): RecentTeam | null {
  // Older builds stored bare ID strings.
  if (typeof v === 'string') return { id: v, name: null, rank: null }
  if (v && typeof v === 'object' && typeof (v as RecentTeam).id === 'string') {
    const { id, name, rank } = v as RecentTeam
    return {
      id,
      name: typeof name === 'string' ? name : null,
      rank: typeof rank === 'number' ? rank : null,
    }
  }
  return null
}

function readList(): RecentTeam[] {
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
      ? parsed.map(parseEntry).filter((v): v is RecentTeam => v !== null)
      : []
  } catch {
    cachedList = []
  }
  return cachedList
}

function persist(teams: RecentTeam[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(teams))
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

const EMPTY: RecentTeam[] = []

function getServerSnapshot(): RecentTeam[] {
  return EMPTY
}

export function useRecentTeams(): RecentTeam[] {
  return useSyncExternalStore(subscribe, readList, getServerSnapshot)
}

// Moves the team to the front, keeping whatever name/rank is already known.
export function addRecentTeam(id: string): void {
  const current = readList()
  const known = current.find((t) => t.id === id)
  persist(
    [
      known ?? { id, name: null, rank: null },
      ...current.filter((t) => t.id !== id),
    ].slice(0, MAX_RECENT)
  )
}

// Fills in the name and overall rank once the team has loaded.
export function updateRecentTeam(
  id: string,
  name: string,
  rank: number | null
) {
  const current = readList()
  const known = current.find((t) => t.id === id)
  if (!known || (known.name === name && known.rank === rank)) return
  persist(current.map((t) => (t.id === id ? { ...t, name, rank } : t)))
}
