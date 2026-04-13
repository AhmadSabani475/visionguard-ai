"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react"; // Import hook NextAuth
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();
    const { data: session, status } = useSession(); // Ambil data user yang sedang login
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Ambil inisial nama atau email untuk avatar
    const userDisplay = session?.user?.name || session?.user?.email || "Guest";
    const userInitial = userDisplay.charAt(0).toUpperCase();

    const handleLogout = async () => {
        // Fungsi logout bawaan NextAuth
        // callbackUrl memastikan user diarahkan kembali ke halaman login setelah logout
        await signOut({ callbackUrl: "/login" });
    };

    const handleProtectedNavigation = (e, path) => {
        e.preventDefault();
        if (status !== "authenticated") {
            alert("Login dulu untuk akses fitur ini!");
            router.push("/login");
        } else {
            router.push(path);
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 font-sans flex h-screen overflow-hidden transition-colors duration-300">

            {/* SIDEBAR */}
            <aside className="w-64 bg-white dark:bg-slate-800 border-r dark:border-slate-700 p-6 flex flex-col shrink-0 transition-colors">
                <div className="flex items-center mb-10 text-blue-600 dark:text-blue-500 font-bold text-xl">
                    <span className="mr-2">🛡️</span> VisionGuard AI
                </div>

                <nav className="space-y-2 flex-1">
                    <Link href="/dashboard" className="block p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-semibold">
                        Dashboard
                    </Link>

                    <Link href="/monitoring" className="block p-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                        Monitoring
                    </Link>

                    <a 
                        href="/analytics"
                        onClick={(e) => handleProtectedNavigation(e, "/analytics")}
                        className="block p-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                    >
                        Analytics
                    </a>

                    <a 
                        href="/history"
                        onClick={(e) => handleProtectedNavigation(e, "/history")}
                        className="block p-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                    >
                        History
                    </a>

                    <Link href="/settings" className="block p-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                        Settings
                    </Link>
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 p-8 overflow-y-auto">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-8">
                    <input 
                        type="text" 
                        placeholder="Search insights..."
                        className="bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-full px-5 py-2 w-1/3 outline-none focus:ring-2 ring-blue-100 dark:ring-blue-900/50 transition-all"
                    />

                    {/* PROFILE */}
                    <div className="relative">
                        <div 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                            className="flex items-center gap-3 cursor-pointer select-none"
                        >
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                {status === "loading" ? "Loading..." : userDisplay}
                            </span>
                            <div className="w-10 h-10 bg-orange-200 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 rounded-full flex items-center justify-center font-bold">
                                {userInitial}
                            </div>
                        </div>

                        {/* DROPDOWN MENU */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-3 w-40 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50">
                                {status !== "authenticated" ? (
                                    <button 
                                        onClick={() => router.push("/login")} 
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm dark:text-white transition-colors"
                                    >
                                        Login
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleLogout} 
                                        className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/30 text-sm text-red-500 dark:text-red-400 transition-colors"
                                    >
                                        Logout
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* HERO SECTION */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border dark:border-slate-700 mb-8 flex justify-between items-center shadow-sm transition-colors">
                    <div className="max-w-md">
                        <span className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                            ⚡ AI Monitoring Active
                        </span>
                        <h2 className="text-4xl font-bold text-slate-800 dark:text-white my-4">
                            Welcome, {session?.user?.name || "User"}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            Monitor your posture in real-time to enhance your health.
                        </p>

                        <div className="flex gap-4">
                            <Link 
                                href="/monitoring"
                                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors text-center"
                            >
                                Start Monitoring
                            </Link>

                            <button 
                                onClick={(e) => handleProtectedNavigation(e, "/analytics")}
                                className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-center"
                            >
                                View Analytics
                            </button>
                        </div>
                    </div>

                    <div className="w-1/3 hidden md:block">
                        <img 
                            src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80"
                            alt="Monitoring Posture"
                            className="rounded-2xl grayscale object-cover"
                        />
                    </div>
                </div>

            </main>
        </div>
    );
}