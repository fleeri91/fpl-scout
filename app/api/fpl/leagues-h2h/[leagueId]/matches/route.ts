import { fetchH2HMatches } from 'fpl-api'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params
  const searchParams = request.nextUrl.searchParams
  const entryId = searchParams.get('entryId')
  const page = searchParams.get('page')

  if (!entryId) {
    return Response.json(
      { error: 'entryId query parameter is required' },
      { status: 400 }
    )
  }

  const data = await fetchH2HMatches(
    Number(leagueId),
    Number(entryId),
    page ? Number(page) : 1
  )

  return Response.json(data)
}
