import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma"; // Sesuaikan path jika berbeda
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@contoh.com" },
        password: { label: "Password", type: "password" }
      },
      secret: "bebas",
      async authorize(credentials) {
        // 1. Cek apakah email dan password diisi
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password wajib diisi");
        }

        // 2. Cari user di database berdasarkan email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("Email tidak ditemukan");
        }

        // 3. Verifikasi password dengan bcrypt
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Password salah");
        }

        // 4. Jika sukses, kembalikan objek user (akan disimpan di JWT)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      }
    })
  ],

  pages: {
    signIn: "/login", // Sesuaikan dengan folder halaman login kamu
    error: "/api/auth/error", // Ke halaman error default atau custom
  },
  debug: process.env.NODE_ENV === "development",

  session: {
    strategy: "jwt", // Wajib "jwt" jika pakai Credentials Provider
  },
  callbacks: {
    // Memasukkan user ID dari database ke dalam session NextAuth
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };