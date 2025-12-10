import React, { useState } from 'react';
import { Transaction, Goal } from '../types';
import { TrendingUp, TrendingDown, Wallet, Sparkles, PlusCircle, Target, ChevronRight } from 'lucide-react';
import { analyzeFinances } from '../services/geminiService';

interface DashboardProps {
  transactions: Transaction[];
  goals: Goal[];
  onAddTransactionClick: () => void;
  onViewGoalsClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, goals, onAddTransactionClick, onViewGoalsClick }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const income = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = income - expense;

  // Find the primary goal (the one closest to completion but not done, or just the first one)
  const primaryGoal = goals.find(g => g.currentAmount < g.targetAmount) || goals[0];

  const handleAnalyze = async () => {
    if (transactions.length === 0) {
      setAnalysis("Belum ada data transaksi untuk dianalisis. Yuk, catat pengeluaranmu dulu!");
      return;
    }
    setIsAnalyzing(true);
    const result = await analyzeFinances(transactions);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Halo, Siswa! 👋</h2>
          <p className="text-slate-500 text-sm">Ayo atur uang sakumu dengan bijak.</p>
        </div>
        <button 
          onClick={onAddTransactionClick}
          className="sm:hidden bg-emerald-500 text-white p-2 rounded-full shadow-lg hover:bg-emerald-600 transition"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
      </header>

      {/* Balance Cards - Consistent Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Saldo Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shrink-0">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Saldo</p>
            <h3 className={`text-2xl font-bold ${balance < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              Rp {balance.toLocaleString('id-ID')}
            </h3>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
          <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 shrink-0">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Pemasukan</p>
            <h3 className="text-2xl font-bold text-emerald-600">
              + Rp {income.toLocaleString('id-ID')}
            </h3>
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
          <div className="bg-rose-50 p-3 rounded-2xl text-rose-600 shrink-0">
            <TrendingDown className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Pengeluaran</p>
            <h3 className="text-2xl font-bold text-rose-600">
              - Rp {expense.toLocaleString('id-ID')}
            </h3>
          </div>
        </div>
      </div>

      {/* Primary Goal Snippet */}
      {primaryGoal && (
        <div 
          onClick={onViewGoalsClick}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition group"
        >
          <div className="flex justify-between items-center mb-3">
             <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-700">Target: {primaryGoal.name}</h3>
             </div>
             <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
          </div>
          <div className="flex items-center gap-4">
             <div className="flex-1">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-indigo-500 rounded-full" 
                     style={{width: `${Math.min((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100, 100)}%`}}
                   ></div>
                </div>
             </div>
             <span className="text-sm font-bold text-indigo-600 whitespace-nowrap">
               Rp {primaryGoal.currentAmount.toLocaleString('id-ID')} / {primaryGoal.targetAmount.toLocaleString('id-ID')}
             </span>
          </div>
        </div>
      )}

      {/* AI Analysis Section */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-32 h-32 text-indigo-500" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-indigo-900">Analisis Keuangan AI</h3>
            </div>
            {!analysis && (
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isAnalyzing ? 'Sedang Berpikir...' : 'Analisis Sekarang'}
              </button>
            )}
          </div>

          {analysis ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap animate-fade-in border border-indigo-100">
              {analysis}
              <button 
                onClick={() => setAnalysis(null)} 
                className="block mt-4 text-xs text-indigo-600 font-medium hover:underline"
              >
                Tutup Analisis
              </button>
            </div>
          ) : (
            <p className="text-indigo-800/70 text-sm max-w-lg">
              Biarkan Gemini AI menganalisis pola pengeluaranmu dan memberikan tips hemat khusus buat kamu. Coba sekarang!
            </p>
          )}
        </div>
      </div>

      {/* Recent Transactions Preview */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Transaksi Terakhir</h3>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {transactions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'
                    }`}>
                      {t.type === 'INCOME' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{t.description || t.category}</p>
                      <p className="text-xs text-slate-500">{t.date.split('T')[0]} • {t.category}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              Belum ada transaksi. Tambahkan sekarang!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;