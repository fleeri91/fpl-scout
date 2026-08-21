'use client'

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Bootstrap,
  ClassicLeague,
  ElementSummary,
  Entry,
  EntryEvent,
  EntryHistory,
  EventStatus,
  Fixture,
  H2HLeague,
  H2HLeagueMatches,
  Live,
  Me,
  MyTeam,
} from 'fpl-api'

async function extractError(response: Response): Promise<string> {
  const data: unknown = await response.json().catch(() => null)
  if (data && typeof data === 'object' && 'error' in data) {
    const { error } = data as { error: unknown }
    if (typeof error === 'string') return error
  }
  return `Request failed with ${response.status}`
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  return response.json() as Promise<T>
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new Error(await extractError(response))
  }

  return response.json() as Promise<T>
}

export const fplKeys = {
  all: ['fpl'] as const,
  bootstrap: () => [...fplKeys.all, 'bootstrap'] as const,
  eventStatus: () => [...fplKeys.all, 'event-status'] as const,
  fixtures: (eventId?: number) =>
    [...fplKeys.all, 'fixtures', eventId ?? 'all'] as const,
  live: (eventId: number) => [...fplKeys.all, 'live', eventId] as const,
  elementSummary: (elementId: number) =>
    [...fplKeys.all, 'element-summary', elementId] as const,
  entry: (entryId: number) => [...fplKeys.all, 'entry', entryId] as const,
  entryHistory: (entryId: number) =>
    [...fplKeys.all, 'entry', entryId, 'history'] as const,
  entryEvent: (entryId: number, eventId: number) =>
    [...fplKeys.all, 'entry', entryId, 'event', eventId] as const,
  me: () => [...fplKeys.all, 'me'] as const,
  myTeam: (entryId: number) => [...fplKeys.all, 'my-team', entryId] as const,
  classicLeague: (
    leagueId: number,
    options?: {
      pageStandings?: number
      pageNewEntries?: number
      phase?: number
    }
  ) => [...fplKeys.all, 'leagues-classic', leagueId, options ?? {}] as const,
  h2hLeague: (
    leagueId: number,
    options?: { pageStandings?: number; pageNewEntries?: number }
  ) => [...fplKeys.all, 'leagues-h2h', leagueId, options ?? {}] as const,
  h2hMatches: (leagueId: number, entryId: number, page: number) =>
    [
      ...fplKeys.all,
      'leagues-h2h',
      leagueId,
      'matches',
      entryId,
      page,
    ] as const,
}

// General data such as players, teams and gameweeks. Barely changes
// intra-day, so it's kept fresh for longer than the rest of the API.
export function useBootstrap() {
  return useQuery({
    queryKey: fplKeys.bootstrap(),
    queryFn: () => fetchJson<Bootstrap>('/api/fpl/bootstrap'),
    staleTime: 60 * 60 * 1000,
  })
}

export function useEventStatus() {
  return useQuery({
    queryKey: fplKeys.eventStatus(),
    queryFn: () => fetchJson<EventStatus>('/api/fpl/event-status'),
  })
}

export function useFixtures(eventId?: number) {
  return useQuery({
    queryKey: fplKeys.fixtures(eventId),
    queryFn: () =>
      fetchJson<Fixture[]>(
        eventId ? `/api/fpl/fixtures?eventId=${eventId}` : '/api/fpl/fixtures'
      ),
  })
}

export function useLive(eventId: number) {
  return useQuery({
    queryKey: fplKeys.live(eventId),
    queryFn: () => fetchJson<Live>(`/api/fpl/live/${eventId}`),
    enabled: Number.isFinite(eventId),
  })
}

export function useElementSummary(elementId: number) {
  return useQuery({
    queryKey: fplKeys.elementSummary(elementId),
    queryFn: () =>
      fetchJson<ElementSummary>(`/api/fpl/element-summary/${elementId}`),
    enabled: Number.isFinite(elementId),
  })
}

export function useEntry(entryId: number) {
  return useQuery({
    queryKey: fplKeys.entry(entryId),
    queryFn: () => fetchJson<Entry>(`/api/fpl/entry/${entryId}`),
    enabled: Number.isFinite(entryId),
  })
}

export function useEntryHistory(entryId: number) {
  return useQuery({
    queryKey: fplKeys.entryHistory(entryId),
    queryFn: () => fetchJson<EntryHistory>(`/api/fpl/entry/${entryId}/history`),
    enabled: Number.isFinite(entryId),
  })
}

export function useEntryEvent(entryId: number, eventId: number) {
  return useQuery({
    queryKey: fplKeys.entryEvent(entryId, eventId),
    queryFn: () =>
      fetchJson<EntryEvent>(`/api/fpl/entry/${entryId}/event/${eventId}`),
    enabled: Number.isFinite(entryId) && Number.isFinite(eventId),
  })
}

// Whether we're logged into an FPL account, and who — driven by the
// httpOnly session cookie the login route sets. A 401 here just means
// "not logged in yet", so it's treated as a normal (non-retried) result
// rather than a transient fetch error.
export function useMe() {
  return useQuery({
    queryKey: fplKeys.me(),
    queryFn: () => fetchJson<Me>('/api/fpl/me'),
    retry: false,
  })
}

export function useMyTeam(entryId: number, enabled = true) {
  return useQuery({
    queryKey: fplKeys.myTeam(entryId),
    queryFn: () => fetchJson<MyTeam>(`/api/fpl/my-team/${entryId}`),
    enabled: enabled && Number.isFinite(entryId),
    retry: false,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      postJson<{ ok: true }>('/api/fpl/login', credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fplKeys.me() })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => postJson<{ ok: true }>('/api/fpl/logout'),
    onSuccess: () => {
      queryClient.setQueryData(fplKeys.me(), undefined)
      queryClient.invalidateQueries({ queryKey: fplKeys.me() })
    },
  })
}

export function useClassicLeague(
  leagueId: number,
  options?: { pageStandings?: number; pageNewEntries?: number; phase?: number }
) {
  return useQuery({
    queryKey: fplKeys.classicLeague(leagueId, options),
    queryFn: () => {
      const params = new URLSearchParams()
      if (options?.pageStandings)
        params.set('pageStandings', String(options.pageStandings))
      if (options?.pageNewEntries)
        params.set('pageNewEntries', String(options.pageNewEntries))
      if (options?.phase) params.set('phase', String(options.phase))
      const qs = params.toString()

      return fetchJson<ClassicLeague>(
        `/api/fpl/leagues-classic/${leagueId}${qs ? `?${qs}` : ''}`
      )
    },
    enabled: Number.isFinite(leagueId),
  })
}

export function useH2HLeague(
  leagueId: number,
  options?: { pageStandings?: number; pageNewEntries?: number }
) {
  return useQuery({
    queryKey: fplKeys.h2hLeague(leagueId, options),
    queryFn: () => {
      const params = new URLSearchParams()
      if (options?.pageStandings)
        params.set('pageStandings', String(options.pageStandings))
      if (options?.pageNewEntries)
        params.set('pageNewEntries', String(options.pageNewEntries))
      const qs = params.toString()

      return fetchJson<H2HLeague>(
        `/api/fpl/leagues-h2h/${leagueId}${qs ? `?${qs}` : ''}`
      )
    },
    enabled: Number.isFinite(leagueId),
  })
}

export function useElementSummaries(elementIds: number[]) {
  return useQueries({
    queries: elementIds.map((id) => ({
      queryKey: fplKeys.elementSummary(id),
      queryFn: () =>
        fetchJson<ElementSummary>(`/api/fpl/element-summary/${id}`),
      staleTime: 5 * 60 * 1000,
    })),
  })
}

export function useH2HMatches(leagueId: number, entryId: number, page = 1) {
  return useQuery({
    queryKey: fplKeys.h2hMatches(leagueId, entryId, page),
    queryFn: () =>
      fetchJson<H2HLeagueMatches>(
        `/api/fpl/leagues-h2h/${leagueId}/matches?entryId=${entryId}&page=${page}`
      ),
    enabled: Number.isFinite(leagueId) && Number.isFinite(entryId),
  })
}
