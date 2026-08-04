"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Mail } from "lucide-react";
import { api } from "@/components/AuthContext";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await api.post("/api/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err: any) {
      setError("Failed to connect to backend server.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-gray-200 p-10 rounded-xl text-center">
          <div className="w-16 h-16 bg-twBlue rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-6 mx-auto">
            TW
          </div>
          <h1 className="text-3xl font-bold text-black uppercase tracking-widest">Email Sent!</h1>
          <p className="text-sm text-gray-500 mt-4 uppercase tracking-widest font-bold">If an account exists, a reset link has been sent to your email.</p>
          <button 
            onClick={() => router.push("/login")}
            className="w-full bg-gray-100 text-black py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-gray-200 transition-all mt-8"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 p-10 rounded-xl">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-twBlue rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-6">
            TW
          </div>
          <h1 className="text-3xl font-bold text-black uppercase tracking-widest text-center">Reset Password</h1>
          <p className="text-sm text-gray-500 mt-2 uppercase tracking-widest text-center">Enter your email to receive a recovery link</p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          <div>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-twBlue transition-colors" />
              <input 
                type="email" 
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-twBlue focus:border-twBlue transition-all text-black placeholder-gray-400"
                required
              />
            </div>
          </div>
          
          {error && <p className="text-red-600 text-sm font-bold text-center bg-red-50 py-3 rounded-lg border border-red-200 uppercase tracking-widest">{error}</p>}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-twBlue text-white py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Send Reset Link
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        <button 
          onClick={() => router.push("/login")}
          className="w-full bg-transparent text-gray-500 py-4 font-bold uppercase tracking-widest hover:text-black transition-all mt-4 text-xs"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
