"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/components/AuthContext";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await api.post("/api/auth/reset-password", { token, newPassword: password });
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError(err.response.data || "Invalid or expired token.");
      } else {
        setError("Failed to connect to backend server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md bg-white border border-gray-200 p-10 rounded-xl text-center">
        <div className="w-16 h-16 bg-twBlue rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-6 mx-auto">
          TW
        </div>
        <h1 className="text-3xl font-bold text-black uppercase tracking-widest">Password Updated!</h1>
        <p className="text-sm text-gray-500 mt-4 uppercase tracking-widest font-bold">You can now sign in with your new password.</p>
        <p className="text-xs text-gray-400 mt-2">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white border border-gray-200 p-10 rounded-xl">
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 bg-twBlue rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-6">
          TW
        </div>
        <h1 className="text-3xl font-bold text-black uppercase tracking-widest text-center">New Password</h1>
        <p className="text-sm text-gray-500 mt-2 uppercase tracking-widest text-center">Enter your new secure password</p>
      </div>

      <form onSubmit={handleReset} className="space-y-6">
        <div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-twBlue transition-colors" />
            <input 
              type="password" 
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-twBlue focus:border-twBlue transition-all text-black placeholder-gray-400"
              required
              disabled={!token}
            />
          </div>
        </div>
        
        {error && <p className="text-red-600 text-sm font-bold text-center bg-red-50 py-3 rounded-lg border border-red-200 uppercase tracking-widest">{error}</p>}

        <button 
          type="submit" 
          disabled={isLoading || !token}
          className="w-full bg-twBlue text-white py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              Update Password
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-twBlue" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
