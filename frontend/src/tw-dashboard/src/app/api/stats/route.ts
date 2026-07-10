import { NextResponse } from "next/server";

// This is the backend API endpoint that the dashboard will poll for live data.
// Once you connect Payfast and your database, you will replace these static 
// variables with actual database queries (e.g., Prisma, Supabase, Firebase).

let liveStats = {
  grossRevenue: 1245000,
  websiteVisitors: 12845,
  packagesSold: 297,
  consultationsBooked: 185,
  chartData: [
    { name: "Mon", sales: 42, traffic: 2400, revenue: 210000 },
    { name: "Tue", sales: 30, traffic: 1398, revenue: 150000 },
    { name: "Wed", sales: 58, traffic: 9800, revenue: 290000 },
    { name: "Thu", sales: 38, traffic: 3908, revenue: 190000 },
    { name: "Fri", sales: 48, traffic: 4800, revenue: 240000 },
    { name: "Sat", sales: 38, traffic: 3800, revenue: 190000 },
    { name: "Sun", sales: 43, traffic: 4300, revenue: 215000 },
  ]
};

export async function GET() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return NextResponse.json(liveStats);
}
