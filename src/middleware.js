import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    // Arahkan pengguna ke sini jika mereka belum login
    signIn: "/login", 
  },
});

// Tentukan folder mana saja yang ingin diproteksi
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/monitoring/:path*",
    "/analytics/:path*",
    "/history/:path*",
    "/settings/:path*",
  ],
};