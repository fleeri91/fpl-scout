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
  count = 6
): { gws: string[]; matrix: FixturePlannerRow[]; bestWindows: BestWindow[] } {
  const byTeamId = buildFixturesByTeamId(
    bootstrap,
    fixtures,
    fromEventId,
    count
  )
  const gws = Array.from({ length: count }, (_, i) => `GW${fromEventId + i}`)

  const windows = bootstrap.teams.map((team) => {
    const cells = byTeamId[team.id] ?? []
    let best = { i: 0, avg: 9 }
    for (let i = 0; i <= Math.max(0, cells.length - 3); i++) {
      const avg = (cells[i].d + cells[i + 1].d + cells[i + 2].d) / 3
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
        topFour.includes(w.team) && i >= w.start && i < w.start + 3
          ? '2px solid var(--accent)'
          : 'none',
    })),
  }))

  const bestWindows: BestWindow[] = topFour
    .map((t) => windows.find((w) => w.team === t)!)
    .map((w) => ({
      team: w.team,
      avg: w.avg.toFixed(1),
      range: `${gws[w.start] ?? gws[0]} – ${gws[Math.min(w.start + 2, gws.length - 1)]}`,
      note:
        'Three straight fixtures rated ' +
        w.cells
          .slice(w.start, w.start + 3)
          .map((c) => c.d)
          .join(', ') +
        '. Worth targeting assets here.',
    }))

  return { gws, matrix, bestWindows }
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
}

const CHIP_LABELS: Record<ChipName, string> = {
  wildcard: 'Wildcard',
  freehit: 'Free Hit',
  bboost: 'Bench Boost',
  '3xc': 'Triple Captain',
}

export function buildChipStatus(
  history: EntryHistory | undefined
): ChipCardView[] {
  const used = history?.chips ?? []
  return (Object.keys(CHIP_LABELS) as ChipName[]).map((key) => {
    const plays = used.filter((c) => c.name === key)
    const unused = plays.length === 0
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
