import React from 'react';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const data = [
  { name: 'Lun', engagement: 4200, reach: 2400, posts: 3 },
  { name: 'Mar', engagement: 3100, reach: 1398, posts: 1 },
  { name: 'Mié', engagement: 5200, reach: 9800, posts: 4 },
  { name: 'Jue', engagement: 2780, reach: 3908, posts: 2 },
  { name: 'Vie', engagement: 1890, reach: 4800, posts: 5 },
  { name: 'Sáb', engagement: 6390, reach: 3800, posts: 3 },
  { name: 'Dom', engagement: 3490, reach: 4300, posts: 2 },
];

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-zinc-950 border border-zinc-800/60 p-5 rounded-xl transition-all hover:border-orange-500/30 group">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-${color}-500 transition-colors`}>
        <Icon size={20} />
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-bold tracking-widest ${change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
        {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.1em]">{title}</p>
      <h3 className="text-2xl font-black text-white font-display tabular-nums leading-none tracking-tight">{value}</h3>
    </div>
    <div className="mt-4 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
      <div className={`h-full bg-${color}-500 opacity-50`} style={{ width: '60%' }} />
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Followers" value="24,812" change={12.4} icon={Users} color="blue" />
        <StatCard title="Impressions" value="156.4k" change={8.2} icon={Zap} color="orange" />
        <StatCard title="Engagement" value="4.2%" change={-2.1} icon={Heart} color="rose" />
        <StatCard title="Shares" value="1,204" change={15.0} icon={Share2} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-zinc-950 border border-zinc-800/60 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/30">
            <div>
              <h3 className="text-lg font-bold">Activity Metrics</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Last 7 days performance window</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] font-bold uppercase text-zinc-400 hover:text-white transition-colors">Export CSV</button>
              <button className="px-3 py-1 bg-orange-600 rounded-md text-[10px] font-bold uppercase text-white hover:bg-orange-700 transition-colors">Apply Filters</button>
            </div>
          </div>
          <div className="p-8 h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  stroke="#52525b" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#f97316' }}
                  cursor={{ stroke: '#f97316', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="engagement" 
                  stroke="#f97316" 
                  fillOpacity={1} 
                  fill="url(#colorEng)" 
                  strokeWidth={2} 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-950 border border-zinc-800/60 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Content Quality</h3>
              <div className="text-[10px] font-black px-2 py-1 bg-orange-500/10 text-orange-500 rounded border border-orange-500/20">LIVE</div>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Reel Completion', value: 88, color: 'orange' },
                { label: 'Story View-through', value: 42, color: 'blue' },
                { label: 'Link CTR', value: 12, color: 'emerald' },
              ].map((m, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-zinc-500 uppercase">{m.label}</span>
                    <span className="text-white tabular-nums">{m.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full">
                    <div className={`h-full bg-${m.color}-500 rounded-full transition-all duration-1000`} style={{ width: `${m.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/60 p-6 rounded-2xl flex-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6">Social Context</h3>
            <div className="grid grid-cols-2 gap-3">
              {['Instagram', 'TikTok', 'X', 'Facebook'].map((p) => (
                <div key={p} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col items-center gap-1 hover:bg-zinc-800 transition-colors cursor-pointer group">
                  <span className="text-[10px] font-bold text-zinc-500 group-hover:text-white transition-colors">{p}</span>
                  <span className="text-sm font-black text-white tabular-nums">2.4k</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

