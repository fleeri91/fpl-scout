export type PlayerStatus = 'ok' | 'risk' | 'out'
export type Position = 'GKP' | 'DEF' | 'MID' | 'FWD'
export type Delta = 'up' | 'down' | 'flat'
export type Screen = 'dash' | 'explorer' | 'fixtures' | 'chips' | 'transfers'

export interface FixtureCell {
  opp: string
  label: string
  d: number
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
}
