import { fetchEventStatus } from 'fpl-api'

export async function GET() {
  const data = await fetchEventStatus()
  return Response.json(data)
}
