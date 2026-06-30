"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import DashboardLayout from "@/components/DashboardLayout";
import { useSettingsStore } from "@/store/useSettingsStore";

// --- KONSTANTA KONFIGURASI (bukan hardcode tersebar) ---
const DETECTION_INTERVAL_MS = 50;         // Interval deteksi frame (ms)
const SECONDS_PER_FRAME = DETECTION_INTERVAL_MS / 1000; // 0.05 detik per frame
const CALIBRATION_DURATION_MS = 3000;     // Durasi kalibrasi (3 detik)
const MIN_KEYPOINT_CONFIDENCE = 0.3;      // Minimum confidence score keypoint
const SLOUCH_RATIO_THRESHOLD = 0.75;      // Bungkuk jika rasio < 75% dari baseline
const RECOVERY_RATIO_THRESHOLD = 0.82;    // Tegak kembali jika rasio > 82% dari baseline
const DEFAULT_COOLDOWN_SECONDS = 3;       // Default cooldown alert (konsisten dengan store & schema)

export default function MonitoringPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const streamRef = useRef(null);
  
  const lastAlertTimeRef = useRef(0);
  const isSlouchingRef = useRef(false);

  // --- State Kalibrasi ---
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationCountdown, setCalibrationCountdown] = useState(3);
  const baselineRatioRef = useRef(null);
  const calibrationSamplesRef = useRef([]);
  const calibrationStartTimeRef = useRef(null);

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("Waiting...");
  const [goodCount, setGoodCount] = useState(0);
  const [badCount, setBadCount] = useState(0);
  const [currentRatio, setCurrentRatio] = useState(0);
  const [baselineDisplay, setBaselineDisplay] = useState(0);
  const [startTime, setStartTime] = useState(null);

  const router = useRouter();

  const { resolution, selectedCameraId, soundAlert, cooldown, visualAlert } = useSettingsStore();

  // ==========================================
  // 🛡️ FITUR LOCKDOWN / FOCUS MODE
  // ==========================================
  useEffect(() => {
    const cegahPindahHalaman = (e) => {
      if (isMonitoring || isCalibrating) {
        // Cari tahu apakah elemen yang diklik (atau elemen pembungkusnya) adalah sebuah Link <a>
        const linkYangDiklik = e.target.closest('a');
        
        if (linkYangDiklik) {
          e.preventDefault(); // Hentikan proses pindah halaman
          e.stopPropagation(); // Hentikan aksi klik menyebar
          alert("⚠️ FOCUS MODE AKTIF!\n\nHarap klik tombol 'STOP MONITORING' terlebih dahulu sebelum pindah ke menu lain.");
        }
      }
    };

    // Pasang perisai pelindung di seluruh dokumen web
    document.addEventListener("click", cegahPindahHalaman, true);

    // Copot perisai saat halaman ini ditutup
    return () => {
      document.removeEventListener("click", cegahPindahHalaman, true);
    };
  }, [isMonitoring, isCalibrating]);
  // ==========================================


  const playAlertSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine"; 
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 300);
    } catch (e) {
      console.warn("Browser tidak mendukung Web Audio API");
    }
  };

  const showDesktopNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("⚠️ Bungkuk Terdeteksi!", {
        body: "Yuk, tegakkan lagi punggungmu untuk menjaga kesehatan tulang belakang.",
        icon: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png",
        silent: true 
      });
    }
  };

  const drawSkeleton = (ctx, telingaKiri, telingaKanan, bahuKiri, bahuKanan, warna) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const gambarTitik = (titik) => {
      if (titik?.score > MIN_KEYPOINT_CONFIDENCE) {
        ctx.beginPath(); ctx.arc(titik.x, titik.y, 6, 0, 2 * Math.PI); ctx.fillStyle = warna; ctx.fill();
      }
    };
    const gambarGaris = (titikA, titikB) => {
      if (titikA?.score > MIN_KEYPOINT_CONFIDENCE && titikB?.score > MIN_KEYPOINT_CONFIDENCE) {
        ctx.beginPath(); ctx.moveTo(titikA.x, titikA.y); ctx.lineTo(titikB.x, titikB.y);
        ctx.strokeStyle = warna; ctx.lineWidth = 4; ctx.stroke();
      }
    };
    gambarGaris(bahuKiri, bahuKanan); gambarTitik(telingaKiri); gambarTitik(telingaKanan);
    gambarTitik(bahuKiri); gambarTitik(bahuKanan);
  };

  // --- HITUNG RASIO: verticalDist / shoulderWidth ---
  const calculateRatio = (lEar, rEar, lShoulder, rShoulder) => {
    const avgEarY = (lEar.y + rEar.y) / 2;
    const avgShoulderY = (lShoulder.y + rShoulder.y) / 2;
    const verticalDist = avgShoulderY - avgEarY;

    // Lebar bahu sebagai normalisasi (menghilangkan efek jarak kamera)
    const shoulderWidth = Math.abs(rShoulder.x - lShoulder.x);

    // Hindari division by zero
    if (shoulderWidth < 1) return null;

    return verticalDist / shoulderWidth;
  };

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
        const lEar = kp.find((k) => k.name === "left_ear"); const rEar = kp.find((k) => k.name === "right_ear");
        const lShoulder = kp.find((k) => k.name === "left_shoulder"); const rShoulder = kp.find((k) => k.name === "right_shoulder");

        if (lEar?.score > MIN_KEYPOINT_CONFIDENCE && rEar?.score > MIN_KEYPOINT_CONFIDENCE && lShoulder?.score > MIN_KEYPOINT_CONFIDENCE && rShoulder?.score > MIN_KEYPOINT_CONFIDENCE) {
          
          const ratio = calculateRatio(lEar, rEar, lShoulder, rShoulder);

          if (ratio === null) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            setCurrentStatus("Adjust your position...");
          } else if (isCalibrating) {
            // === FASE KALIBRASI: Kumpulkan sampel rasio ===
            calibrationSamplesRef.current.push(ratio);
            setCurrentRatio(parseFloat(ratio.toFixed(2)));
            
            // Update countdown
            const elapsed = Date.now() - calibrationStartTimeRef.current;
            const remaining = Math.max(0, Math.ceil((CALIBRATION_DURATION_MS - elapsed) / 1000));
            setCalibrationCountdown(remaining);

            // Warna biru saat kalibrasi
            drawSkeleton(ctx, lEar, rEar, lShoulder, rShoulder, "#3B82F6");
            setCurrentStatus(`Kalibrasi... Duduk tegak! (${remaining}s)`);

            // Cek apakah kalibrasi sudah selesai
            if (elapsed >= CALIBRATION_DURATION_MS) {
              const samples = calibrationSamplesRef.current;
              if (samples.length > 0) {
                // Rata-ratakan semua sampel sebagai baseline
                const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
                baselineRatioRef.current = avg;
                setBaselineDisplay(parseFloat(avg.toFixed(2)));
                setIsCalibrating(false);
                setCurrentStatus("Healthy (Upright)");
              } else {
                // Gagal kalibrasi (tidak ada sampel valid)
                setIsCalibrating(false);
                setCurrentStatus("Kalibrasi gagal, coba lagi...");
              }
            }
          } else if (baselineRatioRef.current !== null) {
            // === FASE MONITORING: Bandingkan dengan baseline ===
            setCurrentRatio(parseFloat(ratio.toFixed(2)));

            let warnaGaris = "#4ade80";
            const baseline = baselineRatioRef.current;

            // --- LOGIKA BUNGKUK DENGAN HYSTERESIS (BERBASIS RASIO) ---
            let isSlouchingNow = isSlouchingRef.current;
            
            if (ratio < baseline * SLOUCH_RATIO_THRESHOLD) {
              // Rasio turun > 25% dari baseline → PASTI bungkuk
              isSlouchingNow = true;
            } else if (ratio > baseline * RECOVERY_RATIO_THRESHOLD) {
              // Rasio kembali > 82% dari baseline → PASTI tegak
              isSlouchingNow = false;
            }
            // Jika di antara 75%-82% → tetap status sebelumnya (dead zone / hysteresis)

            if (isSlouchingNow) {
              warnaGaris = "#ef4444";
              setBadCount((prev) => prev + 1);
              setCurrentStatus("Poor (Slouching)");

              const now = Date.now();
              const cooldownMs = (cooldown || DEFAULT_COOLDOWN_SECONDS) * 1000;

              if (!isSlouchingRef.current) {
                if (visualAlert) showDesktopNotification();
                isSlouchingRef.current = true; 
              }

              if (now - lastAlertTimeRef.current >= cooldownMs) {
                if (soundAlert) playAlertSound();
                lastAlertTimeRef.current = now;
              }
            } else {
              setGoodCount((prev) => prev + 1);
              setCurrentStatus("Healthy (Upright)");
              isSlouchingRef.current = false; 
            }
            drawSkeleton(ctx, lEar, rEar, lShoulder, rShoulder, warnaGaris);
          }
        } else {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          setCurrentStatus("Adjust your position...");
        }
      }
    }
    if (window.runDetection) {
      setTimeout(detectFrame, DETECTION_INTERVAL_MS); 
    }
  };

  const stopCameraLogic = () => {
    window.runDetection = false;
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause(); 
      videoRef.current.srcObject = null; 
      videoRef.current.removeAttribute('src'); 
      videoRef.current.load(); 
    }

    // --- SIMPAN DATA KE ANALISIS ---
    saveSession();

    setIsMonitoring(false);
    setIsCalibrating(false);
    setCurrentStatus("Waiting...");
    
    // Reset kalibrasi untuk sesi berikutnya
    baselineRatioRef.current = null;
    calibrationSamplesRef.current = [];
    setBaselineDisplay(0);
    setCurrentRatio(0);

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const saveSession = async () => {
    if (goodCount === 0 && badCount === 0) return;

    try {
      const endTime = new Date();
      const durationSeconds = Math.floor((endTime - new Date(startTime)) / 1000);
      
      // Konversi frame count ke detik
      const goodSec = Math.round(goodCount * SECONDS_PER_FRAME);
      const badSec = Math.round(badCount * SECONDS_PER_FRAME);

      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: new Date(startTime).toISOString(),
          endTime: endTime.toISOString(),
          duration: durationSeconds,
          goodPostureSeconds: goodSec,
          badPostureSeconds: badSec,
        }),
      });

      // Redirect ke halaman analisis
      router.push("/analytics");
    } catch (error) {
      console.error("Gagal menyimpan sesi:", error);
    }
  };

  const initAI = async () => {
    if (isStarting) return;

    if (!window.poseDetection || !window.tf) {
      alert("⏳ Mesin AI sedang dimuat. Tunggu beberapa detik lalu klik Start lagi.");
      return;
    }

    if (visualAlert && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    
    setIsStarting(true);
    setCurrentStatus("Memulai AI & Kamera...");

    try {
      const model = window.poseDetection.SupportedModels.MoveNet;
      
      if (!detectorRef.current) {
          detectorRef.current = await window.poseDetection.createDetector(model, {
            modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          });
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser API untuk kamera tidak didukung.");
      }

      const videoConstraints = { width: { ideal: parseInt(resolution) || 640 } };
      if (selectedCameraId) videoConstraints.deviceId = { exact: selectedCameraId };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false
        });
      } catch (streamErr) {
        console.warn("Kamera spesifik gagal diakses, mencoba setelan default...", streamErr);
        // Fallback jika id kamera spesifik atau resolusi spesifik tidak didukung
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setGoodCount(0);
        setBadCount(0);
        setStartTime(Date.now());
        window.runDetection = true;

        // --- MULAI FASE KALIBRASI ---
        setIsCalibrating(true);
        setIsMonitoring(true);
        setCalibrationCountdown(Math.ceil(CALIBRATION_DURATION_MS / 1000));
        calibrationSamplesRef.current = [];
        calibrationStartTimeRef.current = Date.now();
        setCurrentStatus("Kalibrasi... Duduk tegak!");
        
        videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(e => console.error("Video play error:", e));
            detectFrame();
        };
      }
    } catch (err) {
      console.error("Gagal:", err);
      alert("Gagal mengakses kamera. Pastikan browser memiliki izin kamera, atau tutup aplikasi lain yang sedang menggunakan kamera.");
      setCurrentStatus("Waiting...");
    } finally {
      setIsStarting(false);
    }
  };

  const handleToggle = () => {
    if (isMonitoring) stopCameraLogic();
    else initAI();
  };

  useEffect(() => {
    return () => stopCameraLogic();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = goodCount + badCount || 1;
  const goodPercent = Math.round((goodCount / total) * 100);
  const badPercent = Math.round((badCount / total) * 100);

  return (
    <DashboardLayout>
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core" />
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter" />
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl" />
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection" />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Live Monitoring</h2>
          <p className="text-slate-400 text-sm">Postur lu dipantau pakai MoveNet.</p>
        </div>
        {isMonitoring && !isCalibrating && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-bold animate-pulse">
            ● System Active
          </div>
        )}
        {isCalibrating && (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold animate-pulse">
            📐 Kalibrasi...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden aspect-video flex items-center justify-center border-[6px] border-white shadow-2xl">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover scale-x-[-1] ${!isMonitoring && "hidden"}`}
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className={`absolute top-0 left-0 w-full h-full object-cover scale-x-[-1] pointer-events-none ${!isMonitoring && "hidden"}`}
            />

            {!isMonitoring && (
              <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center text-white">
                <div className="bg-slate-700 p-5 rounded-full mb-4 text-3xl">
                  {isStarting ? "⏳" : "📷"}
                </div>
                <p className="font-bold">{isStarting ? "Memulai Sistem AI..." : "Kamera Belum Nyala"}</p>
              </div>
            )}

            {/* Overlay Kalibrasi */}
            {isCalibrating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                <div className="bg-blue-600/90 backdrop-blur-sm text-white px-10 py-8 rounded-3xl shadow-2xl text-center">
                  <p className="text-sm font-bold mb-2 opacity-80 uppercase tracking-wider">📐 Kalibrasi Postur</p>
                  <p className="text-6xl font-black mb-3">{calibrationCountdown}</p>
                  <p className="text-sm font-medium">Duduk tegak dan jangan bergerak</p>
                </div>
              </div>
            )}

            {isMonitoring && !isCalibrating && currentStatus.includes("Poor") && (
              <div className="absolute top-10 bg-red-600 text-white px-8 py-3 rounded-2xl animate-bounce shadow-xl font-bold z-20">
                ⚠️ BUNGKUK DETECTED
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] p-6 flex justify-between border shadow-sm">
            <div className="flex gap-12">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Status {baselineDisplay > 0 && `(Rasio: ${currentRatio} / Baseline: ${baselineDisplay})`}
                </p>
                <p
                  className={`text-xl font-black ${
                    currentStatus.includes("Healthy") ? "text-emerald-500" : 
                    currentStatus.includes("Poor") ? "text-red-500" : "text-blue-500"
                  }`}
                >
                  {currentStatus}
                </p>
              </div>
            </div>
          </div>
        </div>

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
          </div>

          {/* Info Kalibrasi */}
          {baselineDisplay > 0 && (
            <div className="bg-blue-50 p-5 rounded-[1.5rem] border border-blue-100">
              <h4 className="text-xs font-black text-blue-600 uppercase tracking-wider mb-2">📐 Kalibrasi</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Baseline Rasio</span>
                  <span className="font-bold text-slate-700">{baselineDisplay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rasio Saat Ini</span>
                  <span className={`font-bold ${currentRatio < baselineDisplay * SLOUCH_RATIO_THRESHOLD ? 'text-red-500' : 'text-emerald-500'}`}>
                    {currentRatio}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Threshold Bungkuk</span>
                  <span className="font-bold text-orange-500">{"<"} {(baselineDisplay * SLOUCH_RATIO_THRESHOLD).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleToggle}
            disabled={isStarting} 
            className={`w-full font-black py-5 rounded-[1.5rem] transition-all shadow-xl hover:scale-[1.02] active:scale-95 ${
              isStarting 
                ? "bg-slate-300 text-slate-500 cursor-not-allowed border-none shadow-none" 
                : isMonitoring
                ? "bg-red-50 text-red-600 border-2 border-red-100"
                : "bg-blue-600 text-white"
            }`}
          >
            {isStarting ? "⏳ TUNGGU SEBENTAR..." : isMonitoring ? "⏹ STOP MONITORING" : "▶ START MONITORING"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}