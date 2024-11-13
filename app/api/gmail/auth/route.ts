import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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
    access_type: 'online',
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
      
      if (tokens.access_token) {
        // Store the access token in a secure HTTP-only cookie
        const cookieStore = await cookies()
        await cookieStore.set('gmail_access_token', tokens.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3600 // 1 hour
        })

        // Redirect to the main application page
        return NextResponse.redirect(new URL('/?connected=true', request.url))
      } else {
        throw new Error('No access token received')
      }
    } catch (error) {
      console.error('Error exchanging code for tokens:', error)
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
    }
  }

  return NextResponse.redirect(new URL('/?error=no_code', request.url))
}