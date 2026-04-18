"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Clock, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";

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
  BarElement,
} from "chart.js";
import { Doughnut, Line, Bar } from "react-chartjs-2";

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
  BarElement
);

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch semua sesi dari database
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch("/api/sessions");
        if (!res.ok) throw new Error("Gagal memuat data");
        const data = await res.json();
        setSessions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Data sesi terakhir (terbaru)
  const latestSession = sessions.length > 0 ? sessions[0] : null;

  // Helper: format durasi detik ke mm:ss atau hh:mm:ss
  const formatDuration = (totalSec) => {
    if (!totalSec) return "00:00";
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, "0");
    const s = (totalSec % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  // Helper: format tanggal
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper: format tanggal singkat untuk chart
  const formatDateShort = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  // Hitung statistik dari sesi terakhir
  const calcPercent = (good, bad) => {
    const total = good + bad;
    if (total === 0) return { goodPercent: 0, badPercent: 0 };
    return {
      goodPercent: Math.round((good / total) * 100),
      badPercent: Math.round((bad / total) * 100),
    };
  };

  const latestStats = latestSession
    ? calcPercent(latestSession.goodPostureSeconds, latestSession.badPostureSeconds)
    : { goodPercent: 0, badPercent: 0 };

  // Data untuk Score Timeline chart (10 sesi terakhir, dibalik agar chronological)
  const recentSessions = sessions.slice(0, 10).reverse();
  const lineData = {
    labels: recentSessions.map((s) => formatDateShort(s.startTime)),
    datasets: [
      {
        fill: true,
        label: "Avg Score",
        data: recentSessions.map((s) => Math.round(s.avgScore || 0)),
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.05)",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: recentSessions.map((s) =>
          (s.avgScore || 0) < 50 ? "#EF4444" : "#10B981"
        ),
        borderWidth: 3,
        segment: {
          borderColor: (ctx) => (ctx.p1.raw < 50 ? "#EF4444" : undefined),
        },
      },
    ],
  };

  // Data untuk Bar chart (Good vs Bad seconds per sesi)
  const barData = {
    labels: recentSessions.map((s) => formatDateShort(s.startTime)),
    datasets: [
      {
        label: "Good (detik)",
        data: recentSessions.map((s) => s.goodPostureSeconds),
        backgroundColor: "#3B82F6",
        borderRadius: 8,
      },
      {
        label: "Bad (detik)",
        data: recentSessions.map((s) => s.badPostureSeconds),
        backgroundColor: "#EF4444",
        borderRadius: 8,
      },
    ],
  };

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-medium">Memuat data analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="bg-red-50 p-4 rounded-2xl text-red-500 font-bold mb-4">⚠️</div>
          <p className="text-red-500 font-bold">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  // --- EMPTY STATE ---
  if (sessions.length === 0) {
    return (
      <DashboardLayout>
        <div className="mb-8">
          <h2 className="text-[32px] font-bold text-[#0F172A] tracking-tight">
            Analytics Overview
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            Visualisasi performa postur dari sesi monitoring Anda
          </p>
        </div>
        <div className="flex flex-col items-center justify-center h-[50vh] bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Data Sesi</h3>
          <p className="text-slate-400 text-sm max-w-md text-center mb-6">
            Mulai sesi monitoring pertama Anda di halaman{" "}
            <a href="/monitoring" className="text-blue-600 font-bold hover:underline">
              Monitoring
            </a>{" "}
            untuk melihat analytics di sini.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* TITLE SECTION */}
      <div className="mb-8">
        <h2 className="text-[32px] font-bold text-[#0F172A] tracking-tight">
          Analytics Overview
        </h2>
        <p className="text-slate-400 text-sm font-medium">
          Visualisasi performa postur dari {sessions.length} sesi monitoring
        </p>
      </div>

      {/* CARDS SUMMARY — Sesi Terakhir */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-50 p-2 rounded-xl">
              <Clock size={18} className="text-blue-600" />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Durasi
            </p>
          </div>
          <h3 className="text-2xl font-black text-slate-800">
            {formatDuration(latestSession.duration)}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-emerald-50 p-2 rounded-xl">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Avg Score
            </p>
          </div>
          <h3 className="text-2xl font-black text-emerald-500">
            {Math.round(latestSession.avgScore || 0)}%
          </h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-red-50 p-2 rounded-xl">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Bad Posture
            </p>
          </div>
          <h3 className="text-2xl font-black text-red-500">
            {latestSession.badPostureSeconds}s
          </h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-50 p-2 rounded-xl">
              <BarChart3 size={18} className="text-purple-600" />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Total Sesi
            </p>
          </div>
          <h3 className="text-2xl font-black text-slate-800">
            {sessions.length}
          </h3>
        </div>
      </div>

      {/* TIMELINE + BAR CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Score Timeline */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-700">Score Timeline</h3>
            <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
              <span className="text-emerald-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Good
              </span>
              <span className="text-red-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span> Poor
              </span>
            </div>
          </div>
          <div className="h-56">
            <Line
              data={lineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    display: true,
                    min: 0,
                    max: 100,
                    grid: { color: "#f1f5f9" },
                    ticks: { color: "#94a3b8", font: { size: 10 } },
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: "#94a3b8", font: { size: 10 } },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Good vs Bad Bar Chart */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-700">Good vs Bad Posture</h3>
            <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
              <span className="text-blue-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Good
              </span>
              <span className="text-red-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span> Bad
              </span>
            </div>
          </div>
          <div className="h-56">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    grid: { color: "#f1f5f9" },
                    ticks: { color: "#94a3b8", font: { size: 10 } },
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: "#94a3b8", font: { size: 10 } },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* DISTRIBUTION & SESSION DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Donut Chart — Sesi Terakhir */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center">
          <h3 className="font-bold text-slate-700 self-start mb-6 text-sm uppercase tracking-widest">
            Sesi Terakhir
          </h3>
          <div className="w-40 h-40 relative">
            <Doughnut
              data={{
                labels: ["Good", "Bad"],
                datasets: [
                  {
                    data: [latestStats.goodPercent, latestStats.badPercent],
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
                {latestStats.goodPercent}%
              </span>
              <span className="text-[8px] uppercase text-slate-400 font-bold">
                Healthy
              </span>
            </div>
          </div>
          <div className="flex gap-6 mt-6 text-xs font-bold">
            <span className="text-blue-600">● Good: {latestSession.goodPostureSeconds}s</span>
            <span className="text-red-500">● Bad: {latestSession.badPostureSeconds}s</span>
          </div>
        </div>

        {/* Session Detail — Sesi Terakhir */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-6 text-sm uppercase tracking-widest">
            Detail Sesi Terakhir
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <span className="text-sm text-slate-400 font-medium">Tanggal Monitoring</span>
              <span className="text-sm font-bold text-slate-700">
                {formatDate(latestSession.startTime)}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <span className="text-sm text-slate-400 font-medium">Durasi Sesi</span>
              <span className="text-sm font-bold text-slate-700">
                {formatDuration(latestSession.duration)}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <span className="text-sm text-slate-400 font-medium">Good Posture</span>
              <span className="text-sm font-bold text-emerald-600">
                {latestSession.goodPostureSeconds} detik ({latestStats.goodPercent}%)
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <span className="text-sm text-slate-400 font-medium">Bad Posture</span>
              <span className="text-sm font-bold text-red-500">
                {latestSession.badPostureSeconds} detik ({latestStats.badPercent}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400 font-medium">Avg Score</span>
              <span className={`text-sm font-bold ${
                (latestSession.avgScore || 0) >= 80 ? "text-emerald-600" :
                (latestSession.avgScore || 0) >= 50 ? "text-yellow-600" : "text-red-500"
              }`}>
                {Math.round(latestSession.avgScore || 0)}% — {
                  (latestSession.avgScore || 0) >= 80 ? "Excellent" :
                  (latestSession.avgScore || 0) >= 50 ? "Average" : "Needs Improvement"
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIWAYAT SEMUA SESI */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-700 mb-6 text-sm uppercase tracking-widest">
          Riwayat Monitoring ({sessions.length} sesi)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Tanggal</th>
                <th className="text-left py-3 px-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Durasi</th>
                <th className="text-left py-3 px-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Good</th>
                <th className="text-left py-3 px-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Bad</th>
                <th className="text-left py-3 px-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Score</th>
                <th className="text-left py-3 px-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const score = Math.round(s.avgScore || 0);
                const statusColor = score >= 80 ? "text-emerald-600 bg-emerald-50" : score >= 50 ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";
                const statusLabel = score >= 80 ? "Good" : score >= 50 ? "Average" : "Bad";
                return (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-700">{formatDate(s.startTime)}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{formatDuration(s.duration)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{s.goodPostureSeconds}s</td>
                    <td className="py-3 px-4 font-bold text-red-500">{s.badPostureSeconds}s</td>
                    <td className="py-3 px-4 font-black text-slate-800">{score}%</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
