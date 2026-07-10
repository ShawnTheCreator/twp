"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, User, Loader2 } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        // In a real app, save the token to cookies. For this demo, we use localStorage.
        localStorage.setItem("tw_auth", data.role);
        router.push("/");
      } else {
        setError("Invalid credentials.");
      }
    } catch (err) {
      setError("Failed to connect to backend server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-twBlue rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-twBlue/30">TW</div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to the TW Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Username (admin or dev)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-twBlue/20 focus:border-twBlue transition-all text-slate-900"
                required
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="password" 
                placeholder="Password (password123 or dev123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-twBlue/20 focus:border-twBlue transition-all text-slate-900"
                required
              />
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-twBlue text-white py-3 rounded-xl font-bold hover:bg-twBlue/90 transition-colors shadow-lg shadow-twBlue/20 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-8 uppercase tracking-widest">
          Secure Login Portal
        </p>
      </motion.div>
    </div>
  );
}
