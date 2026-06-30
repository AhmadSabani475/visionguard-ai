"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Play } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { HealthCard, StreakCard, ScoreCard } from "@/components/StatCard";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userDisplay = session?.user?.name || session?.user?.email || "Guest";

  const [stats, setStats] = useState({
    healthPercent: 0,
    streakDays: 0,
    focusScore: 0,
  });

  // Fetch data nyata dari API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/sessions", { cache: "no-store" });
        if (!res.ok) return;
        const sessions = await res.json();

        if (!sessions || sessions.length === 0) return;

        // --- HEALTH: avgScore dari sesi terakhir ---
        const latestScore = Math.round(sessions[0]?.avgScore || 0);

        // --- STREAK: hitung hari berturut-turut ada sesi (dari hari ini mundur) ---
        const uniqueDays = new Set(
          sessions.map((s) =>
            new Date(s.startTime).toLocaleDateString("id-ID")
          )
        );
        const today = new Date();
        let streakCount = 0;
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          const dateStr = checkDate.toLocaleDateString("id-ID");
          if (uniqueDays.has(dateStr)) {
            streakCount++;
          } else {
            // Untuk hari pertama (hari ini), jika belum ada sesi, lanjut cek kemarin
            if (i === 0) continue;
            break;
          }
        }

        // --- SCORE: rata-rata avgScore dari 7 sesi terakhir ---
        const recentSessions = sessions.slice(0, 7);
        const avgOfRecent =
          recentSessions.reduce((sum, s) => sum + (s.avgScore || 0), 0) /
          recentSessions.length;

        setStats({
          healthPercent: latestScore,
          streakDays: streakCount,
          focusScore: Math.round(avgOfRecent),
        });
      } catch (error) {
        console.error("Gagal memuat statistik dashboard:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      {/* HERO SECTION */}
      <div className="bg-white p-10 rounded-[2rem] border border-slate-100 mb-8 flex justify-between items-center shadow-sm relative overflow-hidden">
        <div className="max-w-lg z-10">
          <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-wider bg-[#EFF6FF] px-3 py-1 rounded-full flex items-center gap-1 w-fit border border-blue-100">
            <span className="animate-pulse text-blue-500">⚡</span> AI Monitoring Active
          </span>
          <h2 className="text-[40px] font-bold text-[#0F172A] my-6 leading-[1.1]">
            Welcome back, <br /> {userDisplay.split(" ")[0]}!
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

      {/* STATS CARDS — Data Real dari Database */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HealthCard percent={stats.healthPercent} />
        <StreakCard days={stats.streakDays} />
        <ScoreCard score={stats.focusScore} />
      </div>
    </DashboardLayout>
  );
}