"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Settings as SettingsIcon, LogOut, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth, api } from "@/components/AuthContext";
import { QRCodeSVG } from "qrcode.react";

export default function Settings() {
  const router = useRouter();
  const { role, name, logout, isLoading: authLoading } = useAuth();
  
  const [setupStep, setSetupStep] = useState<"idle" | "qr" | "success">("idle");
  const [qrUri, setQrUri] = useState("");
  const [secret, setSecret] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!role) {
      router.push("/login");
      return;
    }
  }, [role, authLoading, router]);

  const handleStartMfaSetup = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/mfa/setup");
      setQrUri(res.data.uri);
      setSecret(res.data.secret);
      setSetupStep("qr");
    } catch (err: any) {
      setError("Failed to start MFA setup.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/mfa/verify", { code: mfaCode });
      if (res.data.success) {
        setSetupStep("success");
      }
    } catch (err: any) {
      setError("Invalid code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center flex-col gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-twBlue" />
        <p className="text-gray-500 font-medium">Connecting to TW Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-black overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col z-20">
        <div className="p-8 flex items-center gap-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-twBlue rounded-xl flex items-center justify-center text-white font-bold">TW</div>
          <div>
            <h2 className="font-bold text-black text-lg leading-tight uppercase">TW Publishers</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Workspace</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem icon={LayoutDashboard} label="Overview" onClick={() => router.push("/")} />
          <NavItem icon={SettingsIcon} label="Settings" active />
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all font-bold uppercase text-sm tracking-widest">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        
        {/* Topbar */}
        <header className="h-20 border-b border-gray-200 bg-white flex items-center justify-between px-10 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-black">
              <ArrowLeft size={24} />
            </button>
            <h1 className="font-bold text-black text-lg uppercase tracking-widest">Settings</h1>
          </div>
          
          <div className="flex items-center gap-6 ml-auto">
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-bold text-black uppercase">{name}</p>
                <p className="text-xs text-twBlue font-semibold capitalize">{role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-babyBlue flex items-center justify-center text-twBlue font-bold border border-twBlue">
                {name?.charAt(0) || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-10 z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            
            <div className="bg-twBlue p-8 rounded-xl text-white">
              <h1 className="text-4xl font-bold uppercase tracking-widest mb-2">Security Settings</h1>
              <p className="text-babyBlue text-sm uppercase tracking-widest">Manage your authentication and security preferences</p>
            </div>

            {/* Security Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-twBlue">
                  <ShieldCheck size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-black uppercase tracking-widest text-lg">Two-Factor Authentication (2FA)</h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-xl">
                    Add an extra layer of security to your account. When you sign in, you'll need to provide a 6-digit code from your authenticator app.
                  </p>

                  {setupStep === "idle" && (
                    <button 
                      onClick={handleStartMfaSetup}
                      disabled={isLoading}
                      className="mt-6 bg-twBlue text-white px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-black transition-colors"
                    >
                      {isLoading ? "Starting..." : "Enable 2FA"}
                    </button>
                  )}

                  {setupStep === "qr" && (
                    <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-xl">
                      <h4 className="font-bold text-black uppercase tracking-widest text-sm mb-4">1. Scan this QR Code</h4>
                      <p className="text-xs text-gray-500 mb-6">Open your authenticator app (like Google Authenticator or Authy) and scan the code below.</p>
                      
                      <div className="bg-white p-4 border border-gray-200 rounded-xl inline-block mb-6">
                        <QRCodeSVG value={qrUri} size={200} />
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-8">Or enter this secret manually: <code className="bg-white border border-gray-200 px-2 py-1 rounded mx-1 text-black font-mono">{secret}</code></p>

                      <h4 className="font-bold text-black uppercase tracking-widest text-sm mb-4">2. Enter the 6-digit code</h4>
                      <form onSubmit={handleVerifyMfa} className="flex items-center gap-4 max-w-sm">
                        <input 
                          type="text" 
                          maxLength={6}
                          placeholder="123456"
                          value={mfaCode}
                          onChange={(e) => setMfaCode(e.target.value)}
                          className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-twBlue text-black font-mono tracking-widest"
                          required
                        />
                        <button 
                          type="submit"
                          disabled={isLoading || mfaCode.length !== 6}
                          className="bg-twBlue text-white px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-black transition-colors disabled:opacity-50"
                        >
                          Verify
                        </button>
                      </form>
                      {error && <p className="text-red-600 text-xs font-bold uppercase tracking-widest mt-4">{error}</p>}
                    </div>
                  )}

                  {setupStep === "success" && (
                    <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4 text-green-700">
                      <ShieldCheck size={24} />
                      <div>
                        <h4 className="font-bold uppercase tracking-widest text-sm">2FA is Enabled</h4>
                        <p className="text-xs mt-1">Your account is now secured with two-factor authentication.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// Components
function NavItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg transition-all font-bold uppercase text-sm tracking-widest ${active ? "bg-twBlue text-white" : "text-gray-500 hover:bg-gray-100 hover:text-black"}`}>
      <Icon size={20} className={active ? "text-white" : "text-gray-400"} />
      {label}
    </button>
  );
}
