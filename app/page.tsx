'use client'

import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import {
  useBootstrap,
  useElementSummaries,
  useEntry,
  useEntryEvent,
  useEntryHistory,
  useFixtures,
} from '@/lib/queries/fpl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import '@/components/fpl-scout.css'
import { ConnectScreen } from '@/components/ConnectScreen'
import { Header } from '@/components/Header'
import { PlayerSheet } from '@/components/PlayerSheet'
import { Sidebar } from '@/components/Sidebar'
import {
  buildAlerts,
  buildChipStatus,
  buildFixturesByTeamId,
  buildTransferSuggestions,
  computeFixturePlanner,
  getCurrentEvent,
  mapElementToPlayer,
  type FplElement,
} from '@/components/mapFplData'
import { addRecentTeamId, removeRecentTeamId, useRecentTeamIds } from '@/components/recentTeams'
import { ChipsScreen } from '@/components/screens/ChipsScreen'
import { DashboardScreen } from '@/components/screens/DashboardScreen'
import { ExplorerScreen, type ExplorerFilters } from '@/components/screens/ExplorerScreen'
import { FixturesScreen } from '@/components/screens/FixturesScreen'
import { TransfersScreen } from '@/components/screens/TransfersScreen'
import type { Player, Screen } from '@/components/types'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function StatusShell({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-[430px] rounded-xl border-border p-5.5">
        <div className="text-base font-semibold tracking-tight">{title}</div>
        <div className="mt-2 text-[12.5px] leading-relaxed text-(--fg2)">{body}</div>
        {action ? <div className="mt-4">{action}</div> : null}
      </Card>
    </div>
  )
}

export default function Home() {
  const [entry, setEntry] = useState('')
  const [entryError, setEntryError] = useState('')
  const [teamId, setTeamId] = useState<string | null>(null)

  const [navOpen, setNavOpen] = useState(true)
  const [screen, setScreen] = useState<Screen>('dash')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [now, setNow] = useState(() => Date.now())
  const recentTeamIds = useRecentTeamIds()

  const [filters, setFilters] = useState<ExplorerFilters>({
    pos: 'All',
    team: 'All teams',
    maxPrice: 15,
    maxOwn: 60,
    sortKey: 'xgi',
    sortDir: -1,
  })

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Select/Sheet/etc. render their popup content in a portal appended to
  // <body>, outside the .fpl-scout wrapper below — so the theme variables
  // scoped to that wrapper wouldn't reach them. Mirroring the class onto
  // <body> lets portaled content inherit the same theme via normal CSS
  // inheritance. Safe from FOUC: portals only ever open after a user
  // interaction, which can't happen before this effect has already run.
  useEffect(() => {
    document.body.classList.add('fpl-scout')
    document.body.dataset.theme = 'dark'
    return () => {
      document.body.classList.remove('fpl-scout')
      delete document.body.dataset.theme
    }
  }, [])

  const numericTeamId = teamId ? Number(teamId) : NaN

  const bootstrapQuery = useBootstrap()
  const entryQuery = useEntry(numericTeamId)
  const entryHistoryQuery = useEntryHistory(numericTeamId)
  const fixturesQuery = useFixtures()

  const currentEvent = bootstrapQuery.data ? getCurrentEvent(bootstrapQuery.data) : undefined
  const entryEventQuery = useEntryEvent(numericTeamId, currentEvent?.id ?? NaN)

  const squadElementIds = useMemo(() => entryEventQuery.data?.picks.map((p) => p.element) ?? [], [entryEventQuery.data])
  const summaries = useElementSummaries(squadElementIds)
  const histByElementId = useMemo(() => {
    const map: Record<number, number[]> = {}
    squadElementIds.forEach((id, i) => {
      map[id] = (summaries[i]?.data?.history ?? []).slice(-5).map((h) => h.total_points)
    })
    return map
  }, [squadElementIds, summaries])

  const connectWithId = (v: string) => {
    setEntry(v)
    setEntryError('')
    setSelectedId(null)
    setScreen('dash')
    setTeamId(v)
    addRecentTeamId(v, recentTeamIds)
  }

  const connect = () => {
    const v = entry.trim()
    if (!/^\d{1,9}$/.test(v)) {
      setEntryError('Team IDs are numbers only, up to nine digits.')
      return
    }
    connectWithId(v)
  }

  const onEntryKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') connect()
  }

  const disconnect = () => {
    setTeamId(null)
    setEntry('')
    setScreen('dash')
    setSelectedId(null)
  }

  const backToConnect = () => setTeamId(null)

  const allPlayers = useMemo<Player[]>(() => {
    if (!bootstrapQuery.data || !fixturesQuery.data || !currentEvent) return []
    const fixturesByTeamId = buildFixturesByTeamId(bootstrapQuery.data, fixturesQuery.data, currentEvent.id, 6)
    return (bootstrapQuery.data.elements as FplElement[]).map((el) =>
      mapElementToPlayer(el, bootstrapQuery.data!, fixturesByTeamId, histByElementId[el.id] ?? [])
    )
  }, [bootstrapQuery.data, fixturesQuery.data, currentEvent, histByElementId])

  const playersById = useMemo(() => new Map(allPlayers.map((p) => [p.id, p])), [allPlayers])

  const teams = useMemo(() => bootstrapQuery.data?.teams.map((t) => t.short_name) ?? [], [bootstrapQuery.data])

  const fixturePlanner = useMemo(() => {
    if (!bootstrapQuery.data || !fixturesQuery.data || !currentEvent) return { gws: [], matrix: [], bestWindows: [] }
    return computeFixturePlanner(bootstrapQuery.data, fixturesQuery.data, currentEvent.id, 6)
  }, [bootstrapQuery.data, fixturesQuery.data, currentEvent])

  const xi = useMemo(() => {
    const picks = entryEventQuery.data?.picks ?? []
    return picks
      .filter((p) => p.position <= 11)
      .sort((a, b) => a.position - b.position)
      .map((p) => playersById.get(p.element))
      .filter((p): p is Player => !!p)
  }, [entryEventQuery.data, playersById])

  const bench = useMemo(() => {
    const picks = entryEventQuery.data?.picks ?? []
    return picks
      .filter((p) => p.position > 11)
      .sort((a, b) => a.position - b.position)
      .map((p) => playersById.get(p.element))
      .filter((p): p is Player => !!p)
  }, [entryEventQuery.data, playersById])

  const alerts = useMemo(() => {
    if (!bootstrapQuery.data || !entryEventQuery.data) return []
    const squadIds = new Set(entryEventQuery.data.picks.map((p) => p.element))
    const squadElements = (bootstrapQuery.data.elements as FplElement[]).filter((el) => squadIds.has(el.id))
    return buildAlerts(squadElements).filter((a) => !dismissed.includes(a.id))
  }, [bootstrapQuery.data, entryEventQuery.data, dismissed])

  const chips = useMemo(() => buildChipStatus(entryHistoryQuery.data), [entryHistoryQuery.data])

  const bankM = (entryEventQuery.data?.entry_history.bank ?? 0) / 10
  const valueM = (entryEventQuery.data?.entry_history.value ?? 0) / 10
  const eventTransfers = entryEventQuery.data?.entry_history.event_transfers ?? 0
  const overallRank = entryEventQuery.data?.entry_history.overall_rank ?? entryQuery.data?.summary_overall_rank ?? null

  const rankHistory = entryHistoryQuery.data?.current
  const rankCur = rankHistory && currentEvent ? rankHistory.find((c) => c.event === currentEvent.id) : undefined
  const rankPrev = rankHistory && currentEvent ? rankHistory.find((c) => c.event === currentEvent.id - 1) : undefined
  const rankDelta = rankCur && rankPrev ? rankPrev.overall_rank - rankCur.overall_rank : null
  const rankNote =
    rankDelta === null
      ? '—'
      : rankDelta === 0
        ? 'No change'
        : rankDelta > 0
          ? `▲ ${rankDelta.toLocaleString('en-GB')} places`
          : `▼ ${Math.abs(rankDelta).toLocaleString('en-GB')} places`

  const transfers = useMemo(() => {
    if (xi.length === 0 || allPlayers.length === 0) return []
    const squadIds = new Set(entryEventQuery.data?.picks.map((p) => p.element) ?? [])
    return buildTransferSuggestions(xi, allPlayers, squadIds, bankM)
  }, [xi, allPlayers, entryEventQuery.data, bankM])

  const seasonLabel = useMemo(() => {
    if (!bootstrapQuery.data?.events.length) return ''
    const firstYear = new Date(bootstrapQuery.data.events[0].deadline_time).getFullYear()
    return `${firstYear}/${String(firstYear + 1).slice(-2)}`
  }, [bootstrapQuery.data])

  const deadlineMs = currentEvent ? new Date(currentEvent.deadline_time).getTime() : null
  const diffSecs = deadlineMs ? Math.max(0, Math.floor((deadlineMs - now) / 1000)) : 0
  const d = Math.floor(diffSecs / 86400)
  const hh = Math.floor((diffSecs % 86400) / 3600)
  const mm = Math.floor((diffSecs % 3600) / 60)
  const ss = diffSecs % 60
  const countdown = `${d}d ${pad(hh)}:${pad(mm)}:${pad(ss)}`

  const initials = useMemo(() => {
    const p = entryQuery.data
    if (!p) return 'FS'
    return `${p.player_first_name.charAt(0)}${p.player_last_name.charAt(0)}`.toUpperCase()
  }, [entryQuery.data])

  const titles: Record<Screen, [string, string]> = {
    dash: ['Dashboard', 'Your squad at a glance'],
    explorer: ['Player Explorer', `${allPlayers.length} players · season stats`],
    fixtures: [
      'Fixture Planner',
      fixturePlanner.gws.length ? `${fixturePlanner.gws[0]} – ${fixturePlanner.gws[fixturePlanner.gws.length - 1]} difficulty matrix` : '',
    ],
    chips: ['Chip Strategy', 'Usage this season'],
    transfers: ['Transfer Suggestions', 'Ranked by xGI per million'],
  }

  if (!teamId) {
    return (
      <div className="fpl-scout min-h-screen" data-theme="dark">
        <ConnectScreen
          entry={entry}
          entryError={entryError}
          connectLabel="Connect team"
          recentTeamIds={recentTeamIds}
          onEntryChange={(v) => {
            setEntry(v)
            setEntryError('')
          }}
          onEntryKeyDown={onEntryKeyDown}
          onConnect={connect}
          onSelectRecent={connectWithId}
          onRemoveRecent={(id) => removeRecentTeamId(id, recentTeamIds)}
        />
      </div>
    )
  }

  if (entryQuery.isError) {
    return (
      <div className="fpl-scout min-h-screen" data-theme="dark">
        <StatusShell
          title="Team not found"
          body="Scout couldn't find an FPL team with that ID. Double-check it and try again."
          action={
            <Button onClick={backToConnect} className="h-auto rounded-lg px-3.5 py-2.25 text-[13px] font-semibold">
              Try again
            </Button>
          }
        />
      </div>
    )
  }

  const anyError = bootstrapQuery.isError || entryHistoryQuery.isError || fixturesQuery.isError
  if (anyError) {
    return (
      <div className="fpl-scout min-h-screen" data-theme="dark">
        <StatusShell
          title="Couldn't load that team"
          body="This team ID is valid, but Scout couldn't load its history right now. The FPL API may be temporarily unavailable."
          action={
            <Button onClick={disconnect} className="h-auto rounded-lg px-3.5 py-2.25 text-[13px] font-semibold">
              Try a different team
            </Button>
          }
        />
      </div>
    )
  }

  const allReady = bootstrapQuery.data && entryQuery.data && entryHistoryQuery.data && fixturesQuery.data && currentEvent
  if (!allReady) {
    return (
      <div className="fpl-scout min-h-screen" data-theme="dark">
        <StatusShell title="Fetching squad…" body="Pulling your team, gameweek picks and fixtures from the FPL API." />
      </div>
    )
  }

  // The FPL API only exposes a gameweek's picks once its deadline has passed,
  // so a team can be perfectly valid while its current-event picks 404.
  const picksAvailable = !!entryEventQuery.data
  const picksUnavailableNotice = (
    <div className="p-5.5">
      <Card className="rounded-xl border-border p-6 text-center text-[13px] leading-relaxed text-(--fg2)">
        Picks for GW{currentEvent.id} aren&apos;t public yet — the FPL API only exposes a gameweek&apos;s squad once its
        deadline has passed. Check back after {new Date(currentEvent.deadline_time).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}.
      </Card>
    </div>
  )

  const summary = [
    { label: 'Squad value', value: `£${valueM.toFixed(1)}m`, note: `GW${currentEvent.id}`, dir: 'flat' as const },
    {
      label: 'In the bank',
      value: `£${bankM.toFixed(1)}m`,
      note: eventTransfers === 0 ? 'No transfers made' : `${eventTransfers} transfer${eventTransfers > 1 ? 's' : ''} made`,
      dir: 'flat' as const,
    },
    { label: 'Overall rank', value: overallRank ? overallRank.toLocaleString('en-GB') : '—', note: rankNote, dir: rankNote.startsWith('▲') ? ('up' as const) : rankNote.startsWith('▼') ? ('down' as const) : ('flat' as const) },
    {
      label: `GW${currentEvent.id} deadline`,
      value: `${d}d ${pad(hh)}h`,
      note: new Date(currentEvent.deadline_time).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
      dir: 'flat' as const,
    },
  ]

  const sel = selectedId != null ? playersById.get(selectedId) : null
  const [title, subtitle] = titles[screen]

  return (
    <div className="fpl-scout min-h-screen" data-theme="dark">
      <div className="flex min-h-screen">
        <Sidebar
          screen={screen}
          navOpen={navOpen}
          deadlineLabel={`GW${currentEvent.id} deadline`}
          countdown={countdown}
          onNavigate={setScreen}
          onToggleNav={() => setNavOpen((v) => !v)}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <Header
            title={title}
            subtitle={subtitle}
            teamId={teamId}
            gameweekLabel={`Gameweek ${currentEvent.id}${seasonLabel ? ` · ${seasonLabel}` : ''}`}
            initials={initials}
            onDisconnect={disconnect}
          />

          {screen === 'dash' &&
            (picksAvailable ? (
              <DashboardScreen
                summary={summary}
                xi={xi}
                bench={bench}
                alerts={alerts}
                onOpenPlayer={setSelectedId}
                onDismissAlert={(id) => setDismissed((d) => [...d, id])}
              />
            ) : (
              picksUnavailableNotice
            ))}
          {screen === 'explorer' && (
            <ExplorerScreen
              players={allPlayers}
              teams={teams}
              filters={filters}
              onFiltersChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
              onSort={(key) =>
                setFilters((f) => (f.sortKey === key ? { ...f, sortDir: f.sortDir === 1 ? -1 : 1 } : { ...f, sortKey: key, sortDir: -1 }))
              }
              onReset={() => setFilters({ pos: 'All', team: 'All teams', maxPrice: 15, maxOwn: 60, sortKey: 'xgi', sortDir: -1 })}
              onOpenPlayer={setSelectedId}
            />
          )}
          {screen === 'fixtures' && (
            <FixturesScreen gws={fixturePlanner.gws} matrix={fixturePlanner.matrix} bestWindows={fixturePlanner.bestWindows} />
          )}
          {screen === 'chips' && <ChipsScreen chips={chips} />}
          {screen === 'transfers' && (picksAvailable ? <TransfersScreen transfers={transfers} /> : picksUnavailableNotice)}
        </main>

        {sel ? <PlayerSheet player={sel} onClose={() => setSelectedId(null)} /> : null}
      </div>
    </div>
  )
}
