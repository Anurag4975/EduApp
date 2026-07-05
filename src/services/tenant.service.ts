import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Tenant, TenantWithStats, AdminStats } from "@/types";

export const TenantService = {
  // Get all tenants (super admin only)
  async getAll(): Promise<TenantWithStats[]> {
    const supabase = await createServerSupabaseClient();

    const { data: tenants, error } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !tenants) return [];

    // Get stats for each tenant
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const [teachers, students, courses] = await Promise.all([
          supabase
            .from("users")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenant.id)
            .eq("role", "teacher"),
          supabase
            .from("users")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenant.id)
            .eq("role", "student"),
          supabase
            .from("courses")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenant.id),
        ]);

        return {
          ...tenant,
          teacherCount: teachers.count ?? 0,
          studentCount: students.count ?? 0,
          courseCount: courses.count ?? 0,
        };
      }),
    );

    return tenantsWithStats;
  },

  // Get single tenant by id
  async getById(id: string): Promise<Tenant | null> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  },
  // Get stats for ONE specific institution (for institution admin dashboard)
async getInstitutionStats(tenantId: string) {
  const supabase = await createServerSupabaseClient()

  const [teachers, students, courses, departments] = await Promise.all([
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('role', 'teacher'),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('role', 'student'),
    supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase
      .from('departments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
  ])

  return {
    totalTeachers: teachers.count ?? 0,
    totalStudents: students.count ?? 0,
    totalCourses: courses.count ?? 0,
    totalDepartments: departments.count ?? 0,
  }
},

  // Get platform wide stats for super admin dashboard
  async getAdminStats(): Promise<AdminStats> {
    const supabase = await createServerSupabaseClient();

    const [institutions, teachers, students, courses] = await Promise.all([
      supabase
        .from("tenants")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "teacher"),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "student"),
      supabase.from("courses").select("id", { count: "exact", head: true }),
    ]);

    return {
      totalInstitutions: institutions.count ?? 0,
      totalTeachers: teachers.count ?? 0,
      totalStudents: students.count ?? 0,
      totalCourses: courses.count ?? 0,
    };
  },

  // Create new tenant
  async create(data: {
    name: string;
    slug: string;
    primary_color?: string;
  }): Promise<Tenant | null> {
    const supabase = await createServerSupabaseClient();

    const { data: tenant, error } = await supabase
      .from("tenants")
      .insert({
        name: data.name,
        slug: data.slug,
        primary_color: data.primary_color ?? "#6366f1",
        is_active: true,
      })
      .select()
      .single();

    if (error) return null;
    return tenant;
  },

  // Toggle tenant active status
  async toggleStatus(id: string, is_active: boolean): Promise<boolean> {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from("tenants")
      .update({ is_active })
      .eq("id", id);

    return !error;
  },

  async getGradingScale(tenantId: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('tenants')
    .select('grading_scale')
    .eq('id', tenantId)
    .single()

  return data?.grading_scale ?? 'percentage'
},

async updateGradingScale(tenantId: string, scale: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('tenants')
    .update({ grading_scale: scale })
    .eq('id', tenantId)

  return !error
},
};
