import React, { useState } from 'react';
import { DebtRecord, DebtType, DebtStatus } from '../types';
import { Plus, Trash2, Calendar, User, DollarSign, CheckCircle, Handshake, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface DebtManagerProps {
  debts: DebtRecord[];
  addDebt: (d: DebtRecord) => void;
  updateDebtStatus: (id: string, status: 'PAID' | 'UNPAID') => void;
  deleteDebt: (id: string) => void;
}

const DebtManager: React.FC<DebtManagerProps> = ({ debts, addDebt, updateDebtStatus, deleteDebt }) => {
  const [activeTab, setActiveTab] = useState<DebtType>('PAYABLE'); // PAYABLE (Hutang), RECEIVABLE (Piutang)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('UNPAID');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  // Calculations based on Filter
  const getFilteredTotal = (type: DebtType) => {
    return debts
      .filter(d => d.type === type && (statusFilter === 'ALL' || d.status === statusFilter))
      .reduce((sum, d) => sum + d.amount, 0);
  };

  const totalPayable = getFilteredTotal('PAYABLE');
  const totalReceivable = getFilteredTotal('RECEIVABLE');

  const filteredDebts = debts.filter(d => 
    d.type === activeTab && 
    (statusFilter === 'ALL' || d.status === statusFilter)
  );

  const getStatusLabel = (type: DebtType) => {
    if (statusFilter === 'ALL') return 'Total Riwayat';
    if (statusFilter === 'PAID') return type === 'PAYABLE' ? 'Telah Dibayar' : 'Telah Diterima';
    return type === 'PAYABLE' ? 'Harus Dibayar' : 'Akan Diterima';
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !person) return;

    const newDebt: DebtRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      person,
      amount: Number(amount),
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      description,
      type: activeTab,
      status: 'UNPAID'
    };

    addDebt(newDebt);
    
    // Reset
    setPerson('');
    setAmount('');
    setDueDate('');
    setDescription('');
    setIsFormOpen(false);
  };

  return (
    <div className="h-full pb-20 sm:pb-0 relative space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <Handshake size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Manajemen Hutang</h2>
            <p className="text-slate-500 text-sm">Catat kewajiban dan hakmu.</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex gap-2">
         {[
           { id: 'UNPAID', label: 'Belum Lunas' },
           { id: 'PAID', label: 'Lunas' },
           { id: 'ALL', label: 'Semua' },
         ].map(filter => (
           <button
             key={filter.id}
             onClick={() => setStatusFilter(filter.id as any)}
             className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
               statusFilter === filter.id 
                 ? 'bg-slate-800 text-white border-slate-800' 
                 : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
             }`}
           >
             {filter.label}
           </button>
         ))}
      </div>

      {/* Overview Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 transition-all">
          <div className="flex items-center gap-2 mb-2 text-rose-700">
            <ArrowDownRight size={16} />
            <span className="text-xs font-bold uppercase tracking-wide">Hutangku</span>
          </div>
          <p className="text-xl font-bold text-rose-600">Rp {totalPayable.toLocaleString('id-ID')}</p>
          <p className="text-xs text-rose-400 mt-1">{getStatusLabel('PAYABLE')}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 transition-all">
          <div className="flex items-center gap-2 mb-2 text-emerald-700">
            <ArrowUpRight size={16} />
            <span className="text-xs font-bold uppercase tracking-wide">Piutangku</span>
          </div>
          <p className="text-xl font-bold text-emerald-600">Rp {totalReceivable.toLocaleString('id-ID')}</p>
          <p className="text-xs text-emerald-400 mt-1">{getStatusLabel('RECEIVABLE')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl">
        <button
            onClick={() => setActiveTab('PAYABLE')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'PAYABLE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
            Daftar Hutang
        </button>
        <button
            onClick={() => setActiveTab('RECEIVABLE')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'RECEIVABLE' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
            Daftar Piutang
        </button>
      </div>

      {/* Toggle Form Button */}
      {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="w-full py-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-400 transition flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Tambah {activeTab === 'PAYABLE' ? 'Hutang' : 'Piutang'} Baru
          </button>
      )}

      {/* Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fade-in">
          <h3 className="font-bold text-slate-800 mb-4">Detail Catatan</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                  {activeTab === 'PAYABLE' ? 'Berhutang Kepada' : 'Dipinjam Oleh'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Nama orang..."
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Jatuh Tempo</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Keterangan (Opsional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="Contoh: Beli pulsa, Makan siang..."
              />
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    className={`flex-1 py-3 rounded-xl text-white font-bold shadow-lg transition-transform active:scale-95 ${
                        activeTab === 'PAYABLE' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
                    }`}
                >
                    Simpan
                </button>
            </div>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-3">
        {filteredDebts.length === 0 && !isFormOpen ? (
            <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100">
                <p>Tidak ada catatan {activeTab === 'PAYABLE' ? 'hutang' : 'piutang'} {statusFilter === 'ALL' ? '' : statusFilter === 'UNPAID' ? 'yang belum lunas' : 'yang sudah lunas'}.</p>
            </div>
        ) : (
            filteredDebts.map(item => (
                <div key={item.id} className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${item.status === 'PAID' ? 'opacity-60 grayscale' : ''}`}>
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                            item.status === 'PAID' 
                                ? 'bg-slate-100 text-slate-400' 
                                : activeTab === 'PAYABLE' ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'
                        }`}>
                            <User size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className={`font-bold text-lg ${item.status === 'PAID' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                    {item.person}
                                </h4>
                                {item.status === 'PAID' && (
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">LUNAS</span>
                                )}
                            </div>
                            <p className="text-slate-500 text-sm">{item.description || 'Tanpa keterangan'}</p>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                <Calendar size={12} /> Jatuh Tempo: {item.dueDate}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        <p className={`font-bold text-lg ${
                             item.status === 'PAID' ? 'text-slate-400' : activeTab === 'PAYABLE' ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                            Rp {item.amount.toLocaleString('id-ID')}
                        </p>
                        
                        <div className="flex gap-2">
                            {item.status === 'UNPAID' && (
                                <button 
                                    onClick={() => updateDebtStatus(item.id, 'PAID')}
                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition"
                                    title="Tandai Lunas"
                                >
                                    <CheckCircle size={20} />
                                </button>
                            )}
                            <button 
                                onClick={() => deleteDebt(item.id)}
                                className="p-2 bg-rose-50 text-rose-400 rounded-lg hover:bg-rose-100 transition"
                                title="Hapus"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default DebtManager;