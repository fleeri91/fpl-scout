import { fetchElementSummary } from 'fpl-api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ elementId: string }> }
) {
  const { elementId } = await params
  const data = await fetchElementSummary(Number(elementId))
  return Response.json(data)
}
