import { NextResponse } from 'next/server'
import { FPL_SESSION_COOKIE } from '@/lib/fplAuth'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(FPL_SESSION_COOKIE)
  return response
}
