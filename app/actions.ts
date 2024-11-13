'use server'

import fs from 'fs/promises'
import path from 'path'
import OpenAI from 'openai'
import { google } from 'googleapis'

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
    let content = await fs.readFile(EXAMPLES_FILE, 'utf-8').catch(() => '')
    const exampleNumber = (content.split('\n\n').length + 1) / 2
    const newExample = `Example email number ${exampleNumber}:\n${example}\n\n`
    await fs.appendFile(EXAMPLES_FILE, newExample)
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

    const response = completion.choices[0].message.content.trim()
    return { success: true, response }
  } catch (error) {
    console.error('Error generating response:', error)
    return { success: false, response: '' }
  }
}

export async function draftResponses(accessToken: string) {
  try {
    oauth2Client.setCredentials({ access_token: accessToken })
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const examples = await fs.readFile(EXAMPLES_FILE, 'utf-8').catch(() => '')
    const results: { id: string; success: boolean }[] = []

    // Fetch emails from the inbox
    const res = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults: 100, // Adjust this number as needed
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

        // Skip automatic emails from Luma
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

        const response = completion.choices[0].message.content.trim()

        // Create a draft reply in the same thread
        const draft = await gmail.users.drafts.create({
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
        results.push({ id: message.id!, success: true })
      } catch (error) {
        console.error(`Error creating draft for email ${message.id}:`, error)
        results.push({ id: message.id!, success: false })
      }
    }

    return { success: true, results }
  } catch (error) {
    console.error('Error drafting responses:', error)
    return { success: false, results: [] }
  }
}