import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { email, password, isPlatformAdmin } = body

    if (!email || !password) return handleCORS(NextResponse.json({ error: 'Email and password are required' }, { status: 400 }))

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return handleCORS(NextResponse.json({ error: error.message }, { status: 401 }))

    if (isPlatformAdmin) {
      const { data: profile } = await supabase.from('profiles').select('is_platform_admin').eq('id', data.user.id).single()
      if (!profile?.is_platform_admin) {
        await supabase.auth.signOut()
        return handleCORS(NextResponse.json({ error: 'Not authorized as platform admin' }, { status: 403 }))
      }
    }

    return handleCORS(NextResponse.json({ message: 'Login successful', user: data.user, session: data.session }))
  } catch (e) {
    console.error('auth/signin error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
