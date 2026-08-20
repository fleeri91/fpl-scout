import { fetchLive } from 'fpl-api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const data = await fetchLive(Number(eventId))
  return Response.json(data)
}
