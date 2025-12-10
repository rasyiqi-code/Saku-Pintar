import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, CategoryState } from '../types';
import { Plus, Trash2, Calendar, Tag, FileText, DollarSign, X, Check, Sparkles, Loader2 } from 'lucide-react';
import { parseTransactionWithAI } from '../services/geminiService';

interface TransactionManagerProps {
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  categories: CategoryState;
  onAddCategory: (type: TransactionType, category: string) => void;
  initialData?: {
    amount: number;
    description: string;
    type: TransactionType;
  } | null;
}

const TransactionManager: React.FC<TransactionManagerProps> = ({ 
  transactions, 
  addTransaction, 
  deleteTransaction,
  categories,
  onAddCategory,
  initialData
}) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'ADD'>('LIST');
  
  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // New Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // AI Input State
  const [aiInput, setAiInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // AI Confirmation State
  const [pendingAiTransaction, setPendingAiTransaction] = useState<{
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    description: string;
  } | null>(null);

  // Handle Initial Data (from Advisor)
  useEffect(() => {
    if (initialData) {
      setActiveTab('ADD');
      setAmount(initialData.amount.toString());
      setDescription(initialData.description);
      setType(initialData.type);
      // Try to find a matching category or default
      setCategory(categories.EXPENSE.find(c => c === 'Lainnya') || categories.EXPENSE[0]);
    }
  }, [initialData, categories]);

  // Update default category when type or category list changes
  useEffect(() => {
    const currentList = type === 'INCOME' ? categories.INCOME : categories.EXPENSE;
    // Only reset if current category is not in the new list, OR if category is empty
    if (!category || !currentList.includes(category)) {
      setCategory(currentList[0] || '');
    }
  }, [type, categories, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date: new Date(date).toISOString(),
      amount: Number(amount),
      category,
      description,
      type
    };

    addTransaction(newTransaction);
    
    // Reset Form
    setAmount('');
    setDescription('');
    setAiInput('');
    setActiveTab('LIST');
  };

  const handleSaveCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(type, newCategoryName.trim());
      setCategory(newCategoryName.trim()); // Auto select new category
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleAiProcess = async () => {
    if (!aiInput.trim()) return;
    setIsAiProcessing(true);
    
    const result = await parseTransactionWithAI(aiInput, categories);
    
    if (result) {
      setPendingAiTransaction(result);
    } else {
      alert("Maaf, AI tidak dapat memahami input tersebut. Silakan coba lagi atau isi manual.");
    }
    
    setIsAiProcessing(false);
  };

  const confirmAiTransaction = () => {
    if (!pendingAiTransaction) return;

    setType(pendingAiTransaction.type);
    setAmount(pendingAiTransaction.amount.toString());
    setDate(pendingAiTransaction.date);
    setDescription(pendingAiTransaction.description);
    
    // Check if parsed category exists, if not, try to match or default to existing
    const currentList = pendingAiTransaction.type === 'INCOME' ? categories.INCOME : categories.EXPENSE;
    if (currentList.includes(pendingAiTransaction.category)) {
      setCategory(pendingAiTransaction.category);
    } else {
      // If AI returned a category we don't have, default to first available
      setCategory(currentList[0]);
    }
    
    setPendingAiTransaction(null);
  };

  return (
    <div className="h-full pb-20 sm:pb-0 relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {activeTab === 'LIST' ? 'Riwayat Transaksi' : 'Catat Transaksi'}
        </h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('LIST')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'LIST' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            List
          </button>
          <button
            onClick={() => setActiveTab('ADD')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'ADD' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className="flex items-center gap-1"><Plus size={14} /> Baru</span>
          </button>
        </div>
      </div>

      {activeTab === 'ADD' ? (
        <div className="max-w-lg mx-auto animate-fade-in space-y-6">
          
          {/* AI Magic Input */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-20">
               <Sparkles className="w-24 h-24" />
             </div>
             
             <div className="relative z-10">
               <div className="flex items-center gap-2 mb-3">
                 <Sparkles className="w-5 h-5 text-yellow-300" />
                 <h3 className="font-bold">Input Ajaib AI</h3>
               </div>
               <p className="text-indigo-100 text-sm mb-4">
                 Ketik santai aja, nanti aku isikan formnya buat kamu!
               </p>
               
               <div className="relative">
                 <textarea 
                   value={aiInput}
                   onChange={(e) => setAiInput(e.target.value)}
                   placeholder="Contoh: Beli bakso 15rb buat makan siang tadi..."
                   className="w-full bg-white/10 backdrop-blur-md border border-indigo-400/30 rounded-xl p-3 text-white placeholder-indigo-200 focus:outline-none focus:bg-white/20 transition-all text-sm resize-none h-20"
                 />
                 <button 
                  onClick={handleAiProcess}
                  disabled={!aiInput.trim() || isAiProcessing}
                  className="absolute bottom-3 right-3 bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-50 disabled:opacity-50 transition-colors flex items-center gap-2"
                 >
                   {isAiProcessing ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
                   {isAiProcessing ? 'Memproses...' : 'Proses'}
                 </button>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Atau Manual</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            {/* Type Toggle */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`p-3 rounded-xl border-2 font-bold text-center transition-all ${type === 'EXPENSE' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-100 text-slate-400'}`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`p-3 rounded-xl border-2 font-bold text-center transition-all ${type === 'INCOME' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-400'}`}
              >
                Pemasukan
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tanggal</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Jumlah (Rp)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-lg text-slate-800"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-600">Kategori</label>
                  {!isAddingCategory && (
                     <button 
                      type="button" 
                      onClick={() => setIsAddingCategory(true)}
                      className="text-xs text-emerald-600 font-medium hover:underline flex items-center gap-1"
                     >
                       <Plus size={12} /> Kategori Baru
                     </button>
                  )}
                </div>

                {isAddingCategory ? (
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nama Kategori..."
                      className="flex-1 px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      autoFocus
                    />
                    <button 
                      type="button" 
                      onClick={handleSaveCategory}
                      className="bg-emerald-500 text-white p-3 rounded-xl hover:bg-emerald-600"
                    >
                      <Check size={20} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingCategory(false)}
                      className="bg-slate-100 text-slate-500 p-3 rounded-xl hover:bg-slate-200"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none bg-white text-slate-700"
                    >
                      {(type === 'INCOME' ? categories.INCOME : categories.EXPENSE).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Catatan (Opsional)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                    placeholder="Contoh: Beli Nasi Goreng"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-emerald-200 transition-all mt-6 transform active:scale-95 ${type === 'INCOME' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
              >
                Simpan Transaksi
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                 <FileText size={32} />
               </div>
               <p className="text-slate-500 font-medium">Belum ada transaksi</p>
               <button onClick={() => setActiveTab('ADD')} className="text-emerald-500 text-sm mt-2 font-semibold hover:underline">Tambah sekarang</button>
             </div>
          ) : (
            transactions.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold ${
                    t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'
                  }`}>
                    {t.date.split('T')[0].split('-')[2]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{t.category}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={12} /> {t.date.split('T')[0]} 
                      {t.description && <span className="mx-1">• {t.description}</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                  </p>
                  <button 
                    onClick={() => deleteTransaction(t.id)}
                    className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* AI Confirmation Modal */}
      {pendingAiTransaction && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
            <div className="flex items-center gap-3 mb-4 text-indigo-600">
              <div className="bg-indigo-100 p-2 rounded-full">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Konfirmasi Hasil AI</h3>
            </div>
            
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl mb-6 text-sm">
               <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Tipe</span>
                  <span className={`font-bold ${pendingAiTransaction.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {pendingAiTransaction.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
               </div>
               <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Tanggal</span>
                  <span className="font-medium text-slate-800">{pendingAiTransaction.date}</span>
               </div>
               <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Jumlah</span>
                  <span className="font-bold text-slate-800">Rp {pendingAiTransaction.amount.toLocaleString('id-ID')}</span>
               </div>
               <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Kategori</span>
                  <span className="font-medium text-slate-800">{pendingAiTransaction.category}</span>
               </div>
               <div>
                  <span className="block text-slate-500 mb-1">Deskripsi</span>
                  <span className="block font-medium text-slate-800 italic">"{pendingAiTransaction.description}"</span>
               </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setPendingAiTransaction(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button 
                onClick={confirmAiTransaction}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
              >
                Gunakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;
