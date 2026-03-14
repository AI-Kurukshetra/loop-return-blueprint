import { withAuth } from "next-auth/middleware";
import { normalizeRole } from "@/lib/roles";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (!token) {
        return false;
      }

      const role = normalizeRole((token.role as string | undefined) ?? "seller");
      const pathname = req.nextUrl.pathname;

      if (pathname.startsWith("/admin")) {
        return role === "admin";
      }
      if (pathname.startsWith("/client")) {
        return role === "client";
      }
      if (pathname.startsWith("/seller")) {
        return role === "seller" || role === "admin";
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/panel", "/seller/:path*", "/client/:path*", "/admin/:path*"],
};
