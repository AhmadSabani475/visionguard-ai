import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
    persist(
        (set) => ({
            // STATE 
            resolution: "720",
            soundAlert: true,
            visualAlert: true,
            screenFlash: false,
            cooldown: 3,
            selectedCameraId: "", // <-- State baru untuk ID Kamera

            // ACTIONS
            setResolution: (newResolution) => set({ resolution: newResolution }),
            toggleSound: () => set((state) => ({ soundAlert: !state.soundAlert })),
            toggleVisual: () => set((state) => ({ visualAlert: !state.visualAlert })),
            toggleScreenFlash: () => set((state) => ({ screenFlash: !state.screenFlash })),
            setCooldown: (newVal) => set({ cooldown: newVal }),
            setSelectedCameraId: (id) => set({ selectedCameraId: id }), // <-- Action baru
            
            // FUNGSI RESET
            resetSettings: () => set({
                resolution: "720",
                soundAlert: true,
                visualAlert: true,
                screenFlash: false,
                cooldown: 3,
                selectedCameraId: "", // <-- Kembalikan ke kosong
            }),
        }),
        {
            name: 'vg_settings', 
        }
    )
);