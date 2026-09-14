"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, DollarSign, Target, Activity, Link as LinkIcon, Copy, Check, Download, Clipboard, LogOut,
  Flame, TrendingUp, Users, Calendar, AlertCircle, MessageSquare, MousePointerClick, FileText
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("Overview");
  
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
      const link = `https://twpublishers.co.za?ref=${data.partnerCode}`;
      
      const triggerAnimation = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      try {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(link).then(triggerAnimation).catch((err) => {
            console.error(err);
            fallbackCopyTextToClipboard(link, triggerAnimation);
          });
        } else {
          fallbackCopyTextToClipboard(link, triggerAnimation);
        }
      } catch (err) {
        fallbackCopyTextToClipboard(link, triggerAnimation);
      }
    }
  };

  const fallbackCopyTextToClipboard = (text: string, onSuccess: () => void) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      // Avoid scrolling to bottom
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) onSuccess();
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
  };

  const handleCopyScript = (id: string, content: string) => {
    if (!data?.partnerCode) return;
    const link = `https://twpublishers.co.za?ref=${data.partnerCode}`;
    // Use case-insensitive regex to replace all instances
    const finalContent = content.replace(/\[AFFILIATE_LINK\]/gi, link);
    
    const triggerAnimation = () => {
      setCopiedScriptId(id);
      setTimeout(() => setCopiedScriptId(null), 2000);
    };

    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(finalContent).then(triggerAnimation).catch(() => {
          fallbackCopyTextToClipboard(finalContent, triggerAnimation);
        });
      } else {
        fallbackCopyTextToClipboard(finalContent, triggerAnimation);
      }
    } catch (err) {
      fallbackCopyTextToClipboard(finalContent, triggerAnimation);
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
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col md:flex-row">
      
      {/* Sidebar - Minimalist Squarespace Style */}
      <aside className="w-full md:w-56 border-r border-gray-200 flex-col hidden md:flex">
        <div className="h-20 flex items-center px-6">
           <div className="flex items-center gap-3">
             <div className="w-6 h-6 bg-black flex items-center justify-center rounded">
               <span className="text-white font-bold text-[10px] tracking-tighter">TW</span>
             </div>
             <span className="text-sm font-semibold tracking-tight text-gray-900">Partner</span>
           </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 mb-4 px-2 tracking-wider uppercase mt-2">Analytics</div>
          <button 
            onClick={() => setActiveTab("Overview")}
            className={`w-full flex items-center px-2 py-1.5 text-[13px] font-medium rounded transition-colors ${activeTab === 'Overview' ? 'text-black bg-gray-100' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
          >
            Overview
          </button>
          
          <div className="text-xs font-semibold text-gray-400 mb-4 px-2 tracking-wider uppercase mt-8">Operations</div>
          <button 
            onClick={() => setActiveTab("Pipeline")}
            className={`w-full flex items-center px-2 py-1.5 text-[13px] font-medium rounded transition-colors ${activeTab === 'Pipeline' ? 'text-black bg-gray-100' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
          >
            Pipeline
          </button>
          <button 
            onClick={() => setActiveTab("Activity")}
            className={`w-full flex items-center px-2 py-1.5 text-[13px] font-medium rounded transition-colors ${activeTab === 'Activity' ? 'text-black bg-gray-100' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
          >
            Submit Activity
          </button>
          
          <div className="text-xs font-semibold text-gray-400 mb-4 px-2 tracking-wider uppercase mt-8">Resources</div>
          <button 
            onClick={() => setActiveTab("Scripts")}
            className={`w-full flex items-center px-2 py-1.5 text-[13px] font-medium rounded transition-colors ${activeTab === 'Scripts' ? 'text-black bg-gray-100' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
          >
            Outreach Scripts
          </button>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                {name?.charAt(0) || 'U'}
              </div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-800" title="Log Out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        
        {/* Mobile Nav (simple) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200">
           <div className="w-6 h-6 bg-black flex items-center justify-center rounded">
             <span className="text-white font-bold text-[10px] tracking-tighter">TW</span>
           </div>
           <select 
             value={activeTab} 
             onChange={(e) => setActiveTab(e.target.value)}
             className="text-sm font-medium border-none outline-none bg-transparent"
           >
             <option value="Overview">Overview</option>
             <option value="Pipeline">Pipeline</option>
             <option value="Activity">Submit Activity</option>
             <option value="Scripts">Outreach Scripts</option>
           </select>
        </div>

        {/* Top Header Section */}
        <header className="px-6 md:px-10 pt-8 pb-4 flex-shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-200 pb-2">
            <h1 className="text-[26px] font-normal text-gray-900 tracking-tight leading-none mb-4 md:mb-0">
              {activeTab}
            </h1>
            <div className="flex items-center gap-4 pb-1">
               <button 
                  onClick={handleCopyLink}
                  className="text-[13px] font-medium text-gray-600 hover:text-black flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-500"/> : <LinkIcon size={14} />}
                  {copied ? "Copied!" : "Copy Affiliate Link"}
                </button>
            </div>
          </div>
          
          {/* Sub tabs line */}
          <div className="flex gap-6 mt-1">
             <button className="py-2 text-[13px] font-medium text-black border-b border-black">{activeTab}</button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
          <div className="max-w-5xl">
            
            {activeTab === "Overview" && (
              <div className="space-y-12 animate-in fade-in duration-300">
                {/* Performance Metrics */}
                <div>
                  <h3 className="text-[13px] font-medium text-gray-900 mb-4">Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 border-t border-b border-gray-200 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    <div className="py-6 md:pr-6">
                      <div className="flex items-center gap-1.5 mb-2">
                        <DollarSign size={14} className="text-blue-500" />
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Earned</span>
                      </div>
                      <h3 className="text-3xl font-light text-gray-900">R {data?.totalCommissionZar?.toLocaleString() || 0}</h3>
                    </div>
                    <div className="py-6 md:px-6">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Target size={14} className="text-amber-500" />
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Pending</span>
                      </div>
                      <h3 className="text-3xl font-light text-gray-900">R {data?.pendingCommissionZar?.toLocaleString() || 0}</h3>
                    </div>
                    <div className="py-6 md:pl-6">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Activity size={14} className="text-green-500" />
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Closed Deals</span>
                      </div>
                      <h3 className="text-3xl font-light text-gray-900">{data?.totalDealsClosed || 0}</h3>
                    </div>
                  </div>
                </div>

                {/* Conversion & Goals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <h3 className="text-[13px] font-medium text-gray-900 mb-4">Goal Tracker</h3>
                    <div className="p-6 border border-gray-200 h-40 flex flex-col justify-between">
                      <div className="flex justify-between items-start text-orange-500">
                        <div className="flex items-center gap-2">
                           <Flame size={16} />
                           <span className="font-semibold text-xs tracking-wide">THIS WEEK</span>
                        </div>
                        <span className="text-xs font-semibold">{currentStreak}-Day Streak</span>
                      </div>
                      
                      <div className="space-y-3 mt-4">
                         <div className="flex justify-between text-xs font-medium text-gray-500">
                            <span>{weeklyMessages} / 150 messages</span>
                            <span>{Math.round(progressPercent)}%</span>
                         </div>
                         <div className="w-full bg-gray-100 h-1 overflow-hidden">
                           <div 
                             className="bg-orange-500 h-1 transition-all duration-1000 ease-out" 
                             style={{ width: `${progressPercent}%` }}
                           />
                         </div>
                      </div>
                    </div>
                  </div>

                  <div>
                     <h3 className="text-[13px] font-medium text-gray-900 mb-4">Conversion Metrics</h3>
                     <div className="grid grid-cols-3 divide-x divide-gray-200 border border-gray-200 h-40">
                        <div className="flex flex-col items-center justify-center p-4 text-center group">
                          <MessageSquare className="text-blue-500 mb-3 opacity-80" size={18} />
                          <span className="text-2xl font-light text-gray-900 mb-1">{todayMessages}</span>
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Msgs Today</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 text-center group">
                          <MousePointerClick className="text-indigo-500 mb-3 opacity-80" size={18} />
                          <span className="text-2xl font-light text-gray-900 mb-1">{todayClicks}</span>
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Clicks Today</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 text-center group">
                          <FileText className="text-green-500 mb-3 opacity-80" size={18} />
                          <span className="text-2xl font-light text-gray-900 mb-1">{weeklyFills}</span>
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Forms Week</span>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Pipeline" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-medium text-gray-900">Active Leads</h3>
                  <button 
                    onClick={downloadLeads}
                    className="text-[12px] font-medium text-gray-500 hover:text-black flex items-center gap-1.5 transition-colors"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                </div>
                
                <div className="w-full overflow-x-auto border border-gray-200">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 text-[11px] font-semibold uppercase tracking-wider bg-gray-50/50">
                        <th className="py-3 px-4 font-semibold">Lead</th>
                        <th className="py-3 px-4 font-semibold">Package / Info</th>
                        <th className="py-3 px-4 font-semibold">Date</th>
                        <th className="py-3 px-4 text-right font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leads.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-gray-400 text-sm">You have no active leads in your pipeline.</td>
                        </tr>
                      ) : leads.map((l, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-4">
                            <p className="font-medium text-gray-900">{l.fullName}</p>
                            <div className="flex items-center gap-3 mt-1">
                               {l.linkedInUrl && <a href={l.linkedInUrl} target="_blank" rel="noreferrer" className="text-[11px] text-gray-500 hover:text-black transition-colors flex items-center gap-1"><LinkIcon size={10}/> LinkedIn</a>}
                               {l.email && <span className="text-[11px] text-gray-500">{l.email}</span>}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1.5 items-start">
                              {l.packageTier && (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-semibold tracking-wide uppercase">
                                  {l.packageTier}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 truncate max-w-[200px]" title={l.companyOrBookTitle}>
                                {l.companyOrBookTitle || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs text-gray-500">
                            {new Date(l.createdAt).toLocaleDateString()}
                            {l.formSubmittedAt && <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1"><Check size={10}/> Form Filled</div>}
                          </td>
                          <td className="py-4 px-4 text-right">
                             <span className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider inline-flex items-center justify-center
                                ${l.status === 'closed_won' ? 'text-green-600 bg-green-50' : 
                                  l.status === 'disqualified' ? 'text-red-600 bg-red-50' : 
                                  l.status === 'contacted' ? 'text-blue-600 bg-blue-50' : 
                                  'text-gray-600 bg-gray-100'}`
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
            )}

            {activeTab === "Activity" && (
              <div className="max-w-2xl animate-in fade-in duration-300">
                <h3 className="text-[13px] font-medium text-gray-900 mb-6">Log Daily Performance</h3>
                
                <form onSubmit={submitActivity} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Messages Sent</label>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        value={messagesSent} 
                        onChange={e => setMessagesSent(e.target.value)}
                        className="w-full px-3 py-2 border-b border-gray-300 focus:border-black outline-none transition-colors text-sm bg-transparent"
                        placeholder="e.g. 30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Link Clicks</label>
                      <input 
                        type="number" 
                        min="0"
                        value={linkClicks} 
                        onChange={e => setLinkClicks(e.target.value)}
                        className="w-full px-3 py-2 border-b border-gray-300 focus:border-black outline-none transition-colors text-sm bg-transparent"
                        placeholder="e.g. 5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Follow-ups</label>
                      <input 
                        type="number" 
                        min="0"
                        value={followUps} 
                        onChange={e => setFollowUps(e.target.value)}
                        className="w-full px-3 py-2 border-b border-gray-300 focus:border-black outline-none transition-colors text-sm bg-transparent"
                        placeholder="e.g. 10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Disqualified</label>
                      <input 
                        type="number" 
                        min="0"
                        value={disqualified} 
                        onChange={e => setDisqualified(e.target.value)}
                        className="w-full px-3 py-2 border-b border-gray-300 focus:border-black outline-none transition-colors text-sm bg-transparent"
                        placeholder="e.g. 2"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex items-center gap-4">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? "Saving..." : "Save Activity"}
                    </button>
                    {submitSuccess && <span className="text-sm text-gray-500 flex items-center gap-1 animate-in fade-in">Saved successfully <Check size={14}/></span>}
                  </div>
                </form>
              </div>
            )}

            {activeTab === "Scripts" && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[13px] font-medium text-gray-900">Provided Templates</h3>
                  <span className="text-[12px] text-gray-500">{scripts.length} available</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {scripts.length === 0 ? (
                    <p className="text-sm text-gray-400">No scripts have been assigned yet.</p>
                  ) : scripts.map((s, i) => (
                    <div key={i} className="p-6 border border-gray-200 flex flex-col group">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-sm font-medium text-gray-900">{s.title}</span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500">{s.platform}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-6 flex-1 whitespace-pre-wrap leading-relaxed">{s.content}</p>
                      <button 
                        onClick={() => handleCopyScript(s.id, s.content)}
                        className="self-start text-[12px] font-medium text-black border-b border-transparent hover:border-black flex items-center gap-1.5 transition-all"
                      >
                        {copiedScriptId === s.id ? <Check size={14} className="text-green-500"/> : <Clipboard size={14} />}
                        {copiedScriptId === s.id ? "Copied" : "Copy Template"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
