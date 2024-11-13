import { NextResponse } from 'next/server'

export async function GET() {
  const tokens = global.tokens

  if (!tokens || !tokens.access_token) {
    return NextResponse.json({ isConnected: false })
  }

  return NextResponse.json({ isConnected: true })
}