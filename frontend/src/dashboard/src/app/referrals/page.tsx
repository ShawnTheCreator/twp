"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users as UsersIcon, Loader2, Upload, Plus, Eye, X
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://twp-pfrw.onrender.com";

import { useAuth, api } from "@/components/AuthContext";

export default function ReferralsPage() {
  const router = useRouter();
  const { role, name, isLoading: authLoading } = useAuth();
  
  const [partners, setPartners] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Scripts Form
  const [newScript, setNewScript] = useState({ title: "", platform: "LinkedIn", content: "" });
  const [isSavingScript, setIsSavingScript] = useState(false);

  // CSV Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPartner, setUploadingPartner] = useState<string | null>(null);

  // Pipeline Modal
  const [viewingPipeline, setViewingPipeline] = useState<string | null>(null);
  const [pipelineLeads, setPipelineLeads] = useState<any[]>([]);
  const [isPipelineLoading, setIsPipelineLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!role || !["admin", "developer", "super_admin"].includes(role)) {
      router.push("/");
      return;
    }

    fetchData();
  }, [role, authLoading, router]);

  async function fetchData() {
    try {
      const [referralsRes, scriptsRes] = await Promise.all([
        api.get("${API_BASE}/api/admin/referrals/dashboard"),
        api.get("${API_BASE}/api/admin/scripts")
      ]);
      setPartners(referralsRes.data);
      setScripts(scriptsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, partnerCode: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPartner(partnerCode);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      const leads = lines.slice(1).filter(l => l.trim().length > 0).map(line => {
        const [fullName, email, phone, company, linkedin] = line.split(',');
        return {
          FullName: fullName?.trim() || "",
          Email: email?.trim() || "",
          Phone: phone?.trim() || "",
          CompanyOrBookTitle: company?.trim() || "",
          LinkedInUrl: linkedin?.trim() || "",
          ReferralPartnerCode: partnerCode
        };
      });

      try {
        await api.post("${API_BASE}/api/admin/leads/batch", leads);
        alert("Successfully assigned " + leads.length + " leads to " + partnerCode);
      } catch (err) {
        console.error(err);
        alert("Failed to upload leads");
      } finally {
        setUploadingPartner(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleSaveScript = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingScript(true);
    try {
      const res = await api.post("${API_BASE}/api/admin/scripts", newScript);
      setScripts([...scripts, res.data]);
      setNewScript({ title: "", platform: "LinkedIn", content: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingScript(false);
    }
  };

  const openPipelineModal = async (partnerCode: string) => {
    setViewingPipeline(partnerCode);
    setIsPipelineLoading(true);
    try {
      const res = await api.get("${API_BASE}/api/admin/partner-pipeline/");
      setPipelineLeads(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPipelineLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-600 font-sans flex">
      <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={(e) => handleFileUpload(e, uploadingPartner || "")} />

      {viewingPipeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Pipeline Audit</h2>
                <p className="text-sm text-slate-500">Partner Code: {viewingPipeline}</p>
              </div>
              <button onClick={() => setViewingPipeline(null)} className="p-2 bg-slate-200 text-slate-500 hover:text-slate-900 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {isPipelineLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : pipelineLeads.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No leads assigned to this partner.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Lead</th>
                      <th className="pb-3 font-semibold">Company</th>
                      <th className="pb-3 font-semibold text-center">Status</th>
                      <th className="pb-3 font-semibold text-right">Assigned On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipelineLeads.map((l, i) => (
                      <tr key={i} className="border-b border-slate-200/50 hover:bg-slate-200/30">
                        <td className="py-3 text-sm text-slate-900 font-bold">{l.fullName}</td>
                        <td className="py-3 text-sm text-slate-500">{l.companyOrBookTitle || "N/A"}</td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                            
                          ">
                            {l.status}
                          </span>
                        </td>
                        <td className="py-3 text-right text-xs text-slate-500">
                          {new Date(l.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-slate-900 font-bold tracking-tighter">TW</span>
          </div>
          <span className="text-slate-900 font-bold text-lg tracking-tight">Publishers</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-all">
            <LayoutDashboard size={18} /> Overview
          </button>
          <button onClick={() => router.push('/referrals')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-900 bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <UsersIcon size={18} className="text-blue-400" /> Team Work
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Principal Dashboard</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              {/* Partner Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-lg px-2">Partner Network</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                        <th className="pb-4 px-4 font-semibold">Partner</th>
                        <th className="pb-4 px-4 font-semibold text-center">Status</th>
                        <th className="pb-4 px-4 font-semibold">Last Activity</th>
                        <th className="pb-4 px-4 font-semibold text-center">Streak</th>
                        <th className="pb-4 px-4 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partners.map((p, i) => (
                        <tr key={i} className="border-b border-slate-200/50 hover:bg-slate-200/30 transition-colors">
                          <td className="py-4 px-4">
                            <p className="font-bold text-slate-900">{p.partnerName}</p>
                            <p className="text-xs text-slate-500 font-mono">?ref={p.partnerCode}</p>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ">
                              {p.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {p.lastActivity ? (
                              <div>
                                <p className="text-sm font-semibold text-slate-600">Sent {p.lastActivity.messagesSent}</p>
                                <p className="text-xs text-slate-500">{new Date(p.lastActivity.timestamp).toLocaleDateString()}</p>
                              </div>
                            ) : <span className="text-sm text-slate-600 italic">None</span>}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="font-bold text-orange-400">?? {p.streak?.current || 0}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                               <button 
                                onClick={() => openPipelineModal(p.partnerCode)}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-700 border border-slate-600 text-slate-900 text-xs font-bold rounded-lg flex items-center gap-2"
                              >
                                <Eye size={14} /> Audit Pipeline
                              </button>
                              <button 
                                onClick={() => {
                                  setUploadingPartner(p.partnerCode);
                                  fileInputRef.current?.click();
                                }}
                                disabled={uploadingPartner === p.partnerCode}
                                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-slate-900 text-xs font-bold rounded-lg flex items-center gap-2"
                              >
                                <Upload size={14} /> Assign Leads
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Scripts Manager */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl">
                <h3 className="font-bold text-slate-900 text-lg mb-4">New Outreach Script</h3>
                <form onSubmit={handleSaveScript} className="space-y-4">
                  <input type="text" placeholder="Script Title" value={newScript.title} onChange={e => setNewScript({...newScript, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-900" required />
                  <select value={newScript.platform} onChange={e => setNewScript({...newScript, platform: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-900">
                    <option>LinkedIn</option>
                    <option>Email</option>
                    <option>WhatsApp</option>
                  </select>
                  <textarea placeholder="Hi {Name}, I saw your profile..." value={newScript.content} onChange={e => setNewScript({...newScript, content: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-900 h-32" required />
                  <button type="submit" disabled={isSavingScript} className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-slate-900 font-bold rounded-lg flex items-center justify-center gap-2">
                    {isSavingScript ? <Loader2 className="animate-spin w-4 h-4"/> : <><Plus size={16}/> Save Script</>}
                  </button>
                </form>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl">
                <h3 className="font-bold text-slate-900 text-lg mb-4">Active Scripts</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {scripts.map((s, i) => (
                    <div key={i} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-900">{s.title}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">{s.platform}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{s.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
