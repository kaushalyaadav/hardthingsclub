import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseConfig } from "@/lib/supabaseEnv";
import { NextResponse, type NextRequest } from "next/server";

export function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!hasSupabaseConfig()) {
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        {
          error:
            "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (see .env.example)."
        },
        { status: 503 }
      );
    }
    if (path === "/" || path.startsWith("/_next") || path === "/favicon.ico") {
      return NextResponse.next({ request });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("env", "missing");
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  return supabase.auth.getUser().then(async ({ data }) => {
    const user = data.user;
    const isAuthPath = path === "/";
    const isProtected = path.startsWith("/home") || path.startsWith("/log") || path.startsWith("/progress") || path.startsWith("/journal") || path.startsWith("/admin");

    if (!user && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    if (user && isAuthPath) {
      const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
      const isAdminByEmail = !!adminEmail && user.email?.toLowerCase() === adminEmail;
      const url = request.nextUrl.clone();
      url.pathname = isAdminByEmail ? "/admin" : "/home";
      return NextResponse.redirect(url);
    }

    if (user && path.startsWith("/admin")) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/home";
        return NextResponse.redirect(url);
      }
    }

    return response;
  });
}
