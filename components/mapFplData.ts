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
  PlayerStatus,
  Player,
  Position,
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

// ---- Transfer suggestions ----

export interface TransferStatRow {
  k: string
  v: string
  dir: Delta
}

export interface TransferCardView {
  name: string
  team: string
  pos: string
  price: string
  tag: string
  tagFg: string
  border: string
  bg: string
  cta: string
  ctaBg: string
  ctaBorder: string
  ctaFg: string
  stats: TransferStatRow[]
  next: FixtureCell[]
}

export interface TransferSectionView {
  outName: string
  bank: string
  rationale: string
  cards: TransferCardView[]
}

function xgiPer90(p: Player): number {
  return p.mins > 0 ? p.xgi / (p.mins / 90) : 0
}

function avgFdr(p: Player): number {
  return p.next.length ? p.next.reduce((s, f) => s + f.d, 0) / p.next.length : 0
}

export function buildTransferSuggestions(
  squadStarters: Player[],
  allPlayers: Player[],
  squadIds: Set<number>,
  bankM: number
): TransferSectionView[] {
  const ranked = [...squadStarters].sort(
    (a, b) => a.xgi / Math.max(a.price, 0.1) - b.xgi / Math.max(b.price, 0.1)
  )
  const worst = ranked.slice(0, 2)

  return worst.map((o) => {
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

    const base: TransferCardView = {
      name: o.name,
      team: o.team,
      pos: o.pos,
      price: o.price.toFixed(1),
      tag: 'Current',
      tagFg: 'var(--fg3)',
      border: 'var(--border)',
      bg: 'var(--card2)',
      cta: 'Keep',
      ctaBg: 'transparent',
      ctaBorder: 'var(--border)',
      ctaFg: 'var(--fg2)',
      stats: [
        { k: 'xGI / 90', v: xgiPer90(o).toFixed(2), dir: 'flat' },
        { k: 'xG', v: o.xg.toFixed(2), dir: 'flat' },
        { k: 'xA', v: o.xa.toFixed(2), dir: 'flat' },
        { k: 'Form', v: o.form.toFixed(1), dir: 'flat' },
        { k: 'Minutes', v: String(o.mins), dir: 'flat' },
        { k: 'Next 5 avg FDR', v: avgFdr(o).toFixed(1), dir: 'flat' },
      ],
      next: o.next,
    }

    const oFdr = avgFdr(o)
    const opts: TransferCardView[] = alternatives.map((p, idx) => {
      const dP = +(p.price - o.price).toFixed(1)
      const dX = +(p.xgi - o.xgi).toFixed(2)
      const fdr = avgFdr(p)
      const rec = idx === 0
      return {
        name: p.name,
        team: p.team,
        pos: p.pos,
        price: p.price.toFixed(1),
        tag: rec ? 'Recommended' : 'Alternative',
        tagFg: rec ? 'var(--accent)' : 'var(--fg3)',
        border: rec ? 'var(--accent)' : 'var(--border)',
        bg: 'var(--card)',
        cta: rec ? 'Make transfer' : 'Compare',
        ctaBg: rec ? 'var(--accent)' : 'transparent',
        ctaBorder: rec ? 'var(--accent)' : 'var(--border)',
        ctaFg: rec ? 'var(--accent-fg)' : 'var(--fg2)',
        stats: [
          {
            k: 'xGI / 90',
            v: xgiPer90(p).toFixed(2),
            dir: dX > 0 ? 'up' : 'down',
          },
          {
            k: 'Price delta',
            v: (dP > 0 ? '+' : '') + dP.toFixed(1) + 'm',
            dir: dP < 0 ? 'up' : 'flat',
          },
          {
            k: 'xGI delta',
            v: (dX > 0 ? '+' : '') + dX.toFixed(2),
            dir: dX > 0 ? 'up' : 'down',
          },
          {
            k: 'Form',
            v: p.form.toFixed(1),
            dir: p.form > o.form ? 'up' : 'down',
          },
          { k: 'Ownership', v: p.own.toFixed(1) + '%', dir: 'flat' },
          {
            k: 'Next 5 avg FDR',
            v: fdr.toFixed(1),
            dir: fdr < oFdr ? 'up' : 'down',
          },
        ],
        next: p.next,
      }
    })

    return {
      outName: o.name,
      bank: `£${bankM.toFixed(1)}m`,
      rationale: `Lowest xGI per £m among your starting XI at ${o.pos}.`,
      cards: [base, ...opts],
    }
  })
}
