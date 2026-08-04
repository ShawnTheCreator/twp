"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";
import { 
  LogOut, LayoutDashboard, Settings, UserCircle, Wallet, Globe, Package, CalendarCheck, Activity, Loader2,
  Bell, ChevronDown, Search, ArrowUpRight, Users, Zap, Briefcase
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://twp-pfrw.onrender.com";

import { useAuth, api } from "@/components/AuthContext";

export default function Dashboard() {
  const router = useRouter();
  const { role, name, logout, isLoading: authLoading } = useAuth();
  
  const [statsData, setStatsData] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!role) {
      router.push("/login");
      return;
    }

    async function fetchLiveData() {
      try {
        const [statsRes, actRes, consRes] = await Promise.all([
          api.get(`/api/stats`),
          api.get(`/api/activity`),
          api.get(`/api/consultations`)
        ]);

        if(statsRes.status === 200) setStatsData(statsRes.data);
        if(actRes.status === 200) setActivities(actRes.data);
        if(consRes.status === 200) setConsultations(consRes.data);
      } catch (error) {
        console.error("Failed to fetch live data", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, [role, authLoading, router]);

  if (authLoading || isLoading || !statsData) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center flex-col gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-twBlue" />
        <p className="text-gray-500 font-medium">Connecting to TW Workspace...</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
  };

  const devCommission = statsData.packagesSold * 2000;
  const ownerRevenue = statsData.grossRevenue - devCommission;

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
          <NavItem icon={LayoutDashboard} label="Overview" active />
          {role === "admin" && <NavItem icon={Users} label="Team" onClick={() => router.push('/users')} />}
          {role === "admin" && <NavItem icon={Briefcase} label="Referrals" onClick={() => router.push('/referrals')} />}
          <NavItem icon={CalendarCheck} label="Consultations" />
          <NavItem icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all font-bold uppercase text-sm tracking-widest">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        
        {/* Topbar */}
        <header className="h-20 border-b border-gray-200 bg-white flex items-center justify-between px-10 z-10 sticky top-0">
          <div className="relative w-96 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-twBlue focus:ring-1 focus:ring-twBlue transition-all text-black" />
          </div>
          
          <div className="flex items-center gap-6 ml-auto">
            <button className="relative text-gray-500 hover:text-black transition-colors">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-twBlue rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-bold text-black uppercase">{name}</p>
                <p className="text-xs text-twBlue font-semibold capitalize">{role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-babyBlue flex items-center justify-center text-twBlue font-bold border border-twBlue">
                {name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-10 z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            
            <div className="bg-twBlue p-8 rounded-xl text-white">
              <h1 className="text-4xl font-bold uppercase tracking-widest mb-2">Performance Overview</h1>
              <p className="text-babyBlue text-sm uppercase tracking-widest">Real-time metrics and revenue breakdown</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard title="Gross Revenue" value={`R ${statsData.grossRevenue.toLocaleString()}`} icon={Wallet} trend="+12.5%" trendUp={true} color="bg-babyBlue text-twBlue" />
              <KpiCard title="Total Visitors" value={statsData.websiteVisitors.toLocaleString()} icon={Globe} trend="+5.2%" trendUp={true} color="bg-gray-100 text-black" />
              <KpiCard title="Packages Sold" value={statsData.packagesSold.toLocaleString()} icon={Package} trend="+18.1%" trendUp={true} color="bg-gray-100 text-black" />
              <KpiCard title="Consultations" value={statsData.consultationsBooked.toLocaleString()} icon={CalendarCheck} trend="-2.4%" trendUp={false} color="bg-gray-100 text-black" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="font-bold text-black uppercase tracking-widest text-lg">Revenue Analytics</h3>
                    <p className="text-sm text-gray-500 uppercase tracking-widest">Last 7 Days (Live via Payfast)</p>
                  </div>
                  <div className="bg-babyBlue text-twBlue px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-twBlue">
                    LIVE SYNC
                  </div>
                </div>
                
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(val) => `R${val/1000}k`} />
                      <Tooltip contentStyle={{backgroundColor: '#fff', borderColor: '#e5e7eb', borderRadius: '8px', color: '#000'}} itemStyle={{color: '#0047AB', fontWeight: 'bold'}} />
                      <Area type="monotone" dataKey="revenue" stroke="#0047AB" strokeWidth={3} fill="#B2E2F2" fillOpacity={0.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Developer Revenue / Breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-black uppercase tracking-widest text-lg">Revenue Split</h3>
                  <p className="text-sm text-gray-500 uppercase tracking-widest mb-8">Distribution based on sales</p>
                  
                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between text-sm mb-2 font-bold uppercase tracking-widest">
                        <span className="text-gray-600">Owner Revenue</span>
                        <span className="text-black">R {ownerRevenue.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                        <div className="bg-twBlue h-4" style={{width: `${(ownerRevenue/statsData.grossRevenue)*100}%`}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2 font-bold uppercase tracking-widest">
                        <span className="text-gray-600">Dev Commission</span>
                        <span className="text-twBlue">R {devCommission.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                        <div className="bg-babyBlue h-4 border-r border-twBlue" style={{width: `${(devCommission/statsData.grossRevenue)*100}%`}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-gray-50 border border-gray-200 p-6 rounded-xl text-center">
                  <Zap className="text-twBlue mx-auto mb-2 w-8 h-8" />
                  <p className="text-sm font-bold text-black uppercase tracking-widest">System Healthy</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">All services running perfectly</p>
                </div>
              </div>

            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Activity Feed */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-black uppercase tracking-widest text-lg mb-6">Live Activity Stream</h3>
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-sm text-gray-500">No recent activity.</p>
                  ) : activities.slice(0, 5).map((act: any, i: number) => (
                    <div key={i} className="flex gap-4 items-center p-4 border border-gray-100 bg-gray-50 rounded-lg">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-lg ${act.type === 'sale' ? 'bg-babyBlue text-twBlue' : 'bg-twBlue text-white'}`}>
                        {act.type === 'sale' ? <Wallet size={20} /> : <CalendarCheck size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-black">{act.message}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{new Date(act.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Consultations */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-black uppercase tracking-widest text-lg">Recent Consultations</h3>
                  <button className="text-xs text-twBlue hover:text-black font-bold uppercase tracking-widest">View All</button>
                </div>
                <div className="space-y-4">
                  {consultations.length === 0 ? (
                    <p className="text-sm text-gray-500">No consultations yet.</p>
                  ) : consultations.slice(0, 4).map((cons: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-4 border border-gray-100 rounded-lg hover:border-twBlue transition-colors">
                      <div>
                        <p className="text-sm font-bold text-black">{cons.name}</p>
                        <p className="text-xs text-gray-500">{cons.email}</p>
                      </div>
                      <span className="text-xs bg-babyBlue px-3 py-1 text-twBlue font-bold uppercase tracking-widest border border-twBlue">
                        {new Date(cons.date).toLocaleDateString()}
                      </span>
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

// Components
function NavItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg transition-all font-bold uppercase text-sm tracking-widest ${active ? "bg-twBlue text-white" : "text-gray-500 hover:bg-gray-100 hover:text-black"}`}>
      <Icon size={20} className={active ? "text-white" : "text-gray-400"} />
      {label}
    </button>
  );
}

function KpiCard({ title, value, icon: Icon, trend, trendUp, color }: any) {
  return (
    <div className={`border border-gray-200 rounded-xl p-6 ${color === 'bg-babyBlue text-twBlue' ? 'bg-babyBlue text-twBlue' : 'bg-white text-black'}`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color === 'bg-babyBlue text-twBlue' ? 'bg-twBlue text-white' : 'bg-gray-100 text-twBlue'}`}>
          <Icon size={24} />
        </div>
        <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${color === 'bg-babyBlue text-twBlue' ? 'bg-white/50 text-twBlue' : 'bg-gray-100 text-gray-600'}`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowUpRight size={14} className="rotate-90" />}
          {trend}
        </span>
      </div>
      
      <div>
        <p className={`text-xs uppercase tracking-widest font-bold mb-1 ${color === 'bg-babyBlue text-twBlue' ? 'text-twBlue' : 'text-gray-500'}`}>{title}</p>
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
      </div>
    </div>
  );
}
