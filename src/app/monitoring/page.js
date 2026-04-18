"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

export default function MonitoringPage() {
  const { data: authSession } = useSession();
  const router = useRouter();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // loading state saat init AI
  const [currentStatus, setCurrentStatus] = useState("Waiting...");
  const [goodCount, setGoodCount] = useState(0);
  const [badCount, setBadCount] = useState(0);
  const [slouchDistance, setSlouchDistance] = useState(0);

  // --- TRACKING SCRIPT LOADING ---
  const [scriptsLoaded, setScriptsLoaded] = useState(0);
  const totalScripts = 4;
  const allScriptsReady = scriptsLoaded >= totalScripts;

  const handleScriptLoad = () => {
    setScriptsLoaded((prev) => prev + 1);
  };

  // --- TRACKING WAKTU ---
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const lastPostureRef = useRef(null); // "good" | "bad" | null
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [goodSeconds, setGoodSeconds] = useState(0);
  const [badSeconds, setBadSeconds] = useState(0);

  // --- SLIDING WINDOW untuk bar real-time (30 detik terakhir) ---
  const WINDOW_SIZE = 30; // detik
  const postureHistoryRef = useRef([]); // array of "good" | "bad"
  const [realtimeGoodPercent, setRealtimeGoodPercent] = useState(0);
  const [realtimeBadPercent, setRealtimeBadPercent] = useState(0);

  // --- STATE SIMPAN ---
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null); // { type: "success"|"error", text: "..." }

  // --- FUNGSI MENGGAMBAR KERANGKA (CANVAS) ---
  const drawSkeleton = (ctx, telingaKiri, telingaKanan, bahuKiri, bahuKanan, warna) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const gambarTitik = (titik) => {
      if (titik?.score > 0.3) {
        ctx.beginPath();
        ctx.arc(titik.x, titik.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = warna;
        ctx.fill();
      }
    };

    const gambarGaris = (titikA, titikB) => {
      if (titikA?.score > 0.3 && titikB?.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(titikA.x, titikA.y);
        ctx.lineTo(titikB.x, titikB.y);
        ctx.strokeStyle = warna;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    };

    gambarGaris(bahuKiri, bahuKanan);
    gambarTitik(telingaKiri);
    gambarTitik(telingaKanan);
    gambarTitik(bahuKiri);
    gambarTitik(bahuKanan);
  };

  // --- LOGIKA AI UTAMA ---
  const detectFrame = async () => {
    if (detectorRef.current && videoRef.current && videoRef.current.readyState >= 2) {
      if (canvasRef.current.width !== videoRef.current.videoWidth) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      }

      const ctx = canvasRef.current.getContext("2d");
      const poses = await detectorRef.current.estimatePoses(videoRef.current);

      if (poses.length > 0) {
        const kp = poses[0].keypoints;
        const lEar = kp.find((k) => k.name === "left_ear");
        const rEar = kp.find((k) => k.name === "right_ear");
        const lShoulder = kp.find((k) => k.name === "left_shoulder");
        const rShoulder = kp.find((k) => k.name === "right_shoulder");

        if (lEar?.score > 0.3 && rEar?.score > 0.3 && lShoulder?.score > 0.3 && rShoulder?.score > 0.3) {
          const avgEarY = (lEar.y + rEar.y) / 2;
          const avgShoulderY = (lShoulder.y + rShoulder.y) / 2;
          const verticalDist = Math.round(avgShoulderY - avgEarY);
          setSlouchDistance(verticalDist);

          let warnaGaris = "#4ade80";

          if (verticalDist < 100) {
            warnaGaris = "#ef4444";
            setBadCount((prev) => prev + 1);
            setCurrentStatus("Poor (Slouching)");
            lastPostureRef.current = "bad";
          } else {
            setGoodCount((prev) => prev + 1);
            setCurrentStatus("Healthy (Upright)");
            lastPostureRef.current = "good";
          }

          drawSkeleton(ctx, lEar, rEar, lShoulder, rShoulder, warnaGaris);
        } else {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          setCurrentStatus("Adjust your position...");
        }
      }
    }

    if (window.runDetection) {
      requestAnimationFrame(detectFrame);
    }
  };

  // --- INIT AI: tunggu TF backend siap + buat detector + nyalakan kamera ---
  const initAI = async () => {
    setIsLoading(true);
    setCurrentStatus("Memuat AI model...");

    try {
      // Tunggu sampai library tersedia (polling max 10 detik)
      let retries = 0;
      while ((!window.tf || !window.poseDetection) && retries < 40) {
        await new Promise((r) => setTimeout(r, 250));
        retries++;
      }

      if (!window.tf || !window.poseDetection) {
        throw new Error("TensorFlow atau Pose Detection gagal dimuat. Coba refresh halaman.");
      }

      // Pastikan backend WebGL siap
      await window.tf.setBackend("webgl");
      await window.tf.ready();

      const model = window.poseDetection.SupportedModels.MoveNet;
      detectorRef.current = await window.poseDetection.createDetector(model, {
        modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      });

      // Nyalakan kamera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Tunggu video benar-benar siap sebelum mulai deteksi
        await new Promise((resolve) => {
          videoRef.current.onloadeddata = resolve;
        });

        window.runDetection = true;
        setCurrentStatus("Detecting...");
        setIsLoading(false);
        detectFrame();
      }
    } catch (err) {
      console.error("Gagal inisialisasi AI:", err);
      setCurrentStatus("Error: " + err.message);
      setIsLoading(false);
      setIsMonitoring(false);
    }
  };

  // --- SIMPAN SESI KE DATABASE ---
  const saveSession = useCallback(async () => {
    if (!startTimeRef.current) return;

    const endTime = new Date();
    const duration = Math.round((endTime - startTimeRef.current) / 1000);

    // Minimal 3 detik monitoring baru disimpan
    if (duration < 3) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: startTimeRef.current.toISOString(),
          endTime: endTime.toISOString(),
          duration,
          goodPostureSeconds: goodSeconds,
          badPostureSeconds: badSeconds,
        }),
      });

      if (res.ok) {
        setSaveMessage({ type: "success", text: "Sesi berhasil disimpan! ✅" });
      } else {
        const data = await res.json();
        setSaveMessage({ type: "error", text: data.error || "Gagal menyimpan sesi." });
      }
    } catch (error) {
      setSaveMessage({ type: "error", text: "Gagal terhubung ke server." });
    } finally {
      setIsSaving(false);
    }
  }, [goodSeconds, badSeconds]);

  // --- START / STOP TOGGLE ---
  const handleToggle = async () => {
    if (isMonitoring) {
      // STOP: Hentikan deteksi & simpan
      window.runDetection = false;
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }

      // Hentikan timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      setIsMonitoring(false);
      setCurrentStatus("Waiting...");

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      // Simpan sesi ke database
      await saveSession();
    } else {
      // START: Reset & mulai
      setSaveMessage(null);
      setGoodCount(0);
      setBadCount(0);
      setGoodSeconds(0);
      setBadSeconds(0);
      setElapsedSeconds(0);
      lastPostureRef.current = null;
      postureHistoryRef.current = [];
      setRealtimeGoodPercent(0);
      setRealtimeBadPercent(0);

      // Catat waktu mulai
      startTimeRef.current = new Date();

      // Timer per detik — track goodSeconds/badSeconds + sliding window
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        const currentPosture = lastPostureRef.current;
        if (currentPosture === "good") {
          setGoodSeconds((prev) => prev + 1);
        } else if (currentPosture === "bad") {
          setBadSeconds((prev) => prev + 1);
        }

        // Push ke sliding window
        if (currentPosture) {
          postureHistoryRef.current.push(currentPosture);
          // Hapus data lebih dari WINDOW_SIZE detik
          if (postureHistoryRef.current.length > WINDOW_SIZE) {
            postureHistoryRef.current = postureHistoryRef.current.slice(-WINDOW_SIZE);
          }
          // Hitung persentase dari window
          const history = postureHistoryRef.current;
          const goodInWindow = history.filter((p) => p === "good").length;
          const badInWindow = history.filter((p) => p === "bad").length;
          const totalInWindow = goodInWindow + badInWindow || 1;
          setRealtimeGoodPercent(Math.round((goodInWindow / totalInWindow) * 100));
          setRealtimeBadPercent(Math.round((badInWindow / totalInWindow) * 100));
        }
      }, 1000);

      // Set monitoring dulu agar video element visible, baru init AI
      setIsMonitoring(true);
      // Delay kecil agar React sempat render ulang (video element jadi visible)
      await new Promise((r) => setTimeout(r, 100));
      await initAI();
    }
  };

  // Cleanup interval & kamera saat unmount
  useEffect(() => {
    return () => {
      window.runDetection = false;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Format waktu elapsed
  const formatTime = (totalSec) => {
    const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const s = (totalSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Bar real-time menggunakan sliding window
  const goodPercent = realtimeGoodPercent;
  const badPercent = realtimeBadPercent;

  return (
    <DashboardLayout>
      {/* Load TF scripts secara berurutan dengan afterInteractive */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />

      {/* TITLE */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Live Monitoring</h2>
          <p className="text-slate-400 text-sm">Postur dipantau secara real-time dengan AI MoveNet.</p>
        </div>
        <div className="flex items-center gap-3">
          {isMonitoring && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-bold animate-pulse">
              ● System Active
            </div>
          )}
          {isMonitoring && (
            <div className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-sm font-mono font-bold">
              ⏱ {formatTime(elapsedSeconds)}
            </div>
          )}
        </div>
      </div>

      {/* SAVE MESSAGE NOTIFICATION */}
      {saveMessage && (
        <div
          className={`mb-6 p-4 rounded-2xl font-bold text-sm flex items-center justify-between ${
            saveMessage.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <span>{saveMessage.text}</span>
          <div className="flex gap-2">
            {saveMessage.type === "success" && (
              <button
                onClick={() => router.push("/analytics")}
                className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
              >
                Lihat Analytics →
              </button>
            )}
            <button
              onClick={() => setSaveMessage(null)}
              className="text-slate-400 hover:text-slate-600 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* CONTAINER KAMERA & CANVAS */}
          <div className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden aspect-video flex items-center justify-center border-[6px] border-white shadow-2xl">
            {/* Video & Canvas selalu di-render, visibility diatur lewat style */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover scale-x-[-1]"
              style={{ display: isMonitoring ? "block" : "none" }}
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1] pointer-events-none"
              style={{ display: isMonitoring ? "block" : "none" }}
            />

            {/* Loading indicator saat AI sedang dimuat */}
            {isMonitoring && isLoading && (
              <div className="absolute inset-0 bg-slate-800/90 flex flex-col items-center justify-center text-white z-10">
                <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-sm">Memuat AI Model...</p>
                <p className="text-slate-400 text-xs mt-1">Mohon tunggu sebentar</p>
              </div>
            )}

            {!isMonitoring && (
              <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center text-white">
                <div className="bg-slate-700 p-5 rounded-full mb-4 text-3xl">📷</div>
                <p className="font-bold">Kamera Belum Nyala</p>
                {!allScriptsReady && (
                  <p className="text-slate-400 text-xs mt-2">
                    Memuat library AI ({scriptsLoaded}/{totalScripts})...
                  </p>
                )}
              </div>
            )}

            {/* WARNING BOX */}
            {isMonitoring && currentStatus.includes("Poor") && (
              <div className="absolute top-10 bg-red-600 text-white px-8 py-3 rounded-2xl animate-bounce shadow-xl font-bold z-20">
                ⚠️ BUNGKUK DETECTED
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] p-6 flex justify-between items-center border shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Status (Jarak: {slouchDistance}px)
              </p>
              <p
                className={`text-xl font-black ${
                  currentStatus.includes("Healthy") ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {currentStatus}
              </p>
            </div>
            {isMonitoring && (
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Good</p>
                  <p className="text-lg font-black text-emerald-500">{goodSeconds}s</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bad</p>
                  <p className="text-lg font-black text-red-500">{badSeconds}s</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">📊 Sesi Statistik</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>Good</span>
                  <span className="text-emerald-500">{goodPercent}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${goodPercent}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>Slouch</span>
                  <span className="text-red-500">{badPercent}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${badPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Timer info */}
            {(isMonitoring || elapsedSeconds > 0) && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Durasi Sesi</span>
                  <span className="text-slate-700 font-mono">{formatTime(elapsedSeconds)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold mt-2">
                  <span className="text-slate-400">Good / Bad (detik)</span>
                  <span className="text-slate-700">{goodSeconds}s / {badSeconds}s</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleToggle}
            disabled={isSaving || isLoading}
            className={`w-full font-black py-5 rounded-[1.5rem] transition-all shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${
              isMonitoring
                ? "bg-red-50 text-red-600 border-2 border-red-100"
                : "bg-blue-600 text-white"
            }`}
          >
            {isSaving
              ? "💾 Menyimpan sesi..."
              : isLoading
              ? "⏳ Memuat AI..."
              : isMonitoring
              ? "⏹ STOP MONITORING"
              : "▶ START MONITORING"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}