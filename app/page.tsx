'use client'

import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
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
import { Dossier } from '@/components/Dossier'
import { Masthead } from '@/components/Masthead'
import { PageFooter } from '@/components/PageFooter'
import {
  buildAlerts,
  buildChipStatus,
  buildCrowdData,
  buildFixturesByTeamId,
  buildHeadToHead,
  buildLeads,
  buildPositionAudit,
  computeFixturePlanner,
  getCurrentEvent,
  mapElementToPlayer,
  type FplElement,
} from '@/components/mapFplData'
import {
  addRecentTeamId,
  removeRecentTeamId,
  useRecentTeamIds,
} from '@/components/recentTeams'
import { ChipsScreen } from '@/components/screens/ChipsScreen'
import { CrowdScreen } from '@/components/screens/CrowdScreen'
import { FixturesScreen } from '@/components/screens/FixturesScreen'
import {
  FormBookScreen,
  type FormBookFilters,
} from '@/components/screens/FormBookScreen'
import { HeadToHeadScreen } from '@/components/screens/HeadToHeadScreen'
import { MatchdayScreen } from '@/components/screens/MatchdayScreen'
import { TeamSheetScreen } from '@/components/screens/TeamSheetScreen'
import { PAGES, type Player } from '@/components/types'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function StatusShell({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <Card className="border-border w-full max-w-[430px] rounded-xl p-5.5">
        <div className="text-base font-semibold tracking-tight">{title}</div>
        <div className="mt-2 text-[12.5px] leading-relaxed text-(--fg2)">
          {body}
        </div>
        {action ? <div className="mt-4">{action}</div> : null}
      </Card>
    </div>
  )
}

export default function Home() {
  const [entry, setEntry] = useState('')
  const [entryError, setEntryError] = useState('')
  const [teamId, setTeamId] = useState<string | null>(null)

  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [now, setNow] = useState(() => Date.now())
  const [horizon, setHorizon] = useState(6)
  const [windowLen, setWindowLen] = useState(3)
  const recentTeamIds = useRecentTeamIds()

  const [filters, setFilters] = useState<FormBookFilters>({
    pos: 'All',
    avail: 'All',
    team: 'All clubs',
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

  // Arrow keys page the sliding ledger, Escape is handled by the Dossier's
  // own Sheet/Dialog. Skipped while a form control has focus or a modifier
  // is held, and suppressed entirely while the Dossier is open so the
  // reader isn't paged out from under them mid-comparison.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && /INPUT|SELECT|TEXTAREA/.test(target.tagName)) return
      if (selectedId != null) return
      if (e.key === 'ArrowRight') setPage((p) => Math.min(PAGES.length - 1, p + 1))
      else if (e.key === 'ArrowLeft') setPage((p) => Math.max(0, p - 1))
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId])

  const numericTeamId = teamId ? Number(teamId) : NaN

  const bootstrapQuery = useBootstrap()
  const entryQuery = useEntry(numericTeamId)
  const entryHistoryQuery = useEntryHistory(numericTeamId)
  const fixturesQuery = useFixtures()

  const currentEvent = bootstrapQuery.data
    ? getCurrentEvent(bootstrapQuery.data)
    : undefined
  const entryEventQuery = useEntryEvent(numericTeamId, currentEvent?.id ?? NaN)

  const squadElementIds = useMemo(
    () => entryEventQuery.data?.picks.map((p) => p.element) ?? [],
    [entryEventQuery.data]
  )
  const summaries = useElementSummaries(squadElementIds)
  const histByElementId = useMemo(() => {
    const map: Record<number, number[]> = {}
    squadElementIds.forEach((id, i) => {
      map[id] = (summaries[i]?.data?.history ?? [])
        .slice(-5)
        .map((h) => h.total_points)
    })
    return map
  }, [squadElementIds, summaries])

  const connectWithId = (v: string) => {
    setEntry(v)
    setEntryError('')
    setSelectedId(null)
    setPage(0)
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
    setPage(0)
    setSelectedId(null)
  }

  const backToConnect = () => setTeamId(null)

  const allPlayers = useMemo<Player[]>(() => {
    if (!bootstrapQuery.data || !fixturesQuery.data || !currentEvent) return []
    const fixturesByTeamId = buildFixturesByTeamId(
      bootstrapQuery.data,
      fixturesQuery.data,
      currentEvent.id,
      6
    )
    return (bootstrapQuery.data.elements as FplElement[]).map((el) =>
      mapElementToPlayer(
        el,
        bootstrapQuery.data!,
        fixturesByTeamId,
        histByElementId[el.id] ?? []
      )
    )
  }, [bootstrapQuery.data, fixturesQuery.data, currentEvent, histByElementId])

  const playersById = useMemo(
    () => new Map(allPlayers.map((p) => [p.id, p])),
    [allPlayers]
  )

  const teams = useMemo(
    () => bootstrapQuery.data?.teams.map((t) => t.short_name) ?? [],
    [bootstrapQuery.data]
  )

  // The FPL season runs 38 gameweeks, so the horizon slider can't reach
  // further than that from the current gameweek.
  const horizonMax = currentEvent ? Math.max(3, 39 - currentEvent.id) : 39
  const windowMax = Math.max(2, Math.min(6, horizon))
  const effectiveWindowLen = Math.max(2, Math.min(windowLen, windowMax))
  const windowLenLabel = `${effectiveWindowLen} GWs`
  const horizonLabel = currentEvent
    ? `GW${currentEvent.id} – GW${currentEvent.id + horizon - 1} · ${horizon} weeks`
    : ''
  const windowNote = currentEvent
    ? `Lowest average difficulty across any ${effectiveWindowLen} consecutive gameweeks in the GW${currentEvent.id}–GW${currentEvent.id + horizon - 1} range.`
    : ''
  const cellW = horizon <= 6 ? 'auto' : horizon <= 24 ? '64px' : '72px'

  const fixturePlanner = useMemo(() => {
    if (!bootstrapQuery.data || !fixturesQuery.data || !currentEvent)
      return {
        gws: [],
        matrix: [],
        bestWindows: [],
        windowLen: effectiveWindowLen,
      }
    return computeFixturePlanner(
      bootstrapQuery.data,
      fixturesQuery.data,
      currentEvent.id,
      horizon,
      windowLen
    )
  }, [
    bootstrapQuery.data,
    fixturesQuery.data,
    currentEvent,
    horizon,
    windowLen,
    effectiveWindowLen,
  ])

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

  const squad = useMemo(() => [...xi, ...bench], [xi, bench])
  const squadIds = useMemo(() => new Set(squad.map((p) => p.id)), [squad])
  const squadTeams = useMemo(() => squad.map((p) => p.team), [squad])

  const captainId =
    entryEventQuery.data?.picks.find((p) => p.is_captain)?.element ?? null
  const viceId =
    entryEventQuery.data?.picks.find((p) => p.is_vice_captain)?.element ??
    null

  const squadElements = useMemo(() => {
    if (!bootstrapQuery.data || !entryEventQuery.data) return []
    const squadElementIdSet = new Set(
      entryEventQuery.data.picks.map((p) => p.element)
    )
    return (bootstrapQuery.data.elements as FplElement[]).filter((el) =>
      squadElementIdSet.has(el.id)
    )
  }, [bootstrapQuery.data, entryEventQuery.data])

  const alerts = useMemo(() => {
    return buildAlerts(squadElements).filter((a) => !dismissed.includes(a.id))
  }, [squadElements, dismissed])

  const chips = useMemo(
    () =>
      buildChipStatus(
        entryHistoryQuery.data,
        squadElements,
        fixturesQuery.data,
        currentEvent?.id
      ),
    [entryHistoryQuery.data, squadElements, fixturesQuery.data, currentEvent]
  )

  const bankM = (entryEventQuery.data?.entry_history.bank ?? 0) / 10
  const valueM = (entryEventQuery.data?.entry_history.value ?? 0) / 10
  const eventTransfers =
    entryEventQuery.data?.entry_history.event_transfers ?? 0
  const overallRank =
    entryEventQuery.data?.entry_history.overall_rank ??
    entryQuery.data?.summary_overall_rank ??
    null

  const rankHistory = entryHistoryQuery.data?.current
  const rankCur =
    rankHistory && currentEvent
      ? rankHistory.find((c) => c.event === currentEvent.id)
      : undefined
  const rankPrev =
    rankHistory && currentEvent
      ? rankHistory.find((c) => c.event === currentEvent.id - 1)
      : undefined
  const rankDelta =
    rankCur && rankPrev ? rankPrev.overall_rank - rankCur.overall_rank : null
  const rankNote =
    rankDelta === null
      ? '—'
      : rankDelta === 0
        ? 'No change'
        : rankDelta > 0
          ? `▲ ${rankDelta.toLocaleString('en-GB')} places`
          : `▼ ${Math.abs(rankDelta).toLocaleString('en-GB')} places`

  const posAudit = useMemo(
    () => buildPositionAudit(xi, allPlayers, squadIds),
    [xi, allPlayers, squadIds]
  )

  const crowd = useMemo(
    () => buildCrowdData(allPlayers, squadIds),
    [allPlayers, squadIds]
  )

  const headToHead = useMemo(() => {
    if (xi.length === 0 || allPlayers.length === 0) return []
    return buildHeadToHead(xi, allPlayers, squadIds, bankM)
  }, [xi, allPlayers, squadIds, bankM])

  const leads = useMemo(
    () => buildLeads(headToHead, chips, posAudit),
    [headToHead, chips, posAudit]
  )

  const seasonLabel = useMemo(() => {
    if (!bootstrapQuery.data?.events.length) return ''
    const firstYear = new Date(
      bootstrapQuery.data.events[0].deadline_time
    ).getFullYear()
    return `${firstYear}/${String(firstYear + 1).slice(-2)}`
  }, [bootstrapQuery.data])

  const deadlineMs = currentEvent
    ? new Date(currentEvent.deadline_time).getTime()
    : null
  const diffSecs = deadlineMs
    ? Math.max(0, Math.floor((deadlineMs - now) / 1000))
    : 0
  const d = Math.floor(diffSecs / 86400)
  const hh = Math.floor((diffSecs % 86400) / 3600)
  const mm = Math.floor((diffSecs % 3600) / 60)
  const ss = diffSecs % 60
  const countdown = `${d}d ${pad(hh)}:${pad(mm)}:${pad(ss)}`

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
            <Button
              onClick={backToConnect}
              className="h-auto rounded-lg px-3.5 py-2.25 text-[13px] font-semibold"
            >
              Try again
            </Button>
          }
        />
      </div>
    )
  }

  const anyError =
    bootstrapQuery.isError || entryHistoryQuery.isError || fixturesQuery.isError
  if (anyError) {
    return (
      <div className="fpl-scout min-h-screen" data-theme="dark">
        <StatusShell
          title="Couldn't load that team"
          body="This team ID is valid, but Scout couldn't load its history right now. The FPL API may be temporarily unavailable."
          action={
            <Button
              onClick={disconnect}
              className="h-auto rounded-lg px-3.5 py-2.25 text-[13px] font-semibold"
            >
              Try a different team
            </Button>
          }
        />
      </div>
    )
  }

  const allReady =
    bootstrapQuery.data &&
    entryQuery.data &&
    entryHistoryQuery.data &&
    fixturesQuery.data &&
    currentEvent
  if (!allReady) {
    return (
      <div className="fpl-scout min-h-screen" data-theme="dark">
        <StatusShell
          title="Fetching squad…"
          body="Pulling your team, gameweek picks and fixtures from the FPL API."
        />
      </div>
    )
  }

  // The FPL API only exposes a gameweek's picks once its deadline has passed,
  // so a team can be perfectly valid while its current-event picks 404.
  const picksAvailable = !!entryEventQuery.data
  const picksUnavailableNotice = (
    <div className="flex h-full items-center justify-center px-7.5">
      <div className="max-w-[46ch] text-center text-[13px] leading-relaxed text-(--fg3) italic">
        Picks for GW{currentEvent.id} aren&apos;t public yet — the FPL API
        only exposes a gameweek&apos;s squad once its deadline has passed.
        Check back after{' '}
        {new Date(currentEvent.deadline_time).toLocaleString('en-GB', {
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
        .
      </div>
    </div>
  )

  const glance = [
    {
      label: `GW${currentEvent.id} deadline`,
      value: `${d}d ${pad(hh)}h`,
      note: new Date(currentEvent.deadline_time).toLocaleString('en-GB', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      dir: 'flat' as const,
    },
    {
      label: 'Overall rank',
      value: overallRank ? overallRank.toLocaleString('en-GB') : '—',
      note: rankNote,
      dir: rankNote.startsWith('▲')
        ? ('up' as const)
        : rankNote.startsWith('▼')
          ? ('down' as const)
          : ('flat' as const),
    },
    {
      label: 'Squad value',
      value: `£${valueM.toFixed(1)}m`,
      note: `GW${currentEvent.id}`,
      dir: 'flat' as const,
    },
    {
      label: 'In the bank',
      value: `£${bankM.toFixed(1)}m`,
      note:
        eventTransfers === 0
          ? 'No transfers made'
          : `${eventTransfers} transfer${eventTransfers > 1 ? 's' : ''} made`,
      dir: 'flat' as const,
    },
  ]

  const sel = selectedId != null ? playersById.get(selectedId) : null
  const pageKey = PAGES[page].key

  return (
    <div className="fpl-scout min-h-screen" data-theme="dark">
      <div className="flex h-screen flex-col">
        <Masthead
          gw={currentEvent.id}
          season={seasonLabel}
          countdown={countdown}
          teamId={teamId}
          pages={PAGES}
          activePage={pageKey}
          onNavigate={(key) =>
            setPage(PAGES.findIndex((p) => p.key === key))
          }
          onDisconnect={disconnect}
        />

        <div className="min-h-0 flex-1 overflow-hidden">
          <div
            className="flex h-full"
            style={{
              width: '700%',
              transform: `translateX(-${page * (100 / 7)}%)`,
              transition: 'transform .42s cubic-bezier(.4,0,.2,1)',
            }}
          >
            <div style={{ width: '14.2857%', height: '100%' }}>
              {picksAvailable ? (
                <MatchdayScreen
                  glance={glance}
                  leads={leads}
                  alerts={alerts}
                  onNavigate={(key) =>
                    setPage(PAGES.findIndex((p) => p.key === key))
                  }
                  onDismissAlert={(id) => setDismissed((ds) => [...ds, id])}
                />
              ) : (
                picksUnavailableNotice
              )}
            </div>
            <div style={{ width: '14.2857%', height: '100%' }}>
              {picksAvailable ? (
                <TeamSheetScreen
                  xi={xi}
                  bench={bench}
                  captainId={captainId}
                  viceId={viceId}
                  posAudit={posAudit}
                  onOpenPlayer={setSelectedId}
                />
              ) : (
                picksUnavailableNotice
              )}
            </div>
            <div style={{ width: '14.2857%', height: '100%' }}>
              <FormBookScreen
                players={allPlayers}
                teams={teams}
                squadIds={squadIds}
                filters={filters}
                onFiltersChange={(patch) =>
                  setFilters((f) => ({ ...f, ...patch }))
                }
                onSort={(key) =>
                  setFilters((f) =>
                    f.sortKey === key
                      ? { ...f, sortDir: f.sortDir === 1 ? -1 : 1 }
                      : { ...f, sortKey: key, sortDir: -1 }
                  )
                }
                onOpenPlayer={setSelectedId}
              />
            </div>
            <div style={{ width: '14.2857%', height: '100%' }}>
              <FixturesScreen
                gws={fixturePlanner.gws}
                matrix={fixturePlanner.matrix}
                bestWindows={fixturePlanner.bestWindows}
                windowLen={effectiveWindowLen}
                windowMax={windowMax}
                windowLenLabel={windowLenLabel}
                onWindowLenChange={setWindowLen}
                horizon={horizon}
                horizonMax={horizonMax}
                horizonLabel={horizonLabel}
                onHorizonChange={setHorizon}
                windowNote={windowNote}
                cellW={cellW}
                squadTeams={squadTeams}
              />
            </div>
            <div style={{ width: '14.2857%', height: '100%' }}>
              <CrowdScreen crowd={crowd} onOpenPlayer={setSelectedId} />
            </div>
            <div style={{ width: '14.2857%', height: '100%' }}>
              <ChipsScreen chips={chips} />
            </div>
            <div style={{ width: '14.2857%', height: '100%' }}>
              {picksAvailable ? (
                <HeadToHeadScreen cases={headToHead} />
              ) : (
                picksUnavailableNotice
              )}
            </div>
          </div>
        </div>

        <PageFooter
          pageLabel={`${PAGES[page].roman} of VII`}
          canPrev={page > 0}
          canNext={page < PAGES.length - 1}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => Math.min(PAGES.length - 1, p + 1))}
        />
      </div>

      {sel ? (
        <Dossier player={sel} squad={squad} onClose={() => setSelectedId(null)} />
      ) : null}
    </div>
  )
}
