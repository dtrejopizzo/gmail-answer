import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export async function GET() {
  let tokens = global.tokens

  if (!tokens || !tokens.access_token) {
    return NextResponse.json({ error: 'No access token available' }, { status: 401 })
  }

  // Check if the token is expired
  if (tokens.expiry_date && tokens.expiry_date <= Date.now()) {
    try {
      // Refresh the token
      const { credentials } = await oauth2Client.refreshAccessToken()
      tokens = credentials
      global.tokens = credentials
    } catch (error) {
      console.error('Error refreshing access token:', error)
      return NextResponse.json({ error: 'Failed to refresh access token' }, { status: 401 })
    }
  }

  return NextResponse.json({ accessToken: tokens.access_token })
}