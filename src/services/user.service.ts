import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { User, UserRole } from "@/types";

export const UserService = {
  // Get current logged in user profile
  async getCurrentUser(): Promise<User | null> {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) return null;
    return data;
  },

  // Get all users by tenant
  async getByTenant(tenantId: string): Promise<User[]> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) return [];
    return data;
  },

  // Get all users by role within a tenant
  async getByRole(tenantId: string, role: UserRole): Promise<User[]> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("role", role)
      .order("created_at", { ascending: false });

    if (error) return [];
    return data;
  },

  // Get all users across platform (super admin only)
  async getAll(): Promise<User[]> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return [];
    return data;
  },

  // Invite new user to a tenant
  async invite(data: {
  email: string
  full_name: string
  role: UserRole
  tenant_id: string | null
}): Promise<{ success: boolean; error?: string }> {
  const supabaseAdmin = createAdminSupabaseClient()

  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    data.email,
    {
      data: {
        full_name: data.full_name,
        role: data.role,
        tenant_id: data.tenant_id,
      },
    }
  )

  if (inviteError) {
    return { success: false, error: inviteError.message }
  }

  return { success: true }
},

  // Update user role
  async updateRole(userId: string, role: UserRole): Promise<boolean> {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", userId);

    return !error;
  },

  // Toggle user active status
  async toggleStatus(userId: string, is_active: boolean): Promise<boolean> {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from("users")
      .update({ is_active })
      .eq("id", userId);

    return !error;
  },

  // Update user profile
  async updateProfile(
    userId: string,
    data: Partial<Pick<User, "full_name" | "avatar_url">>,
  ): Promise<boolean> {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from("users")
      .update(data)
      .eq("id", userId);

    return !error;
  },
};
