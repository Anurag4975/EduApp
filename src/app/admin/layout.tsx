import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") redirect("/login");

  return (
    <div style={styles.root}>
      <Sidebar
        sectionLabel="MAIN MENU"
        navItems={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "▦" },
          { label: "Institutions", href: "/admin/institutions", icon: "🏫" },
          { label: "Users", href: "/admin/users", icon: "👥" },
        ]}
      />
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
    width: "100%",
    overflowX: "hidden",
  },
  main: {
    marginLeft: "240px",
    flex: 1,
    padding: "32px",
    minWidth: 0,
    maxWidth: "calc(100% - 240px)",
    overflowX: "hidden",
  },
};