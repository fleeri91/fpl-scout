import type {
  Bootstrap,
  ChipName,
  ElementTypes,
  Element as FplRawElement,
  EntryEventHistory,
  EntryHistory,
  Event as FplEvent,
  Fixture,
  Team,
} from 'fpl-api'
import type {
  FixtureCell,
  PlayerStatus,
  Player,
  Position,
  SetPieceMark,
} from './types'

// `getTeamShortName`/`getElementTypeLabel` are called per-fixture and
// per-element (hundreds to thousands of times per bootstrap payload).
// Index the lookup tables once per `bootstrap` reference instead of doing
// a linear .find() on every call.
const teamIndexCache = new WeakMap<Bootstrap, Map<number, Team>>()
const elementTypeIndexCache = new WeakMap<
  Bootstrap,
  Map<number, ElementTypes>
>()

function teamsById(bootstrap: Bootstrap): Map<number, Team> {
  let index = teamIndexCache.get(bootstrap)
  if (!index) {
    index = new Map(bootstrap.teams.map((t) => [t.id, t]))
    teamIndexCache.set(bootstrap, index)
  }
  return index
}

function elementTypesById(bootstrap: Bootstrap): Map<number, ElementTypes> {
  let index = elementTypeIndexCache.get(bootstrap)
  if (!index) {
    index = new Map(bootstrap.element_types.map((t) => [t.id, t]))
    elementTypeIndexCache.set(bootstrap, index)
  }
  return index
}

// fpl-api's typed Element doesn't declare these, but the live API returns
// them (as numeric strings, same convention as form/creativity/etc).
export type FplElement = FplRawElement & {
  expected_goals?: string
  expected_assists?: string
  expected_goal_involvements?: string
}

function num(v: unknown): number {
  if (typeof v === 'number') return v
  const n = parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}

function statusToPlayerStatus(status: FplElement['status']): PlayerStatus {
  if (status === 'a') return 'ok'
  if (status === 'd') return 'risk'
  return 'out'
}

export function getElementTypeLabel(
  bootstrap: Bootstrap,
  elementTypeId: number
): Position {
  const et = elementTypesById(bootstrap).get(elementTypeId)
  return (et?.singular_name_short as Position) ?? 'MID'
}

export function getTeamShortName(bootstrap: Bootstrap, teamId: number): string {
  return teamsById(bootstrap).get(teamId)?.short_name ?? '???'
}

export function getCurrentEvent(bootstrap: Bootstrap): FplEvent | undefined {
  return (
    bootstrap.events.find((e) => e.is_current) ??
    bootstrap.events.find((e) => e.is_next) ??
    bootstrap.events[bootstrap.events.length - 1]
  )
}

// FPL banks unused free transfers up to this cap (the 2024/25+ rule — this
// doesn't reconstruct older seasons' lower cap).
const FREE_TRANSFER_CAP = 5

// Free transfers aren't exposed directly by the API — reconstruct the bank
// by walking event history from GW2 (GW1 is unlimited, so it doesn't
// consume or grant a banked transfer). Taking a hit (more transfers than
// were banked) resets the bank to 1 for the following gameweek.
export function computeFreeTransfers(
  history: EntryEventHistory[],
  uptoEventId: number
): number {
  const byEvent = new Map(history.map((h) => [h.event, h]))
  let ft = 1
  for (let event = 2; event <= uptoEventId; event++) {
    const h = byEvent.get(event)
    if (!h) continue
    ft =
      h.event_transfers > ft
        ? 1
        : Math.min(FREE_TRANSFER_CAP, ft - h.event_transfers + 1)
  }
  return ft
}

export function buildFixturesByTeamId(
  bootstrap: Bootstrap,
  fixtures: Fixture[],
  fromEventId: number,
  count = 6
): Record<number, FixtureCell[]> {
  const byTeamId: Record<number, FixtureCell[]> = {}
  for (const team of bootstrap.teams) byTeamId[team.id] = []

  const upcoming = fixtures
    .filter((f) => f.event != null && f.event >= fromEventId)
    .sort((a, b) => a.event - b.event)

  for (const f of upcoming) {
    const homeOpp = getTeamShortName(bootstrap, f.team_a)
    const awayOpp = getTeamShortName(bootstrap, f.team_h).toLowerCase()
    if (byTeamId[f.team_h] && byTeamId[f.team_h].length < count) {
      byTeamId[f.team_h].push({
        opp: homeOpp,
        label: homeOpp,
        d: f.team_h_difficulty,
      })
    }
    if (byTeamId[f.team_a] && byTeamId[f.team_a].length < count) {
      byTeamId[f.team_a].push({
        opp: awayOpp,
        label: awayOpp,
        d: f.team_a_difficulty,
      })
    }
  }
  return byTeamId
}

function defaultNote(element: FplElement): string {
  return `${num(element.points_per_game).toFixed(1)} pts/game · ${element.minutes} mins this season.`
}

function buildSetPieces(element: FplElement): SetPieceMark[] {
  const marks: SetPieceMark[] = []
  if (element.penalties_order === 1) {
    marks.push({ mark: 'P', title: 'First-choice penalty taker' })
  } else if (element.penalties_order === 2) {
    marks.push({ mark: 'P', title: 'Second-choice penalty taker' })
  }
  if (element.corners_and_indirect_freekicks_order === 1) {
    marks.push({ mark: 'C', title: 'Takes corners and indirect free kicks' })
  } else if (element.corners_and_indirect_freekicks_order === 2) {
    marks.push({ mark: 'C', title: 'Second-choice for corners' })
  }
  return marks
}

export function mapElementToPlayer(
  element: FplElement,
  bootstrap: Bootstrap,
  fixturesByTeamId: Record<number, FixtureCell[]>,
  histPoints: number[] = []
): Player {
  const moveN = element.cost_change_event / 10
  return {
    id: element.id,
    name: element.web_name,
    team: getTeamShortName(bootstrap, element.team),
    pos: getElementTypeLabel(bootstrap, element.element_type),
    price: element.now_cost / 10,
    own: num(element.selected_by_percent),
    form: num(element.form),
    xg: num(element.expected_goals),
    xa: num(element.expected_assists),
    xgi: num(element.expected_goal_involvements),
    mins: element.minutes,
    status: statusToPlayerStatus(element.status),
    note: element.news?.trim() || defaultNote(element),
    hist: histPoints,
    priceMove: (moveN > 0 ? '+' : '') + moveN.toFixed(1),
    priceDir: moveN > 0.05 ? 'up' : moveN < -0.05 ? 'down' : ('flat' as const),
    next: fixturesByTeamId[element.team]?.slice(0, 5) ?? [],
    next3: fixturesByTeamId[element.team]?.slice(0, 3) ?? [],
    ep: num(element.ep_next),
    ppg: num(element.points_per_game),
    bonus: element.bonus,
    bps: element.bps,
    ict: [num(element.influence), num(element.creativity), num(element.threat)],
    chance:
      element.chance_of_playing_next_round == null
        ? 100
        : element.chance_of_playing_next_round,
    setPieces: buildSetPieces(element),
    transfersInEvent: element.transfers_in_event,
    transfersOutEvent: element.transfers_out_event,
  }
}

// ---- Fixture Planner ----

export interface FixturePlannerRow {
  team: string
  avg: string
  cells: (FixtureCell & { ring: string })[]
}

export interface BestWindow {
  team: string
  avg: string
  range: string
  note: string
}

export function computeFixturePlanner(
  bootstrap: Bootstrap,
  fixtures: Fixture[],
  fromEventId: number,
  horizon = 6,
  windowLen = 3
): {
  gws: string[]
  matrix: FixturePlannerRow[]
  bestWindows: BestWindow[]
  windowLen: number
} {
  const H = horizon
  const W = Math.max(2, Math.min(windowLen, H))
  const byTeamId = buildFixturesByTeamId(bootstrap, fixtures, fromEventId, H)
  const gws = Array.from({ length: H }, (_, i) => `GW${fromEventId + i}`)

  const windows = bootstrap.teams.map((team) => {
    const cells = byTeamId[team.id] ?? []
    let best = { i: 0, avg: 9 }
    for (let i = 0; i <= Math.max(0, cells.length - W); i++) {
      const avg = cells.slice(i, i + W).reduce((s, c) => s + c.d, 0) / W
      if (avg < best.avg) best = { i, avg }
    }
    const overall = cells.length
      ? cells.reduce((s, c) => s + c.d, 0) / cells.length
      : 0
    return {
      team: team.short_name,
      start: best.i,
      avg: best.avg,
      cells,
      overall,
    }
  })

  const topFour = [...windows]
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 4)
    .map((w) => w.team)

  const matrix: FixturePlannerRow[] = windows.map((w) => ({
    team: w.team,
    avg: w.overall.toFixed(1),
    cells: w.cells.map((c, i) => ({
      ...c,
      ring:
        topFour.includes(w.team) && i >= w.start && i < w.start + W
          ? '2px solid var(--accent)'
          : 'none',
    })),
  }))

  const bestWindows: BestWindow[] = topFour
    .map((t) => windows.find((w) => w.team === t)!)
    .map((w) => ({
      team: w.team,
      avg: w.avg.toFixed(1),
      range: `${gws[w.start] ?? gws[0]} – ${gws[Math.min(w.start + W - 1, gws.length - 1)]}`,
      note:
        `${W} straight fixtures rated ` +
        w.cells
          .slice(w.start, w.start + W)
          .map((c) => c.d)
          .join(', ') +
        '. Worth targeting assets here.',
    }))

  return { gws, matrix, bestWindows, windowLen: W }
}

// ---- Chip strategy ----

export interface ChipCardView {
  name: string
  availability: string
  status: string
  badgeBg: string
  badgeBorder: string
  badgeFg: string
  window: string
  reasons: string[]
  conf: number
  confLabel: string
}

const CHIP_LABELS: Record<ChipName, string> = {
  wildcard: 'Wildcard',
  freehit: 'Free Hit',
  bboost: 'Bench Boost',
  '3xc': 'Triple Captain',
}

const CHIP_HORIZON = 8

interface EventImpact {
  event: number
  badCount: number
  blankCount: number
  doubleCount: number
  totalDifficulty: number
  fixtureSlots: number
}

function computeSquadEventImpact(
  fixtures: Fixture[],
  squadTeamIds: number[],
  fromEventId: number,
  horizon: number
): EventImpact[] {
  const events = Array.from({ length: horizon }, (_, i) => fromEventId + i)
  return events.map((event) => {
    let badCount = 0
    let blankCount = 0
    let doubleCount = 0
    let totalDifficulty = 0
    let fixtureSlots = 0
    for (const teamId of squadTeamIds) {
      const teamFixtures = fixtures.filter(
        (f) => f.event === event && (f.team_h === teamId || f.team_a === teamId)
      )
      if (teamFixtures.length === 0) blankCount++
      if (teamFixtures.length >= 2) doubleCount++
      for (const f of teamFixtures) {
        const d = f.team_h === teamId ? f.team_h_difficulty : f.team_a_difficulty
        if (d >= 4) badCount++
        totalDifficulty += d
        fixtureSlots++
      }
    }
    return { event, badCount, blankCount, doubleCount, totalDifficulty, fixtureSlots }
  })
}

export function confBucket(score: number): { conf: number; confLabel: string } {
  if (score >= 70) return { conf: score, confLabel: 'High' }
  if (score >= 45) return { conf: score, confLabel: 'Medium' }
  return { conf: score, confLabel: 'Low' }
}

function recommendWildcard(
  impacts: EventImpact[],
  fromEventId: number,
  horizon: number
): { window: string; reasons: string[]; conf: number; confLabel: string } {
  const totalSlots = impacts.reduce((s, i) => s + i.fixtureSlots, 0)
  const totalDiff = impacts.reduce((s, i) => s + i.totalDifficulty, 0)
  const baselineAvg = totalSlots ? totalDiff / totalSlots : 3

  const W = 3
  let best = { start: 0, avgD: 0, badSum: 0 }
  for (let i = 0; i <= impacts.length - W; i++) {
    const slice = impacts.slice(i, i + W)
    const slots = slice.reduce((s, x) => s + x.fixtureSlots, 0)
    const diff = slice.reduce((s, x) => s + x.totalDifficulty, 0)
    const badSum = slice.reduce((s, x) => s + x.badCount, 0)
    const avgD = slots ? diff / slots : 0
    if (avgD > best.avgD) best = { start: i, avgD, badSum }
  }

  const startEvent = impacts[best.start]?.event ?? fromEventId
  const endEvent =
    impacts[Math.min(best.start + W - 1, impacts.length - 1)]?.event ??
    fromEventId
  const delta = best.avgD - baselineAvg
  const score = Math.round(Math.max(30, Math.min(88, 45 + delta * 60)))

  return {
    window: `GW${startEvent} – GW${endEvent}`,
    reasons: [
      `${best.badSum} squad fixture${best.badSum === 1 ? '' : 's'} rated 4 or 5 across GW${startEvent}–GW${endEvent}.`,
      `Squad average difficulty in that window is ${best.avgD.toFixed(1)}, versus ${baselineAvg.toFixed(1)} across the full GW${fromEventId}–GW${fromEventId + horizon - 1} outlook.`,
    ],
    ...confBucket(score),
  }
}

function recommendFreeHit(
  impacts: EventImpact[],
  fromEventId: number,
  horizon: number,
  squadSize: number
): { window: string; reasons: string[]; conf: number; confLabel: string } {
  const peak = impacts.reduce(
    (b, x) => (x.blankCount > b.blankCount ? x : b),
    impacts[0]
  )
  if (peak && peak.blankCount >= 3) {
    const score = Math.round(Math.max(35, Math.min(85, peak.blankCount * 12)))
    return {
      window: `GW${peak.event} (blank)`,
      reasons: [
        `${peak.blankCount} of your ${squadSize} squad players have no fixture in GW${peak.event}.`,
        `That leaves only ${squadSize - peak.blankCount} starters with a game that week.`,
      ],
      ...confBucket(score),
    }
  }
  return {
    window: `No blank in GW${fromEventId}–GW${fromEventId + horizon - 1}`,
    reasons: [
      `Fixture list is clean through GW${fromEventId + horizon - 1} — hold until a blank gameweek is confirmed.`,
    ],
    ...confBucket(20),
  }
}

function recommendBenchBoost(
  impacts: EventImpact[],
  fromEventId: number,
  horizon: number,
  squadSize: number
): { window: string; reasons: string[]; conf: number; confLabel: string } {
  const peak = impacts.reduce(
    (b, x) => (x.doubleCount > b.doubleCount ? x : b),
    impacts[0]
  )
  if (peak && peak.doubleCount >= 2) {
    const score = Math.round(Math.max(35, Math.min(85, peak.doubleCount * 15)))
    return {
      window: `GW${peak.event} (double)`,
      reasons: [
        `${peak.doubleCount} of your ${squadSize} squad players play twice in GW${peak.event}.`,
        `Doubling those minutes is worth more from the bench when the whole squad plays.`,
      ],
      ...confBucket(score),
    }
  }
  return {
    window: `No double in GW${fromEventId}–GW${fromEventId + horizon - 1}`,
    reasons: [
      `No confirmed double gameweek for your squad through GW${fromEventId + horizon - 1} — hold for now.`,
    ],
    ...confBucket(20),
  }
}

function recommendTripleCaptain(
  fixtures: Fixture[],
  squadElements: FplElement[],
  fromEventId: number,
  horizon: number
): { window: string; reasons: string[]; conf: number; confLabel: string } {
  const topPlayer = [...squadElements].sort(
    (a, b) => num(b.expected_goal_involvements) - num(a.expected_goal_involvements)
  )[0]

  if (!topPlayer) {
    return {
      window: `GW${fromEventId}–GW${fromEventId + horizon - 1}`,
      reasons: ['Not enough squad data yet to pick a captain target.'],
      ...confBucket(20),
    }
  }

  let best: { event: number; avgD: number; isDouble: boolean } | null = null
  for (let i = 0; i < horizon; i++) {
    const event = fromEventId + i
    const teamFixtures = fixtures.filter(
      (f) =>
        f.event === event &&
        (f.team_h === topPlayer.team || f.team_a === topPlayer.team)
    )
    if (!teamFixtures.length) continue
    const avgD =
      teamFixtures.reduce(
        (s, f) =>
          s + (f.team_h === topPlayer.team ? f.team_h_difficulty : f.team_a_difficulty),
        0
      ) / teamFixtures.length
    const isDouble = teamFixtures.length >= 2
    const score = (isDouble ? -10 : 0) + avgD
    if (!best || score < (best.isDouble ? -10 : 0) + best.avgD) {
      best = { event, avgD, isDouble }
    }
  }

  if (!best) {
    return {
      window: `GW${fromEventId}–GW${fromEventId + horizon - 1}`,
      reasons: [`${topPlayer.web_name} has no confirmed fixture in this window yet.`],
      ...confBucket(20),
    }
  }

  const score = best.isDouble
    ? 80
    : best.avgD <= 2
      ? 65
      : best.avgD <= 3
        ? 45
        : 30

  return {
    window: `GW${best.event}${best.isDouble ? ' (double)' : ''}`,
    reasons: [
      `${topPlayer.web_name} has ${best.isDouble ? 'a double gameweek' : `a difficulty-${Math.round(best.avgD)} fixture`} in GW${best.event}.`,
      `Leads your squad in expected goal involvement this season (${num(topPlayer.expected_goal_involvements).toFixed(1)}).`,
    ],
    ...confBucket(score),
  }
}

export function buildChipStatus(
  history: EntryHistory | undefined,
  squadElements: FplElement[],
  fixtures: Fixture[] | undefined,
  fromEventId: number | undefined
): ChipCardView[] {
  const used = history?.chips ?? []
  const squadTeamIds = squadElements.map((el) => el.team)
  const squadSize = squadElements.length
  const horizon = CHIP_HORIZON

  const impacts =
    fixtures && fromEventId
      ? computeSquadEventImpact(fixtures, squadTeamIds, fromEventId, horizon)
      : []

  return (Object.keys(CHIP_LABELS) as ChipName[]).map((key) => {
    const plays = used.filter((c) => c.name === key)
    const maxUses = key === 'wildcard' ? 2 : 1
    const unused = plays.length === 0
    const fullyUsed = plays.length >= maxUses

    let rec: { window: string; reasons: string[]; conf: number; confLabel: string }
    if (fullyUsed) {
      rec = {
        window: 'Already used this season',
        reasons: [],
        conf: 0,
        confLabel: '—',
      }
    } else if (!fixtures || !fromEventId || squadSize === 0) {
      rec = {
        window: 'Connect a squad to see a recommendation',
        reasons: [],
        conf: 0,
        confLabel: '—',
      }
    } else if (key === 'wildcard') {
      rec = recommendWildcard(impacts, fromEventId, horizon)
    } else if (key === 'freehit') {
      rec = recommendFreeHit(impacts, fromEventId, horizon, squadSize)
    } else if (key === 'bboost') {
      rec = recommendBenchBoost(impacts, fromEventId, horizon, squadSize)
    } else {
      rec = recommendTripleCaptain(fixtures, squadElements, fromEventId, horizon)
    }

    return {
      name: CHIP_LABELS[key],
      availability:
        key === 'wildcard' ? 'Up to two per season' : 'One per season',
      status: unused
        ? 'Unused'
        : plays.map((p) => `Used GW${p.event}`).join(', '),
      badgeBg: unused ? 'var(--muted)' : 'transparent',
      badgeBorder: 'var(--border)',
      badgeFg: unused ? 'var(--fg2)' : 'var(--fg3)',
      ...rec,
    }
  })
}

function xgiPer90(p: Player): number {
  return p.mins > 0 ? p.xgi / (p.mins / 90) : 0
}

function avgFdr(p: Player): number {
  return p.next.length ? p.next.reduce((s, f) => s + f.d, 0) / p.next.length : 0
}

function surname(name: string): string {
  const parts = name.trim().split(' ')
  return parts[parts.length - 1]
}

// ---- Team sheet: totals ----

export interface TeamTotalRow {
  k: string
  v: string
  fg: string
}

export function buildTeamTotals(
  xi: Player[],
  squad: Player[],
  bankM: number,
  valueM: number
): TeamTotalRow[] {
  const xiEp = xi.reduce((a, p) => a + p.ep, 0)
  const flagged = squad.filter((p) => p.status !== 'ok').length
  return [
    { k: 'Squad value', v: `£${valueM.toFixed(1)}m`, fg: 'var(--fg)' },
    { k: 'In the bank', v: `£${bankM.toFixed(1)}m`, fg: 'var(--fg)' },
    { k: 'XI expected points', v: xiEp.toFixed(1), fg: 'var(--accent)' },
    { k: 'Flagged', v: String(flagged), fg: 'var(--warn)' },
  ]
}

// ---- Transfers ----

export interface ForcedDecision {
  id: number
  name: string
  chance: string
  note: string
  where: string
  dot: string
}

// A flagged squad player forces a decision whether or not a good
// replacement exists — surfaced separately from the transfer calls below.
export function buildForcedDecisions(
  xi: Player[],
  bench: Player[]
): ForcedDecision[] {
  const dot = (p: Player) => (p.status === 'risk' ? 'var(--warn)' : 'var(--neg)')
  return [
    ...xi
      .filter((p) => p.status !== 'ok')
      .map((p) => ({
        id: p.id,
        name: p.name,
        chance: `${p.chance}%`,
        note: p.note,
        where: 'Starting XI',
        dot: dot(p),
      })),
    ...bench
      .filter((p) => p.status !== 'ok')
      .map((p, i) => ({
        id: p.id,
        name: p.name,
        chance: `${p.chance}%`,
        note: p.note,
        where: `Bench ${i + 1}`,
        dot: dot(p),
      })),
  ]
}

// ---- Dossier ----

export interface DossierRivalOption {
  id: number
  label: string
  selected: boolean
}

export interface DossierVersusRow {
  k: string
  a: string
  b: string
  delta: string
  fg: string
}

export interface DossierTableRow {
  k: string
  v: string
  fg: string
}

export interface DossierView {
  name: string
  shortName: string
  rivalShort: string
  meta: string
  newsLine: string
  statusFg: string
  summary: string
  rivalOptions: DossierRivalOption[]
  versus: DossierVersusRow[]
  versusVerdict: string
  table: DossierTableRow[]
  next: FixtureCell[]
}

const STATUS_FG: Record<PlayerStatus, string> = {
  ok: 'var(--fg3)',
  risk: 'var(--warn)',
  out: 'var(--neg)',
}

export function buildDossier(
  player: Player,
  rivalId: number | null,
  squad: Player[]
): DossierView | null {
  const pool = squad.filter((p) => p.id !== player.id)
  const samePos = pool.filter((p) => p.pos === player.pos)
  const candidates = samePos.length ? samePos : pool
  if (candidates.length === 0) return null

  const rival =
    (rivalId != null && candidates.find((p) => p.id === rivalId)) ||
    [...candidates].sort((a, b) => a.ep - b.ep)[0]

  const rivalOptions: DossierRivalOption[] = candidates.map((p) => ({
    id: p.id,
    label: `${p.name} · ${p.pos} · £${p.price.toFixed(1)}m`,
    selected: p.id === rival.id,
  }))

  const cmp = (
    k: string,
    f: (p: Player) => number,
    dp: number,
    lowerBetter = false
  ): DossierVersusRow => {
    const a = f(player)
    const b = f(rival)
    const diff = a - b
    const good = lowerBetter ? diff < 0 : diff > 0
    return {
      k,
      a: a.toFixed(dp),
      b: b.toFixed(dp),
      delta:
        (diff > 0 ? '+' : diff < 0 ? '−' : '') + Math.abs(diff).toFixed(dp),
      fg:
        Math.abs(diff) < 0.005
          ? 'var(--fg3)'
          : good
            ? 'var(--pos)'
            : 'var(--neg)',
    }
  }

  const versus: DossierVersusRow[] = [
    cmp('Expected points', (p) => p.ep, 1),
    cmp('Expected involvement', (p) => p.xgi, 2),
    cmp('Per ninety', xgiPer90, 2),
    cmp('Points per game', (p) => p.ppg, 1),
    cmp('Price', (p) => p.price, 1, true),
    cmp('Value per million', (p) => (p.price > 0 ? p.ppg / p.price : 0), 2),
    cmp('Mean difficulty, next five', avgFdr, 1, true),
    cmp('Chance of playing', (p) => p.chance, 0),
  ]

  const wins = versus.filter((v) => v.fg === 'var(--pos)').length
  const rivalSurname = surname(rival.name)
  const versusVerdict =
    wins >= 6
      ? `Clearly ahead of ${rivalSurname} on ${wins} of eight measures. A straight upgrade if the money is there.`
      : wins >= 4
        ? `Ahead on ${wins} of eight. Better, but not by enough to spend a transfer on alone.`
        : `Behind ${rivalSurname} on most measures. No case for the switch this week.`

  const table: DossierTableRow[] = [
    { k: 'Expected goals', v: player.xg.toFixed(2), fg: 'var(--fg)' },
    { k: 'Expected assists', v: player.xa.toFixed(2), fg: 'var(--fg)' },
    { k: 'Minutes', v: String(player.mins), fg: 'var(--fg)' },
    { k: 'Bonus · BPS', v: `${player.bonus} · ${player.bps}`, fg: 'var(--fg)' },
    {
      k: 'Influence, creativity, threat',
      v: player.ict.map((n) => n.toFixed(0)).join(' · '),
      fg: 'var(--fg)',
    },
    {
      k: 'Transfers in, out this week',
      v: `${Math.round(player.transfersInEvent / 1000)}k · ${Math.round(player.transfersOutEvent / 1000)}k`,
      fg: 'var(--fg)',
    },
    {
      k: 'Price movement this week',
      v: `${player.priceMove}m`,
      fg:
        player.priceDir === 'up'
          ? 'var(--pos)'
          : player.priceDir === 'down'
            ? 'var(--neg)'
            : 'var(--fg3)',
    },
  ]

  return {
    name: player.name,
    shortName: surname(player.name),
    rivalShort: rivalSurname,
    meta: `${player.team} · ${player.pos} · £${player.price.toFixed(1)}m · ${player.own.toFixed(1)}% owned`,
    newsLine: player.status === 'ok' ? 'No availability concerns' : player.note,
    statusFg: STATUS_FG[player.status],
    summary: `${player.ppg.toFixed(1)} points per game this season, from ${player.mins} minutes played.`,
    rivalOptions,
    versus,
    versusVerdict,
    table,
    next: player.next,
  }
}

