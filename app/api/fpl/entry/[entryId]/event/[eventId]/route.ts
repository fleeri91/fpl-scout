import { fetchEntryEvent } from 'fpl-api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entryId: string; eventId: string }> }
) {
  const { entryId, eventId } = await params
  const data = await fetchEntryEvent(Number(entryId), Number(eventId))
  return Response.json(data)
}
