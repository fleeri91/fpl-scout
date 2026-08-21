import { NextResponse, type NextRequest } from 'next/server'
import type { Me } from 'fpl-api'
import { FPL_SESSION_COOKIE } from '@/lib/fplAuth'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(FPL_SESSION_COOKIE)?.value
  if (!token) {
    return NextResponse.json({ error: 'Not logged in.' }, { status: 401 })
  }

  const response = await fetch('https://fantasy.premierleague.com/api/me/', {
    headers: {
      Cookie: `pl_profile=${token}`,
      'User-Agent': 'Mozilla/5.0',
    },
  })

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Your FPL session has expired. Log in again.' },
      { status: 401 }
    )
  }

  const data = (await response.json()) as Me
  return NextResponse.json(data)
}
