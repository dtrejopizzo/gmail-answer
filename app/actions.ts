'use server'

import fs from 'fs/promises'
import path from 'path'
import OpenAI from 'openai'
import { google } from 'googleapis'
import { cookies } from 'next/headers'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const EXAMPLES_FILE = path.join(process.cwd(), 'examples.txt')

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export async function addExample(example: string) {
  try {
    await fs.appendFile(EXAMPLES_FILE, example + '\n\n')
    return { success: true }
  } catch (error) {
    console.error('Error adding example:', error)
    return { success: false }
  }
}

export async function generateResponse(incomingEmail: string) {
  try {
    const examples = await fs.readFile(EXAMPLES_FILE, 'utf-8').catch(() => '')
    const prompt = `You are an AI assistant tasked with generating email responses. 
    Here are examples of my previous email responses:

    ${examples}

    Now, please generate a response to the following incoming email, using the style of my previous responses:

    ${incomingEmail}

    Generated response:`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    })

    const response = completion.choices[0].message.content?.trim() || ''
    return { success: true, response }
  } catch (error) {
    console.error('Error generating response:', error)
    return { success: false, response: '' }
  }
}

export async function draftResponses() {
  try {
    const cookieStore = await cookies()
    const accessTokenCookie = cookieStore.get('gmail_access_token')
    const accessToken = accessTokenCookie?.value

    if (!accessToken) {
      return { success: false, responses: {}, error: 'Invalid Credentials' }
    }

    oauth2Client.setCredentials({ access_token: accessToken })
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const examples = await fs.readFile(EXAMPLES_FILE, 'utf-8').catch(() => '')
    const responses: { [key: string]: string } = {}

    const res = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults: 100,
    })

    const messages = res.data.messages || []

    for (const message of messages) {
      try {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
        })

        const fromHeader = fullMessage.data.payload?.headers?.find(
          (header) => header.name?.toLowerCase() === 'from'
        )
        const subjectHeader = fullMessage.data.payload?.headers?.find(
          (header) => header.name?.toLowerCase() === 'subject'
        )

        const from = fromHeader?.value || ''
        const subject = subjectHeader?.value || ''
        const snippet = fullMessage.data.snippet || ''

        if (from.toLowerCase().includes('luma') && subject.toLowerCase().includes('automatic')) {
          console.log(`Skipping automatic Luma email: ${subject}`)
          continue
        }

        const prompt = `You are an AI assistant tasked with generating email responses. 
        Here are examples of my previous email responses:

        ${examples}

        Now, please generate a response to the following incoming email snippet, using the style of my previous responses:

        Subject: ${subject}
        From: ${from}
        Snippet: ${snippet}

        Generated response:`

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        })

        const response = completion.choices[0].message.content?.trim() || ''

        await gmail.users.drafts.create({
          userId: 'me',
          requestBody: {
            message: {
              threadId: message.threadId,
              raw: Buffer.from(
                `To: ${from}
Subject: Re: ${subject}
Content-Type: text/plain; charset="UTF-8"
In-Reply-To: ${message.id}
References: ${message.id}

${response}`
              ).toString('base64')
            }
          }
        })
        responses[message.id!] = response
      } catch (error) {
        console.error(`Error creating draft for email ${message.id}:`, error)
      }
    }

    return { success: true, responses }
  } catch (error) {
    console.error('Error drafting responses:', error)
    return { success: false, responses: {}, error: 'Failed to draft responses' }
  }
}