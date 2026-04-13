"use client";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
