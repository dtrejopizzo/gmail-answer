import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify'
]

export async function POST() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  })

  return NextResponse.json({ url: authUrl })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    try {
      const { tokens } = await oauth2Client.getToken(code)
      oauth2Client.setCredentials(tokens)

      // In a production environment, you should securely store these tokens
      // associated with the user's session or in a database
      // For this example, we'll store them in memory (not recommended for production)
      global.tokens = tokens

      // Redirect to the main application page after successful authentication
      return NextResponse.redirect(new URL('/', request.url))
    } catch (error) {
      console.error('Error exchanging code for tokens:', error)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'No code provided' }, { status: 400 })
}