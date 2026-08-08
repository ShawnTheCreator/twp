"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, LayoutDashboard, Settings, Users as UsersIcon, Link as LinkIcon, Loader2, Trash2, Shield, Briefcase, Copy, Check
} from "lucide-react";

import { useAuth, api } from "@/components/AuthContext";

export default function UsersPage() {
  const router = useRouter();
  const { role, name, logout, isLoading: authLoading } = useAuth();
  
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Invite state
  const [isGenerating, setIsGenerating] = useState(false);
  const [inviteRole, setInviteRole] = useState("client");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!role || role !== "admin") {
      router.push("/");
      return;
    }

    fetchUsers();
  }, [role, authLoading, router]);

  async function fetchUsers() {
    try {
      const res = await api.get(`/api/users`);
      if (res.status === 200) setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedLink("");
    setCopied(false);
    try {
      const res = await api.post(`/api/auth/invite`, { role: inviteRole });
      if (res.status === 200) {
        const link = `https://dashboard.twpublishers.co.za/signup?token=${res.data.inviteToken}`;
        setGeneratedLink(link);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate invite.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteUser = async (id: string) => {
    if(!confirm("Are you sure you want to remove this user?")) return;
    try {
      await api.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center flex-col gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-twBlue" />
        <p className="text-gray-500 font-medium">Loading Team...</p>
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
          <NavItem icon={LayoutDashboard} label="Overview" onClick={() => router.push('/')} />
          <NavItem icon={UsersIcon} label="Team" active />
          {role === "admin" && <NavItem icon={Briefcase} label="Referrals" onClick={() => router.push('/referrals')} />}
          <NavItem icon={Settings} label="Settings" onClick={() => router.push('/settings')} />
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
          <h1 className="text-xl font-bold text-black uppercase tracking-widest">Team Management</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-10 z-10 scrollbar-hide bg-gray-50">
          <div className="max-w-5xl mx-auto space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* User List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-bold text-black uppercase tracking-widest mb-6">Active Members</h3>
                {users.map(u => (
                  <div key={u.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-babyBlue flex items-center justify-center text-twBlue font-bold text-lg border border-twBlue">
                        {u.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="font-bold text-black">{u.name} <span className="text-gray-400 font-normal ml-2">@{u.username}</span></p>
                        <p className="text-xs text-twBlue font-bold uppercase tracking-widest mt-1">{u.role}</p>
                      </div>
                    </div>
                    {u.username !== "admin" && (
                      <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Generate Invite Form */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-fit">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                    <Shield className="text-twBlue" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-black uppercase tracking-widest text-sm">Generate Invite</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Create sign-up link</p>
                  </div>
                </div>

                <form onSubmit={handleGenerateInvite} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Role</label>
                    <select 
                      value={inviteRole} 
                      onChange={e => setInviteRole(e.target.value)} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black focus:outline-none focus:border-twBlue appearance-none font-medium"
                    >
                      <option value="client">Client</option>
                      <option value="referral_partner">Referral Partner</option>
                      <option value="developer">Developer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <button type="submit" disabled={isGenerating} className="w-full bg-twBlue text-white py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 mt-2">
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LinkIcon size={18} /> Generate Link</>}
                  </button>
                </form>

                {generatedLink && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Invite Link</p>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={generatedLink}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-black font-mono focus:outline-none"
                      />
                      <button 
                        onClick={copyToClipboard}
                        className="p-2 bg-twBlue text-white rounded-lg hover:bg-black transition-colors flex-shrink-0"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg transition-all font-bold uppercase text-sm tracking-widest ${active ? "bg-twBlue text-white" : "text-gray-500 hover:bg-gray-100 hover:text-black"}`}>
      <Icon size={20} className={active ? "text-white" : "text-gray-400"} />
      {label}
    </button>
  );
}
