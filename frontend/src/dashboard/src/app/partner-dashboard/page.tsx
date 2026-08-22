"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, Loader2, DollarSign, Target, Activity, Link as LinkIcon, Copy, Check, Download, Clipboard, LogOut,
  Flame, TrendingUp, Users, Calendar, AlertCircle, MessageSquare, MousePointerClick, FileText
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://twp-pfrw.onrender.com";

import { useAuth, api } from "@/components/AuthContext";

export default function PartnerDashboardPage() {
  const router = useRouter();
  const { role, name, logout, isLoading: authLoading } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [scripts, setScripts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  
  // Activity form state
  const [messagesSent, setMessagesSent] = useState("");
  const [linkClicks, setLinkClicks] = useState("");
  const [followUps, setFollowUps] = useState("");
  const [disqualified, setDisqualified] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!role || role !== "referral_partner") {
      router.push("/");
      return;
    }

    fetchPartnerData();
  }, [role, authLoading, router]);

  async function fetchPartnerData() {
    try {
      const [dashRes, scriptsRes, leadsRes] = await Promise.all([
        api.get(`/api/partner/dashboard`),
        api.get(`/api/partner/scripts`),
        api.get(`/api/partner/leads`)
      ]);
      setData(dashRes.data);
      setScripts(scriptsRes.data);
      setLeads(leadsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopyLink = () => {
    if (data?.partnerCode) {
      const link = "https://twpublishers.co.za?ref=" + data.partnerCode;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => prompt("Copy your link manually:", link));
      } else {
        prompt("Copy your link manually:", link);
      }
    }
  };

  const handleCopyScript = (id: string, content: string) => {
    if (!data?.partnerCode) return;
    const link = "https://twpublishers.co.za?ref=" + data.partnerCode;
    const finalContent = content.replace("[AFFILIATE_LINK]", link);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(finalContent).then(() => {
        setCopiedScriptId(id);
        setTimeout(() => setCopiedScriptId(null), 2000);
      }).catch(() => prompt("Copy your script manually:", finalContent));
    } else {
      prompt("Copy your script manually:", finalContent);
    }
  };

  const downloadLeads = async () => {
    if (!leads || leads.length === 0) {
      alert("No leads assigned to you right now.");
      return;
    }
    
    const csvRows = [];
    csvRows.push("Name,Email,LinkedIn,Package,Status");
    leads.forEach((l: any) => {
      csvRows.push(`${l.fullName},${l.email || ""},${l.linkedInUrl || ""},${l.packageTier || ""},${l.status || ""}`);
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'My_Assigned_Leads.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const submitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messagesSent) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/partner/activity`, { 
        messagesSent: parseInt(messagesSent) || 0,
        linkClicks: parseInt(linkClicks) || 0,
        followUps: parseInt(followUps) || 0,
        disqualified: parseInt(disqualified) || 0
      });
      setSubmitSuccess(true);
      setMessagesSent("");
      setLinkClicks("");
      setFollowUps("");
      setDisqualified("");
      setTimeout(() => setSubmitSuccess(false), 3000);
      fetchPartnerData(); // Refresh data to show updated streak
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Calculate weekly messages from recent activities
  const weeklyMessages = data?.activities?.reduce((acc: number, curr: any) => acc + curr.messagesSent, 0) || 0;
  const weeklyClicks = data?.activities?.reduce((acc: number, curr: any) => acc + curr.linkClicks, 0) || 0;
  const weeklyFills = data?.totalFormFills || 0;
  const progressPercent = Math.min((weeklyMessages / 150) * 100, 100);
  const currentStreak = data?.currentStreak || 0;
  
  // Calculate today's metrics
  const today = new Date().toISOString().split('T')[0];
  const todaysActivity = data?.activities?.find((a: any) => a.date.startsWith(today));
  const todayMessages = todaysActivity?.messagesSent || 0;
  const todayClicks = todaysActivity?.linkClicks || 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col md:flex-row">
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center px-8 justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold tracking-tighter">TW</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Partner Dashboard</h1>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-gray-500 hidden md:block">Welcome, {name}</span>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all font-bold text-xs uppercase tracking-widest">
              <LogOut size={16} />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Earned</p>
                <h3 className="text-2xl font-black text-gray-800">R {data?.totalCommissionZar?.toLocaleString() || 0}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Target size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending</p>
                <h3 className="text-2xl font-black text-gray-800">R {data?.pendingCommissionZar?.toLocaleString() || 0}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
                <Activity size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Closed Deals</p>
                <h3 className="text-2xl font-black text-gray-800">{data?.totalDealsClosed || 0}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm flex flex-col justify-center">
               <button 
                onClick={handleCopyLink}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {copied ? <Check size={18} strokeWidth={3} /> : <LinkIcon size={18} strokeWidth={2.5} />}
                {copied ? "Copied!" : "Copy Affiliate Link"}
              </button>
            </div>
          </div>

          {/* Goal Tracker & Conversion Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                      <Flame className="text-orange-500" size={24} /> 
                      THIS WEEK
                    </h2>
                 </div>
                 <div className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full font-black text-sm flex items-center gap-1">
                   <Flame size={16} /> {currentStreak}-Day Streak
                 </div>
               </div>
               
               <div className="space-y-3">
                 <div className="flex justify-between text-sm font-bold text-gray-600">
                    <span>{weeklyMessages} / 150 messages</span>
                    <span>{Math.round(progressPercent)}%</span>
                 </div>
                 <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                   <div 
                     className="bg-gradient-to-r from-orange-400 to-red-500 h-4 rounded-full transition-all duration-1000 ease-out" 
                     style={{ width: `${progressPercent}%` }}
                   />
                 </div>
               </div>
               
               <div className="mt-8 flex gap-4 text-sm font-bold text-gray-600">
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                    {todayMessages >= 30 ? <Check className="text-green-500" size={16}/> : <AlertCircle className="text-orange-400" size={16}/>}
                    {todayMessages} today
                  </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
               <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 mb-6">
                 <TrendingUp className="text-blue-500" size={24} /> 
                 Conversion Metrics
               </h2>
               <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <MessageSquare className="text-blue-500 mb-2" size={24} />
                    <span className="text-2xl font-black text-gray-800">{todayMessages}</span>
                    <span className="text-xs font-bold text-gray-500 uppercase">Messages Today</span>
                    <span className="text-xs text-gray-400 mt-1">{weeklyMessages} Week</span>
                  </div>
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <MousePointerClick className="text-indigo-500 mb-2" size={24} />
                    <span className="text-2xl font-black text-gray-800">{todayClicks}</span>
                    <span className="text-xs font-bold text-gray-500 uppercase">Clicks Today</span>
                    <span className="text-xs text-gray-400 mt-1">{weeklyClicks} Week</span>
                  </div>
                  <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <FileText className="text-green-500 mb-2" size={24} />
                    <span className="text-2xl font-black text-gray-800">{weeklyFills}</span>
                    <span className="text-xs font-bold text-gray-500 uppercase">Form Fills</span>
                    <span className="text-xs text-gray-400 mt-1">This Week</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tools & Activity Form */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-lg font-black mb-2 text-gray-800 flex items-center gap-2">
                  <Users className="text-indigo-500" size={20} />
                  Export Leads
                </h2>
                <p className="text-sm text-gray-500 mb-4 font-medium">Current Batch: <strong className="text-gray-800">{leads.length} leads assigned</strong></p>
                <button 
                  onClick={downloadLeads}
                  className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black flex items-center justify-center gap-2 transition-colors"
                >
                  <Download size={18} /> Download Lead Batch
                </button>
              </div>

              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                <h2 className="text-lg font-black mb-4 text-gray-800 flex items-center gap-2">
                  <Calendar className="text-blue-500" size={20} />
                  Submit Daily Activity
                </h2>
                <form onSubmit={submitActivity} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Messages Sent</label>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        value={messagesSent} 
                        onChange={e => setMessagesSent(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-semibold"
                        placeholder="e.g. 30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link Clicks</label>
                      <input 
                        type="number" 
                        min="0"
                        value={linkClicks} 
                        onChange={e => setLinkClicks(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-semibold"
                        placeholder="e.g. 5"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Follow-ups</label>
                      <input 
                        type="number" 
                        min="0"
                        value={followUps} 
                        onChange={e => setFollowUps(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-semibold"
                        placeholder="e.g. 10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Disqualified</label>
                      <input 
                        type="number" 
                        min="0"
                        value={disqualified} 
                        onChange={e => setDisqualified(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-semibold"
                        placeholder="e.g. 2"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm mt-2"
                  >
                    {isSubmitting ? "Submitting..." : submitSuccess ? "Logged!" : "Submit Log"}
                  </button>
                  {submitSuccess && <p className="text-sm text-green-600 flex items-center justify-center gap-1 text-center font-bold">Activity logged. Streak updated! <Flame size={16} /></p>}
                </form>
              </div>

              {/* Scripts Manager */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm h-[400px] flex flex-col">
                <h2 className="text-lg font-black mb-4 flex items-center justify-between text-gray-800">
                  <span className="flex items-center gap-2"><FileText className="text-emerald-500" size={20} /> Outreach Scripts</span>
                  <span className="text-xs bg-gray-100 text-gray-600 font-bold px-3 py-1 rounded-full">{scripts.length} available</span>
                </h2>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                  {scripts.length === 0 ? (
                    <p className="text-sm text-gray-500 font-medium">No scripts have been assigned yet.</p>
                  ) : scripts.map((s, i) => (
                    <div key={i} className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors bg-gray-50/50 flex flex-col group">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-black text-gray-800">{s.title}</span>
                        <span className="text-xs px-2 py-0.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-full">{s.platform}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-4 flex-1 whitespace-pre-wrap font-medium leading-relaxed">{s.content}</p>
                      <button 
                        onClick={() => handleCopyScript(s.id, s.content)}
                        className="w-full py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2 transition-all group-hover:shadow-sm"
                      >
                        {copiedScriptId === s.id ? <Check size={16} className="text-green-500"/> : <Clipboard size={16} />}
                        {copiedScriptId === s.id ? "Copied!" : "Copy Script"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Pipeline Table */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-100 p-0 rounded-3xl shadow-sm h-full flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                  <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                    My Pipeline
                  </h2>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-widest bg-gray-50/50">
                        <th className="py-4 px-6">Lead</th>
                        <th className="py-4 px-6">Package / Info</th>
                        <th className="py-4 px-6">Date</th>
                        <th className="py-4 px-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-gray-500 font-medium">You have no active leads in your pipeline.</td>
                        </tr>
                      ) : leads.map((l, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-bold text-gray-900">{l.fullName}</p>
                            <div className="flex items-center gap-3 mt-1">
                               {l.linkedInUrl && <a href={l.linkedInUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"><LinkIcon size={12}/> LinkedIn</a>}
                               {l.email && <span className="text-xs text-gray-500 font-medium">{l.email}</span>}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1 items-start">
                              {l.packageTier && (
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded text-xs font-bold tracking-wide">
                                  {l.packageTier}
                                </span>
                              )}
                              <span className="text-sm text-gray-600 font-medium truncate max-w-[200px]" title={l.companyOrBookTitle}>
                                {l.companyOrBookTitle || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600 font-medium">
                            {new Date(l.createdAt).toLocaleDateString()}
                            {l.formSubmittedAt && <div className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1"><Check size={12}/> Form Filled</div>}
                          </td>
                          <td className="py-4 px-6 text-right">
                             <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center justify-center
                                ${l.status === 'closed_won' ? 'bg-green-100 text-green-700' : 
                                  l.status === 'disqualified' ? 'bg-red-50 text-red-600' : 
                                  l.status === 'contacted' ? 'bg-blue-50 text-blue-600' : 
                                  'bg-gray-100 text-gray-600'}`
                              }>
                               {l.status}
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

