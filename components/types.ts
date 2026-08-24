export type PlayerStatus = 'ok' | 'risk' | 'out'
export type Position = 'GKP' | 'DEF' | 'MID' | 'FWD'
export type Delta = 'up' | 'down' | 'flat'

export type PageKey = 'team-sheet' | 'form-book' | 'fixtures' | 'chips'

export interface PageConfig {
  key: PageKey
  title: string
}

// Transfers is no longer its own tab — its verdict cards render as a
// permanent panel below whichever of these is active (v3 redesign).
export const PAGES: PageConfig[] = [
  { key: 'team-sheet', title: 'Team sheet' },
  { key: 'form-book', title: 'Form book' },
  { key: 'fixtures', title: 'Fixtures' },
  { key: 'chips', title: 'Chips' },
]

export interface FixtureCell {
  opp: string
  label: string
  d: number
}

export interface SetPieceMark {
  mark: 'P' | 'C'
  title: string
}

export interface Player {
  id: number
  name: string
  team: string
  pos: Position
  price: number
  own: number
  form: number
  xg: number
  xa: number
  xgi: number
  mins: number
  status: PlayerStatus
  note: string
  hist: number[]
  priceMove: string
  priceDir: Delta
  next: FixtureCell[]
  next3: FixtureCell[]

  // v3 additions — all sourced from real fpl-api Element fields.
  ep: number
  ppg: number
  bonus: number
  bps: number
  ict: [number, number, number] // influence, creativity, threat
  chance: number // 0-100, chance of playing next round (null on the API -> 100)
  setPieces: SetPieceMark[]
  transfersInEvent: number
  transfersOutEvent: number
}
