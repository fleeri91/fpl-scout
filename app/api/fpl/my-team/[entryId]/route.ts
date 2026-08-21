import { NextResponse, type NextRequest } from 'next/server'
import type { MyTeam } from 'fpl-api'
import { FPL_SESSION_COOKIE } from '@/lib/fplAuth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const token = request.cookies.get(FPL_SESSION_COOKIE)?.value
  if (!token) {
    return NextResponse.json({ error: 'Not logged in.' }, { status: 401 })
  }

  const { entryId } = await params
  const response = await fetch(
    `https://fantasy.premierleague.com/api/my-team/${entryId}/`,
    {
      headers: {
        Cookie: `pl_profile=${token}`,
        'User-Agent': 'Mozilla/5.0',
      },
    }
  )

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Could not load your team.' },
      { status: response.status }
    )
  }

  const data = (await response.json()) as MyTeam
  return NextResponse.json(data)
}
