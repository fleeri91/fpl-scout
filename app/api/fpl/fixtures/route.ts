import { fetchFixtures } from 'fpl-api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get('eventId')
  const data = await fetchFixtures(eventId ? Number(eventId) : undefined)
  return Response.json(data)
}
