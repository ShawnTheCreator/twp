"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users as UsersIcon, Settings, Briefcase, Loader2, DollarSign, Target, Activity, FileText
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://twp-pfrw.onrender.com";

import { useAuth, api } from "@/components/AuthContext";

export default function ReferralsPage() {
  const router = useRouter();
  const { role, name, isLoading: authLoading } = useAuth();
  
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!role || role !== "admin") {
      router.push("/");
      return;
    }

    fetchReferrals();
  }, [role, authLoading, router]);

  async function fetchReferrals() {
    try {
      const res = await api.get(`/api/admin/referrals/dashboard`);
      if (res.status === 200) {
        setPartners(res.data.partners);
      }
    } catch (error) {
      console.error("Failed to fetch referrals", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center flex-col gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-tw-blue" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-slate-800 overflow-hidden font-sans">
      
      {/* Sidebar (simplified for sub-page) */}
      <motion.aside 
        initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        className="w-72 bg-slate-50/80 backdrop-blur-xl border-r border-slate-200 flex flex-col z-20"
      >
        <div className="p-8 flex items-center gap-4 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-10 h-10 bg-gradient-to-br from-tw-blue to-indigo-600 rounded-xl flex items-center justify-center text-slate-900 font-bold shadow-lg shadow-blue-500/20">TW</div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg leading-tight">TW Publishers</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Workspace</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={LayoutDashboard} label="Overview" onClick={() => router.push('/')} />
          <NavItem icon={UsersIcon} label="Team" onClick={() => router.push('/users')} />
          <NavItem icon={Briefcase} label="Referrals" active />
          <NavItem icon={Settings} label="Settings" />
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-tw-blue/10 blur-[120px] rounded-full pointer-events-none" />
        
        <header className="h-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-md flex items-center justify-between px-10 z-10 sticky top-0">
          <h1 className="text-xl font-bold text-slate-900">Referral Partners</h1>
          <button className="bg-tw-blue hover:bg-blue-500 text-slate-900 px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20">
            + New Partner
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-10 z-10 scrollbar-hide">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-8">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard title="Active Partners" value={partners.filter(p => p.status === 'active').length} icon={UsersIcon} color="text-blue-400" bg="bg-blue-400/10" />
              <StatCard title="Total Form Fills" value={partners.reduce((acc, p) => acc + p.totalFormFills, 0)} icon={FileText} color="text-indigo-400" bg="bg-indigo-400/10" />
              <StatCard title="Deals Closed" value={partners.reduce((acc, p) => acc + p.totalDealsClosed, 0)} icon={Target} color="text-green-400" bg="bg-green-400/10" />
              <StatCard title="Pending Commissions" value={`R ${partners.reduce((acc, p) => acc + p.pendingCommissionZar, 0).toLocaleString()}`} icon={DollarSign} color="text-amber-400" bg="bg-amber-400/10" />
            </div>

            {/* Partners Table */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xl overflow-hidden">
              <h3 className="font-bold text-slate-900 text-lg mb-6 px-2">Partner Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                      <th className="pb-4 px-4 font-semibold">Partner</th>
                      <th className="pb-4 px-4 font-semibold">Code / Link</th>
                      <th className="pb-4 px-4 font-semibold text-center">Forms</th>
                      <th className="pb-4 px-4 font-semibold text-center">Closed</th>
                      <th className="pb-4 px-4 font-semibold text-right">Commissions (ZAR)</th>
                      <th className="pb-4 px-4 font-semibold text-center">Status</th>
                      <th className="pb-4 px-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          No referral partners found. Add one to get started.
                        </td>
                      </tr>
                    ) : partners.map((p, i) => (
                      <tr key={i} className="border-b border-slate-200/50 hover:bg-slate-200/30 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-900">{p.partnerName}</p>
                        </td>
                        <td className="py-4 px-4">
                          <code className="bg-white text-blue-400 px-2 py-1 rounded text-xs border border-slate-700">
                            ?ref={p.partnerCode}
                          </code>
                        </td>
                        <td className="py-4 px-4 text-center font-medium text-slate-600">{p.totalFormFills}</td>
                        <td className="py-4 px-4 text-center font-medium text-green-400">{p.totalDealsClosed}</td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-slate-900">R {p.totalCommissionZar.toLocaleString()}</span>
                            {p.pendingCommissionZar > 0 && (
                              <span className="text-xs font-semibold text-amber-400">R {p.pendingCommissionZar.toLocaleString()} pending</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            p.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button className="text-sm text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                            View Advice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: { title: string, value: string | number, icon: any, color: string, bg: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-xl">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={color} size={24} />
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${active ? "bg-tw-blue text-slate-900 shadow-lg shadow-blue-600/20" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
      <Icon size={20} className={active ? "text-slate-900" : "text-slate-500"} />
      {label}
    </button>
  );
}
