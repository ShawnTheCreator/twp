"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Loader2, ArrowRight } from "lucide-react";
import { useAuth, api } from "@/components/AuthContext";
import { Turnstile } from '@marsidev/react-turnstile';

export default function Login() {
  const router = useRouter();
  const { setAuth } = useAuth();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // MFA State
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaUserId, setMfaUserId] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!turnstileToken) {
        setError("Please complete the security check.");
        setIsLoading(false);
        return;
      }

      const res = await api.post("/api/auth/login", { username, password, turnstileToken });
      
      if (res.data.mfa_required) {
        setMfaUserId(res.data.userId);
        setRequiresMfa(true);
      } else if (res.data.success) {
        setAuth(res.data.accessToken, res.data.role, res.data.name);
        router.push("/");
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 429) {
        setError(err.response.status === 429 ? "Too many attempts. Try again later." : "Invalid credentials.");
      } else {
        setError("Failed to connect to backend server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await api.post("/api/auth/login/mfa", { userId: mfaUserId, code: mfaCode });
      if (res.data.success) {
        setAuth(res.data.accessToken, res.data.role, res.data.name);
        router.push("/");
      }
    } catch (err: any) {
      setError("Invalid 2FA code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

      <div className="w-full max-w-md bg-white border border-gray-200 p-10 rounded-xl">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-twBlue rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-6">
            TW
          </div>
          <h1 className="text-3xl font-bold text-black uppercase tracking-widest text-center">
            {requiresMfa ? "Two-Factor Auth" : "Welcome Back"}
          </h1>
          <p className="text-sm text-gray-500 mt-2 uppercase tracking-widest text-center">
            {requiresMfa ? "Enter the 6-digit code from your app" : "Sign in to your workspace"}
          </p>
        </div>

        {!requiresMfa ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-twBlue transition-colors" />
                <input 
                  type="text" 
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-twBlue focus:border-twBlue transition-all text-black placeholder-gray-400"
                  required
                />
              </div>
            </div>
            <div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-twBlue transition-colors" />
                <input 
                  type="password" 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-twBlue focus:border-twBlue transition-all text-black placeholder-gray-400"
                  required
                />
              </div>
              <div className="text-right mt-2">
                <a href="/forgot-password" className="text-xs font-bold text-twBlue uppercase tracking-widest hover:underline">Forgot Password?</a>
              </div>
            </div>

            <div className="flex justify-center">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setError("Turnstile verification failed. Please refresh and try again.")}
                onExpire={() => setTurnstileToken("")}
              />
            </div>
            
            {error && <p className="text-red-600 text-sm font-bold text-center bg-red-50 py-3 rounded-lg border border-red-200 uppercase tracking-widest">{error}</p>}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-twBlue text-white py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="space-y-6">
            <div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-twBlue transition-colors" />
                <input 
                  type="text" 
                  placeholder="123456"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-twBlue focus:border-twBlue transition-all text-black placeholder-gray-400 tracking-[0.5em] font-mono text-xl text-center"
                  required
                />
              </div>
            </div>
            
            {error && <p className="text-red-600 text-sm font-bold text-center bg-red-50 py-3 rounded-lg border border-red-200 uppercase tracking-widest">{error}</p>}

            <button 
              type="submit" 
              disabled={isLoading || mfaCode.length !== 6}
              className="w-full bg-twBlue text-white py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Verify
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
            <button 
              type="button"
              onClick={() => { setRequiresMfa(false); setMfaCode(""); setError(""); }}
              className="w-full bg-transparent text-gray-500 py-4 font-bold uppercase tracking-widest hover:text-black transition-all mt-2 text-xs"
            >
              Cancel
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-10 uppercase tracking-widest font-bold">
          TWPublishers Secure Portal
        </p>
      </div>
    </div>
  );
}
