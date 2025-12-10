import React from 'react';
import { Transaction } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ShieldCheck, HeartPulse, PiggyBank, TrendingUp, HandHeart, ShoppingCart } from 'lucide-react';

interface GoalManagerProps {
  transactions: Transaction[];
  // Legacy props kept for compatibility if needed, though we primarily use transactions now
  goals?: any[];
  addGoal?: any;
  deleteGoal?: any;
  addSavings?: any;
  initialData?: any;
}

const GoalManager: React.FC<GoalManagerProps> = ({ transactions }) => {
  // 1. Calculate Income
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  // 2. Calculate CSIZ Components
  // We assume specific category names. If users use custom categories, they might fall into Consumption.
  const expenses = transactions.filter(t => t.type === 'EXPENSE');

  const ZIS_CATEGORIES = ['Zakat/Infaq/Sedekah', 'Sedekah', 'Infaq', 'Zakat', 'Amal'];
  const INVEST_CATEGORIES = ['Investasi', 'Emas', 'Reksa Dana', 'Saham'];
  const SAVING_CATEGORIES = ['Tabungan', 'Dana Darurat'];

  let zAmount = 0;
  let iAmount = 0;
  let sAmount = 0;
  let cAmount = 0;

  expenses.forEach(t => {
    if (ZIS_CATEGORIES.some(cat => t.category.includes(cat))) {
      zAmount += t.amount;
    } else if (INVEST_CATEGORIES.some(cat => t.category.includes(cat))) {
      iAmount += t.amount;
    } else if (SAVING_CATEGORIES.some(cat => t.category.includes(cat))) {
      sAmount += t.amount;
    } else {
      cAmount += t.amount;
    }
  });

  // Handle case where total income is 0 to avoid Infinity
  const safeIncome = totalIncome || 1; 

  const metrics = [
    {
      id: 'C',
      label: 'Consumption',
      fullLabel: 'Konsumsi (C)',
      amount: cAmount,
      percent: (cAmount / safeIncome) * 100,
      targetPercent: 65,
      operator: '<=', // Max limit
      color: '#f43f5e', // Rose
      icon: ShoppingCart,
      desc: 'Maksimal 65%',
      status: (cAmount / safeIncome) * 100 <= 65 ? 'Sehat' : 'Boros'
    },
    {
      id: 'S',
      label: 'Saving',
      fullLabel: 'Tabungan (S)',
      amount: sAmount,
      percent: (sAmount / safeIncome) * 100,
      targetPercent: 10,
      operator: '>=', // Min limit
      color: '#3b82f6', // Blue
      icon: PiggyBank,
      desc: 'Minimal 10%',
      status: (sAmount / safeIncome) * 100 >= 10 ? 'Bagus' : 'Kurang'
    },
    {
      id: 'I',
      label: 'Investment',
      fullLabel: 'Investasi (I)',
      amount: iAmount,
      percent: (iAmount / safeIncome) * 100,
      targetPercent: 20,
      operator: '>=',
      color: '#8b5cf6', // Purple
      icon: TrendingUp,
      desc: 'Minimal 20%',
      status: (iAmount / safeIncome) * 100 >= 20 ? 'Hebat' : 'Perlu Ditingkatkan'
    },
    {
      id: 'Z',
      label: 'ZIS',
      fullLabel: 'Zakat/Infaq (Z)',
      amount: zAmount,
      percent: (zAmount / safeIncome) * 100,
      targetPercent: 5,
      operator: '>=',
      color: '#10b981', // Emerald
      icon: HandHeart,
      desc: 'Minimal 5%',
      status: (zAmount / safeIncome) * 100 >= 5 ? 'Mulia' : 'Jangan Lupa'
    }
  ];

  const pieData = metrics.filter(m => m.amount > 0).map(m => ({
    name: m.label,
    value: m.amount,
    color: m.color
  }));

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
           <div className="bg-white/20 p-2 rounded-lg">
             <HeartPulse className="w-6 h-6" />
           </div>
           <div>
             <h2 className="text-2xl font-bold">Kesehatan Keuangan</h2>
             <p className="text-emerald-100 text-sm">Metode C-S-I-Z (Consumption, Saving, Investment, ZIS)</p>
           </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-end">
           <div>
             <p className="text-sm text-emerald-100">Total Pendapatan</p>
             <p className="text-2xl font-bold">Rp {totalIncome.toLocaleString('id-ID')}</p>
           </div>
           <div className="text-right">
             <div className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full">
                <ShieldCheck size={14} />
                <span>Status: {metrics[0].status === 'Sehat' ? 'Aman' : 'Perlu Perbaikan'}</span>
             </div>
           </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Visual Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
           <h3 className="font-bold text-slate-700 mb-4">Distribusi Pengeluaran</h3>
           <div className="h-64 w-full">
             {pieData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={pieData}
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {pieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip 
                     formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                   />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                 Belum ada data pengeluaran
               </div>
             )}
           </div>
           {pieData.length > 0 && (
             <div className="flex flex-wrap gap-3 justify-center mt-4">
                {metrics.map(m => (
                  <div key={m.id} className="flex items-center gap-1 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: m.color}}></div>
                    <span className="text-slate-600">{m.id}</span>
                  </div>
                ))}
             </div>
           )}
        </div>

        {/* Detailed Progress Bars */}
        <div className="space-y-4">
          {metrics.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: `${item.color}20`, color: item.color}}>
                      <item.icon size={20} />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-800">{item.fullLabel}</h4>
                     <p className="text-xs text-slate-500">{item.desc}</p>
                   </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    item.status === 'Sehat' || item.status === 'Bagus' || item.status === 'Hebat' || item.status === 'Mulia'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-end mb-1">
                 <span className="text-xl font-bold" style={{color: item.color}}>
                   {item.percent.toFixed(1)}%
                 </span>
                 <span className="text-xs text-slate-400">
                   Rp {item.amount.toLocaleString('id-ID')}
                 </span>
              </div>

              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${Math.min(item.percent, 100)}%`,
                    backgroundColor: item.color
                  }}
                ></div>
              </div>
              
              {/* Target Marker */}
              <div className="relative h-4 mt-1">
                 <div 
                   className="absolute top-0 w-0.5 h-full bg-slate-300 flex flex-col items-center"
                   style={{ left: `${Math.min(item.targetPercent, 100)}%`}}
                 >
                    <span className="text-[10px] text-slate-400 mt-4 whitespace-nowrap">Target {item.targetPercent}%</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-sm text-indigo-800">
         <p>💡 <strong>Tips:</strong> Pastikan kategori transaksi kamu sesuai (Investasi, Tabungan, Zakat/Infaq/Sedekah) agar perhitungan CSIZ akurat.</p>
      </div>
    </div>
  );
};

export default GoalManager;