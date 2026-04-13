"use client";

import { useSession } from "next-auth/react";
import { Search, Bell } from "lucide-react";

export default function Header() {
  const { data: session, status } = useSession();

  const userDisplay = session?.user?.name || session?.user?.email || "Guest";
  const userInitial = userDisplay.charAt(0).toUpperCase();

  return (
    <div className="flex justify-between items-center mb-8">
      {/* Search Bar */}
      <div className="relative w-1/3">
        <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Search insights..."
          className="bg-[#F1F5F9] border-none rounded-xl pl-11 pr-5 py-2.5 w-full outline-none focus:ring-2 ring-blue-100 transition text-sm"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <Bell size={20} />
        </button>

        {/* Profile Section */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800 leading-none">
              {status === "loading" ? "Loading..." : userDisplay}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              {session ? "Verified User" : "Free Account"}
            </p>
          </div>
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm border-2 border-white">
            {userInitial}
          </div>
        </div>
      </div>
    </div>
  );
}
