"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Activity, // Ikon untuk Monitoring
  BarChart3,
  History, // Ikon untuk History
  Settings,
  Search,
  Bell,
  Play,
  TrendingUp,
  Flame,
} from "lucide-react";

export default function DashboardPage() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white p-6 flex flex-col border-r border-slate-100 shadow-sm">
        {/* Logo Section */}
        <div className="flex items-center gap-2 mb-10 text-[#2563EB] font-bold text-xl px-2">
          <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center text-white text-xs">
            <div className="w-4 h-4 border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
          VisionGuard AI
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 flex-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 p-3 bg-[#EFF6FF] text-[#2563EB] rounded-xl font-semibold transition"
          >
            <LayoutDashboard size={20} /> Dashboard
          </Link>

          {/* TOMBOL MONITORING */}
          <Link
            href="/monitoring"
            className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition"
          >
            <Activity size={20} /> Monitoring
          </Link>

          <Link
            href="/analytics"
            className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition"
          >
            <BarChart3 size={20} /> Analytics
          </Link>

          {/* TOMBOL HISTORY */}
          <Link
            href="/history"
            className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition"
          >
            <History size={20} /> History
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition"
          >
            <Settings size={20} /> Settings
          </Link>
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div className="relative w-1/2">
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
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800 leading-none">
                  Alex Rivera
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  Free Account
                </p>
              </div>
              <img
                src="https://ui-avatars.com/api/?name=Alex+Rivera&background=f97316&color=fff"
                className="w-10 h-10 rounded-full border border-slate-100 shadow-sm"
                alt="Profile"
              />
            </div>
          </div>
        </div>

        {/* HERO SECTION */}
        <div className="bg-white p-10 rounded-[2rem] border border-slate-100 mb-8 flex justify-between items-center shadow-sm relative overflow-hidden">
          <div className="max-w-lg z-10">
            <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-wider bg-[#EFF6FF] px-3 py-1 rounded-full flex items-center gap-1 w-fit border border-blue-100">
              <span className="animate-pulse text-blue-500">⚡</span> AI
              Monitoring Active
            </span>
            <h2 className="text-[44px] font-bold text-[#0F172A] my-6 leading-[1.1]">
              Welcome to <br /> VisionGuard AI
            </h2>
            <p className="text-slate-500 text-lg mb-8 leading-relaxed max-w-md font-medium">
              Monitor your posture in real-time to enhance your long-term health
              and focus. Start your AI-powered session today to improve your
              ergonomics.
            </p>

            <div className="flex gap-4">
              <Link
                href="/monitoring"
                className="bg-[#3B82F6] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-95"
              >
                <Play size={18} fill="currentColor" /> Start Monitoring
              </Link>
              <Link
                href="/history"
                className="bg-[#F1F5F9] text-slate-700 px-8 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition active:scale-95"
              >
                View History
              </Link>
            </div>
          </div>

          <div className="w-[380px] h-[260px] relative z-10 mr-4">
            <div className="absolute inset-0 bg-blue-100 rounded-[2rem] blur-3xl opacity-30 -z-10"></div>
            <img
              src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80"
              alt="Working Posture"
              className="w-full h-full object-cover rounded-3xl shadow-xl border-4 border-white"
            />
          </div>
        </div>

        {/* STATS CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card: Daily Good Posture */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center hover:shadow-md transition">
            <div className="flex justify-between w-full mb-6">
              <span className="text-sm font-bold text-slate-800">
                Daily Good Posture
              </span>
              <span className="text-[#22C55E] text-xs font-bold flex items-center gap-1">
                <TrendingUp size={12} /> +12%
              </span>
            </div>

            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#F1F5F9"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#3B82F6"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * 71) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[28px] font-black text-slate-800">
                  5h 42m
                </span>
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-tighter">
                  Today
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-bold mt-6 uppercase tracking-widest">
              Goal: 8h 00m
            </p>
          </div>

          {/* Card: 7-Day Streak */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden hover:shadow-md transition">
            <div className="flex justify-between items-start mb-10">
              <span className="text-sm font-bold text-slate-800">
                7-Day Streak
              </span>
              <div className="bg-orange-50 p-2 rounded-lg">
                <Flame size={20} className="text-orange-500 fill-orange-500" />
              </div>
            </div>
            <div className="mb-8">
              <h3 className="text-[48px] font-black text-slate-800 leading-none">
                7 Days
              </h3>
            </div>
            <div className="flex gap-1.5 mb-6">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 bg-[#3B82F6] rounded-full"
                ></div>
              ))}
            </div>
            <p className="text-[13px] text-slate-400 font-medium">
              You're in the top 5% of users this week!
            </p>
          </div>

          {/* Card: Focus Score Trend */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-8">
              <span className="text-sm font-bold text-slate-800">
                Focus Score Trend
              </span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                Weekly
              </span>
            </div>

            <div className="h-28 flex items-end gap-2 mb-8 px-2">
              <div className="flex-1 bg-blue-50 h-[40%] rounded-sm"></div>
              <div className="flex-1 bg-blue-50 h-[60%] rounded-sm"></div>
              <div className="flex-1 bg-blue-50 h-[50%] rounded-sm"></div>
              <div className="flex-1 bg-blue-50 h-[80%] rounded-sm"></div>
              <div className="flex-1 bg-blue-50 h-[75%] rounded-sm"></div>
              <div className="flex-1 bg-blue-600 h-[100%] rounded-sm shadow-md shadow-blue-100"></div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <h4 className="text-[28px] font-black text-slate-800">92</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                  Current Score
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#22C55E] text-sm font-bold">Perfect</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Last 24h
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
