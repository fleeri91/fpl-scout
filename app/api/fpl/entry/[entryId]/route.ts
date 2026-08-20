import { fetchEntry } from 'fpl-api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params
  const data = await fetchEntry(Number(entryId))
  return Response.json(data)
}
