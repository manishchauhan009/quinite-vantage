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

    const { data: profile } = await supabase.from('profiles').select('organization_id, is_platform_admin').eq('id', user.id).single()

    const canView = true // permission checks can be added here

    if (!canView && !profile?.is_platform_admin) return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))

    const { data, error } = await supabase.from('profiles').select(`*, organization:organizations(id, name), role:roles(id, name)`).eq('organization_id', profile.organization_id).order('created_at', { ascending: false })
    if (error) throw error
    return handleCORS(NextResponse.json({ users: data || [] }))
  } catch (e) {
    console.error('users GET error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const { data: profile } = await supabase.from('profiles').select('organization_id, full_name, is_platform_admin').eq('id', user.id).single()

    const canCreate = true // permission checks can be added
    if (!canCreate && !profile?.is_platform_admin) return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))

    const body = await request.json()
    const { email, password, fullName, roleId } = body
    if (!email || !password || !roleId) return handleCORS(NextResponse.json({ error: 'Email, password, and role are required' }, { status: 400 }))

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
    if (createError) return handleCORS(NextResponse.json({ error: createError.message }, { status: 400 }))

    const { error: updateError } = await supabase.from('profiles').update({ organization_id: profile.organization_id, role_id: roleId, full_name: fullName || null }).eq('id', newUser.user.id)
    if (updateError) console.error('Profile update error:', updateError)

    await logAudit(supabase, user.id, profile.full_name || user.email, 'user.created', 'user', newUser.user.id, { email, role_id: roleId })

    return handleCORS(NextResponse.json({ message: 'User created successfully', user: newUser.user }))
  } catch (e) {
    console.error('users POST error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
