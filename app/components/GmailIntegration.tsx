'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from 'react-toastify'
import { draftResponses } from '../actions'

export default function GmailIntegration() {
  const [isLoading, setIsLoading] = useState(false)
  const [accessToken, setAccessToken] = useState('')

  const handleConnect = async () => {
    try {
      const result = await fetch('/api/gmail/auth', { method: 'POST' })
      const data = await result.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to initiate Gmail authentication:', error)
      toast.error('Failed to connect to Gmail')
    }
  }

  const fetchAccessToken = async () => {
    setIsLoading(true)
    try {
      const result = await fetch('/api/gmail/token')
      const data = await result.json()
      if (data.accessToken) {
        setAccessToken(data.accessToken)
        toast.success('Successfully fetched access token')
      } else {
        toast.error('Failed to fetch access token')
      }
    } catch (error) {
      console.error('Failed to fetch access token:', error)
      toast.error('Failed to fetch access token')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDraftResponses = async () => {
    setIsLoading(true)
    try {
      const result = await draftResponses(accessToken)
      if (result.success) {
        const successCount = result.results.filter(r => r.success).length
        toast.success(`Created ${successCount} draft response${successCount !== 1 ? 's' : ''} in Gmail inbox threads`)
      } else {
        toast.error('Failed to create draft responses in Gmail')
      }
    } catch (error) {
      console.error('Error drafting responses:', error)
      toast.error('An error occurred while creating draft responses in Gmail')
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
        <Button onClick={handleConnect}>Connect to Gmail</Button>
        <Button onClick={fetchAccessToken} disabled={isLoading}>
          {isLoading ? 'Fetching...' : 'Fetch Access Token'}
        </Button>
        {accessToken && (
          <Button onClick={handleDraftResponses} disabled={isLoading}>
            {isLoading ? 'Creating Drafts...' : 'Create Draft Responses in Inbox Threads'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}