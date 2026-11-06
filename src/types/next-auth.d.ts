import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    login?: string | null;
  }
  interface Session {
    user: User & {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      login?: string | null;
    };
  }
  interface Profile {
    login?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    login?: string | null;
  }
}
