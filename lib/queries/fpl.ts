'use client'

import { useQueries, useQuery } from '@tanstack/react-query'
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
} from 'fpl-api'

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`${url} responded with ${response.status}`)
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
  classicLeague: (
    leagueId: number,
    options?: { pageStandings?: number; pageNewEntries?: number; phase?: number }
  ) => [...fplKeys.all, 'leagues-classic', leagueId, options ?? {}] as const,
  h2hLeague: (
    leagueId: number,
    options?: { pageStandings?: number; pageNewEntries?: number }
  ) => [...fplKeys.all, 'leagues-h2h', leagueId, options ?? {}] as const,
  h2hMatches: (leagueId: number, entryId: number, page: number) =>
    [...fplKeys.all, 'leagues-h2h', leagueId, 'matches', entryId, page] as const,
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
    queryFn: () =>
      fetchJson<EntryHistory>(`/api/fpl/entry/${entryId}/history`),
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
      queryFn: () => fetchJson<ElementSummary>(`/api/fpl/element-summary/${id}`),
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
