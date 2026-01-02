import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/permissions'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

    const { data, error } = await supabase.from('projects').select('*').eq('organization_id', profile.organization_id).order('created_at', { ascending: false })
    if (error) throw error
    return handleCORS(NextResponse.json({ projects: data || [] }))
  } catch (e) {
    console.error('projects GET error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const { data: profile } = await supabase.from('profiles').select('organization_id, full_name').eq('id', user.id).single()

    const { name, description, address, type, metadata, image_url, image_path } = body
    if (!name) return handleCORS(NextResponse.json({ error: 'Project name is required' }, { status: 400 }))

    const payload = {
      name,
      description: description || null,
      address: address || null,
      project_type: type || null,
      metadata: metadata || null,
      image_url: image_url || null,
      image_path: image_path || null,
      organization_id: profile.organization_id,
      created_by: user.id
    }

    const { data: project, error } = await supabase.from('projects').insert(payload).select().single()
    if (error) throw error

    try { await logAudit(supabase, user.id, profile.full_name || user.email, 'project.create', 'project', project.id, { name: project.name }) } catch (e) { }

    return handleCORS(NextResponse.json({ project }))
  } catch (e) {
    console.error('projects POST error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
