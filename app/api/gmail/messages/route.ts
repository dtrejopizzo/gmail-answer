import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export async function GET() {
  if (!global.tokens) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  oauth2Client.setCredentials(global.tokens)

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  try {
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
    })

    const messages = await Promise.all(
      res.data.messages!.map(async (message) => {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
        })
        return fullMessage.data
      })
    )

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}