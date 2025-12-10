import React, { useState } from 'react';
import { PurchaseAnalysis } from '../types';
import { analyzePurchase } from '../services/geminiService';
import { Scale, Sparkles, AlertCircle, CheckCircle2, ArrowRight, Loader2, Heart, ShoppingBag } from 'lucide-react';

interface ShoppingAdvisorProps {
  onAddToTransaction: (item: string, price: number) => void;
  onAddToGoal: (item: string, price: number) => void;
}

const ShoppingAdvisor: React.FC<ShoppingAdvisorProps> = ({ onAddToTransaction, onAddToGoal }) => {
  const [item, setItem] = useState('');
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PurchaseAnalysis | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !price || !reason) return;

    setIsAnalyzing(true);
    setResult(null);
    const analysis = await analyzePurchase(item, Number(price), reason);
    setResult(analysis);
    setIsAnalyzing(false);
  };

  const handleReset = () => {
    setItem('');
    setPrice('');
    setReason('');
    setResult(null);
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200">
          <Scale className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cek Belanja</h2>
          <p className="text-slate-500 text-sm">Butuh atau cuma Ingin? Biar AI yang nilai!</p>
        </div>
      </div>

      {!result ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 max-w-lg mx-auto">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Barang apa yang mau dibeli?</label>
              <input
                type="text"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="Contoh: Sepatu Sneakers Baru"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Harganya berapa?</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Rp 0"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Kenapa kamu butuh ini?</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Jujur aja... Contoh: Karena yang lama udah robek, atau karena lagi ngetren aja."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none h-24"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              {isAnalyzing ? 'Sedang Menilai...' : 'Analisis Sekarang'}
            </button>
          </form>
        </div>
      ) : (
        <div className="animate-fade-in max-w-lg mx-auto space-y-6">
          {/* Result Card */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100">
            <div className={`p-6 text-center ${result.verdict === 'NEED' ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
              <p className="text-sm font-medium opacity-90 uppercase tracking-widest mb-1">Hasil Analisis</p>
              <h3 className="text-4xl font-black mb-2">{result.verdict === 'NEED' ? 'KEBUTUHAN (NEED)' : 'KEINGINAN (WANT)'}</h3>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-sm font-semibold">
                <span>Skor Kepentingan:</span>
                <span className="text-lg">{result.score}/100</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
               <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-indigo-500"/> Alasan AI
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-3 rounded-xl">
                    {result.reasoning}
                  </p>
               </div>

               <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                    <CheckCircle2 size={16} className="text-emerald-500"/> Rekomendasi
                  </h4>
                  <p className="text-slate-600 text-sm">{result.recommendation}</p>
               </div>
               
               {result.alternatives && (
                 <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-orange-500"/> Alternatif Hemat
                    </h4>
                    <p className="text-slate-600 text-sm">{result.alternatives}</p>
                 </div>
               )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 gap-3">
               {result.verdict === 'NEED' ? (
                 <button 
                  onClick={() => onAddToTransaction(item, Number(price))}
                  className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition flex items-center justify-center gap-2"
                 >
                   <ShoppingBag size={18} /> Beli & Catat Pengeluaran
                 </button>
               ) : (
                 <button 
                  onClick={() => onAddToGoal(item, Number(price))}
                  className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition flex items-center justify-center gap-2"
                 >
                   <Heart size={18} /> Tabung di Target Impian
                 </button>
               )}
               
               <button 
                onClick={handleReset}
                className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition"
               >
                 Cek Barang Lain
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingAdvisor;