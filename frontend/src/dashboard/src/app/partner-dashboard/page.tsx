"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, Loader2, DollarSign, Target, Activity, Link as LinkIcon, Copy, Check, Download, Clipboard
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://twp-pfrw.onrender.com";

import { useAuth, api } from "@/components/AuthContext";

export default function PartnerDashboardPage() {
  const router = useRouter();
  const { role, name, isLoading: authLoading } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [scripts, setScripts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  
  // Activity form state
  const [messagesSent, setMessagesSent] = useState("");
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
        api.get("${API_BASE}/api/partner/dashboard"),
        api.get("${API_BASE}/api/partner/scripts"),
        api.get("${API_BASE}/api/partner/leads")
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
      navigator.clipboard.writeText("https://twpublishers.co.za?ref=" + data.partnerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyScript = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedScriptId(id);
    setTimeout(() => setCopiedScriptId(null), 2000);
  };

  const downloadLeads = async () => {
    if (!leads || leads.length === 0) {
      alert("No leads assigned to you right now.");
      return;
    }
    
    const csvRows = [];
    csvRows.push("Name,Email,Phone,Company,LinkedIn,Status");
    leads.forEach((l: any) => {
      csvRows.push("${l.fullName},,,,,");
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
      await api.post("${API_BASE}/api/partner/activity", { messagesSent: parseInt(messagesSent) });
      setSubmitSuccess(true);
      setMessagesSent("");
      setTimeout(() => setSubmitSuccess(false), 3000);
      fetchPartnerData(); // Refresh data to show streak
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      await api.post("${API_BASE}/api/partner/leads//status", { status: newStatus });
      setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    } catch (err) {
      console.error(err);
      alert("Failed to update lead status.");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-twWhite text-twBlack flex items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-twBlue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-twBlack font-sans flex">
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center px-8 justify-between shadow-sm">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-twBlue to-blue-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold tracking-tighter">TW</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Partner Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-500">Welcome, {name}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-twBlue flex items-center justify-center">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Earned</p>
                <h3 className="text-2xl font-black text-gray-800">R {data?.totalCommissionZar?.toLocaleString() || 0}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Target size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pending</p>
                <h3 className="text-2xl font-black text-gray-800">R {data?.pendingCommissionZar?.toLocaleString() || 0}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Closed Deals</p>
                <h3 className="text-2xl font-black text-gray-800">{data?.totalDealsClosed || 0}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 bg-blue-50/50 shadow-sm flex flex-col justify-center">
               <button 
                onClick={handleCopyLink}
                className="w-full py-3 bg-twBlue hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check size={18} /> : <LinkIcon size={18} />}
                {copied ? "Copied!" : "Copy Affiliate Link"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tools & Activity Form */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-white border-2 border-indigo-100 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-black mb-2 text-indigo-900">Export Leads</h2>
                <p className="text-sm text-indigo-600 mb-4">Download your assigned leads as a CSV for bulk messaging tools.</p>
                <button 
                  onClick={downloadLeads}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Download Lead Batch
                </button>
              </div>

              <div className="bg-white border-2 border-gray-100 p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-bold mb-4">Submit Daily Activity</h2>
                <form onSubmit={submitActivity} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Messages Sent Today</label>
                    <input 
                      type="number" 
                      required 
                      min="0"
                      value={messagesSent} 
                      onChange={e => setMessagesSent(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-twBlue focus:ring-0"
                      placeholder="e.g. 30"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-2 bg-twBlue text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : submitSuccess ? "Logged!" : "Submit Log"}
                  </button>
                  {submitSuccess && <p className="text-sm text-green-600 text-center font-semibold">Activity successfully logged. Streak updated!</p>}
                </form>
              </div>

              {/* Scripts Manager */}
              <div className="bg-white border-2 border-gray-100 p-6 rounded-xl shadow-sm h-full">
                <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                  <span>Outreach Scripts</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{scripts.length} available</span>
                </h2>
                <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2">
                  {scripts.length === 0 ? (
                    <p className="text-sm text-gray-500">No scripts have been assigned yet.</p>
                  ) : scripts.map((s, i) => (
                    <div key={i} className="p-4 border-2 border-gray-100 rounded-xl hover:border-blue-200 transition-colors bg-gray-50 flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-bold text-gray-800">{s.title}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded-full">{s.platform}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 flex-1 whitespace-pre-wrap">{s.content}</p>
                      <button 
                        onClick={() => handleCopyScript(s.id, s.content)}
                        className="w-full py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
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
              <div className="bg-white border-2 border-gray-100 p-6 rounded-xl shadow-sm h-full flex flex-col">
                <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                  <span>My Pipeline</span>
                  <span className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full">{leads.length} Leads Assigned</span>
                </h2>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-100 text-gray-400 text-sm uppercase tracking-wider">
                        <th className="pb-3 px-4 font-semibold">Lead</th>
                        <th className="pb-3 px-4 font-semibold">Company / Title</th>
                        <th className="pb-3 px-4 font-semibold text-center">Status</th>
                        <th className="pb-3 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-500">You have no active leads in your pipeline.</td>
                        </tr>
                      ) : leads.map((l, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-bold text-gray-800">{l.fullName}</p>
                            <div className="flex items-center gap-2 mt-1">
                               {l.linkedInUrl && <a href={l.linkedInUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">LinkedIn</a>}
                               {l.email && <span className="text-xs text-gray-500">{l.email}</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {l.companyOrBookTitle || "N/A"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                              
                            ">
                              {l.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <select 
                              value={l.status}
                              onChange={(e) => updateLeadStatus(l.id, e.target.value)}
                              className="text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-twBlue"
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="replied">Replied</option>
                              <option value="disqualified">Disqualified</option>
                            </select>
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
