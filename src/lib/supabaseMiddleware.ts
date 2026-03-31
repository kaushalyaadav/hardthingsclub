import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  return supabase.auth.getUser().then(async ({ data }) => {
    const user = data.user;
    const path = request.nextUrl.pathname;
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
