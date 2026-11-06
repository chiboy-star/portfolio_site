import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

const adminLogin = (process.env.ADMIN_GITHUB_LOGIN || "chiboy-star").toLowerCase();

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
            profile(profile) {
              return {
                id: String(profile.id),
                name: profile.name || profile.login,
                email: profile.email,
                image: profile.avatar_url,
                login: profile.login,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.login = profile.login || profile.name || null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.login) {
        session.user.login = token.login;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isDev = process.env.NODE_ENV === "development";
      const devBypass = isDev && process.env.ADMIN_DEV_BYPASS === "true";

      const isOnAdmin = nextUrl.pathname.startsWith("/admin");

      if (isOnAdmin) {
        if (devBypass) {
          return true;
        }

        if (isDev && (!process.env.AUTH_GITHUB_ID || !process.env.AUTH_GITHUB_SECRET)) {
          return true;
        }

        const isLoggedIn = !!auth?.user;
        const userLogin =
          auth?.user?.login?.toLowerCase() || auth?.user?.name?.toLowerCase();

        if (isLoggedIn && userLogin === adminLogin) {
          return true;
        }
        return false;
      }

      return true;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
});
