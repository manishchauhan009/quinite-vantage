// Permission checking utilities

/**
 * Check if user has a specific permission
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {string} featureName - Feature name (e.g., 'project.create')
 * @returns {Promise<boolean>}
 */
export async function hasPermission(supabase, userId, featureName) {
  try {
    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role_id, is_platform_admin')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return false
    }

    // Platform admins have all permissions
    if (profile.is_platform_admin) {
      return true
    }

    // Check user-specific permission overrides first
    const { data: userPerm } = await supabase
      .from('user_permissions')
      .select('granted, features(name)')
      .eq('user_id', userId)
      .eq('features.name', featureName)
      .single()

    if (userPerm) {
      return userPerm.granted
    }

    // Check role permissions
    const { data: rolePerm } = await supabase
      .from('role_permissions')
      .select('features(name)')
      .eq('role_id', profile.role_id)
      .eq('features.name', featureName)
      .single()

    return !!rolePerm
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Get all permissions for a user
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @returns {Promise<string[]>}
 */
export async function getUserPermissions(supabase, userId) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, is_platform_admin')
      .eq('id', userId)
      .single()

    if (!profile) return []

    // Platform admins get all permissions
    if (profile.is_platform_admin) {
      const { data: allFeatures } = await supabase
        .from('features')
        .select('name')
      return allFeatures?.map(f => f.name) || []
    }

    // Get role permissions
    const { data: rolePerms } = await supabase
      .from('role_permissions')
      .select('features(name)')
      .eq('role_id', profile.role_id)

    const permissions = new Set(rolePerms?.map(rp => rp.features.name) || [])

    // Apply user-specific overrides
    const { data: userPerms } = await supabase
      .from('user_permissions')
      .select('granted, features(name)')
      .eq('user_id', userId)

    userPerms?.forEach(up => {
      if (up.granted) {
        permissions.add(up.features.name)
      } else {
        permissions.delete(up.features.name)
      }
    })

    return Array.from(permissions)
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return []
  }
}

/**
 * Log an audit event
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {string} userName - User name
 * @param {string} action - Action performed
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @param {Object} metadata - Additional metadata
 */
export async function logAudit(supabase, userId, userName, action, entityType, entityId, metadata = {}) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      user_name: userName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error logging audit:', error)
  }
}