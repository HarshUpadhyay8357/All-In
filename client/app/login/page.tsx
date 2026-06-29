"use client";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import '@/app/complement.css'

export default function LoginPage() {
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [error, seterror] = useState("");
  const [loading, setloading] = useState(false);
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    seterror("");
    setloading(true);

    try {
      const result = await api.post("/api/auth/login", { email, password });
      const { user, accessToken, refreshToken } = result.data;

      setUser(user);
      setTokens(accessToken, refreshToken);
      router.push("/lobby");
    } catch (error: any) {
      seterror(error.response?.data?.error || "login failed");
    } finally {
      setloading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/bg.png')" }}>
      <div className="rounded-lg shadow-2xl p-8 w-full max-w-md login-card">
        <h1 className="text-3xl font-bold text-center mb-8 heading">
          Your Seat Awaits...
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-violet-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setemail(e.target.value);
              }}
              className="w-full px-4 py-2 input rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-violet-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setpassword(e.target.value);
              }}
              className="w-full px-4 py-2 input rounded-lg"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-950/30 border border-red-500/30 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition login-btn"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="text-center text-sm text-white mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline register-link">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
