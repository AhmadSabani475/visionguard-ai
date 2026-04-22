"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi helper untuk format durasi (detik ke menit)
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
          Monitoring Story
        </h2>
        <p className="text-slate-400 font-medium text-sm">
          Lihat semua catatan postur tubuhmu di sini.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white p-10 rounded-[2.5rem] border text-center">
          <p className="text-slate-400 font-bold">
            Belum ada history. Yuk mulai monitoring!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((session) => {
            const total =
              session.goodPostureSeconds + session.badPostureSeconds || 1;
            const goodPercent = Math.round(
              (session.goodPostureSeconds / total) * 100,
            );

            return (
              <div
                key={session.id}
                className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-wrap md:flex-nowrap items-center justify-between gap-6"
              >
                {/* INFO WAKTU */}
                <div className="flex items-center gap-5 min-w-[200px]">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">
                    {new Date(session.startTime).getDate()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">
                      {new Date(session.startTime).toLocaleDateString("id-ID", {
                        month: "short",
                        year: "numeric",
                      })}
                    </h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} />{" "}
                      {new Date(session.startTime).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* STATS SINGKAT */}
                <div className="flex flex-1 gap-8 justify-around">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase mb-1">
                      Durasi
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {formatDuration(session.duration)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-emerald-300 uppercase mb-1">
                      Good
                    </p>
                    <p className="text-sm font-bold text-emerald-500">
                      {goodPercent}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-red-300 uppercase mb-1">
                      Slouch
                    </p>
                    <p className="text-sm font-bold text-red-500">
                      {100 - goodPercent}%
                    </p>
                  </div>
                </div>

                {/* PROGRESS BAR KECIL */}
                <div className="hidden md:block w-32">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${goodPercent}%` }}
                    ></div>
                  </div>
                </div>

                <button className="p-3 rounded-2xl bg-slate-50 text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
