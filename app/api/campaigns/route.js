import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/permissions'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

    const { data, error } = await supabase.from('campaigns').select('*').eq('organization_id', profile.organization_id).order('scheduled_at', { ascending: false })
    if (error) throw error
    return handleCORS(NextResponse.json({ campaigns: data || [] }))
  } catch (e) {
    console.error('campaigns GET error:', e)
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
    const { project_id, name, description, start_date, end_date, time_start, time_end, metadata } = body
    if (!project_id || !start_date || !end_date || !time_start || !time_end) {
      return handleCORS(NextResponse.json({ error: 'project_id, start_date, end_date, time_start and time_end are required' }, { status: 400 }))
    }

    const payload = {
      organization_id: profile.organization_id,
      project_id,
      name: name || 'Call Campaign',
      description: description || null,
      start_date,
      end_date,
      time_start,
      time_end,
      status: 'scheduled',
      metadata: metadata || null,
      created_by: user.id
    }

    const { data: campaign, error } = await supabase.from('campaigns').insert(payload).select().single()
    if (error) throw error

    try { await logAudit(supabase, user.id, profile.full_name || user.email, 'campaign.create', 'campaign', campaign.id, { project_id }) } catch (e) { }

    return handleCORS(NextResponse.json({ campaign }))
  } catch (e) {
    console.error('campaigns POST error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
