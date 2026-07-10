"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";
import { 
  LogOut, LayoutDashboard, Settings, UserCircle, Wallet, Globe, Package, CalendarCheck, Activity, Loader2
} from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "developer">("admin");
  const [data, setData] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication
    const authRole = localStorage.getItem("tw_auth");
    if (!authRole) {
      router.push("/login");
      return;
    }
    setRole(authRole as "admin" | "developer");
    setIsAuthenticated(true);

    // This fetches the live data from the .NET Backend
    async function fetchLiveData() {
      try {
        const res = await fetch("http://localhost:5000/api/stats");
        const json = await res.json();
        setData(json);

        const consRes = await fetch("http://localhost:5000/api/consultations");
        const consJson = await consRes.json();
        setConsultations(consJson);
      } catch (error) {
        console.error("Failed to fetch live stats", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLiveData();
    
    // Set up polling to fetch live data every 30 seconds
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated || isLoading || !data) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center flex-col gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-twBlue" />
        <p className="text-slate-500 font-medium">Connecting to secure portal...</p>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("tw_auth");
    router.push("/login");
  };

  // Live calculated stats
  const devCommission = data.packagesSold * 2000;
  const ownerRevenue = data.grossRevenue - devCommission;

  const stats = [
    { title: "Gross Revenue", value: `R ${(data.grossRevenue).toLocaleString()}`, icon: Wallet, color: "text-green-600", bg: "bg-green-100" },
    { title: "Website Visitors", value: data.websiteVisitors.toLocaleString(), icon: Globe, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Packages Sold", value: data.packagesSold.toLocaleString(), icon: Package, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Consultations Booked", value: data.consultationsBooked.toLocaleString(), icon: CalendarCheck, color: "text-orange-600", bg: "bg-orange-100" },
  ];

  const developerStats = [
    { title: "Dev Commission (R2,000 / sale)", value: `R ${(devCommission).toLocaleString()}`, icon: Wallet, color: "text-twBlue", bg: "bg-blue-50" },
    { title: "Total Owner Revenue", value: `R ${(ownerRevenue).toLocaleString()}`, icon: Package, color: "text-green-600", bg: "bg-green-50" },
    { title: "System Uptime", value: "99.9%", icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col"
      >
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-twBlue rounded-xl flex items-center justify-center text-white font-bold">TW</div>
          <span className="font-bold text-xl tracking-tight">Dashboard</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setRole("admin")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${role === "admin" ? "bg-twBlue text-white" : "text-slate-500 hover:bg-slate-100"}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Admin View</span>
          </button>
          <button 
            onClick={() => setRole("developer")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${role === "developer" ? "bg-twBlue text-white" : "text-slate-500 hover:bg-slate-100"}`}
          >
            <Settings size={20} />
            <span className="font-medium">Developer View</span>
          </button>
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto overflow-x-hidden">
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-between items-center mb-10"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {role === "admin" ? "Owner Overview" : "Developer Console"}
              <span className="ml-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                LIVE
              </span>
            </h1>
            <p className="text-slate-500 mt-1">Welcome back, {role === "admin" ? "Webster" : "Dev"}. Here's what's happening right now.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-bold text-slate-900">{role === "admin" ? "Webster Tsenase" : "Lead Developer"}</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest">{role}</p>
            </div>
            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
               <UserCircle size={32} className="text-slate-400" />
            </div>
          </div>
        </motion.header>

        {/* Stats Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
        >
          {stats.map((stat, i) => (
            <motion.div variants={itemVariants} key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                  <stat.icon size={24} />
                </div>
                <span className="text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">Live</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </motion.div>
          ))}
        </motion.div>

        {role === "developer" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
          >
            {developerStats.map((stat, i) => (
              <div key={i} className="bg-twBlue text-white p-6 rounded-2xl shadow-xl shadow-twBlue/20 hover:scale-[1.02] transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <stat.icon size={24} />
                  </div>
                </div>
                <p className="opacity-70 text-sm font-medium">{stat.title}</p>
                <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
              </div>
            ))}
          </motion.div>
        )}

        {/* Traffic vs Conversion Tracking Note */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-50 border border-blue-100 p-6 rounded-2xl mb-10 text-sm text-blue-900"
        >
          <strong>💡 How we track conversions via Payfast:</strong> Since visitors book a consultation call or purchase a package directly from the site, we use a <strong>Payfast Webhook</strong>. Every time a successful transaction is completed through the Payfast gateway, it securely pings this dashboard and registers exactly 1 Confirmed Sale. The charts below compare raw website traffic against these verified Payfast transactions.
        </motion.div>

        {/* Charts */}
        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 24 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue Growth (Live)</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0047AB" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0047AB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#0047AB" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Website Traffic vs Conversions (Live)</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="traffic" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={40} name="Visitors" />
                  <Bar dataKey="sales" fill="#B2E2F2" radius={[6, 6, 0, 0]} barSize={40} name="Sales (Conversions)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Recent Bookings Table */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 24 }}
          className="mt-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Bookings & Inquiries</h3>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">{consultations.length} total</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Message</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {consultations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">No bookings yet.</td>
                  </tr>
                ) : (
                  consultations.map((c, i) => (
                    <tr key={c.id || i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-4 text-slate-500 whitespace-nowrap">
                        {new Date(c.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 font-medium text-slate-900">
                        {c.name}
                      </td>
                      <td className="py-4 text-slate-500">
                        <div className="flex flex-col">
                          <span>{c.email}</span>
                          <span className="text-xs">{c.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 text-slate-600 max-w-xs truncate" title={c.message}>
                        {c.message}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
