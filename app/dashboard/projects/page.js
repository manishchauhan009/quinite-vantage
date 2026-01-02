'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function ProjectsPage() {
  const supabase = createClient()
  const fileRef = useRef(null)

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePath, setImagePath] = useState(null)
  const router = useRouter()

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    setLoading(true)
    const res = await fetch('/api/projects')
    const data = await res.json()
    setProjects(data.projects || [])
    setLoading(false)
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Only images allowed')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // 1️⃣ Ask backend for signed URL
      const res = await fetch('/api/projects/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type
        })
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to get upload URL')
      }

      const { uploadUrl, image_url, image_path } = payload

      // 2️⃣ Upload directly to signed URL
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file
      })

      if (!uploadRes.ok) {
        throw new Error('Upload failed')
      }

      // 3️⃣ Save for project creation
      setImageUrl(image_url)
      setImagePath(image_path)

    } catch (err) {
      console.error(err)
      setError(err.message || 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function createProject() {
    setError(null)

    if (!name) {
      setError('Project name required')
      return
    }

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        address,
        image_url: imageUrl,
        image_path: imagePath
      })
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }

    setProjects(prev => [data.project, ...prev])

    // reset
    setName('')
    setDescription('')
    setAddress('')
    setImageUrl('')
    setImagePath(null)
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Project name"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <Input
            placeholder="Address"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />

          <Textarea
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <input
            type="file"
            ref={fileRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />

          <Button
            variant="outline"
            onClick={() => fileRef.current.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>

          {imageUrl && (
            <img
              src={imageUrl}
              alt="preview"
              className="h-40 w-full object-cover rounded-md border"
            />
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button onClick={createProject}>
            Create Project
          </Button>
        </CardContent>
      </Card>

      {/* PROJECT CARDS */}
      <div className="grid gap-6 md:grid-cols-3">
        {loading && <p>Loading...</p>}

        {!loading && projects.map(project => (
          <Card key={project.id} className="overflow-hidden transform hover:scale-[1.01] transition">
            <div className="relative">
              {project.image_url ? (
                <img
                  src={project.image_url}
                  alt={project.name}
                  className="h-44 w-full object-cover"
                />
              ) : (
                <div className="h-44 w-full bg-gradient-to-r from-slate-50 to-slate-100 flex items-center justify-center">
                  <span className="text-sm text-slate-500">No image</span>
                </div>
              )}
              <div className="absolute top-3 right-3">
                <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}>
                  Edit
                </Button>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                  {project.address && (
                    <p className="text-sm text-gray-600">{project.address}</p>
                  )}
                </div>
              </div>

              {project.description && (
                <p className="text-sm text-gray-700 line-clamp-3">{project.description}</p>
              )}

              <div className="pt-2 flex items-center justify-between">
                <div className="text-xs text-gray-500">{project.created_at ? new Date(project.created_at).toLocaleDateString() : ''}</div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => router.push(`/dashboard/campaigns/new?projectId=${project.id}`)}>
                    Add Campaign
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
