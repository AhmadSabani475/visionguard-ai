"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  History,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/monitoring", label: "Monitoring", icon: Activity },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <aside className="w-64 bg-white p-6 flex flex-col border-r border-slate-100 shadow-sm shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10 text-[#2563EB] font-bold text-xl px-2">
        🛡️ VisionGuard AI
      </div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 p-3 rounded-xl font-medium transition ${
                isActive
                  ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition mt-auto font-bold"
      >
        <LogOut size={20} /> Logout
      </button>
    </aside>
  );
}
