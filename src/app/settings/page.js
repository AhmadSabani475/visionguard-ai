"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Video, Bell, Lock, AppWindow } from "lucide-react";

export default function SettingsPage() {
  const { 
    resolution, setResolution,
    soundAlert, toggleSound,
    visualAlert, toggleVisual, 
    cooldown, setCooldown,
    selectedCameraId, setSelectedCameraId, // <-- Dikembalikan!
    resetSettings
  } = useSettingsStore();

  const [hasHydrated, setHasHydrated] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]); // <-- Dikembalikan!
  
  // --- FUNGSI DETEKSI KAMERA OTOMATIS (DIKEMBALIKAN) ---
  useEffect(() => {
    let isMounted = true;

    const detectCameras = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (isMounted) {
          setAvailableCameras(videoDevices);
          
          if (!selectedCameraId && videoDevices.length > 0) {
            setSelectedCameraId(videoDevices[0].deviceId);
          }
        }

        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.warn("Gagal mendeteksi kamera.", error);
      }
    };

    if (hasHydrated) {
      detectCameras();
    }

    return () => {
      isMounted = false;
    };
  }, [hasHydrated, selectedCameraId, setSelectedCameraId]);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const handleSave = () => {
    if (visualAlert && "Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification("VisionGuard AI", { body: "Notifikasi pop-up berhasil diaktifkan!" });
        } else {
          alert("Kamu memblokir notifikasi! Silakan klik ikon gembok 🔒 di dekat URL untuk mengizinkannya.");
        }
      });
    }
    alert("Settings berhasil disimpan secara permanen!");
  };

  const handleDiscard = () => {
    resetSettings();
    alert("Perubahan dibatalkan, kembali ke bawaan pabrik!");
  };

  if (!hasHydrated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-slate-400 animate-pulse font-medium">Loading settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  const ToggleSwitch = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
        checked ? 'bg-[#3B82F6]' : 'bg-slate-200'
      }`}
    >
      <span 
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} 
      />
    </button>
  );

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h2 className="text-[32px] font-bold text-[#0F172A] leading-tight">
          Settings
        </h2>
        <p className="text-slate-500 mt-1 font-medium">
          Manage your device preferences and security configurations.
        </p>
      </div>

      <div className="space-y-6 max-w-[800px] pb-10">
        
        {/* CAMERA SETTINGS CARD */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-[#3B82F6]"><Video size={24} strokeWidth={2.5} /></div>
            <h3 className="font-bold text-[#0F172A] text-lg">Camera Settings</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* INPUT DEVICE DROPDOWN (DIKEMBALIKAN) */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-2 block uppercase tracking-wider">Input Device</label>
              <select 
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer font-medium appearance-none truncate"
              >
                {availableCameras.length === 0 ? (
                  <option value="">Mendeteksi kamera...</option>
                ) : (
                  availableCameras.map((camera, index) => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera Device ${index + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-2 block uppercase tracking-wider">Resolution</label>
              <select 
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer font-medium appearance-none"
              >
                <option value="720">1280 x 720 (720p)</option>
                <option value="1080">1920 x 1080 (1080p)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ALERT SETTINGS CARD */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all">
          <div className="flex items-center gap-3 mb-8">
            <div className="text-[#3B82F6]"><Bell size={24} strokeWidth={2.5} /></div>
            <h3 className="font-bold text-[#0F172A] text-lg">Sound Alert</h3>
          </div>
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-[#0F172A] mb-1">Sound Notification</h4>
                <p className="text-sm text-slate-500">Play an audible chime when a threat is detected.</p>
              </div>
              <ToggleSwitch checked={soundAlert} onChange={toggleSound} />
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-[#0F172A] text-sm">Alert Cooldown (Seconds)</h4>
                <span className="text-[#3B82F6] font-bold text-sm">{cooldown}s</span>
              </div>
              <input 
                type="range" min="0" max="10" 
                value={cooldown} onChange={(e) => setCooldown(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#3B82F6]" 
              />
            </div>
          </div>
        </div>

        {/* NOTIFICATION POPUP CARD */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all">
          <div className="flex items-center gap-3 mb-8">
            <div className="text-[#3B82F6]"><AppWindow size={24} strokeWidth={2.5} /></div>
            <h3 className="font-bold text-[#0F172A] text-lg">Desktop Notification</h3>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-[#0F172A] mb-1">System Pop-up Alert</h4>
              <p className="text-sm text-slate-500">Munculkan peringatan dari sistem komputer meski browser di-minimize.</p>
            </div>
            <ToggleSwitch checked={visualAlert} onChange={toggleVisual} />
          </div>
        </div>

        {/* PRIVACY SETTINGS CARD */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-[#3B82F6]"><Lock size={24} strokeWidth={2.5} /></div>
            <h3 className="font-bold text-[#0F172A] text-lg">Privacy Settings</h3>
          </div>
          <div className="flex justify-between items-start gap-8 bg-[#F8FAFC] p-6 rounded-2xl border border-slate-100">
            <div>
              <h4 className="font-bold text-[#0F172A] mb-2">Local Neural Processing</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                All video streams stay on your device. VisionGuard AI will not send any data to the cloud.
              </p>
            </div>
            <div className="mt-1">
              <ToggleSwitch checked={true} onChange={() => alert("Local processing is mandatory.")} />
            </div>
          </div>
        </div>

        {/* BOTTOM BUTTONS */}
        <div className="flex items-center justify-end gap-6 pt-4">
          <button onClick={handleDiscard} className="text-slate-500 font-bold hover:text-slate-800 transition-colors text-sm">Discard Changes</button>
          <button onClick={handleSave} className="bg-[#3B82F6] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 text-sm">Save Settings</button>
        </div>

      </div>
    </DashboardLayout>
  );
}