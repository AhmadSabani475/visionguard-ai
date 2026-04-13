"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    
    // State untuk form Login
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [isLoginLoading, setIsLoginLoading] = useState(false);

    // State untuk form Register
    const [regName, setRegName] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regError, setRegError] = useState("");
    const [regSuccess, setRegSuccess] = useState("");
    const [isRegLoading, setIsRegLoading] = useState(false);

    // --- FUNGSI LOGIN ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoginLoading(true);
        setLoginError("");

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setLoginError("Email atau password salah.");
            } else {
                router.push("/dashboard"); 
            }
        } catch (error) {
            setLoginError("Terjadi kesalahan sistem.");
        } finally {
            setIsLoginLoading(false);
        }
    };

    // --- FUNGSI REGISTER ---
    const handleRegister = async (e) => {
        e.preventDefault();
        setIsRegLoading(true);
        setRegError("");
        setRegSuccess("");

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    name: regName, 
                    email: regEmail, 
                    password: regPassword 
                }),
            });

            const data = await res.json();

            if (res.ok) {
                // Jika sukses, tampilkan pesan dan pindah ke tab login
                setRegSuccess("Akun berhasil dibuat! Silakan login.");
                setRegName("");
                setRegEmail("");
                setRegPassword("");
                setTimeout(() => setIsLogin(true), 2000); // Pindah ke tab login setelah 2 detik
            } else {
                setRegError(data.message || "Gagal melakukan registrasi.");
            }
        } catch (error) {
            setRegError("Gagal terhubung ke server.");
        } finally {
            setIsRegLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 font-sans flex items-center justify-center min-h-screen transition-colors duration-300">
            <div className="w-full max-w-md px-4">
                
                {/* LOGO */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-blue-600 dark:text-blue-500 flex items-center justify-center gap-2">
                        🛡️ VisionGuard AI
                    </h1>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Smart posture monitoring system</p>
                </div>

                {/* CARD KONTEN */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-300">
                    
                    {/* TOGGLE TABS */}
                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 mb-6 transition-colors">
                        <button 
                            onClick={() => {
                                setIsLogin(true);
                                setRegError(""); // Bersihkan error saat pindah tab
                                setRegSuccess("");
                            }}
                            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                                isLogin 
                                    ? "bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white" 
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                        >
                            Login
                        </button>
                        <button 
                            onClick={() => {
                                setIsLogin(false);
                                setLoginError(""); // Bersihkan error saat pindah tab
                            }}
                            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                                !isLogin 
                                    ? "bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white" 
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                        >
                            Register
                        </button>
                    </div>

                    {isLogin ? (
                        /* ================= LOGIN FORM ================= */
                        <form className="space-y-4" onSubmit={handleLogin}>
                            {loginError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 text-sm rounded-lg text-center font-medium">
                                    {loginError}
                                </div>
                            )}
                            {/* Menampilkan pesan sukses dari register (jika ada) */}
                            {regSuccess && (
                                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm rounded-lg text-center font-medium">
                                    {regSuccess}
                                </div>
                            )}
                            
                            <input 
                                type="email" 
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 ring-blue-100 dark:ring-blue-900/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors" 
                            />
                            <input 
                                type="password" 
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 ring-blue-100 dark:ring-blue-900/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors" 
                            />
                            <button 
                                type="submit" 
                                disabled={isLoginLoading}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {isLoginLoading ? "Memproses..." : "Login"}
                            </button>
                        </form>
                    ) : (
                        /* ================= REGISTER FORM ================= */
                        <form className="space-y-4" onSubmit={handleRegister}>
                            {regError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 text-sm rounded-lg text-center font-medium">
                                    {regError}
                                </div>
                            )}

                            <input 
                                type="text" 
                                placeholder="Nama Lengkap"
                                value={regName}
                                onChange={(e) => setRegName(e.target.value)}
                                required
                                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 ring-blue-100 dark:ring-blue-900/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors" 
                            />
                            <input 
                                type="email" 
                                placeholder="Email"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                required
                                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 ring-blue-100 dark:ring-blue-900/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors" 
                            />
                            <input 
                                type="password" 
                                placeholder="Password"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 ring-blue-100 dark:ring-blue-900/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors" 
                            />
                            <button 
                                type="submit" 
                                disabled={isRegLoading}
                                className="w-full bg-green-600 dark:bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-700 dark:hover:bg-green-600 transition disabled:opacity-50"
                            >
                                {isRegLoading ? "Mendaftarkan..." : "Register"}
                            </button>
                        </form>
                    )}

                </div>

                {/* FOOTER */}
                <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
                    © 2026 VisionGuard AI
                </p>

            </div>
        </div>
    );
}