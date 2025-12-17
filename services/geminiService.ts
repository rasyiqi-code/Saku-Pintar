import { GoogleGenerativeAI, ChatSession, SchemaType, FunctionDeclaration } from "@google/generative-ai";
import { Transaction, CategoryState, TransactionType, NeedsWantsSummary, PurchaseAnalysis } from "../types";

// --- API Key Retrieval Logic ---
const getApiKey = (): string => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  // Fallback for manual .env
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  return '';
};

const apiKey = getApiKey();
let genAI: GoogleGenerativeAI | null = null;

const getClient = (): GoogleGenerativeAI | null => {
  if (!apiKey) return null;
  if (!genAI) genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
};

// --- Tool Definitions ---

const addTransactionTool: FunctionDeclaration = {
  name: "addTransaction",
  description: "Catat transaksi keuangan (pemasukan atau pengeluaran) ke dalam aplikasi.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      type: { 
        type: SchemaType.STRING, 
        description: "Tipe transaksi. Harus bernilai 'INCOME' untuk pemasukan, atau 'EXPENSE' untuk pengeluaran." 
      },
      amount: { 
        type: SchemaType.NUMBER, 
        description: "Jumlah uang dalam Rupiah (angka saja)." 
      },
      category: { 
        type: SchemaType.STRING, 
        description: "Kategori transaksi. Pilih yang paling sesuai dari daftar yang tersedia." 
      },
      description: { 
        type: SchemaType.STRING, 
        description: "Keterangan singkat transaksi." 
      },
      date: { 
        type: SchemaType.STRING, 
        description: "Tanggal transaksi dalam format YYYY-MM-DD. Gunakan hari ini jika tidak disebutkan." 
      }
    },
    required: ["type", "amount", "category"]
  }
};

/**
 * Return type for chat interactions that might involve tool calls
 */
export interface ChatInteractionResult {
  text?: string;
  toolCall?: {
    id: string; // Not used in new SDK but kept for compatibility
    name: string;
    args: any;
  };
}

/**
 * Uses Gemini Flash for quick analysis of financial data.
 */
export const analyzeFinances = async (transactions: Transaction[]): Promise<string> => {
  if (!apiKey) return "API Key belum disetting. Mohon konfigurasi VITE_API_KEY.";

  try {
    const transactionSummary = transactions.map(t => 
      `- ${t.date.split('T')[0]}: ${t.type} Rp${t.amount} (${t.category}) - ${t.description}`
    ).join('\n');

    const prompt = `
      Bertindaklah sebagai penasihat keuangan untuk siswa sekolah.
      Berikut adalah riwayat transaksi siswa ini:
      ${transactionSummary}

      Berikan analisis singkat (maksimal 3 paragraf pendek) tentang kebiasaan pengeluaran mereka.
      Berikan 2 saran praktis dan spesifik untuk membantu mereka berhemat atau menabung lebih baik.
      Gunakan bahasa yang santai, menyemangati, dan mudah dimengerti siswa.
      Jika tidak ada data, berikan tips umum menabung untuk pelajar.
    `;

    const client = getClient();
    if (!client) return "API Key belum disetting.";
    
    const model = client.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: "Kamu adalah asisten keuangan SakuPintar yang cerdas dan ramah."
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error analyzing finances:", error);
    return "Terjadi kesalahan saat menghubungi asisten AI.";
  }
};

/**
 * Parses natural language input into a structured transaction object using Gemini.
 */
export const parseTransactionWithAI = async (
  text: string, 
  categories: CategoryState
): Promise<{
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  description: string;
} | null> => {
  if (!apiKey) return null;

  try {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
      Extract transaction details from this user text: "${text}".
      
      Context:
      - Today's date is ${today}.
      - Available Income Categories: ${categories.INCOME.join(', ')}
      - Available Expense Categories: ${categories.EXPENSE.join(', ')}
      
      Instructions:
      1. Determine if it is INCOME or EXPENSE.
      2. Extract the amount (numeric value only).
      3. Map the category to one of the Available Categories. If it doesn't match exactly, pick the most semantically similar one. If unsure, use "Lainnya".
      4. Extract the date. If the user says "yesterday" or "today", calculate the correct YYYY-MM-DD based on today's date. Default to today if not specified.
      5. Extract a short description.
      
      Response Format:
      Return ONLY a raw JSON string (no markdown formatting) with this structure:
      {
        "amount": number,
        "type": "INCOME" | "EXPENSE",
        "category": "string",
        "date": "YYYY-MM-DD",
        "description": "string"
      }
    `;

    const client = getClient();
    if (!client) return null;
    
    const model = client.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const jsonText = result.response.text();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error parsing transaction with AI:", error);
    return null;
  }
};

/**
 * Batch analyzes transactions to categorize them as NEEDS or WANTS.
 */
export const analyzeNeedsWantsBatch = async (transactions: Transaction[]): Promise<NeedsWantsSummary | null> => {
  if (!apiKey) return null;

  try {
    const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');
    if (expenseTransactions.length === 0) return null;

    const summaryList = expenseTransactions.map(t => 
      `ID: ${t.id}, Item: ${t.description || t.category}, Amount: ${t.amount}, Category: ${t.category}`
    ).join('\n');

    const prompt = `
      Analyze the following list of expenses for a student/user:
      ${summaryList}

      Tasks:
      1. Classify each transaction ID as either "NEED" (Kebutuhan) or "WANT" (Keinginan).
      2. Provide a short "insight" paragraph summarizing their spending behavior based on this split. USE INDONESIAN LANGUAGE ONLY. Gaya bahasa santai untuk siswa.

      Response Format (JSON):
      {
        "breakdown": [
          {"id": "string", "verdict": "NEED" | "WANT"}
        ],
        "insight": "string (Bahasa Indonesia)"
      }
    `;

    const client = getClient();
    if (!client) return null;
    
    const model = client.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    
    // Calculate totals locally
    let needsTotal = 0;
    let wantsTotal = 0;
    const breakdownMap = new Map(parsed.breakdown.map((b: any) => [b.id, b.verdict]));

    expenseTransactions.forEach(t => {
      const verdict = breakdownMap.get(t.id);
      if (verdict === 'NEED') needsTotal += t.amount;
      else wantsTotal += t.amount;
    });

    const total = needsTotal + wantsTotal;

    return {
      needsTotal,
      wantsTotal,
      needsPercentage: total === 0 ? 0 : Math.round((needsTotal / total) * 100),
      wantsPercentage: total === 0 ? 0 : Math.round((wantsTotal / total) * 100),
      insight: parsed.insight,
      breakdown: parsed.breakdown
    };

  } catch (error) {
    console.error("Error analyzing needs vs wants:", error);
    return null;
  }
};

/**
 * Analyzes a specific potential purchase.
 */
export const analyzePurchase = async (item: string, price: number, reason: string): Promise<PurchaseAnalysis> => {
  if (!apiKey) {
    return {
      verdict: 'WANT',
      score: 0,
      reasoning: "API Key tidak ditemukan.",
      recommendation: "Gagal memuat AI.",
      alternatives: "-"
    };
  }

  try {
    const prompt = `
      Analyze this potential purchase for a student:
      Item: "${item}"
      Price: Rp ${price}
      Reason: "${reason}"

      Task:
      1. Determine if this is a "NEED" (Kebutuhan) or "WANT" (Keinginan).
      2. Assign a necessity score (0-100).
      3. Provide reasoning, recommendation, and alternatives in INDONESIAN LANGUAGE.

      Response Format (JSON):
      {
        "verdict": "NEED" | "WANT",
        "score": number,
        "reasoning": "string (Bahasa Indonesia)",
        "recommendation": "string (Bahasa Indonesia)",
        "alternatives": "string (Bahasa Indonesia)"
      }
    `;

    const client = getClient();
    if (!client) return {
      verdict: 'WANT',
      score: 0,
      reasoning: "API Key tidak ditemukan.",
      recommendation: "Gagal memuat AI.",
      alternatives: "-"
    };

    const model = client.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Error analyzing purchase:", error);
    return {
      verdict: 'WANT',
      score: 0,
      reasoning: "Gagal menganalisis. Coba lagi.",
      recommendation: "Pikirkan kembali.",
      alternatives: "-"
    };
  }
};

/**
 * Creates a chat session for the AI Advisor using Gemini 2.0 Flash.
 */
export const createChatSession = (categories: CategoryState): ChatSession | null => {
  const client = getClient();
  if (!client) return null;

  const incomeCats = categories.INCOME.join(', ');
  const expenseCats = categories.EXPENSE.join(', ');

  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ functionDeclarations: [addTransactionTool] }],
    systemInstruction: `
      Kamu adalah "SakuBot", teman chat AI di aplikasi SakuPintar.
      
      TUGAS UTAMA:
      1. Jawab pertanyaan siswa tentang keuangan dengan santai.
      2. BANTU MENCATAT TRANSAKSI. Jika user mengatakan ingin mencatat pengeluaran/pemasukan, GUNAKAN tool 'addTransaction'.
      3. Analisis Kebutuhan vs Keinginan jika diminta.
      
      KATEGORI YANG TERSEDIA:
      - Pemasukan: ${incomeCats}
      - Pengeluaran: ${expenseCats}
      
      Gunakan emoji, jadilah ramah dan memotivasi!
    `
  });

  return model.startChat({
    history: []
  });
};

/**
 * Sends a message to the chat session and handles potential tool calls.
 */
export const sendChatMessage = async (chat: ChatSession, message: string): Promise<ChatInteractionResult> => {
  try {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    
    // Check for tool calls
    const functionCalls = response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      const fc = functionCalls[0];
      return {
        text: undefined,
        toolCall: {
          id: fc.name, // New SDK uses name as ID effectively for single tool calls
          name: fc.name,
          args: fc.args
        }
      };
    }

    return { text: response.text() };
  } catch (error) {
    console.error("Chat error:", error);
    return { text: `Error: ${(error as any).message || "Unknown error"}` };
  }
};

/**
 * Sends the result of a tool execution back to the model.
 */
export const sendToolResponse = async (chat: ChatSession, toolCallId: string, functionName: string, result: any): Promise<string> => {
  try {
    const resultPayload = [
      {
        functionResponse: {
          name: functionName,
          response: { result: result }
        }
      }
    ];
    
    const response = await chat.sendMessage(resultPayload);
    return response.response.text();
  } catch (error) {
    console.error("Tool response error:", error);
    return "Berhasil disimpan, tapi saya lupa mau bilang apa.";
  }
};
