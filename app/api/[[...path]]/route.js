import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission, getUserPermissions, logAudit } from '@/lib/permissions'

// CORS helper
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// Handle OPTIONS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 204 }))
}

// Main GET handler
export async function GET(request) {
  const { pathname } = new URL(request.url)
  const path = pathname.replace('/api', '')

  try {
    const supabase = await createServerSupabaseClient()

    // Public routes
    if (path === '/health') {
      return handleCORS(NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() }))
    }

    if (path === '/auth/user') {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return handleCORS(NextResponse.json({ user: null }, { status: 401 }))
      }

      // Get user profile with organization and role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations(id, name, onboarding_status),
          role:roles(id, name, is_platform_admin)
        `)
        .eq('id', user.id)
        .single()

      // Log error for debugging
      if (profileError) {
        console.error('Profile fetch error:', profileError)
      }

      // Get user permissions
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
    }

    // Protected routes - require authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(name, is_platform_admin)')
      .eq('id', user.id)
      .single()

    // Organizations
    if (path === '/organizations' || path === '/organizations/') {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return handleCORS(NextResponse.json({ organizations: data || [] }))
    }

    // Users - requires users.view permission or super admin
    if (path === '/users' || path === '/users/') {
      const canView = await hasPermission(supabase, user.id, 'users.create') || 
                      await hasPermission(supabase, user.id, 'users.edit')

      if (!canView && !profile?.is_platform_admin) {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      // Get users in same organization
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations(id, name),
          role:roles(id, name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return handleCORS(NextResponse.json({ users: data || [] }))
    }

    // Roles
    if (path === '/roles' || path === '/roles/') {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_platform_admin', false)
        .order('name')

      if (error) throw error
      return handleCORS(NextResponse.json({ roles: data || [] }))
    }

    // Features
    if (path === '/features' || path === '/features/') {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('category', { ascending: true })

      if (error) throw error
      return handleCORS(NextResponse.json({ features: data || [] }))
    }

    // Audit Logs
    if (path === '/audit' || path === '/audit/' || path.startsWith('/audit?')) {
      const canView = await hasPermission(supabase, user.id, 'audit.view')

      if (!canView && !profile?.is_platform_admin) {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      const { searchParams } = new URL(request.url)
      const limit = parseInt(searchParams.get('limit') || '50')

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      // Filter by organization unless platform admin
      if (!profile?.is_platform_admin) {
        const { data: orgUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('organization_id', profile.organization_id)

        const userIds = orgUsers?.map(u => u.id) || []
        query = query.in('user_id', userIds)
      }

      const { data, error } = await query

      if (error) throw error
      return handleCORS(NextResponse.json({ logs: data || [] }))
    }

    // Get organization profile (for onboarding)
    if (path === '/organization/profile' || path === '/organization/profile/') {
      if (profile?.is_platform_admin) {
        return handleCORS(NextResponse.json({ 
          error: 'Platform admins cannot access organization profile' 
        }, { status: 403 }))
      }

      const { data: orgProfile, error: profileError } = await supabase
        .from('organization_profiles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .single()

      // Return empty object if no profile exists yet
      return handleCORS(NextResponse.json({ 
        profile: orgProfile || {},
        organization_id: profile.organization_id
      }))
    }

    // ==================== PLATFORM ADMIN ROUTES ====================
    // Only accessible to users with is_platform_admin = true
    
    if (path.startsWith('/platform/')) {
      // Check platform admin access
      if (!profile?.is_platform_admin) {
        return handleCORS(NextResponse.json({ error: 'Platform Admin access required' }, { status: 403 }))
      }

      // Platform: List all organizations
      if (path === '/platform/organizations' || path === '/platform/organizations/') {
        const { data, error } = await supabase
          .from('organizations')
          .select(`
            *,
            _count:profiles(count),
            profile:organization_profiles(*)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        return handleCORS(NextResponse.json({ organizations: data || [] }))
      }

      // Platform: Get specific organization details
      if (path.match(/^\/platform\/organizations\/[a-f0-9-]+$/)) {
        const orgId = path.split('/').pop()

        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select(`
            *,
            profile:organization_profiles(*),
            users:profiles(
              id, email, full_name, role:roles(name), created_at
            )
          `)
          .eq('id', orgId)
          .single()

        if (orgError) throw orgError

        return handleCORS(NextResponse.json({ organization: org }))
      }

      // Platform: Get platform audit logs
      if (path === '/platform/audit' || path === '/platform/audit/') {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '100')

        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) throw error
        return handleCORS(NextResponse.json({ logs: data || [] }))
      }

      // Platform: Get impersonation sessions
      if (path === '/platform/impersonations' || path === '/platform/impersonations/') {
        const { data, error } = await supabase
          .from('impersonation_sessions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        return handleCORS(NextResponse.json({ sessions: data || [] }))
      }
    }

    return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
  }
}

// Main POST handler
export async function POST(request) {
  const { pathname } = new URL(request.url)
  const path = pathname.replace('/api', '')

  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    // Auth endpoints
    if (path === '/auth/signup') {
      const { email, password } = body

      if (!email || !password) {
        return handleCORS(NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        ))
      }

      // Sign up the user - this only creates the auth user
      // Organization setup happens in /api/onboard
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        return handleCORS(NextResponse.json({ error: signUpError.message }, { status: 400 }))
      }

      return handleCORS(NextResponse.json({
        message: 'Signup successful',
        user: authData.user
      }))
    }

    // Onboarding endpoint - creates organization and sets up user profile
    // This runs AFTER signup and uses SERVICE ROLE for admin operations
    if (path === '/onboard' || path === '/onboard/') {
      console.log('🚀 [ONBOARD] Endpoint hit')
      
      // Get authenticated user from session
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('❌ [ONBOARD] Auth error:', authError)
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      console.log('👤 [ONBOARD] User authenticated:', user.email)

      const { fullName, organizationName } = body

      // Check if user already has an organization (idempotent)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('organization_id, full_name')
        .eq('id', user.id)
        .single()

      console.log('🔍 [ONBOARD] Existing profile check:', existingProfile)

      if (existingProfile?.organization_id) {
        console.log('✅ [ONBOARD] User already has organization, skipping')
        return handleCORS(NextResponse.json({
          message: 'User already onboarded',
          alreadyOnboarded: true
        }))
      }

      // Use SERVICE ROLE client for admin operations
      // This bypasses RLS and allows us to create organization and update profile
      const adminClient = createAdminClient()

      try {
        console.log('📝 [ONBOARD] Creating organization:', organizationName)
        
        // 1. Create organization with PENDING onboarding status
        const { data: org, error: orgError } = await adminClient
          .from('organizations')
          .insert({ 
            name: organizationName || 'My Organization',
            onboarding_status: 'PENDING'
          })
          .select()
          .single()

        if (orgError) {
          console.error('❌ [ONBOARD] Organization creation error:', orgError)
          throw new Error('Failed to create organization')
        }

        console.log('✅ [ONBOARD] Organization created:', org.id)

        // 2. Create organization_profile (business profile)
        console.log('📝 [ONBOARD] Creating organization profile')
        const { error: orgProfileError } = await adminClient
          .from('organization_profiles')
          .insert({
            organization_id: org.id,
            sector: 'real_estate', // Default and only enabled sector
            country: 'India' // Default
          })

        if (orgProfileError) {
          console.error('⚠️ [ONBOARD] Organization profile creation error:', orgProfileError)
          // Don't fail onboarding if org profile fails - can be created later
        } else {
          console.log('✅ [ONBOARD] Organization profile created')
        }

        // 3. Get Client Super Admin role
        console.log('🔍 [ONBOARD] Fetching Client Super Admin role')
        const { data: role, error: roleError } = await adminClient
          .from('roles')
          .select('id')
          .eq('name', 'Client Super Admin')
          .single()

        if (roleError || !role) {
          console.error('❌ [ONBOARD] Role fetch error:', roleError)
          throw new Error('Failed to fetch role')
        }

        console.log('✅ [ONBOARD] Role found:', role.id)

        // 4. Update profile with organization and role
        console.log('📝 [ONBOARD] Updating user profile')
        const { error: profileError } = await adminClient
          .from('profiles')
          .update({
            organization_id: org.id,
            role_id: role.id,
            full_name: fullName || null,
            is_platform_admin: false
          })
          .eq('id', user.id)

        if (profileError) {
          console.error('❌ [ONBOARD] Profile update error:', profileError)
          throw new Error('Failed to update profile')
        }

        console.log('✅ [ONBOARD] Profile updated successfully')

        // 5. Create audit log entry
        console.log('📝 [ONBOARD] Creating audit log')
        await adminClient
          .from('audit_logs')
          .insert({
            user_id: user.id,
            user_name: fullName || user.email,
            action: 'ORG_CREATED',
            entity_type: 'organization',
            entity_id: org.id,
            metadata: { 
              organization_name: org.name,
              onboarding_status: 'PENDING'
            },
            created_at: new Date().toISOString()
          })

        console.log('🎉 [ONBOARD] Onboarding complete!')

        return handleCORS(NextResponse.json({
          message: 'Onboarding successful',
          organization: org,
          onboarding_status: 'PENDING'
        }))

      } catch (error) {
        console.error('💥 [ONBOARD] Fatal error:', error)
        return handleCORS(NextResponse.json(
          { error: error.message || 'Onboarding failed' },
          { status: 500 }
        ))
      }
    }

    if (path === '/auth/signin') {
      const { email, password, isPlatformAdmin } = body

      if (!email || !password) {
        return handleCORS(NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        ))
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 401 }))
      }

      // Check if platform admin login
      if (isPlatformAdmin) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_platform_admin')
          .eq('id', data.user.id)
          .single()

        if (!profile?.is_platform_admin) {
          await supabase.auth.signOut()
          return handleCORS(NextResponse.json(
            { error: 'Not authorized as platform admin' },
            { status: 403 }
          ))
        }
      }

      return handleCORS(NextResponse.json({
        message: 'Login successful',
        user: data.user,
        session: data.session
      }))
    }

    if (path === '/auth/signout') {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }))
      }

      return handleCORS(NextResponse.json({ message: 'Signed out successfully' }))
    }

    // Protected routes
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(name)')
      .eq('id', user.id)
      .single()

    // Create user
    if (path === '/users' || path === '/users/') {
      const canCreate = await hasPermission(supabase, user.id, 'users.create')

      if (!canCreate && !profile?.is_platform_admin) {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      const { email, password, fullName, roleId } = body

      if (!email || !password || !roleId) {
        return handleCORS(NextResponse.json(
          { error: 'Email, password, and role are required' },
          { status: 400 }
        ))
      }

      // Create auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

      if (createError) {
        return handleCORS(NextResponse.json({ error: createError.message }, { status: 400 }))
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          organization_id: profile.organization_id,
          role_id: roleId,
          full_name: fullName || null
        })
        .eq('id', newUser.user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
      }

      // Log audit
      await logAudit(
        supabase,
        user.id,
        profile.full_name || user.email,
        'user.created',
        'user',
        newUser.user.id,
        { email, role_id: roleId }
      )

      return handleCORS(NextResponse.json({
        message: 'User created successfully',
        user: newUser.user
      }))
    }

    // ==================== PLATFORM ADMIN: IMPERSONATION ====================
    // Platform Admin can impersonate org users
    if (path === '/platform/impersonate' || path === '/platform/impersonate/') {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // Verify platform admin
      const { data: impersonatorProfile } = await supabase
        .from('profiles')
        .select('is_platform_admin')
        .eq('id', user.id)
        .single()

      if (!impersonatorProfile?.is_platform_admin) {
        return handleCORS(NextResponse.json({ 
          error: 'Only Platform Admins can impersonate users' 
        }, { status: 403 }))
      }

      const { targetUserId, organizationId } = body

      if (!targetUserId || !organizationId) {
        return handleCORS(NextResponse.json({ 
          error: 'targetUserId and organizationId are required' 
        }, { status: 400 }))
      }

      // Use SERVICE ROLE for impersonation operations
      const adminClient = createAdminClient()

      try {
        // Verify target user exists and belongs to org
        const { data: targetProfile, error: targetError } = await adminClient
          .from('profiles')
          .select('*, organization:organizations(name), role:roles(name)')
          .eq('id', targetUserId)
          .eq('organization_id', organizationId)
          .single()

        if (targetError || !targetProfile) {
          throw new Error('Target user not found in specified organization')
        }

        // End any existing active impersonation sessions for this impersonator
        await adminClient
          .from('impersonation_sessions')
          .update({ 
            is_active: false, 
            ended_at: new Date().toISOString() 
          })
          .eq('impersonator_user_id', user.id)
          .eq('is_active', true)

        // Create new impersonation session
        const { data: session, error: sessionError } = await adminClient
          .from('impersonation_sessions')
          .insert({
            impersonator_user_id: user.id,
            impersonated_user_id: targetUserId,
            impersonated_org_id: organizationId,
            is_active: true
          })
          .select()
          .single()

        if (sessionError) {
          throw new Error('Failed to create impersonation session')
        }

        // Log impersonation start in audit logs
        await adminClient
          .from('audit_logs')
          .insert({
            user_id: user.id,
            user_name: 'Platform Admin',
            action: 'IMPERSONATION_STARTED',
            entity_type: 'user',
            entity_id: targetUserId,
            is_impersonated: false,
            metadata: {
              target_user_email: targetProfile.email,
              target_organization: targetProfile.organization.name,
              impersonation_session_id: session.id
            }
          })

        return handleCORS(NextResponse.json({
          message: 'Impersonation started',
          session: session,
          targetUser: {
            id: targetProfile.id,
            email: targetProfile.email,
            name: targetProfile.full_name,
            role: targetProfile.role.name,
            organization: targetProfile.organization.name
          }
        }))

      } catch (error) {
        console.error('Impersonation error:', error)
        return handleCORS(NextResponse.json(
          { error: error.message || 'Impersonation failed' },
          { status: 500 }
        ))
      }
    }

    // End impersonation
    if (path === '/platform/end-impersonation' || path === '/platform/end-impersonation/') {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const adminClient = createAdminClient()

      try {
        // End active impersonation sessions
        const { error: endError } = await adminClient
          .from('impersonation_sessions')
          .update({ 
            is_active: false, 
            ended_at: new Date().toISOString() 
          })
          .eq('impersonator_user_id', user.id)
          .eq('is_active', true)

        if (endError) {
          throw new Error('Failed to end impersonation')
        }

        // Log impersonation end
        await adminClient
          .from('audit_logs')
          .insert({
            user_id: user.id,
            user_name: 'Platform Admin',
            action: 'IMPERSONATION_ENDED',
            entity_type: 'session',
            entity_id: null
          })

        return handleCORS(NextResponse.json({
          message: 'Impersonation ended'
        }))

      } catch (error) {
        console.error('End impersonation error:', error)
        return handleCORS(NextResponse.json(
          { error: error.message || 'Failed to end impersonation' },
          { status: 500 }
        ))
      }
    }

    // ==================== ORGANIZATION PROFILE (ONBOARDING) ====================
    // Save organization profile (draft or complete)
    if (path === '/organization/profile' || path === '/organization/profile/') {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // Get user's profile and verify they're Org Super Admin
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('organization_id, role:roles(name), is_platform_admin')
        .eq('id', user.id)
        .single()

      if (!userProfile || userProfile.is_platform_admin) {
        return handleCORS(NextResponse.json({ 
          error: 'Only organization users can update profile' 
        }, { status: 403 }))
      }

      if (userProfile.role?.name !== 'Client Super Admin') {
        return handleCORS(NextResponse.json({ 
          error: 'Only Organization Super Admin can complete onboarding' 
        }, { status: 403 }))
      }

      const { 
        sector,
        businessType,
        companyName,
        gstin,
        contactNumber,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        pincode,
        isComplete
      } = body

      const adminClient = createAdminClient()

      try {
        // Upsert organization profile
        const profileData = {
          organization_id: userProfile.organization_id,
          sector: sector || 'real_estate',
          business_type: businessType,
          company_name: companyName,
          gstin: gstin || null,
          contact_number: contactNumber,
          address_line_1: addressLine1,
          address_line_2: addressLine2 || null,
          city: city,
          state: state,
          country: country || 'India',
          pincode: pincode,
          updated_at: new Date().toISOString()
        }

        const { error: profileError } = await adminClient
          .from('organization_profiles')
          .upsert(profileData, {
            onConflict: 'organization_id'
          })

        if (profileError) {
          console.error('Profile upsert error:', profileError)
          throw new Error('Failed to save organization profile')
        }

        // If completing onboarding, update organization status
        if (isComplete) {
          const { error: orgError } = await adminClient
            .from('organizations')
            .update({ 
              onboarding_status: 'COMPLETED',
              updated_at: new Date().toISOString()
            })
            .eq('id', userProfile.organization_id)

          if (orgError) {
            console.error('Organization status update error:', orgError)
            throw new Error('Failed to complete onboarding')
          }

          // Create audit log for onboarding completion
          await adminClient
            .from('audit_logs')
            .insert({
              user_id: user.id,
              user_name: user.email,
              action: 'ONBOARDING_COMPLETED',
              entity_type: 'organization',
              entity_id: userProfile.organization_id,
              metadata: { company_name: companyName },
              created_at: new Date().toISOString()
            })
        }

        return handleCORS(NextResponse.json({
          message: isComplete ? 'Onboarding completed successfully' : 'Profile saved as draft',
          completed: isComplete || false
        }))

      } catch (error) {
        console.error('Organization profile error:', error)
        return handleCORS(NextResponse.json(
          { error: error.message || 'Failed to save profile' },
          { status: 500 }
        ))
      }
    }

    return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
  }
}

// Main PUT handler
export async function PUT(request) {
  const { pathname } = new URL(request.url)
  const path = pathname.replace('/api', '')

  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    // Protected routes
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Update user permissions
    if (path.startsWith('/users/') && path.includes('/permissions')) {
      const canEdit = await hasPermission(supabase, user.id, 'users.edit')

      if (!canEdit && !profile?.is_platform_admin) {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      const userId = path.split('/')[2]
      const { featureId, granted } = body

      // Upsert user permission
      const { error } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: userId,
          feature_id: featureId,
          granted
        })

      if (error) throw error

      // Log audit
      await logAudit(
        supabase,
        user.id,
        profile.full_name || user.email,
        'user.permissions_updated',
        'user',
        userId,
        { feature_id: featureId, granted }
      )

      return handleCORS(NextResponse.json({ message: 'Permission updated successfully' }))
    }

    return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
  }
}

// Main DELETE handler
export async function DELETE(request) {
  const { pathname } = new URL(request.url)
  const path = pathname.replace('/api', '')

  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
  }
}
