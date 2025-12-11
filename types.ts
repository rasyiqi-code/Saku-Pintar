export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  date: string; // ISO String
  amount: number;
  category: string;
  description: string;
  type: TransactionType;
}

export type DebtType = 'PAYABLE' | 'RECEIVABLE'; // PAYABLE = Hutang (I owe), RECEIVABLE = Piutang (Owes me)
export type DebtStatus = 'UNPAID' | 'PAID';

export interface DebtRecord {
  id: string;
  person: string;
  amount: number;
  date: string;
  dueDate: string;
  description: string;
  type: DebtType;
  status: DebtStatus;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  emoji?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum Page {
  DASHBOARD = 'DASHBOARD',
  TRANSACTIONS = 'TRANSACTIONS',
  GOALS = 'GOALS', // Now represents "Financial Health / CSIZ"
  DEBTS = 'DEBTS',
  CHAT = 'CHAT',
  ANALYTICS = 'ANALYTICS'
}

export interface CategoryState {
  INCOME: string[];
  EXPENSE: string[];
}

export const DEFAULT_CATEGORIES: CategoryState = {
  INCOME: ['Uang Saku', 'Hadiah', 'Kerja Part-time', 'Pelunasan Hutang (Masuk)', 'Lainnya'],
  EXPENSE: [
    'Makanan', 
    'Transportasi', 
    'Buku/Alat Tulis', 
    'Pulsa/Data', 
    'Hiburan', 
    'Tabungan', // For 'S'
    'Investasi', // For 'I'
    'Zakat/Infaq/Sedekah', // For 'Z'
    'Bayar Hutang (Keluar)',
    'Lainnya'
  ]
};

export interface NeedsWantsSummary {
  needsTotal: number;
  wantsTotal: number;
  needsPercentage: number;
  wantsPercentage: number;
  insight: string;
  breakdown: { id: string; verdict: 'NEED' | 'WANT' }[];
}

export interface PurchaseAnalysis {
  verdict: 'NEED' | 'WANT';
  score: number;
  reasoning: string;
  recommendation: string;
  alternatives?: string;
}