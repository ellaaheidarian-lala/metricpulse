'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { Activity, DollarSign, Users, ShoppingBag, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

interface KPICardData {
  id: string;
  title: string;
  value: string;
  change: number;
  is_positive: boolean;
}

interface ChartPoint {
  timestamp: string;
  revenue: number;
  users: number;
  conversions: number;
}

interface Transaction {
  id: string;
  user: string;
  amount: number;
  status: string;
  date: string;
}

interface LiveMetrics {
  timestamp: string;
  active_sessions: number;
  server_load: number;
  requests_per_sec: number;
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPICardData[]>([]);
  const [analytics, setAnalytics] = useState<ChartPoint[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [liveData, setLiveData] = useState<LiveMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [kpiRes, analyticsRes, txRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/kpis'),
        axios.get(`http://127.0.0.1:8000/api/analytics?timeframe=${timeframe}`),
        axios.get('http://127.0.0.1:8000/api/transactions')
      ]);
      setKpis(kpiRes.data);
      setAnalytics(analyticsRes.data);
      setTransactions(txRes.data);
    } catch (error) {
      console.error('Error fetching data from backend:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:8000/ws/live-metrics');
    ws.onmessage = (event) => {
      const data: LiveMetrics = JSON.parse(event.data);
      setLiveData(data);
    };
    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            MetricPulse Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time enterprise monitoring & business intelligence dashboard</p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-400">Live WS Connected</span>
          </div>
          {liveData && (
            <div className="text-xs text-slate-400 border-l border-slate-700 pl-3">
              Load: <span className="text-white font-mono">{liveData.server_load}%</span> | Req/s: <span className="text-white font-mono">{liveData.requests_per_sec}</span>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpis.map((kpi) => {
          const icons: Record<string, any> = { "1": DollarSign, "2": Users, "3": ShoppingBag, "4": Activity };
          const IconComponent = icons[kpi.id] || Activity;
          return (
            <div key={kpi.id} className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-lg backdrop-blur">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-slate-400">{kpi.title}</span>
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl"><IconComponent size={20} /></div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-white mb-2">{kpi.value}</div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className={`flex items-center font-semibold ${kpi.is_positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {kpi.is_positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(kpi.change)}%
                </span>
                <span className="text-slate-500">vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Revenue & Traffic Overview</h2>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['day', 'week', 'month'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                    timeframe === t ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">User Growth Trend</h2>
            <p className="text-xs text-slate-400 mb-6">Active engagement across selected timeframe</p>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics}>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                  <Line type="monotone" dataKey="users" stroke="#22d3ee" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Synced with backend DB</span>
            <button onClick={fetchData} className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium">
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <h2 className="text-lg font-bold text-white mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono text-indigo-400 font-medium">{tx.id}</td>
                  <td className="py-3 px-4 text-slate-200">{tx.user}</td>
                  <td className="py-3 px-4 font-semibold text-white">${tx.amount.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      tx.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      tx.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
