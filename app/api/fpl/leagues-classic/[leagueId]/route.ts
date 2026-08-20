import { fetchClassicLeague } from 'fpl-api'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params
  const searchParams = request.nextUrl.searchParams
  const pageStandings = searchParams.get('pageStandings')
  const pageNewEntries = searchParams.get('pageNewEntries')
  const phase = searchParams.get('phase')

  const data = await fetchClassicLeague(Number(leagueId), {
    pageStandings: pageStandings ? Number(pageStandings) : 1,
    pageNewEntries: pageNewEntries ? Number(pageNewEntries) : 1,
    phase: phase ? Number(phase) : 1,
  })

  return Response.json(data)
}
