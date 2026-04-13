""use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react"; // Dari Andi
import { useRouter } from "next/navigation"; // Dari Andi
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  History,
  Settings,
  Search,
  Bell,
  Play,
  TrendingUp,
  Flame,
  LogOut,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  // Logika User dari Andi
  const userDisplay = session?.user?.name || session?.user?.email || "Guest";
  const userInitial = userDisplay.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      {/* --- SIDEBAR (Versi Aldi) --- */}
      <aside className="w-64 bg-white p-6 flex flex-col border-r border-slate-100 shadow-sm shrink-0">
        <div className="flex items-center gap-2 mb-10 text-[#2563EB] font-bold text-xl px-2">
          🛡️ VisionGuard AI
        </div>

        <nav className="space-y-1 flex-1">
          <Link href="/dashboard" className="flex items-center gap-3 p-3 bg-[#EFF6FF] text-[#2563EB] rounded-xl font-semibold transition">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/monitoring" className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition">
            <Activity size={20} /> Monitoring
          </Link>
          <Link href="/analytics" className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition">
            <BarChart3 size={20} /> Analytics
          </Link>
          <Link href="/history" className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition">
            <History size={20} /> History
          </Link>
          <Link href="/settings" className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition">
            <Settings size={20} /> Settings
          </Link>
        </nav>

        {/* Tombol Logout di Bawah Sidebar */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition mt-auto font-bold"
        >
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* --- MAIN CONTENT (Versi Aldi) --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
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

          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
            </button>
            
            {/* PROFILE SECTION (Gabungan UI Aldi + Data Andi) */}
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

        {/* HERO SECTION */}
        <div className="bg-white p-10 rounded-[2rem] border border-slate-100 mb-8 flex justify-between items-center shadow-sm relative overflow-hidden">
          <div className="max-w-lg z-10">
            <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-wider bg-[#EFF6FF] px-3 py-1 rounded-full flex items-center gap-1 w-fit border border-blue-100">
              <span className="animate-pulse text-blue-500">⚡</span> AI Monitoring Active
            </span>
            <h2 className="text-[40px] font-bold text-[#0F172A] my-6 leading-[1.1]">
              Welcome back, <br /> {userDisplay.split(' ')[0]}!
            </h2>
            <p className="text-slate-500 text-lg mb-8 leading-relaxed max-w-md font-medium">
              Monitor your posture in real-time to enhance your health.
            </p>

            <div className="flex gap-4">
              <Link
                href="/monitoring"
                className="bg-[#3B82F6] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-95"
              >
                <Play size={18} fill="currentColor" /> Start Monitoring
              </Link>
            </div>
          </div>

          <div className="w-[300px] h-[200px] relative z-10 mr-4 hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80"
              alt="Posture"
              className="w-full h-full object-cover rounded-3xl shadow-xl border-4 border-white grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>
        </div>

        {/* STATS CARDS GRID (Aldi Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Good Posture */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center">
            <div className="flex justify-between w-full mb-6">
              <span className="text-sm font-bold text-slate-800">Daily Health</span>
              <span className="text-[#22C55E] text-xs font-bold flex items-center gap-1"><TrendingUp size={12} /> +12%</span>
            </div>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="#F1F5F9" strokeWidth="10" fill="transparent" />
                <circle cx="64" cy="64" r="58" stroke="#3B82F6" strokeWidth="10" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * 71) / 100} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-800">71%</span>
              </div>
            </div>
          </div>

          {/* Card 2: Streak */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-10">
              <span className="text-sm font-bold text-slate-800">7-Day Streak</span>
              <div className="bg-orange-50 p-2 rounded-lg"><Flame size={20} className="text-orange-500 fill-orange-500" /></div>
            </div>
            <h3 className="text-[40px] font-black text-slate-800 leading-none">7 Days</h3>
            <div className="flex gap-1.5 mt-6">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 h-1.5 bg-[#3B82F6] rounded-full"></div>
              ))}
            </div>
          </div>

          {/* Card 3: Score */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <span className="text-sm font-bold text-slate-800">Focus Score</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">WEEKLY</span>
            </div>
            <h4 className="text-[40px] font-black text-slate-800">92</h4>
            <p className="text-[#22C55E] text-sm font-bold mt-2">Excellent Performance</p>
          </div>
        </div>
      </main>
    </div>
  );
}