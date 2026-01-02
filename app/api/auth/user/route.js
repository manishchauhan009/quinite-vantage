import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserPermissions } from '@/lib/permissions'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) return handleCORS(NextResponse.json({ user: null }, { status: 401 }))

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`*, organization:organizations(id, name, onboarding_status), role:roles(id, name, is_platform_admin)`)
      .eq('id', user.id)
      .single()

    if (profileError) console.error('Profile fetch error:', profileError)

    const permissions = await getUserPermissions(supabase, user.id)

    return handleCORS(NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        profile,
        profileError: profileError ? profileError.message : null,
        permissions
      }
    }))
  } catch (e) {
    console.error('auth/user error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
