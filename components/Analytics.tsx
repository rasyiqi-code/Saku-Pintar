import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, NeedsWantsSummary } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, BarChart3, BrainCircuit, Sparkles, Loader2, RefreshCcw, FileText, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { analyzeNeedsWantsBatch } from '../services/geminiService';
import { exportToPDF, exportToExcel } from '../services/exportService';
import { db } from '../services/db';

interface AnalyticsProps {
  transactions: Transaction[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

const Analytics: React.FC<AnalyticsProps> = ({ transactions }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // AI Insight State
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [needsWantsSummary, setNeedsWantsSummary] = useState<NeedsWantsSummary | null>(null);

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const currentMonthLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // Load saved analysis when month changes
  useEffect(() => {
    const loadAnalysis = async () => {
      setNeedsWantsSummary(null); // Clear previous while loading
      const savedData = await db.getMonthlyAnalysis(currentMonthKey);
      if (savedData) {
        setNeedsWantsSummary(savedData);
      }
    };
    loadAnalysis();
  }, [currentMonthKey]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 1. Data Processing for Monthly Detail (Current Selection)
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
    });
  }, [transactions, currentDate]);

  const totalIncome = monthlyTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthlyTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyBalance = totalIncome - totalExpense;

  const expenseByCategory = monthlyTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.keys(expenseByCategory).map(key => ({
    name: key,
    value: expenseByCategory[key]
  }));

  const incomeByCategory = monthlyTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // 2. Data Processing for Trends (All Time / Last 6 Months)
  const trendData = useMemo(() => {
    const dataMap: Record<string, { name: string; dateKey: string; Pemasukan: number; Pengeluaran: number }> = {};
    
    transactions.forEach(t => {
      const d = new Date(t.date);
      // Key format: YYYY-MM for sorting
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      if (!dataMap[key]) {
        dataMap[key] = {
          name: d.toLocaleString('id-ID', { month: 'short' }), // "Jan", "Feb"
          dateKey: key,
          Pemasukan: 0,
          Pengeluaran: 0
        };
      }
      
      if (t.type === 'INCOME') {
        dataMap[key].Pemasukan += t.amount;
      } else {
        dataMap[key].Pengeluaran += t.amount;
      }
    });

    // Convert to array, sort by date, and take last 6 months
    return Object.values(dataMap)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .slice(-6); 
  }, [transactions]);

  // 3. Verdict Map for Quick Lookup
  const verdictMap = useMemo(() => {
    if (!needsWantsSummary) return new Map();
    return new Map(needsWantsSummary.breakdown.map(b => [b.id, b.verdict]));
  }, [needsWantsSummary]);

  // Handle AI Analysis Trigger
  const runAiAnalysis = async () => {
    setIsAiAnalyzing(true);
    const result = await analyzeNeedsWantsBatch(monthlyTransactions);
    if (result) {
      setNeedsWantsSummary(result);
      await db.saveMonthlyAnalysis(currentMonthKey, result);
    }
    setIsAiAnalyzing(false);
  };

  const handleResetAnalysis = async () => {
    setNeedsWantsSummary(null);
  };

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-xl text-xs">
          <p className="font-bold text-slate-700 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.name}: Rp {entry.value.toLocaleString('id-ID')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      
      {/* Trend Chart Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-800">Tren Keuangan (6 Bulan Terakhir)</h2>
        </div>
        
        {trendData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 10}}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Belum cukup data untuk menampilkan tren.
          </div>
        )}
      </div>

      <div className="h-px bg-slate-200"></div>

      {/* Monthly Filter Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="text-center">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Laporan Bulanan</span>
            <h2 className="text-xl font-bold text-slate-800">{currentMonthLabel}</h2>
          </div>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronRight className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Export Buttons */}
        {monthlyTransactions.length > 0 && (
          <div className="flex gap-2">
            <button 
              onClick={() => exportToPDF(monthlyTransactions, currentMonthLabel)}
              className="flex-1 flex items-center justify-center gap-2 bg-rose-50 text-rose-600 border border-rose-200 px-4 py-3 rounded-xl text-sm font-bold hover:bg-rose-100 transition shadow-sm active:scale-95"
            >
              <FileText size={18} />
              Export PDF
            </button>
            <button 
              onClick={() => exportToExcel(monthlyTransactions, currentMonthLabel)}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-3 rounded-xl text-sm font-bold hover:bg-emerald-100 transition shadow-sm active:scale-95"
            >
              <FileSpreadsheet size={18} />
              Export Excel
            </button>
          </div>
        )}
      </div>

      {/* AI Insight Needs vs Wants */}
      {monthlyTransactions.length > 0 && totalExpense > 0 && (
         <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <BrainCircuit className="w-40 h-40 text-white" />
            </div>
            
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-yellow-300" />
                       Insight Kebutuhan vs Keinginan
                    </h3>
                    <p className="text-indigo-100 text-sm mt-1">Biarkan AI menilai kualitas pengeluaranmu bulan ini.</p>
                  </div>
                  {!needsWantsSummary && (
                    <button 
                      onClick={runAiAnalysis}
                      disabled={isAiAnalyzing}
                      className="bg-white text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-50 transition flex items-center gap-2 disabled:opacity-70"
                    >
                      {isAiAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                      {isAiAnalyzing ? 'Menganalisis...' : 'Analisis AI'}
                    </button>
                  )}
               </div>

               {needsWantsSummary && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 animate-fade-in border border-white/20">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="flex justify-center">
                           <div className="w-32 h-32 relative">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[
                                      { name: 'Kebutuhan', value: needsWantsSummary.needsTotal },
                                      { name: 'Keinginan', value: needsWantsSummary.wantsTotal }
                                    ]}
                                    innerRadius={30}
                                    outerRadius={50}
                                    dataKey="value"
                                    stroke="none"
                                  >
                                    <Cell fill="#60a5fa" /> {/* Blue for Need */}
                                    <Cell fill="#fb7185" /> {/* Rose for Want */}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold pointer-events-none">
                                 {needsWantsSummary.wantsPercentage}% Wants
                              </div>
                           </div>
                        </div>
                        <div>
                           <div className="flex gap-4 mb-3 text-sm">
                              <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                 <span>Needs: <strong>Rp {needsWantsSummary.needsTotal.toLocaleString('id-ID')}</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                                 <span>Wants: <strong>Rp {needsWantsSummary.wantsTotal.toLocaleString('id-ID')}</strong></span>
                              </div>
                           </div>
                           <p className="text-sm leading-relaxed text-indigo-50 bg-black/20 p-3 rounded-lg">
                              "{needsWantsSummary.insight}"
                           </p>
                           <button 
                             onClick={handleResetAnalysis}
                             className="text-xs text-indigo-200 mt-2 hover:text-white flex items-center gap-1"
                           >
                             <RefreshCcw size={12} /> Reset Analisis
                           </button>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-emerald-200 rounded-md"><TrendingUp size={16} className="text-emerald-700"/></div>
                <span className="text-sm font-medium text-emerald-800">Pemasukan</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">Rp {totalIncome.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
            <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-rose-200 rounded-md"><TrendingDown size={16} className="text-rose-700"/></div>
                <span className="text-sm font-medium text-rose-800">Pengeluaran</span>
            </div>
            <p className="text-2xl font-bold text-rose-700">Rp {totalExpense.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-indigo-200 rounded-md"><Wallet size={16} className="text-indigo-700"/></div>
                <span className="text-sm font-medium text-indigo-800">Sisa Bulan Ini</span>
            </div>
            <p className="text-2xl font-bold text-indigo-700">Rp {monthlyBalance.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {monthlyTransactions.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          <p>Belum ada data transaksi di bulan {currentMonthLabel}.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-700 mb-4 text-center">Pengeluaran per Kategori</h3>
            {totalExpense > 0 ? (
                <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
                    >
                        {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    </PieChart>
                </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Tidak ada pengeluaran bulan ini.</div>
            )}
          </div>

          {/* Detailed Breakdown List */}
          <div className="space-y-4">
             {/* Income List */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">Rincian Pemasukan</h3>
                {Object.keys(incomeByCategory).length > 0 ? (
                    <ul className="space-y-3">
                        {Object.entries(incomeByCategory).map(([cat, amount]) => (
                            <li key={cat} className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 font-medium">{cat}</span>
                                <span className="text-emerald-600 font-bold">+ Rp {amount.toLocaleString('id-ID')}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-400 text-sm">Belum ada data.</p>
                )}
             </div>

             {/* Expense List */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">Rincian Pengeluaran</h3>
                {pieData.length > 0 ? (
                    <ul className="space-y-3">
                        {pieData.sort((a,b) => b.value - a.value).map((item, index) => (
                            <li key={item.name} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                                    <span className="text-slate-600 font-medium">{item.name}</span>
                                </div>
                                <span className="text-rose-500 font-bold">- Rp {item.value.toLocaleString('id-ID')}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-400 text-sm">Belum ada data.</p>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Transaction Audit List with AI Verdicts */}
      {monthlyTransactions.filter(t => t.type === 'EXPENSE').length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Audit Transaksi Pengeluaran</h3>
            {needsWantsSummary && (
              <span className="text-xs font-medium text-slate-400">
                AI Status: <span className="text-emerald-500">Active</span>
              </span>
            )}
          </div>
          
          <div className="space-y-2">
             {monthlyTransactions
               .filter(t => t.type === 'EXPENSE')
               .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
               .map(t => {
                 const verdict = verdictMap.get(t.id);
                 return (
                   <div key={t.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-700 text-sm">{t.category}</p>
                          {t.description && <span className="text-slate-400 text-xs">• {t.description}</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{t.date.split('T')[0]}</p>
                      </div>
                      <div className="text-right">
                         <p className="font-bold text-rose-500 text-sm">- Rp {t.amount.toLocaleString('id-ID')}</p>
                         {verdict && (
                           <div className={`flex items-center justify-end gap-1 text-[10px] font-bold mt-1 ${
                               verdict === 'NEED' ? 'text-blue-600' : 'text-rose-500'
                           }`}>
                              {verdict === 'NEED' ? (
                                <>
                                  <CheckCircle2 size={10} />
                                  <span>KEBUTUHAN</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle size={10} />
                                  <span>KEINGINAN</span>
                                </>
                              )}
                           </div>
                         )}
                      </div>
                   </div>
                 );
               })
             }
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;