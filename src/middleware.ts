import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const adminLogin = (process.env.ADMIN_GITHUB_LOGIN || "chiboy-star").toLowerCase();
  const path = req.nextUrl.pathname;

  if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
    const isDev = process.env.NODE_ENV === "development";
    const devBypass = isDev && process.env.ADMIN_DEV_BYPASS === "true";

    if (!isDev && process.env.ADMIN_DEV_BYPASS === "true") {
      console.warn("[Security Alert] ADMIN_DEV_BYPASS is forbidden and ignored in production builds.");
    }

    if (devBypass) {
      return NextResponse.next();
    }

    // In development without OAuth configured, allow previewing the admin panel
    if (isDev && (!process.env.AUTH_GITHUB_ID || !process.env.AUTH_GITHUB_SECRET)) {
      return NextResponse.next();
    }

    const user = req.auth?.user;
    const userLogin = user?.login?.toLowerCase() || user?.name?.toLowerCase();

    if (!user || userLogin !== adminLogin) {
      if (path.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
