import React from 'react';
import { LayoutDashboard, Receipt, MessageSquareText, PieChart, Wallet, Target } from 'lucide-react';
import { Page } from '../types';

interface NavbarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, setPage }) => {
  const navItems = [
    { page: Page.DASHBOARD, label: 'Beranda', icon: LayoutDashboard },
    { page: Page.TRANSACTIONS, label: 'Transaksi', icon: Receipt },
    { page: Page.GOALS, label: 'Kesehatan', icon: Target }, // Changed label
    { page: Page.ANALYTICS, label: 'Analisis', icon: PieChart },
    { page: Page.CHAT, label: 'AI Chat', icon: MessageSquareText },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 sm:relative sm:border-t-0 sm:border-r sm:w-64 sm:h-screen sm:flex sm:flex-col sm:px-6 sm:py-8 z-50">
      <div className="hidden sm:flex items-center gap-3 mb-10 px-2">
        <div className="bg-emerald-500 p-2 rounded-xl">
          <Wallet className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">SakuPintar</h1>
      </div>

      <div className="flex justify-around sm:flex-col sm:gap-2 overflow-x-auto sm:overflow-visible no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => setPage(item.page)}
            className={`
              flex flex-col sm:flex-row items-center sm:gap-3 p-2 rounded-xl transition-all min-w-[60px] sm:min-w-0
              ${currentPage === item.page 
                ? 'text-emerald-600 bg-emerald-50 sm:bg-emerald-100/50' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
            `}
          >
            <item.icon className={`w-6 h-6 sm:w-5 sm:h-5 ${currentPage === item.page ? 'stroke-[2.5px]' : ''}`} />
            <span className="text-[10px] sm:text-sm font-medium mt-1 sm:mt-0 whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;