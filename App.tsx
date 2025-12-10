import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TransactionManager from './components/TransactionManager';
import Chatbot from './components/Chatbot';
import Analytics from './components/Analytics';
import GoalManager from './components/GoalManager';
import { Page, Transaction, CategoryState, TransactionType, DEFAULT_CATEGORIES } from './types';
import { db } from './services/db';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryState>(DEFAULT_CATEGORIES);

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
    setTransactions(txs);
    setCategories(cats);
  };

  // Transaction Handlers
  const addTransaction = async (t: Transaction) => {
    // Optimistic Update (optional, but safer to wait for DB here since it's local)
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
      case Page.CHAT:
        return (
          <Chatbot 
            onAddTransaction={addTransaction} 
            categories={categories}
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
        <div className="max-w-4xl mx-auto h-full">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;