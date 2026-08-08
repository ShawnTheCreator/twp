"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { User, Mail, Lock, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "@/components/AuthContext";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token") || "";

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!inviteToken) {
      setError("No invite token provided. Please use the link sent to your email.");
    }
  }, [inviteToken]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken) return;

    if (password !== repeatPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await api.post("/api/auth/signup", { 
        inviteToken, 
        username: email, // use email as username
        email, 
        password,
        name: name.trim() + " " + surname.trim()
      });
      
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data || "Registration failed. Token may be invalid or expired.");
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
        <h1 className="text-3xl font-bold text-black uppercase tracking-widest">Account Created!</h1>
        <p className="text-sm text-gray-500 mt-4 uppercase tracking-widest font-bold">You can now sign in to your workspace.</p>
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
        <h1 className="text-3xl font-bold text-black uppercase tracking-widest text-center">Join Workspace</h1>
        <p className="text-sm text-gray-500 mt-2 uppercase tracking-widest text-center">Create your secure account</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-twBlue transition-colors" />
            <input 
              type="text" 
              placeholder="First Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-twBlue focus:border-twBlue transition-all text-black placeholder-gray-400"
              required
              disabled={!inviteToken}
            />
          </div>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-twBlue transition-colors" />
            <input 
              type="text" 
              placeholder="Surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-twBlue focus:border-twBlue transition-all text-black placeholder-gray-400"
              required
              disabled={!inviteToken}
            />
          </div>
        </div>

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
              disabled={!inviteToken}
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
              disabled={!inviteToken}
            />
          </div>
          
          <div className="mt-2 flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 transition-colors ${password.length >= 8 ? "text-green-500" : "text-gray-300"}`} />
            <span className={`text-xs font-bold uppercase tracking-widest ${password.length >= 8 ? "text-green-600" : "text-gray-400"}`}>
              At least 8 characters
            </span>
          </div>
        </div>

        <div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-twBlue transition-colors" />
            <input 
              type="password" 
              placeholder="Repeat Password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-twBlue focus:border-twBlue transition-all text-black placeholder-gray-400"
              required
              disabled={!inviteToken}
            />
          </div>
        </div>
        
        {error && <p className="text-red-600 text-sm font-bold text-center bg-red-50 py-3 rounded-lg border border-red-200 uppercase tracking-widest">{error}</p>}

        <button 
          type="submit" 
          disabled={isLoading || !inviteToken}
          className="w-full bg-twBlue text-white py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              Create Account
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-10 uppercase tracking-widest font-bold">
        TWPublishers Secure Portal
      </p>
    </div>
  );
}

export default function Signup() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-twBlue" />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
