'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { addExample, generateResponse } from './actions'
import GmailIntegration from './components/GmailIntegration'

export default function EmailResponseGenerator() {
  const [previousEmail, setPreviousEmail] = useState('')
  const [incomingEmail, setIncomingEmail] = useState('')
  const [generatedResponse, setGeneratedResponse] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (connected === 'true') {
      setIsConnected(true)
      toast.success('Successfully connected to Gmail')
    } else if (error) {
      toast.error(`Failed to connect to Gmail: ${error}`)
    }
  }, [searchParams])

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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6">Email Response Generator</h1>
      <GmailIntegration 
        isConnected={isConnected}
        setIsConnected={setIsConnected}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Previous Email Examples</CardTitle>
            <CardDescription>Paste your previously sent emails here to add to the example database.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <Textarea
              placeholder="Paste your previous email here..."
              value={previousEmail}
              onChange={(e) => setPreviousEmail(e.target.value)}
              className="min-h-[200px]"
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddExample} className="w-full">Add Example</Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Incoming Email</CardTitle>
            <CardDescription>Paste the incoming email you want to respond to.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <Textarea
              placeholder="Paste the incoming email here..."
              value={incomingEmail}
              onChange={(e) => setIncomingEmail(e.target.value)}
              className="min-h-[200px]"
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateResponse} className="w-full">Generate Response</Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Generated Response</CardTitle>
            <CardDescription>Your AI-generated response will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <Textarea
              placeholder="Generated response will appear here..."
              value={generatedResponse}
              readOnly
              className="min-h-[200px]"
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleCopyResponse} className="w-full">Copy Response</Button>
          </CardFooter>
        </Card>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  )
}