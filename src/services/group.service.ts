import { createServerSupabaseClient } from '@/lib/supabase/server'

export const GroupService = {

  // Get all groups for a tenant
  async getByTenant(tenantId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('groups')
      .select('*, users!groups_created_by_fkey(full_name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) return []
    return data
  },

  // Get a single group
  async getById(groupId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    if (error) return null
    return data
  },

  // Get groups a student belongs to
  async getByStudent(studentId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('group_members')
      .select('*, groups(id, name, description, academic_session)')
      .eq('student_id', studentId)

    if (error) return []
    return data
  },

  // Create a group
  async create(data: {
    tenant_id: string
    created_by: string
    name: string
    description?: string
    academic_session?: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { data: group, error } = await supabase
      .from('groups')
      .insert(data)
      .select()
      .single()

    if (error) return null
    return group
  },

  // Update a group
  async update(groupId: string, data: {
    name?: string
    description?: string
    academic_session?: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('groups')
      .update(data)
      .eq('id', groupId)

    return !error
  },

  // Delete a group
  async delete(groupId: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)

    return !error
  },

  // Add a student to a group
  async addMember(groupId: string, studentId: string, tenantId: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('group_members')
      .upsert(
        { group_id: groupId, student_id: studentId, tenant_id: tenantId },
        { onConflict: 'group_id,student_id' }
      )

    return !error
  },

  // Remove a student from a group
  async removeMember(groupId: string, studentId: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('student_id', studentId)

    return !error
  },

  // Get member counts for all groups in a tenant (single DB query via RPC)
  async getMemberCounts(tenantId: string): Promise<Record<string, number>> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .rpc('get_group_member_counts', { p_tenant_id: tenantId })

    if (error || !data) return {}

    const counts: Record<string, number> = {}
    data.forEach((r: { group_id: string; member_count: number }) => {
      counts[r.group_id] = Number(r.member_count)
    })
    return counts
  },

  // Get group stats via RPC (single optimized query)
  async getGroupStats(groupId: string): Promise<{
    totalStudents: number
    avgAttendance: number | null
    avgGrade: number | null
  }> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .rpc('get_group_stats', { p_group_id: groupId })

    if (error || !data || data.length === 0) {
      return { totalStudents: 0, avgAttendance: null, avgGrade: null }
    }

    const row = data[0]
    return {
      totalStudents: Number(row.total_students),
      avgAttendance: row.avg_attendance != null ? Number(row.avg_attendance) : null,
      avgGrade: row.avg_grade != null ? Number(row.avg_grade) : null,
    }
  },

  // Get at-risk students in a group via RPC
  async getAtRiskStudents(groupId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .rpc('get_at_risk_students', { p_group_id: groupId })

    if (error || !data) return []
    return data
  },

  // Get paginated members
  async getMembersPaginated(groupId: string, page = 0, limit = 20) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .rpc('get_group_members_paginated', {
        p_group_id: groupId,
        p_limit: limit,
        p_offset: page * limit,
      })

    if (error || !data) return { members: [], total: 0 }

    return {
      members: data,
      total: data.length > 0 ? Number(data[0].total_count) : 0,
    }
  },
}