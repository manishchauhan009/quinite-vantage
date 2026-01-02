'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Megaphone, Plus, Radio } from 'lucide-react'

export default function CampaignsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 mt-1">Create and manage your marketing campaigns</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>View and manage all campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Radio className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No campaigns yet</p>
            <p className="text-sm mt-2">Create your first campaign to start reaching leads</p>
            <Button className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}