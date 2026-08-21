import type {
  Bootstrap,
  ChipName,
  ElementTypes,
  Element as FplRawElement,
  EntryHistory,
  Event as FplEvent,
  Fixture,
  Team,
} from 'fpl-api'
import type {
  Delta,
  FixtureCell,
  PageKey,
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

// ---- Alerts ----

export interface AlertItem {
  id: string
  kind: string
  tone: Delta
  title: string
  body: string
}

export function buildAlerts(squad: FplElement[]): AlertItem[] {
  const alerts: AlertItem[] = []
  for (const el of squad) {
    const moveN = el.cost_change_event / 10
    if (moveN > 0.05) {
      alerts.push({
        id: `price-up-${el.id}`,
        kind: 'Price rise',
        tone: 'up',
        title: `${el.web_name} +${moveN.toFixed(1)} today`,
        body: `Risen ${moveN.toFixed(1)}m today. Season change: ${(el.cost_change_start / 10).toFixed(1)}m.`,
      })
    } else if (moveN < -0.05) {
      alerts.push({
        id: `price-down-${el.id}`,
        kind: 'Price fall',
        tone: 'down',
        title: `${el.web_name} ${moveN.toFixed(1)} today`,
        body: `Fallen ${Math.abs(moveN).toFixed(1)}m today. Season change: ${(el.cost_change_start / 10).toFixed(1)}m.`,
      })
    }
    if (el.status !== 'a') {
      const label =
        el.status === 'd'
          ? 'Doubtful'
          : el.status === 'i'
            ? 'Injury'
            : el.status === 's'
              ? 'Suspended'
              : 'Unavailable'
      alerts.push({
        id: `status-${el.id}`,
        kind: label,
        tone: 'down',
        title: `${el.web_name}: ${label.toLowerCase()}`,
        body: el.news?.trim() || 'No further details from the club.',
      })
    }
  }
  return alerts
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

function confBucket(score: number): { conf: number; confLabel: string } {
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

// ---- Head to head ----

export interface HeadToHeadHead {
  name: string
  sub: string
  tag: string
  tagFg: string
}

export interface HeadToHeadCell {
  v: string
  fg: string
}

export interface HeadToHeadMeasureRow {
  k: string
  cells: HeadToHeadCell[]
}

export interface HeadToHeadVerdict {
  text: string
  fg: string
}

export interface HeadToHeadCase {
  outName: string
  bank: string
  ft: string
  rationale: string
  heads: HeadToHeadHead[]
  measures: HeadToHeadMeasureRow[]
  fixtureCells: { next: FixtureCell[] }[]
  verdicts: HeadToHeadVerdict[]
}

function h2hLine(
  k: string,
  candidates: Player[],
  f: (p: Player) => number,
  fmt: (n: number) => string,
  better?: (v: number, out: number) => boolean
): HeadToHeadMeasureRow {
  const out = f(candidates[0])
  return {
    k,
    cells: candidates.map((p, i) => {
      const v = f(p)
      return {
        v: fmt(v),
        fg:
          i === 0
            ? 'var(--fg2)'
            : better
              ? better(v, out)
                ? 'var(--pos)'
                : 'var(--neg)'
              : 'var(--fg)',
      }
    }),
  }
}

function mkHeadToHeadCase(
  outPlayer: Player,
  alternatives: Player[],
  bankM: number
): HeadToHeadCase {
  const set4 = [outPlayer, ...alternatives]

  const heads: HeadToHeadHead[] = set4.map((p, i) => ({
    name: p.name,
    sub: `${p.team} · ${p.pos} · £${p.price.toFixed(1)}m`,
    tag: i === 0 ? 'Under review' : i === 1 ? 'Recommended' : 'Alternative',
    tagFg: i === 1 ? 'var(--accent)' : 'var(--fg3)',
  }))

  const measures: HeadToHeadMeasureRow[] = [
    h2hLine('Expected points next round', set4, (p) => p.ep, (n) => n.toFixed(1), (v, o) => v > o),
    h2hLine('Expected involvement', set4, (p) => p.xgi, (n) => n.toFixed(2), (v, o) => v > o),
    h2hLine('Per ninety', set4, xgiPer90, (n) => n.toFixed(2), (v, o) => v > o),
    h2hLine('Points per game', set4, (p) => p.ppg, (n) => n.toFixed(1), (v, o) => v > o),
    h2hLine('Bonus points system', set4, (p) => p.bps, (n) => n.toFixed(0), (v, o) => v > o),
    h2hLine('Threat index', set4, (p) => p.ict[2], (n) => n.toFixed(0), (v, o) => v > o),
    h2hLine('Chance of playing', set4, (p) => p.chance, (n) => `${n.toFixed(0)}%`, (v, o) => v >= o),
    h2hLine('Price', set4, (p) => p.price, (n) => `£${n.toFixed(1)}m`, (v, o) => v <= o),
    h2hLine('Owned', set4, (p) => p.own, (n) => `${n.toFixed(1)}%`),
    h2hLine('Mean difficulty, next five', set4, avgFdr, (n) => n.toFixed(1), (v, o) => v < o),
  ]

  const fixtureCells = set4.map((p) => ({ next: p.next }))

  const verdicts: HeadToHeadVerdict[] = set4.map((p, i) => {
    if (i === 0) return { text: 'Sell', fg: 'var(--fg3)' }
    if (i === 1) {
      const dP = p.price - outPlayer.price
      const text =
        dP < -0.05
          ? `Frees up £${Math.abs(dP).toFixed(1)}m, and the stronger pick`
          : dP > 0.05
            ? `Costs £${dP.toFixed(1)}m more, but clearly stronger`
            : 'Same price, clearly stronger'
      return { text, fg: 'var(--accent)' }
    }
    const text =
      p.chance < 100
        ? 'Alternative, but a fitness doubt'
        : p.setPieces.length > 0
          ? 'Alternative, and on set pieces'
          : 'Alternative at a similar budget'
    return { text, fg: 'var(--fg3)' }
  })

  return {
    outName: outPlayer.name,
    bank: `£${bankM.toFixed(1)}m`,
    ft: 'one free transfer',
    rationale: `Lowest xGI per £m among your starting XI at ${outPlayer.pos}.`,
    heads,
    measures,
    fixtureCells,
    verdicts,
  }
}

export function buildHeadToHead(
  squadStarters: Player[],
  allPlayers: Player[],
  squadIds: Set<number>,
  bankM: number
): HeadToHeadCase[] {
  const ranked = [...squadStarters].sort(
    (a, b) => a.xgi / Math.max(a.price, 0.1) - b.xgi / Math.max(b.price, 0.1)
  )
  const worst = ranked.slice(0, 2)

  return worst
    .map((o) => {
      const budget = o.price + bankM
      const alternatives = allPlayers
        .filter(
          (p) =>
            p.pos === o.pos &&
            !squadIds.has(p.id) &&
            p.price <= budget &&
            p.status === 'ok'
        )
        .sort((a, b) => b.xgi - a.xgi)
        .slice(0, 3)
      return alternatives.length > 0
        ? mkHeadToHeadCase(o, alternatives, bankM)
        : null
    })
    .filter((c): c is HeadToHeadCase => c !== null)
}

// ---- Team sheet: position audit ----

export interface PositionAuditRow {
  pos: Position
  v: string
  fg: string
  note: string
  gapValue: number
}

// Starters only, benchmarked against the best affordable eleven at that
// spend — bench fodder and injuries would otherwise invent a deficit.
export function buildPositionAudit(
  xi: Player[],
  allPlayers: Player[],
  squadIds: Set<number>
): PositionAuditRow[] {
  const positions: Position[] = ['GKP', 'DEF', 'MID', 'FWD']

  return positions
    .map((pos): PositionAuditRow | null => {
      const mine = xi.filter((p) => p.pos === pos)
      if (mine.length === 0) return null

      const spend = mine.reduce((a, p) => a + p.price, 0)
      const epSum = mine.reduce((a, p) => a + p.ep, 0)
      const affordable = allPlayers
        .filter((p) => p.pos === pos && p.chance > 0)
        .sort((a, b) => b.ep - a.ep)

      const best: Player[] = []
      let budget = spend
      for (const p of affordable) {
        if (best.length >= mine.length) break
        const reserve = (mine.length - best.length - 1) * 4.0
        if (p.price <= budget - reserve) {
          best.push(p)
          budget -= p.price
        }
      }

      const gap = epSum - best.reduce((a, p) => a + p.ep, 0)
      const weakest = [...mine].sort((a, b) => a.ep - b.ep)[0]
      const upgrade = affordable.find(
        (p) =>
          !squadIds.has(p.id) &&
          p.price <= weakest.price + 0.6 &&
          p.ep > weakest.ep + 0.5
      )

      return {
        pos,
        v: `${gap >= -0.05 ? '' : '−'}${Math.abs(gap).toFixed(1)} EP`,
        fg: gap > -1 ? 'var(--pos)' : gap > -2.5 ? 'var(--warn)' : 'var(--neg)',
        note:
          gap > -1
            ? `As strong as the position allows for the £${spend.toFixed(1)}m spent.`
            : upgrade
              ? `${weakest.name} is the drag. ${upgrade.name} costs £${(upgrade.price - weakest.price).toFixed(1)}m more for ${(upgrade.ep - weakest.ep).toFixed(1)} expected points.`
              : `${weakest.name} is the drag, on ${weakest.ep.toFixed(1)} expected points, but nothing better is affordable.`,
        gapValue: gap,
      }
    })
    .filter((row): row is PositionAuditRow => row !== null)
}

// ---- Crowd ----

export interface CrowdPulseTile {
  k: string
  v: string
  sub: string
}

export interface CrowdRow {
  id: number
  n: string
  name: string
  v: string
  owned: string
  ownedFg: string
}

export interface CrowdList {
  title: string
  blurb: string
  items: CrowdRow[]
}

export interface CrowdDifferential {
  id: number
  name: string
  team: string
  own: string
  xgi: string
}

export interface CrowdMissing {
  id: number
  name: string
  team: string
  price: string
  own: string
}

export interface CrowdView {
  pulse: CrowdPulseTile[]
  lists: CrowdList[]
  differentials: CrowdDifferential[]
  missing: CrowdMissing[]
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function buildCrowdData(
  allPlayers: Player[],
  squadIds: Set<number>
): CrowdView {
  const held = (id: number) => squadIds.has(id)
  const crowdRow = (p: Player, i: number, v: string): CrowdRow => ({
    id: p.id,
    n: pad2(i + 1),
    name: p.name,
    v,
    owned: held(p.id) ? 'in your side' : 'not owned',
    ownedFg: held(p.id) ? 'var(--pos)' : 'var(--fg3)',
  })

  const byIn = [...allPlayers].sort(
    (a, b) => b.transfersInEvent - a.transfersInEvent
  )
  const byOut = [...allPlayers].sort(
    (a, b) => b.transfersOutEvent - a.transfersOutEvent
  )
  const byOwn = [...allPlayers].sort((a, b) => b.own - a.own)

  const mostOwned = byOwn[0]
  const biggestRiser = byIn[0]

  const pulse: CrowdPulseTile[] = [
    mostOwned
      ? {
          k: 'Most owned',
          v: mostOwned.name,
          sub: `${mostOwned.own.toFixed(1)}% of managers`,
        }
      : { k: 'Most owned', v: '—', sub: '' },
    biggestRiser
      ? {
          k: 'Biggest riser',
          v: biggestRiser.name,
          sub: `+${Math.round(biggestRiser.transfersInEvent / 1000)}k transfers in this week`,
        }
      : { k: 'Biggest riser', v: '—', sub: '' },
  ]

  const lists: CrowdList[] = [
    {
      title: 'Most bought this week',
      blurb:
        "Where the field is moving before the deadline, from the current gameweek's transfer counts.",
      items: byIn
        .slice(0, 6)
        .map((p, i) =>
          crowdRow(p, i, `+${Math.round(p.transfersInEvent / 1000)}k`)
        ),
    },
    {
      title: 'Most sold this week',
      blurb:
        'The exodus. Selling with the crowd is safe; selling before it is where rank is made.',
      items: byOut
        .slice(0, 6)
        .map((p, i) =>
          crowdRow(p, i, `−${Math.round(p.transfersOutEvent / 1000)}k`)
        ),
    },
  ]

  const differentials: CrowdDifferential[] = allPlayers
    .filter((p) => squadIds.has(p.id) && p.own < 15)
    .sort((a, b) => b.xgi - a.xgi)
    .map((p) => ({
      id: p.id,
      name: p.name,
      team: p.team,
      own: p.own.toFixed(1),
      xgi: p.xgi.toFixed(2),
    }))

  const missing: CrowdMissing[] = byOwn
    .filter((p) => !squadIds.has(p.id) && p.own > 10)
    .map((p) => ({
      id: p.id,
      name: p.name,
      team: p.team,
      price: p.price.toFixed(1),
      own: p.own.toFixed(1),
    }))

  return { pulse, lists, differentials, missing }
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

// ---- Matchday leads ----

export interface LeadFigure {
  k: string
  v: string
  fg: string
}

export interface LeadCard {
  headline: string
  standfirst: string
  body: string
  figures: LeadFigure[]
  cta: string
  ctaPage: PageKey
  size: string
  standSize: string
  ruleW: string
}

export function buildLeads(
  headToHead: HeadToHeadCase[],
  chips: ChipCardView[],
  posAudit: PositionAuditRow[]
): LeadCard[] {
  const leads: LeadCard[] = []

  const bestCase = headToHead[0]
  const inHead = bestCase?.heads[1]
  if (bestCase && inHead) {
    const priceRow = bestCase.measures.find((m) => m.k === 'Price')
    const xgiRow = bestCase.measures.find(
      (m) => m.k === 'Expected involvement'
    )
    const fdrRow = bestCase.measures.find(
      (m) => m.k === 'Mean difficulty, next five'
    )
    leads.push({
      headline: `${bestCase.outName} out, ${inHead.name} in.`,
      standfirst: bestCase.rationale,
      body: `${inHead.name} outweighs ${bestCase.outName} on expected involvement and the run of fixtures, for ${bestCase.bank} in the bank and ${bestCase.ft}.`,
      figures: [
        priceRow && {
          k: 'Price',
          v: priceRow.cells[1].v,
          fg: priceRow.cells[1].fg,
        },
        xgiRow && {
          k: 'xGI',
          v: xgiRow.cells[1].v,
          fg: xgiRow.cells[1].fg,
        },
        fdrRow && {
          k: 'Next five FDR',
          v: fdrRow.cells[1].v,
          fg: fdrRow.cells[1].fg,
        },
        { k: 'Cost', v: bestCase.ft, fg: 'var(--fg)' },
      ].filter((f): f is LeadFigure => !!f),
      cta: 'See the full comparison',
      ctaPage: 'head-to-head',
      size: '44px',
      standSize: '16px',
      ruleW: '120px',
    })
  }

  const bestChip = [...chips]
    .filter((c) => c.status === 'Unused')
    .sort((a, b) => b.conf - a.conf)[0]
  if (bestChip) {
    leads.push({
      headline: `${bestChip.name}: ${bestChip.window}.`,
      standfirst: bestChip.reasons[0] ?? '',
      body: bestChip.reasons.slice(1).join(' '),
      figures: [
        {
          k: 'Confidence',
          v: `${bestChip.confLabel} · ${bestChip.conf}%`,
          fg: 'var(--accent)',
        },
      ],
      cta: 'Read the chip column',
      ctaPage: 'chips',
      size: '32px',
      standSize: '15px',
      ruleW: '80px',
    })
  }

  const weakest = [...posAudit].sort((a, b) => a.gapValue - b.gapValue)[0]
  if (weakest && weakest.gapValue < -1) {
    leads.push({
      headline: `${weakest.pos} is where the squad leaks expected points.`,
      standfirst: weakest.note,
      body: `The position sits ${weakest.v} behind the best affordable eleven at that spend.`,
      figures: [{ k: weakest.pos, v: weakest.v, fg: weakest.fg }],
      cta: 'Open the team sheet',
      ctaPage: 'team-sheet',
      size: '32px',
      standSize: '15px',
      ruleW: '80px',
    })
  }

  return leads
}
