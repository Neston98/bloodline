import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { logger } from "@/lib/logger"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthPage = path.startsWith("/auth/")
  const isAdminAuthPage = path === "/admin/login"
  const isAdminRoute = path.startsWith("/admin/") && path !== "/admin/login"

  logger.info("middleware", `request ${request.method} ${path}`, {
    hasUser: !!user,
    isAuthPage,
    isAdminRoute,
  })

  if (isAdminRoute) {
    if (!user) {
      logger.info("middleware", `redirect unauthenticated admin from ${path} to /admin/login`)
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }

    const role = user.user_metadata?.role
    if (role !== "admin") {
      logger.warn("middleware", `non-admin user ${user.id} attempted admin route ${path}`, { role })
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  if (!user && !isAuthPage && !isAdminAuthPage && path !== "/") {
    logger.info("middleware", `redirect unauthenticated user from ${path} to /auth/login`)
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
