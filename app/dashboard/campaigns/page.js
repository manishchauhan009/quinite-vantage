'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Megaphone, Plus, Radio } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)

  const [projectId, setProjectId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [cRes, pRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/projects')
      ])
      const cData = await cRes.json()
      const pData = await pRes.json()
      setCampaigns(cData.campaigns || [])
      setProjects(pData.projects || [])
    } catch (e) {
      console.error(e)
      setError('Failed to load campaigns or projects')
    } finally { setLoading(false) }
  }

  async function createCampaign(e) {
    e?.preventDefault()
    setError(null)
    if (!projectId || !scheduledAt) {
      setError('Project and scheduled time are required')
      return
    }

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, name, description, scheduled_at: new Date(scheduledAt).toISOString() })
      })

      if (!res.ok) {
        const payload = await res.json()
        throw new Error(payload?.error || 'Failed to create campaign')
      }

      const payload = await res.json()
      setCampaigns(prev => [payload.campaign, ...prev])
      setName('')
      setDescription('')
      setScheduledAt('')
    } catch (e) {
      console.error(e)
      setError(e.message || 'Create failed')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 mt-1">Create and manage your call campaigns</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>View and schedule campaigns for projects</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createCampaign} className="grid gap-3 md:grid-cols-4 mb-6">
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="rounded-md border px-3 py-2">
              <option value="">Select project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Input placeholder="Campaign name" value={name} onChange={e => setName(e.target.value)} />
            <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
            <Button type="submit" className="gap-2">Create Campaign</Button>
            <div className="md:col-span-4">
              <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </form>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          {loading && <p className="text-sm text-gray-500">Loading campaigns...</p>}

          {!loading && campaigns.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Radio className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No campaigns yet</p>
              <p className="text-sm mt-2">Create your first campaign to start scheduling calls</p>
            </div>
          )}

          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c.id} className="p-4 border rounded-md flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{c.name}</h3>
                  <p className="text-sm text-gray-600">{c.description}</p>
                  <p className="text-sm text-gray-500 mt-1">Scheduled: {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : '—'}</p>
                </div>
                <div className="text-sm text-gray-600">Status: {c.status}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}