"use client";

import { TrendingUp, Flame } from "lucide-react";

/**
 * StatCard — Reusable stat card for the dashboard.
 * 
 * Props:
 *  - variant: "health" | "streak" | "score"
 *  - healthPercent: number (for "health" variant)
 *  - streakDays: number (for "streak" variant)
 *  - focusScore: number (for "score" variant)
 */

export function HealthCard({ percent = 71 }) {
  const circumference = 2 * Math.PI * 58; // ~364

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center">
      <div className="flex justify-between w-full mb-6">
        <span className="text-sm font-bold text-slate-800">Daily Health</span>
        <span className="text-[#22C55E] text-xs font-bold flex items-center gap-1">
          <TrendingUp size={12} /> +12%
        </span>
      </div>
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64" cy="64" r="58"
            stroke="#F1F5F9" strokeWidth="10" fill="transparent"
          />
          <circle
            cx="64" cy="64" r="58"
            stroke="#3B82F6" strokeWidth="10" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * percent) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-slate-800">{percent}%</span>
        </div>
      </div>
    </div>
  );
}

export function StreakCard({ days = 7 }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
      <div className="flex justify-between items-start mb-10">
        <span className="text-sm font-bold text-slate-800">{days}-Day Streak</span>
        <div className="bg-orange-50 p-2 rounded-lg">
          <Flame size={20} className="text-orange-500 fill-orange-500" />
        </div>
      </div>
      <h3 className="text-[40px] font-black text-slate-800 leading-none">
        {days} Days
      </h3>
      <div className="flex gap-1.5 mt-6">
        {[...Array(days)].map((_, i) => (
          <div key={i} className="flex-1 h-1.5 bg-[#3B82F6] rounded-full"></div>
        ))}
      </div>
    </div>
  );
}

export function ScoreCard({ score = 92 }) {
  const getLabel = (s) => {
    if (s >= 90) return "Excellent Performance";
    if (s >= 70) return "Good Performance";
    if (s >= 50) return "Average Performance";
    return "Needs Improvement";
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
      <div className="flex justify-between items-start mb-8">
        <span className="text-sm font-bold text-slate-800">Focus Score</span>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
          WEEKLY
        </span>
      </div>
      <h4 className="text-[40px] font-black text-slate-800">{score}</h4>
      <p className="text-[#22C55E] text-sm font-bold mt-2">{getLabel(score)}</p>
    </div>
  );
}
