import { NextResponse } from 'next/server'

export async function GET() {
  if (!global.tokens) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  return NextResponse.json({ accessToken: global.tokens.access_token })
}