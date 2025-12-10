export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  date: string; // ISO String
  amount: number;
  category: string;
  description: string;
  type: TransactionType;
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
  CHAT = 'CHAT',
  ANALYTICS = 'ANALYTICS'
}

export interface CategoryState {
  INCOME: string[];
  EXPENSE: string[];
}

export const DEFAULT_CATEGORIES: CategoryState = {
  INCOME: ['Uang Saku', 'Hadiah', 'Kerja Part-time', 'Lainnya'],
  EXPENSE: [
    'Makanan', 
    'Transportasi', 
    'Buku/Alat Tulis', 
    'Pulsa/Data', 
    'Hiburan', 
    'Tabungan', // For 'S'
    'Investasi', // For 'I'
    'Zakat/Infaq/Sedekah', // For 'Z'
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
