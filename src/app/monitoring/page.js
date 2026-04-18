"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import DashboardLayout from "@/components/DashboardLayout";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function MonitoringPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const streamRef = useRef(null);
  
  const lastAlertTimeRef = useRef(0);
  const isSlouchingRef = useRef(false);

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("Waiting...");
  const [goodCount, setGoodCount] = useState(0);
  const [badCount, setBadCount] = useState(0);
  const [slouchDistance, setSlouchDistance] = useState(0);

  const { resolution, selectedCameraId, soundAlert, cooldown, visualAlert } = useSettingsStore();

  // ==========================================
  // 🛡️ FITUR LOCKDOWN / FOCUS MODE
  // ==========================================
  useEffect(() => {
    const cegahPindahHalaman = (e) => {
      if (isMonitoring) {
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
  }, [isMonitoring]);
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
      if (titik?.score > 0.3) {
        ctx.beginPath(); ctx.arc(titik.x, titik.y, 6, 0, 2 * Math.PI); ctx.fillStyle = warna; ctx.fill();
      }
    };
    const gambarGaris = (titikA, titikB) => {
      if (titikA?.score > 0.3 && titikB?.score > 0.3) {
        ctx.beginPath(); ctx.moveTo(titikA.x, titikA.y); ctx.lineTo(titikB.x, titikB.y);
        ctx.strokeStyle = warna; ctx.lineWidth = 4; ctx.stroke();
      }
    };
    gambarGaris(bahuKiri, bahuKanan); gambarTitik(telingaKiri); gambarTitik(telingaKanan);
    gambarTitik(bahuKiri); gambarTitik(bahuKanan);
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

        if (lEar?.score > 0.3 && rEar?.score > 0.3 && lShoulder?.score > 0.3 && rShoulder?.score > 0.3) {
          const avgEarY = (lEar.y + rEar.y) / 2; const avgShoulderY = (lShoulder.y + rShoulder.y) / 2;
          const verticalDist = Math.round(avgShoulderY - avgEarY);
          setSlouchDistance(verticalDist);
          
          let warnaGaris = "#4ade80";

          // --- LOGIKA BUNGKUK ---
          if (verticalDist < 100) {
            warnaGaris = "#ef4444";
            setBadCount((prev) => prev + 1);
            setCurrentStatus("Poor (Slouching)");

            const now = Date.now();
            const cooldownMs = (cooldown || 0) * 1000;

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
        } else {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          setCurrentStatus("Adjust your position...");
        }
      }
    }
    if (window.runDetection) {
      setTimeout(detectFrame, 200); 
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

    setIsMonitoring(false);
    setCurrentStatus("Waiting...");
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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

      const videoConstraints = { width: { ideal: parseInt(resolution) || 640 } };
      if (selectedCameraId) videoConstraints.deviceId = { exact: selectedCameraId };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsMonitoring(true);
        setGoodCount(0);
        setBadCount(0);
        window.runDetection = true;
        
        videoRef.current.onloadedmetadata = () => {
            detectFrame();
        };
      }
    } catch (err) {
      console.error("Gagal:", err);
      alert("Gagal mengakses kamera. Jika lampu kamera masih menyala, tutup browser sejenak lalu buka kembali.");
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
        {isMonitoring && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-bold animate-pulse">
            ● System Active
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

            {isMonitoring && currentStatus.includes("Poor") && (
              <div className="absolute top-10 bg-red-600 text-white px-8 py-3 rounded-2xl animate-bounce shadow-xl font-bold z-20">
                ⚠️ BUNGKUK DETECTED
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] p-6 flex justify-between border shadow-sm">
            <div className="flex gap-12">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Status (Jarak: {slouchDistance}px)
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