import { fetchBootstrap } from 'fpl-api'

export async function GET() {
  const data = await fetchBootstrap()
  return Response.json(data)
}
