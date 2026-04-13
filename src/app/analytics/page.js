"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Import Chart.js
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

// Import Ikon
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  History,
  Settings,
  Search,
  Bell,
  ArrowLeft,
} from "lucide-react";

// Registrasi modul ChartJS
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
);

export default function AnalyticsPage() {
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // State untuk data sesi
  const [sessionData, setSessionData] = useState({
    duration: "00:45:12",
    goodPercent: 82,
    badPercent: 18,
    badPosture: 12,
    date: "11 April 2026",
    totalChecks: 450,
  });

  // Data Timeline (Warna berubah merah jika < 50)
  const lineData = {
    labels: ["10:00", "10:05", "10:10", "10:15", "10:20", "10:25", "10:30"],
    datasets: [
      {
        fill: true,
        label: "Posture Score",
        data: [80, 85, 40, 55, 90, 85, 80],
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.05)",
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 3,
        segment: {
          borderColor: (ctx) => (ctx.p1.raw < 50 ? "#EF4444" : undefined),
        },
      },
    ],
  };

  useEffect(() => {
    setHasMounted(true);
    const user = localStorage.getItem("currentUser");
    if (user) setCurrentUser(user);

    const savedData = JSON.parse(localStorage.getItem("posture_session"));
    if (savedData) setSessionData(savedData);
  }, []);

  if (!hasMounted) return null;

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* --- SIDEBAR (Identik dengan Dashboard) --- */}
      <aside className="w-64 bg-white p-6 flex flex-col border-r border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-10 text-[#2563EB] font-bold text-xl px-2">
          <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center text-white text-xs">
            <div className="w-4 h-4 border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
          VisionGuard AI
        </div>

        <nav className="space-y-1 flex-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition"
          >
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link
            href="/monitoring"
            className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition"
          >
            <Activity size={20} /> Monitoring
          </Link>
          <Link
            href="/analytics"
            className="flex items-center gap-3 p-3 bg-[#EFF6FF] text-[#2563EB] rounded-xl font-semibold transition"
          >
            <BarChart3 size={20} /> Analytics
          </Link>
          <Link
            href="/history"
            className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition"
          >
            <History size={20} /> History
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition"
          >
            <Settings size={20} /> Settings
          </Link>
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* HEADER (Identik dengan Dashboard) */}
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
            <button className="text-slate-400 hover:text-slate-600">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full border border-slate-100 shadow-sm">
              <img
                src="https://ui-avatars.com/api/?name=Alex+Rivera&background=f97316&color=fff"
                className="w-10 h-10 rounded-full border border-slate-100"
                alt="Profile"
              />
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800 leading-none">
                  Alex Rivera
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Free Account</p>
              </div>
            </div>
          </div>
        </div>

        {/* TITLE SECTION */}
        <div className="mb-8">
          <h2 className="text-[32px] font-bold text-[#0F172A] tracking-tight">
            Analytics Overview
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            Visualisasi performa postur sesi terakhir Anda
          </p>
        </div>

        {/* CARDS SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
              Duration
            </p>
            <h3 className="text-2xl font-black text-slate-800">
              {sessionData.duration}
            </h3>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
              Avg Score
            </p>
            <h3 className="text-2xl font-black text-emerald-500">
              {sessionData.goodPercent}%
            </h3>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
              Bad Posture
            </p>
            <h3 className="text-2xl font-black text-red-500">
              {sessionData.badPosture}
            </h3>
          </div>
        </div>

        {/* TIMELINE CHART */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-700">Posture Timeline</h3>
            <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
              <span className="text-emerald-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>{" "}
                Good
              </span>
              <span className="text-red-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span> Poor
              </span>
            </div>
          </div>
          <div className="h-64">
            <Line
              data={lineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { display: false, min: 0, max: 100 },
                  x: {
                    grid: { display: false },
                    ticks: { color: "#94a3b8", font: { size: 10 } },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* DISTRIBUTION & DETAILS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center">
            <h3 className="font-bold text-slate-700 self-start mb-6 text-sm uppercase tracking-widest">
              Distribution
            </h3>
            <div className="w-40 h-40 relative">
              <Doughnut
                data={{
                  labels: ["Good", "Bad"],
                  datasets: [
                    {
                      data: [sessionData.goodPercent, sessionData.badPercent],
                      backgroundColor: ["#3B82F6", "#EF4444"],
                      borderWidth: 0,
                      cutout: "75%",
                    },
                  ],
                }}
                options={{ plugins: { legend: { display: false } } }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800">
                  {sessionData.goodPercent}%
                </span>
                <span className="text-[8px] uppercase text-slate-400 font-bold">
                  Healthy
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-6 text-sm uppercase tracking-widest">
              Session Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <span className="text-sm text-slate-400 font-medium">
                  Monitoring Date
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {sessionData.date}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <span className="text-sm text-slate-400 font-medium">
                  Total Posture Checks
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {sessionData.totalChecks} kali
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400 font-medium">
                  AI Reliability Score
                </span>
                <span className="text-sm font-bold text-[#2563EB]">
                  High (98.2%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
