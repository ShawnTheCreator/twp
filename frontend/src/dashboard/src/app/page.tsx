"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";
import { 
  LogOut, LayoutDashboard, Settings, UserCircle, Wallet, Globe, Package, CalendarCheck, Activity, Loader2,
  Bell, ChevronDown, Search, ArrowUpRight, Users, Zap
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE = "https://twp-pfrw.onrender.com";

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState<string>("admin");
  const [name, setName] = useState<string>("Admin");
  
  const [statsData, setStatsData] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authRole = localStorage.getItem("tw_auth_role");
    const authName = localStorage.getItem("tw_auth_name");
    
    if (!authRole) {
      router.push("/login");
      return;
    }
    
    setRole(authRole);
    setName(authName || (authRole === "admin" ? "Admin" : "Developer"));
    setIsAuthenticated(true);

    async function fetchLiveData() {
      try {
        const [statsRes, actRes, consRes] = await Promise.all([
          fetch(`${API_BASE}/api/stats`),
          fetch(`${API_BASE}/api/activity`),
          fetch(`${API_BASE}/api/consultations`)
        ]);

        if(statsRes.ok) setStatsData(await statsRes.json());
        if(actRes.ok) setActivities(await actRes.json());
        if(consRes.ok) setConsultations(await consRes.json());
      } catch (error) {
        console.error("Failed to fetch live data", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated || isLoading || !statsData) {
    return (
      <div className="flex min-h-screen bg-[#0F172A] items-center justify-center flex-col gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        <p className="text-slate-400 font-medium">Connecting to TW Workspace...</p>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("tw_auth_role");
    localStorage.removeItem("tw_auth_name");
    router.push("/login");
  };

  const devCommission = statsData.packagesSold * 2000;
  const ownerRevenue = statsData.grossRevenue - devCommission;

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        className="w-72 bg-[#1E293B]/80 backdrop-blur-xl border-r border-slate-800 flex flex-col z-20"
      >
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">TW</div>
          <div>
            <h2 className="font-bold text-white text-lg leading-tight">TW Publishers</h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Workspace</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={LayoutDashboard} label="Overview" active />
          {role === "admin" && <NavItem icon={Users} label="Team" onClick={() => router.push('/users')} />}
          <NavItem icon={CalendarCheck} label="Consultations" />
          <NavItem icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-medium">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Topbar */}
        <header className="h-20 border-b border-slate-800/60 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-between px-10 z-10 sticky top-0">
          <div className="relative w-96 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search data, transactions..." className="w-full bg-[#1E293B] border border-slate-700/50 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500 text-white" />
          </div>
          
          <div className="flex items-center gap-6 ml-auto">
            <button className="relative text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
              <div className="text-right">
                <p className="text-sm font-semibold text-white leading-tight">{name}</p>
                <p className="text-xs text-blue-400 font-medium capitalize">{role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-10 z-10 scrollbar-hide">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8">
            
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Performance Overview</h1>
              <p className="text-slate-400 mt-1">Real-time metrics and revenue breakdown.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard title="Gross Revenue" value={`R ${statsData.grossRevenue.toLocaleString()}`} icon={Wallet} trend="+12.5%" trendUp={true} color="blue" />
              <KpiCard title="Total Visitors" value={statsData.websiteVisitors.toLocaleString()} icon={Globe} trend="+5.2%" trendUp={true} color="purple" />
              <KpiCard title="Packages Sold" value={statsData.packagesSold.toLocaleString()} icon={Package} trend="+18.1%" trendUp={true} color="emerald" />
              <KpiCard title="Consultations" value={statsData.consultationsBooked.toLocaleString()} icon={CalendarCheck} trend="-2.4%" trendUp={false} color="orange" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 bg-[#1E293B] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-semibold text-white">Revenue Analytics</h3>
                    <p className="text-sm text-slate-400">Last 7 Days (Live via Payfast)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>
                      LIVE SYNC
                    </span>
                  </div>
                </div>
                
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsData.chartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `R${val/1000}k`} />
                      <Tooltip contentStyle={{backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '12px', color: '#fff'}} itemStyle={{color: '#3B82F6'}} />
                      <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Developer Revenue / Breakdown */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-white">Revenue Split</h3>
                  <p className="text-sm text-slate-400 mb-6">Distribution based on sales</p>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Owner Revenue</span>
                        <span className="text-emerald-400 font-semibold">R {ownerRevenue.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{width: `${(ownerRevenue/statsData.grossRevenue)*100}%`}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Dev Commission</span>
                        <span className="text-blue-400 font-semibold">R {devCommission.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{width: `${(devCommission/statsData.grossRevenue)*100}%`}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Zap className="text-blue-400" />
                    <div>
                      <p className="text-sm font-semibold text-blue-100">System Healthy</p>
                      <p className="text-xs text-blue-400 mt-1">All services running perfectly.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Activity Feed */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="font-semibold text-white mb-6">Live Activity Stream</h3>
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-sm text-slate-500">No recent activity.</p>
                  ) : activities.slice(0, 5).map((act: any, i: number) => (
                    <div key={i} className="flex gap-4 items-start pb-4 border-b border-slate-800/50 last:border-0 last:pb-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${act.type === 'sale' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
                        {act.type === 'sale' ? <Wallet size={18} /> : <CalendarCheck size={18} />}
                      </div>
                      <div>
                        <p className="text-sm text-slate-200">{act.message}</p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(act.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Consultations */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-white">Recent Consultations</h3>
                  <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">View All</button>
                </div>
                <div className="space-y-4">
                  {consultations.length === 0 ? (
                    <p className="text-sm text-slate-500">No consultations yet.</p>
                  ) : consultations.slice(0, 4).map((cons: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-800/50 rounded-xl transition-colors">
                      <div>
                        <p className="text-sm font-medium text-white">{cons.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{cons.email}</p>
                      </div>
                      <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-md text-slate-300">
                        {new Date(cons.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}

// Components
function NavItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-[#1E293B] hover:text-white"}`}>
      <Icon size={20} className={active ? "text-white" : "text-slate-500"} />
      {label}
    </button>
  );
}

function KpiCard({ title, value, icon: Icon, trend, trendUp, color }: any) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20",
    purple: "from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
    orange: "from-orange-500/20 to-orange-500/5 text-orange-400 border-orange-500/20",
  };

  return (
    <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${colors[color]} blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`w-12 h-12 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center justify-center`}>
          <Icon size={22} className={colors[color].split(" ")[2]} />
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowUpRight size={14} className="rotate-90" />}
          {trend}
        </span>
      </div>
      
      <div className="relative z-10">
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-white mt-1 tracking-tight">{value}</h3>
      </div>
    </div>
  );
}
