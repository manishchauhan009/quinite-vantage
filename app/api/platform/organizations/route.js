import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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

    const { data: profile } = await supabase.from('profiles').select('is_platform_admin').eq('id', user.id).single()
    if (!profile?.is_platform_admin) return handleCORS(NextResponse.json({ error: 'Platform Admin access required' }, { status: 403 }))

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (id) {
      const { data: org, error } = await supabase.from('organizations').select(`*, profile:organization_profiles(*), users:profiles(id, email, full_name, role:roles(name), created_at)`).eq('id', id).single()
      if (error) throw error
      return handleCORS(NextResponse.json({ organization: org }))
    }

    const { data, error } = await supabase.from('organizations').select(`*, _count:profiles(count), profile:organization_profiles(*)`).order('created_at', { ascending: false })
    if (error) throw error
    return handleCORS(NextResponse.json({ organizations: data || [] }))
  } catch (e) {
    console.error('platform/organizations GET error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
