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
    const { email, password } = body

    if (!email || !password) {
      return handleCORS(NextResponse.json({ error: 'Email and password are required' }, { status: 400 }))
    }

    const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) return handleCORS(NextResponse.json({ error: signUpError.message }, { status: 400 }))

    return handleCORS(NextResponse.json({ message: 'Signup successful', user: authData.user }))
  } catch (e) {
    console.error('auth/signup error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
