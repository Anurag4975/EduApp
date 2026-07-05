import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const roleRedirects: Record<string, string> = {
  super_admin: "/admin/dashboard",
  institution_admin: "/institution/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
};

const protectedPrefixes = ["/admin", "/institution", "/teacher", "/student"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip proxy for login page to avoid redirect loops
  if (path === "/login"|| path.startsWith("/auth")) {
    return NextResponse.next();
  }

  // Skip proxy for root page
  if (path === "/") {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in and trying to access protected route
  if (!user && protectedPrefixes.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in but accessing wrong role's route
  if (user && protectedPrefixes.some((p) => path.startsWith(p))) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const correctBase = roleRedirects[profile?.role];
    const isOnWrongRoute =
      !correctBase ||
      !path.startsWith(correctBase.split("/").slice(0, 2).join("/"));

    if (isOnWrongRoute) {
      return NextResponse.redirect(
        new URL(correctBase ?? "/login", request.url),
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
