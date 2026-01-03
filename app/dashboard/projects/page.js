'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'


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
  // Structured real_estate fields for create
  const [transaction, setTransaction] = useState('sell')
  const [propertyCategory, setPropertyCategory] = useState('residential')
  const [propertyUseCase, setPropertyUseCase] = useState('apartment')
  const [bhk, setBhk] = useState('2bhk')
  const [carpetArea, setCarpetArea] = useState('')
  const [builtUpArea, setBuiltUpArea] = useState('')
  const [superBuiltUpArea, setSuperBuiltUpArea] = useState('')
  const [commercialArea, setCommercialArea] = useState('')
  const [commercialBuiltUpArea, setCommercialBuiltUpArea] = useState('')
  const [groundFloor, setGroundFloor] = useState(false)
  const [plotArea, setPlotArea] = useState('')
  const [locCity, setLocCity] = useState('')
  const [locLocality, setLocLocality] = useState('')
  const [locLandmark, setLocLandmark] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [open, setOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editImagePath, setEditImagePath] = useState(null)
  // Structured real_estate fields for edit modal
  const [editTransaction, setEditTransaction] = useState('sell')
  const [editPropertyCategory, setEditPropertyCategory] = useState('residential')
  const [editPropertyUseCase, setEditPropertyUseCase] = useState('apartment')
  const [editBhk, setEditBhk] = useState('2bhk')
  const [editCarpetArea, setEditCarpetArea] = useState('')
  const [editBuiltUpArea, setEditBuiltUpArea] = useState('')
  const [editSuperBuiltUpArea, setEditSuperBuiltUpArea] = useState('')
  const [editCommercialArea, setEditCommercialArea] = useState('')
  const [editCommercialBuiltUpArea, setEditCommercialBuiltUpArea] = useState('')
  const [editGroundFloor, setEditGroundFloor] = useState(false)
  const [editPlotArea, setEditPlotArea] = useState('')
  const [editLocCity, setEditLocCity] = useState('')
  const [editLocLocality, setEditLocLocality] = useState('')
  const [editLocLandmark, setEditLocLandmark] = useState('')
  const [editPriceMin, setEditPriceMin] = useState('')
  const [editPriceMax, setEditPriceMax] = useState('')
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [campName, setCampName] = useState('')
  const [campDescription, setCampDescription] = useState('')
  const [campStartDate, setCampStartDate] = useState('')
  const [campEndDate, setCampEndDate] = useState('')
  const [campTimeStart, setCampTimeStart] = useState('')
  const [campTimeEnd, setCampTimeEnd] = useState('')
  const [campProjectId, setCampProjectId] = useState(null)

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



  async function handleCreateImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Only images allowed')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const res = await fetch('/api/projects/upload-url', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      })

      setImageUrl(data.image_url)
      setImagePath(data.image_path)
    } catch (err) {
      console.error(err)
      setError('Image upload failed')
    } finally {
      setUploading(false)
    }
  }


  async function handleEditImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const res = await fetch('/api/projects/upload-url', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      })

      setEditImageUrl(data.image_url)
      setEditImagePath(data.image_path)
    } catch (err) {
      console.error(err)
      setError('Image upload failed')
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
        image_path: imagePath,
        real_estate: {
          transaction,
          property: {
            category: propertyCategory,
            use_case: propertyUseCase,
            ...(propertyCategory === 'residential' ? { residential: { bhk, carpet_area: Number(carpetArea || 0), built_up_area: Number(builtUpArea || 0), super_built_up_area: Number(superBuiltUpArea || 0) } } : {}),
            ...(propertyCategory === 'commercial' ? { commercial: { area: Number(commercialArea || 0), built_up_area: Number(commercialBuiltUpArea || 0), ground_floor: groundFloor } } : {}),
            ...(propertyCategory === 'land' ? { land: { plot_area: Number(plotArea || 0) } } : {})
          },
          location: { city: locCity, locality: locLocality, landmark: locLandmark },
          pricing: { min: Number(priceMin || 0), max: Number(priceMax || 0) },
          media: { thumbnail: imageUrl || null },
          description: description || ''
        }
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

          <div className="grid grid-cols-3 gap-2">
            <select className="rounded-md border px-2 py-1" value={transaction} onChange={e => setTransaction(e.target.value)}>
              <option value="sell">Sell</option>
              <option value="rent">Rent</option>
              <option value="lease">Lease</option>
              <option value="pg">PG</option>
            </select>

            <select className="rounded-md border px-2 py-1" value={propertyCategory} onChange={e => setPropertyCategory(e.target.value)}>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="land">Land</option>
            </select>

            <select className="rounded-md border px-2 py-1" value={propertyUseCase} onChange={e => setPropertyUseCase(e.target.value)}>
              <option value="apartment">Apartment</option>
              <option value="builder_floor">Builder Floor</option>
              <option value="independent_house">Independent House</option>
              <option value="villa_bungalow">Villa / Bungalow</option>
              <option value="row_house">Row House</option>
              <option value="studio">Studio</option>
              <option value="penthouse">Penthouse</option>
              <option value="farm_house">Farm House</option>
              <option value="service_apartment">Service Apartment</option>
              <option value="office">Office</option>
              <option value="retail">Retail</option>
              <option value="residential_plot">Residential Plot</option>
            </select>
          </div>

          {/* Conditional property details */}
          {propertyCategory === 'residential' && (
            <div className="grid grid-cols-4 gap-2">
              <select value={bhk} onChange={e => setBhk(e.target.value)} className="rounded-md border px-2 py-1">
                <option value="1rk">1RK</option>
                <option value="1bhk">1BHK</option>
                <option value="2bhk">2BHK</option>
                <option value="3bhk">3BHK</option>
                <option value="4bhk">4BHK</option>
                <option value="5plus">5+</option>
              </select>
              <Input placeholder="Carpet area (sqft)" value={carpetArea} onChange={e => setCarpetArea(e.target.value)} />
              <Input placeholder="Built-up area" value={builtUpArea} onChange={e => setBuiltUpArea(e.target.value)} />
              <Input placeholder="Super built-up" value={superBuiltUpArea} onChange={e => setSuperBuiltUpArea(e.target.value)} />
            </div>
          )}

          {propertyCategory === 'commercial' && (
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Area (sqft)" value={commercialArea} onChange={e => setCommercialArea(e.target.value)} />
              <Input placeholder="Built-up area" value={commercialBuiltUpArea} onChange={e => setCommercialBuiltUpArea(e.target.value)} />
              <label className="flex items-center gap-2"><input type="checkbox" checked={groundFloor} onChange={e => setGroundFloor(e.target.checked)} /> Ground floor</label>
            </div>
          )}

          {propertyCategory === 'land' && (
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Plot area (sqft)" value={plotArea} onChange={e => setPlotArea(e.target.value)} />
            </div>
          )}

          {/* Location & pricing required by schema */}
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="City" value={locCity} onChange={e => setLocCity(e.target.value)} />
            <Input placeholder="Locality" value={locLocality} onChange={e => setLocLocality(e.target.value)} />
            <Input placeholder="Landmark" value={locLandmark} onChange={e => setLocLandmark(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Price min" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
            <Input placeholder="Price max" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
          </div>

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
            onChange={handleCreateImageUpload}
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
              <div className="absolute top-3 right-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingProject(project)
                    setEditName(project.name || '')
                    setEditDescription(project.description || '')
                    setEditAddress(project.address || '')
                      setEditImageUrl(project.image_url || '')
                      setEditImagePath(project.image_path || null)
                      // prefills for real_estate if present
                      const re = project?.metadata?.real_estate || project?.real_estate || null
                      if (re) {
                        setEditTransaction(re.transaction || 'sell')
                        setEditPropertyCategory(re.property?.category || 'residential')
                        setEditPropertyUseCase(re.property?.use_case || '')
                        setEditLocCity(re.location?.city || '')
                        setEditLocLocality(re.location?.locality || '')
                        setEditLocLandmark(re.location?.landmark || '')
                        setEditPriceMin(re.pricing?.min || '')
                        setEditPriceMax(re.pricing?.max || '')
                        if (re.property?.residential) {
                          setEditBhk(re.property.residential.bhk || '2bhk')
                          setEditCarpetArea(re.property.residential.carpet_area || '')
                          setEditBuiltUpArea(re.property.residential.built_up_area || '')
                          setEditSuperBuiltUpArea(re.property.residential.super_built_up_area || '')
                        }
                        if (re.property?.commercial) {
                          setEditCommercialArea(re.property.commercial.area || '')
                          setEditCommercialBuiltUpArea(re.property.commercial.built_up_area || '')
                          setEditGroundFloor(re.property.commercial.ground_floor || false)
                        }
                        if (re.property?.land) {
                          setEditPlotArea(re.property.land.plot_area || '')
                        }
                        setEditPriceMin(re.pricing?.min || '')
                        setEditPriceMax(re.pricing?.max || '')
                      }
                    setOpen(true)
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (!confirm('Delete this project? This cannot be undone.')) return
                    setDeleting(true)
                    try {
                      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data.error || 'Delete failed')
                      setProjects(prev => prev.filter(p => p.id !== project.id))
                    } catch (err) {
                      console.error(err)
                      setError(err.message || 'Delete failed')
                    } finally {
                      setDeleting(false)
                    }
                  }}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
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
                  <Button variant="secondary" size="sm" onClick={() => {
                    setCampProjectId(project.id)
                    setCampName('')
                    setCampDescription('')
                    setCampStartDate('')
                    setCampEndDate('')
                    setCampTimeStart('09:00')
                    setCampTimeEnd('17:00')
                    setAddOpen(true)
                  }}>
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

      {/* Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Edit Project</DialogTitle>

          <div className="space-y-3 mt-2">
            <Input placeholder="Project name" value={editName} onChange={e => setEditName(e.target.value)} />
            <Input placeholder="Address" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
            <Textarea placeholder="Description" value={editDescription} onChange={e => setEditDescription(e.target.value)} />

            <div className="grid grid-cols-3 gap-2">
              <select className="rounded-md border px-2 py-1" value={editTransaction} onChange={e => setEditTransaction(e.target.value)}>
                <option value="sell">Sell</option>
                <option value="rent">Rent</option>
                <option value="lease">Lease</option>
                <option value="pg">PG</option>
              </select>

              <select className="rounded-md border px-2 py-1" value={editPropertyCategory} onChange={e => setEditPropertyCategory(e.target.value)}>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
              </select>

              <select className="rounded-md border px-2 py-1" value={editPropertyUseCase} onChange={e => setEditPropertyUseCase(e.target.value)}>
                <option value="apartment">Apartment</option>
                <option value="builder_floor">Builder Floor</option>
                <option value="independent_house">Independent House</option>
                <option value="villa_bungalow">Villa / Bungalow</option>
                <option value="row_house">Row House</option>
                <option value="studio">Studio</option>
                <option value="penthouse">Penthouse</option>
                <option value="farm_house">Farm House</option>
                <option value="service_apartment">Service Apartment</option>
              </select>
            </div>

            {editPropertyCategory === 'residential' && (
              <div className="grid grid-cols-4 gap-2">
                <select value={editBhk} onChange={e => setEditBhk(e.target.value)} className="rounded-md border px-2 py-1">
                  <option value="1rk">1RK</option>
                  <option value="1bhk">1BHK</option>
                  <option value="2bhk">2BHK</option>
                  <option value="3bhk">3BHK</option>
                  <option value="4bhk">4BHK</option>
                  <option value="5plus">5+</option>
                </select>
                <Input placeholder="Carpet area" value={editCarpetArea} onChange={e => setEditCarpetArea(e.target.value)} />
                <Input placeholder="Built-up" value={editBuiltUpArea} onChange={e => setEditBuiltUpArea(e.target.value)} />
                <Input placeholder="Super built-up" value={editSuperBuiltUpArea} onChange={e => setEditSuperBuiltUpArea(e.target.value)} />
              </div>
            )}

            {editPropertyCategory === 'commercial' && (
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Area" value={editCommercialArea} onChange={e => setEditCommercialArea(e.target.value)} />
                <Input placeholder="Built-up" value={editCommercialBuiltUpArea} onChange={e => setEditCommercialBuiltUpArea(e.target.value)} />
                <label className="flex items-center gap-2"><input type="checkbox" checked={editGroundFloor} onChange={e => setEditGroundFloor(e.target.checked)} /> Ground floor</label>
              </div>
            )}

            {editPropertyCategory === 'land' && (
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Plot area" value={editPlotArea} onChange={e => setEditPlotArea(e.target.value)} />
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="City" value={editLocCity} onChange={e => setEditLocCity(e.target.value)} />
              <Input placeholder="Locality" value={editLocLocality} onChange={e => setEditLocLocality(e.target.value)} />
              <Input placeholder="Landmark" value={editLocLandmark} onChange={e => setEditLocLandmark(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Price min" value={editPriceMin} onChange={e => setEditPriceMin(e.target.value)} />
              <Input placeholder="Price max" value={editPriceMax} onChange={e => setEditPriceMax(e.target.value)} />
            </div>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="edit-file"
              onChange={handleEditImageUpload}
              disabled={uploading}
            />

            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="outline"
                disabled={uploading}
              >
                <label htmlFor="edit-file" className="cursor-pointer flex items-center gap-2">
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {uploading ? 'Uploading…' : 'Upload Image'}
                </label>
              </Button>

              {editImageUrl && !uploading && (
                <img
                  src={editImageUrl}
                  alt="preview"
                  className="h-24 rounded-md border object-cover"
                />
              )}
            </div>

          </div>

          <DialogFooter>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!editingProject) return
                if (!confirm('Delete this project? This cannot be undone.')) return
                setDeleting(true)
                try {
                  const res = await fetch(`/api/projects/${editingProject.id}`, { method: 'DELETE' })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.error || 'Delete failed')
                  setProjects(prev => prev.filter(p => p.id !== editingProject.id))
                  setOpen(false)
                } catch (err) {
                  console.error(err)
                  setError(err.message || 'Delete failed')
                } finally {
                  setDeleting(false)
                }
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>

            <Button
              onClick={async () => {
                if (!editingProject) return
                try {
                  const res = await fetch(`/api/projects/${editingProject.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: editName,
                      description: editDescription,
                      address: editAddress,
                      image_url: editImageUrl,
                      image_path: editImagePath,
                      real_estate: {
                        transaction: editTransaction,
                        property: {
                          category: editPropertyCategory,
                          use_case: editPropertyUseCase,
                          ...(editPropertyCategory === 'residential' ? { residential: { bhk: editBhk, carpet_area: Number(editCarpetArea || 0), built_up_area: Number(editBuiltUpArea || 0), super_built_up_area: Number(editSuperBuiltUpArea || 0) } } : {}),
                          ...(editPropertyCategory === 'commercial' ? { commercial: { area: Number(editCommercialArea || 0), built_up_area: Number(editCommercialBuiltUpArea || 0), ground_floor: editGroundFloor } } : {}),
                          ...(editPropertyCategory === 'land' ? { land: { plot_area: Number(editPlotArea || 0) } } : {})
                        },
                        location: { city: editLocCity, locality: editLocLocality, landmark: editLocLandmark },
                        pricing: { min: Number(editPriceMin || 0), max: Number(editPriceMax || 0) },
                        media: { thumbnail: editImageUrl || null },
                        description: editDescription || ''
                      }
                    })
                  })

                  const data = await res.json()
                  if (!res.ok) throw new Error(data.error || 'Update failed')

                  setProjects(prev => prev.map(p => p.id === data.project.id ? data.project : p))
                  setOpen(false)
                } catch (err) {
                  console.error(err)
                  setError(err.message || 'Update failed')
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Campaign Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogTitle>Create Campaign</DialogTitle>

          <div className="space-y-3 mt-2">
            <Input placeholder="Campaign name" value={campName} onChange={e => setCampName(e.target.value)} />
            <Input type="date" value={campStartDate} onChange={e => setCampStartDate(e.target.value)} />
            <Input type="date" value={campEndDate} onChange={e => setCampEndDate(e.target.value)} />
            <div className="flex gap-2">
              <Input type="time" value={campTimeStart} onChange={e => setCampTimeStart(e.target.value)} />
              <Input type="time" value={campTimeEnd} onChange={e => setCampTimeEnd(e.target.value)} />
            </div>
            <Textarea placeholder="Description (optional)" value={campDescription} onChange={e => setCampDescription(e.target.value)} />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              setError(null)
              if (!campProjectId || !campStartDate || !campEndDate || !campTimeStart || !campTimeEnd) {
                setError('Project, dates and time window are required')
                return
              }

              try {
                const res = await fetch('/api/campaigns', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ project_id: campProjectId, name: campName, description: campDescription, start_date: campStartDate, end_date: campEndDate, time_start: campTimeStart, time_end: campTimeEnd })
                })

                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Create failed')

                setProjects(prev => prev)
                setAddOpen(false)
              } catch (err) {
                console.error(err)
                setError(err.message || 'Create failed')
              }
            }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
