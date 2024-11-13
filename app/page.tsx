'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { addExample, generateResponse, draftResponses } from './actions'
import GmailIntegration from './components/GmailIntegration'

interface Email {
  id: string;
  snippet: string;
  isSubscription: boolean;
}

export default function EmailResponseGenerator() {
  const [previousEmail, setPreviousEmail] = useState('')
  const [incomingEmail, setIncomingEmail] = useState('')
  const [generatedResponse, setGeneratedResponse] = useState('')
  const [draftedResponses, setDraftedResponses] = useState<{ [key: string]: string }>({})

  const handleAddExample = async () => {
    if (previousEmail.trim() === '') {
      toast.error('Please enter a previous email example')
      return
    }
    const result = await addExample(previousEmail)
    if (result.success) {
      toast.success('Example added successfully')
      setPreviousEmail('')
    } else {
      toast.error('Failed to add example')
    }
  }

  const handleGenerateResponse = async () => {
    if (incomingEmail.trim() === '') {
      toast.error('Please enter an incoming email')
      return
    }
    const result = await generateResponse(incomingEmail)
    if (result.success) {
      setGeneratedResponse(result.response)
      toast.success('Response generated successfully')
    } else {
      toast.error('Failed to generate response')
    }
  }

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(generatedResponse)
    toast.success('Response copied to clipboard')
  }

  const handleDraftResponses = async (emails: Email[]) => {
    try {
      const result = await draftResponses(emails)
      if (result.success) {
        setDraftedResponses(result.responses)
        toast.success('Draft responses generated successfully')
      } else {
        toast.error('Failed to generate draft responses')
      }
    } catch (error) {
      console.error('Error drafting responses:', error)
      toast.error('An error occurred while drafting responses')
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6">Email Response Generator</h1>
      <GmailIntegration onDraftResponses={handleDraftResponses} />
      <Card>
        <CardHeader>
          <CardTitle>Previous Email Examples</CardTitle>
          <CardDescription>Paste your previously sent emails here to add to the example database.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste your previous email here..."
            value={previousEmail}
            onChange={(e) => setPreviousEmail(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={handleAddExample} className="mt-2">Add Example</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Incoming Email</CardTitle>
          <CardDescription>Paste the incoming email you want to respond to.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste the incoming email here..."
            value={incomingEmail}
            onChange={(e) => setIncomingEmail(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={handleGenerateResponse} className="mt-2">Generate Response</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Generated Response</CardTitle>
          <CardDescription>Your AI-generated response will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Generated response will appear here..."
            value={generatedResponse}
            readOnly
            className="min-h-[100px]"
          />
          <Button onClick={handleCopyResponse} className="mt-2">Copy Response</Button>
        </CardContent>
      </Card>
      {Object.keys(draftedResponses).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Drafted Responses</CardTitle>
            <CardDescription>AI-generated responses for non-subscription emails.</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.entries(draftedResponses).map(([emailId, response]) => (
              <div key={emailId} className="mb-4">
                <h3 className="font-semibold mb-2">Email ID: {emailId}</h3>
                <Textarea
                  value={response}
                  readOnly
                  className="min-h-[100px]"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <ToastContainer position="bottom-right" />
    </div>
  )
}