'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from 'react-toastify'
import { draftResponses } from '../actions'

interface GmailIntegrationProps {
  onDraftResponses: (responses: { [key: string]: string }) => void
  isConnected: boolean
  setIsConnected: (connected: boolean) => void
}

export default function GmailIntegration({ onDraftResponses, isConnected, setIsConnected }: GmailIntegrationProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      const result = await fetch('/api/gmail/auth', { method: 'POST' })
      const data = await result.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to initiate Gmail authentication:', error)
      toast.error('Failed to connect to Gmail')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDraftResponses = async () => {
    if (!isConnected) {
      toast.error('Please connect to Gmail first')
      return
    }
    setIsLoading(true)
    try {
      const result = await draftResponses()
      if (result.success) {
        const successCount = Object.keys(result.responses).length
        toast.success(`Created ${successCount} draft response${successCount !== 1 ? 's' : ''} in Gmail inbox threads`)
      } else {
        toast.error(`Failed to create draft responses in Gmail: ${result.error}`)
      }
    } catch (error) {
      console.error('Error drafting responses:', error)
      toast.error(`An error occurred while creating draft responses in Gmail: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gmail Integration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleConnect} disabled={isLoading}>
          {isConnected ? 'Reconnect to Gmail' : 'Connect to Gmail'}
        </Button>
        <Button onClick={handleDraftResponses} disabled={isLoading || !isConnected}>
          {isLoading ? 'Creating Drafts...' : 'Create Draft Responses in Inbox Threads'}
        </Button>
      </CardContent>
    </Card>
  )
}