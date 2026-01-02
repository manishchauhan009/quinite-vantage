import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/permissions'

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

    const { data: profile } = await supabase.from('profiles').select('organization_id, is_platform_admin').eq('id', user.id).single()

    const canView = await hasPermission(supabase, user.id, 'audit.view')
    if (!canView && !profile?.is_platform_admin) return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit)
    if (!profile?.is_platform_admin) {
      const { data: orgUsers } = await supabase.from('profiles').select('id').eq('organization_id', profile.organization_id)
      const userIds = orgUsers?.map(u => u.id) || []
      query = query.in('user_id', userIds)
    }

    const { data, error } = await query
    if (error) throw error
    return handleCORS(NextResponse.json({ logs: data || [] }))
  } catch (e) {
    console.error('audit GET error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
