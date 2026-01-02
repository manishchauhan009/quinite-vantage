import { NextResponse } from 'next/server'

// Lightweight fallback for any unmatched /api/* routes after refactor.
export async function GET() {
  return NextResponse.json({ error: 'This API has been refactored. Use specific endpoints under /api' }, { status: 404 })
}

export async function POST() {
  return NextResponse.json({ error: 'This API has been refactored. Use specific endpoints under /api' }, { status: 404 })
}

export async function PUT() {
  return NextResponse.json({ error: 'This API has been refactored. Use specific endpoints under /api' }, { status: 404 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'This API has been refactored. Use specific endpoints under /api' }, { status: 404 })
}
import { NextResponse } from 'next/server'

// This file is a fallback for any unmatched /api/* routes after refactor.
export async function GET() {
  return NextResponse.json({ error: 'This API has been refactored. Use specific endpoints under /api' }, { status: 404 })
}

export async function POST() {
  return NextResponse.json({ error: 'This API has been refactored. Use specific endpoints under /api' }, { status: 404 })
}

export async function PUT() {
  return NextResponse.json({ error: 'This API has been refactored. Use specific endpoints under /api' }, { status: 404 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'This API has been refactored. Use specific endpoints under /api' }, { status: 404 })
}

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
