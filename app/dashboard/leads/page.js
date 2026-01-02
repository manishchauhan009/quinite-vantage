'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users2, Plus, Upload, UserPlus } from 'lucide-react'

export default function LeadsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 mt-1">Manage your leads and contacts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Upload CSV
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
          <CardDescription>View and manage all leads in your database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No leads yet</p>
            <p className="text-sm mt-2">Upload leads or add them manually to start</p>
            <div className="flex gap-2 justify-center mt-4">
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload CSV
              </Button>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Lead
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}