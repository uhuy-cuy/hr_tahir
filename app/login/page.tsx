"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter()
    const [name, setName] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await fetch("http://127.0.0.1:8000/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ name, password })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || "Login gagal")

            localStorage.setItem("token", data.token)
            localStorage.setItem("user", JSON.stringify(data.user))
            router.push("/dashboard")
        } catch (err: any) {
            setError(err.message || "Terjadi kesalahan")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 animate-gradient-x">
            <div className="bg-white/30 backdrop-blur-lg shadow-2xl rounded-3xl w-full max-w-md p-10 sm:p-12 border border-white/20">
                <h2 className="text-3xl font-extrabold mb-8 text-center text-white drop-shadow-lg">
                    HR System
                </h2>

                {error && (
                    <p className="text-red-400 text-center mb-6 font-semibold animate-shake">{error}</p>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="relative">
                        <input
                            type="text"
                            id="username"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Username"
                            className="peer w-full bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl px-4 pt-5 pb-2 text-gray-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                            autoFocus
                        />
                        <label
                            htmlFor="username"
                            className="absolute left-4 top-2 text-gray-700 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-gray-700 peer-focus:text-sm"
                        >
                            Username
                        </label>
                    </div>

                    <div className="relative">
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Password"
                            className="peer w-full bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl px-4 pt-5 pb-2 text-gray-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                        />
                        <label
                            htmlFor="password"
                            className="absolute left-4 top-2 text-gray-700 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-gray-700 peer-focus:text-sm"
                        >
                            Password
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading && (
                            <svg
                                className="animate-spin h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                            </svg>
                        )}
                        {loading ? "Loading..." : "Login"}
                    </button>
                </form>

                <p className="mt-6 text-center text-white/80 text-sm">
                    &copy; 2026 HR System by @tahirwiyann
                </p>
            </div>

            {/* Tailwind Animations */}
            <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 10s ease infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s linear;
        }
      `}</style>
        </div>
    )
}