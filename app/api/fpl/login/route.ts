import { NextResponse, type NextRequest } from 'next/server'
import { FPL_SESSION_COOKIE } from '@/lib/fplAuth'

const LOGIN_URL = 'https://users.premierleague.com/accounts/login/'

export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required.' },
      { status: 400 }
    )
  }

  // Forwarded straight to FPL's real login endpoint and never stored or
  // logged on our side — only the session cookie it hands back is kept.
  const form = new URLSearchParams({
    login: email,
    password,
    app: 'plfpl-web',
    redirect_uri: 'https://fantasy.premierleague.com/a/login',
  })

  let loginResponse: Response
  try {
    loginResponse = await fetch(LOGIN_URL, {
      method: 'POST',
      body: form,
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
        Accept: '*/*',
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the FPL login service. Try again shortly." },
      { status: 502 }
    )
  }

  const setCookies = loginResponse.headers.getSetCookie?.() ?? []
  const plProfile = setCookies
    .map((c) => c.split(';')[0])
    .find((c) => c.startsWith('pl_profile='))
    ?.slice('pl_profile='.length)

  if (!plProfile) {
    return NextResponse.json(
      { error: 'Login failed. Check your email and password and try again.' },
      { status: 401 }
    )
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(FPL_SESSION_COOKIE, plProfile, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
  return response
}
