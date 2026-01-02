import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from('organizations').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return handleCORS(NextResponse.json({ organizations: data || [] }))
  } catch (e) {
    console.error('organizations GET error:', e)
    return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
