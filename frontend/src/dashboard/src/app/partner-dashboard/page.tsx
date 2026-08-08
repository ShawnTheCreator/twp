"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, Loader2, DollarSign, Target, Activity, Link as LinkIcon, Copy, Check
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://twp-pfrw.onrender.com";

import { useAuth, api } from "@/components/AuthContext";

export default function PartnerDashboardPage() {
  const router = useRouter();
  const { role, name, isLoading: authLoading } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
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
    setIsLoading(true);
    try {
      const res = await api.get(`${API_BASE}/api/partner/dashboard`);
      setData(res.data);
    } catch (error) {
      console.error("Failed to load partner dashboard", error);
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

  const submitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messagesSent) return;
    setIsSubmitting(true);
    try {
      await api.post(`${API_BASE}/api/partner/activity`, { messagesSent: parseInt(messagesSent) });
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-twWhite text-twBlack flex items-center justify-center font-sans">
        <Loader2 className="w-12 h-12 text-twBlue animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-twWhite text-twBlack p-8 flex items-center justify-center font-sans">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Dashboard Unavailable</h2>
          <p className="text-gray-500">We couldn't load your partner data. Please try again later.</p>
        </div>
      </div>
    );
  }

  const affiliateLink = "https://twpublishers.co.za?ref=" + data.partnerCode;

  return (
    <div className="min-h-screen bg-twWhite text-twBlack font-sans flex flex-col md:flex-row">
      <main className="flex-1 p-6 md:p-8 lg:p-12 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Partner Dashboard</h1>
            <p className="text-gray-500">Welcome back, {name || data.partnerName}. Here's your referral performance.</p>
          </div>
        </header>

        {/* Affiliate Link Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-gray-100 p-6 rounded-xl shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between"
        >
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Your Tracking Link
            </h3>
            <p className="text-lg font-mono text-twBlue break-all">{affiliateLink}</p>
          </div>
          <button 
            onClick={handleCopyLink}
            className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-twBlue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            title="Total Leads" 
            value={data.totalFormFills} 
            icon={<Target className="w-6 h-6 text-blue-500" />} 
          />
          <StatCard 
            title="Closed Deals" 
            value={data.totalDealsClosed} 
            icon={<Activity className="w-6 h-6 text-green-500" />} 
          />
          <StatCard 
            title="Total Earned (ZAR)" 
            value={"R " + data.totalCommissionZar.toLocaleString()} 
            icon={<DollarSign className="w-6 h-6 text-twBlue" />} 
          />
          <StatCard 
            title="Pending Payout (ZAR)" 
            value={"R " + data.pendingCommissionZar.toLocaleString()} 
            icon={<DollarSign className="w-6 h-6 text-orange-500" />} 
          />
        </div>

        {/* Activity Submission & Tables Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Tools & Activity Form */}
          <div className="lg:col-span-1 space-y-8">
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
          </div>

          {/* Tables */}
          <div className="lg:col-span-2 space-y-8">
          {/* Leads Table */}
          <div className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">Your Leads</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                    <th className="p-4 font-semibold">Lead</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.leads.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-gray-500">No leads found yet.</td>
                    </tr>
                  ) : (
                    data.leads.map((l: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium">{l.companyOrBookTitle || "Unknown"}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                            ${l.status === 'closed_won' ? 'bg-green-100 text-green-700' : 
                              l.status === 'closed_lost' ? 'bg-red-100 text-red-700' : 
                              'bg-orange-100 text-orange-700'}
                          `}>
                            {l.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500">
                          {new Date(l.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commissions Table */}
          <div className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">Commissions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                    <th className="p-4 font-semibold">Package</th>
                    <th className="p-4 font-semibold">Amount</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.commissions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-gray-500">No commissions found yet.</td>
                    </tr>
                  ) : (
                    data.commissions.map((c: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium">{c.packageTier}</td>
                        <td className="p-4 font-bold text-twBlue">R {c.commissionZar.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                            ${c.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                          `}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-2 border-gray-100 p-6 rounded-xl shadow-sm flex items-center gap-4"
    >
      <div className="p-4 bg-gray-50 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </motion.div>
  );
}
