"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, LayoutDashboard, Settings, UserCircle, Users as UsersIcon, Plus, Loader2, Trash2, Shield
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://twp-pfrw.onrender.com";

export default function UsersPage() {
  const router = useRouter();
  const [role, setRole] = useState<string>("admin");
  const [name, setName] = useState<string>("Admin");
  
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "developer" });

  useEffect(() => {
    const authRole = localStorage.getItem("tw_auth_role");
    const authName = localStorage.getItem("tw_auth_name");
    
    if (!authRole || authRole !== "admin") {
      router.push("/");
      return;
    }
    
    setRole(authRole);
    setName(authName || "Admin");

    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      if (res.ok) setUsers(await res.json());
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingUser(true);
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setNewUser({ name: "", username: "", password: "", role: "developer" });
        fetchUsers();
      } else {
        alert("Failed to add user. Username might already exist.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if(!confirm("Are you sure you want to remove this user?")) return;
    try {
      await fetch(`${API_BASE}/api/users/${id}`, { method: "DELETE" });
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#0F172A] items-center justify-center flex-col gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar (simplified for sub-page) */}
      <motion.aside 
        initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        className="w-72 bg-[#1E293B]/80 backdrop-blur-xl border-r border-slate-800 flex flex-col z-20"
      >
        <div className="p-8 flex items-center gap-4 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">TW</div>
          <div>
            <h2 className="font-bold text-white text-lg leading-tight">TW Publishers</h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Workspace</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={LayoutDashboard} label="Overview" onClick={() => router.push('/')} />
          <NavItem icon={UsersIcon} label="Team" active />
          <NavItem icon={Settings} label="Settings" />
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <header className="h-20 border-b border-slate-800/60 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-between px-10 z-10 sticky top-0">
          <h1 className="text-xl font-bold text-white">Team Management</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-10 z-10 scrollbar-hide">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* User List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-semibold text-white mb-6">Active Members</h3>
                {users.map(u => (
                  <div key={u.id} className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white">{u.name} <span className="text-slate-500 font-normal ml-2">@{u.username}</span></p>
                        <p className="text-sm text-blue-400 font-medium capitalize mt-0.5">{u.role}</p>
                      </div>
                    </div>
                    {u.username !== "admin" && (
                      <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add User Form */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-6 shadow-xl h-fit">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Shield className="text-blue-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Invite Member</h3>
                    <p className="text-xs text-slate-400">Grant workspace access</p>
                  </div>
                </div>

                <form onSubmit={handleAddUser} className="space-y-4">
                  <input type="text" placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required className="w-full bg-[#0F172A] border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                  <input type="text" placeholder="Username" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required className="w-full bg-[#0F172A] border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                  <input type="password" placeholder="Temporary Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required className="w-full bg-[#0F172A] border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                  
                  <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-[#0F172A] border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none">
                    <option value="developer">Developer</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button type="submit" disabled={isAddingUser} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-500 transition-all flex items-center justify-center gap-2 mt-2">
                    {isAddingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus size={20} /> Add Member</>}
                  </button>
                </form>
              </div>
            </div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-[#1E293B] hover:text-white"}`}>
      <Icon size={20} className={active ? "text-white" : "text-slate-500"} />
      {label}
    </button>
  );
}
