import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
import { createAdminClient as createAdmin } from '@/lib/supabase/admin'

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
    if (profile?.is_platform_admin) return handleCORS(NextResponse.json({ error: 'Platform admins cannot access organization profile' }, { status: 403 }))

    const { data: orgProfile } = await supabase.from('organization_profiles').select('*').eq('organization_id', profile.organization_id).single()
    return handleCORS(NextResponse.json({ profile: orgProfile || {}, organization_id: profile.organization_id }))
  } catch (e) {
    console.error('organizations/profile GET error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}

export async function PUT(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

    const { data: userProfile } = await supabase.from('profiles').select('organization_id, role:roles(name), is_platform_admin').eq('id', user.id).single()
    if (!userProfile || userProfile.is_platform_admin) return handleCORS(NextResponse.json({ error: 'Only organization users can update profile' }, { status: 403 }))
    if (userProfile.role?.name !== 'Client Super Admin') return handleCORS(NextResponse.json({ error: 'Only Organization Super Admin can complete onboarding' }, { status: 403 }))

    const adminClient = createAdmin()

    const profileData = Object.assign({}, body, { organization_id: userProfile.organization_id, updated_at: new Date().toISOString() })

    const { error } = await adminClient.from('organization_profiles').upsert(profileData, { onConflict: 'organization_id' })
    if (error) throw error

    if (body.isComplete) {
      const { error: orgError } = await adminClient.from('organizations').update({ onboarding_status: 'COMPLETED', updated_at: new Date().toISOString() }).eq('id', userProfile.organization_id)
      if (orgError) throw orgError
      await adminClient.from('audit_logs').insert({ user_id: user.id, user_name: user.email, action: 'ONBOARDING_COMPLETED', entity_type: 'organization', entity_id: userProfile.organization_id, metadata: { company_name: body.companyName }, created_at: new Date().toISOString() })
    }

    return handleCORS(NextResponse.json({ message: body.isComplete ? 'Onboarding completed successfully' : 'Profile saved as draft', completed: !!body.isComplete }))
  } catch (e) {
    console.error('organizations/profile PUT error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
