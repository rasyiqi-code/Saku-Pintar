import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TransactionManager from './components/TransactionManager';
import Chatbot from './components/Chatbot';
import Analytics from './components/Analytics';
import GoalManager from './components/GoalManager';
import DebtManager from './components/DebtManager';
import { Page, Transaction, CategoryState, TransactionType, DEFAULT_CATEGORIES, DebtRecord } from './types';
import { db } from './services/db';
import { Loader2, MessageSquareText } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryState>(DEFAULT_CATEGORIES);
  const [debts, setDebts] = useState<DebtRecord[]>([]);

  // Initialize DB and Fetch Data
  useEffect(() => {
    const initData = async () => {
      try {
        await db.init();
        await refreshData();
      } catch (error) {
        console.error("Failed to load database", error);
        alert("Gagal memuat database. Harap refresh halaman.");
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  const refreshData = async () => {
    const txs = await db.getTransactions();
    const cats = await db.getCategories();
    const dbs = await db.getDebts();
    setTransactions(txs);
    setCategories(cats);
    setDebts(dbs);
  };

  // Transaction Handlers
  const addTransaction = async (t: Transaction) => {
    await db.addTransaction(t);
    await refreshData();
  };

  const deleteTransaction = async (id: string) => {
    await db.deleteTransaction(id);
    await refreshData();
  };

  const addCategory = async (type: TransactionType, newCategory: string) => {
    await db.addCategory(type, newCategory);
    await refreshData();
  };

  // Debt Handlers
  const addDebt = async (d: DebtRecord) => {
    await db.addDebt(d);
    await refreshData();
  };

  const updateDebtStatus = async (id: string, status: 'PAID' | 'UNPAID') => {
    await db.updateDebtStatus(id, status);
    
    // Logic: If marking as PAID, offer to create transaction
    if (status === 'PAID') {
        const debt = debts.find(d => d.id === id);
        if (debt) {
            const isPayable = debt.type === 'PAYABLE'; // Hutang (Expense when paid)
            const confirmMsg = isPayable 
                ? `Kamu baru saja melunasi hutang ke ${debt.person}. Catat sebagai PENGELUARAN (Bayar Hutang)?`
                : `Kamu baru saja menerima pelunasan piutang dari ${debt.person}. Catat sebagai PEMASUKAN (Pelunasan Hutang)?`;
            
            if (window.confirm(confirmMsg)) {
                const t: Transaction = {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    amount: debt.amount,
                    category: isPayable ? 'Bayar Hutang (Keluar)' : 'Pelunasan Hutang (Masuk)',
                    description: isPayable ? `Bayar hutang ke ${debt.person}` : `Terima piutang dari ${debt.person}`,
                    type: isPayable ? 'EXPENSE' : 'INCOME'
                };
                await db.addTransaction(t);
            }
        }
    }
    await refreshData();
  };

  const deleteDebt = async (id: string) => {
    if (window.confirm("Yakin ingin menghapus catatan ini?")) {
        await db.deleteDebt(id);
        await refreshData();
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.DASHBOARD:
        return (
          <Dashboard 
            transactions={transactions} 
            goals={[]} 
            onAddTransactionClick={() => setCurrentPage(Page.TRANSACTIONS)} 
            onViewGoalsClick={() => setCurrentPage(Page.GOALS)}
          />
        );
      case Page.TRANSACTIONS:
        return (
          <TransactionManager 
            transactions={transactions} 
            addTransaction={addTransaction}
            deleteTransaction={deleteTransaction}
            categories={categories}
            onAddCategory={addCategory}
          />
        );
      case Page.GOALS:
        return (
          <GoalManager 
            transactions={transactions}
          />
        );
      case Page.DEBTS:
        return (
          <DebtManager 
             debts={debts}
             addDebt={addDebt}
             updateDebtStatus={updateDebtStatus}
             deleteDebt={deleteDebt}
          />
        );
      case Page.ANALYTICS:
        return <Analytics transactions={transactions} />;
      default:
        return <Dashboard transactions={transactions} goals={[]} onAddTransactionClick={() => setCurrentPage(Page.TRANSACTIONS)} onViewGoalsClick={() => setCurrentPage(Page.GOALS)} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium">Memuat Database SQLite...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-slate-50 font-sans">
      <Navbar currentPage={currentPage} setPage={setCurrentPage} />
      
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-4xl mx-auto h-full pb-24 sm:pb-0">
          {renderPage()}
        </div>
      </main>

      {/* Floating Action Button for Chat */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`
          fixed bottom-24 right-6 sm:bottom-8 sm:right-8 z-50
          p-3 rounded-full shadow-2xl transition-all duration-300
          ${isChatOpen ? 'bg-slate-800 rotate-90 scale-75' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 animate-bounce-subtle'}
          text-white flex items-center justify-center
        `}
      >
        <MessageSquareText size={20} />
      </button>

      {/* Floating Chat Overlay */}
      {isChatOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-8 sm:w-96 sm:h-[600px] z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Mobile Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 sm:hidden backdrop-blur-sm"
            onClick={() => setIsChatOpen(false)}
          ></div>
          
          <div className="relative h-full w-full">
            <Chatbot 
              onAddTransaction={addTransaction}
              categories={categories}
              onClose={() => setIsChatOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;