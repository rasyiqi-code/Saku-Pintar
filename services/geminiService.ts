import { GoogleGenAI, Chat, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { Transaction, ChatMessage, CategoryState, TransactionType, NeedsWantsSummary, PurchaseAnalysis } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Tool Definitions ---

const addTransactionTool: FunctionDeclaration = {
  name: "addTransaction",
  description: "Catat transaksi keuangan (pemasukan atau pengeluaran) ke dalam aplikasi.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: { 
        type: Type.STRING, 
        enum: ["INCOME", "EXPENSE"], 
        description: "Tipe transaksi. INCOME untuk pemasukan, EXPENSE untuk pengeluaran." 
      },
      amount: { 
        type: Type.NUMBER, 
        description: "Jumlah uang dalam Rupiah (angka saja)." 
      },
      category: { 
        type: Type.STRING, 
        description: "Kategori transaksi. Pilih yang paling sesuai dari daftar yang tersedia." 
      },
      description: { 
        type: Type.STRING, 
        description: "Keterangan singkat transaksi." 
      },
      date: { 
        type: Type.STRING, 
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
    id: string;
    name: string;
    args: any;
  };
}

/**
 * Uses Gemini Flash for quick analysis of financial data.
 */
export const analyzeFinances = async (transactions: Transaction[]): Promise<string> => {
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Kamu adalah asisten keuangan SakuPintar yang cerdas dan ramah."
      }
    });

    return response.text || "Maaf, saya tidak bisa menganalisis data saat ini.";
  } catch (error) {
    console.error("Error analyzing finances:", error);
    return "Terjadi kesalahan saat menghubungi asisten AI. Pastikan API Key valid.";
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;

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
         - NEEDS: Essentials like Food (regular), Transport, School supplies, Zakat/Infaq.
         - WANTS: Entertainment, Games, Expensive snacks, Impulse buys.
      2. Provide a short "insight" paragraph summarizing their spending behavior based on this split.

      Response Format (JSON):
      {
        "breakdown": [
          {"id": "string", "verdict": "NEED" | "WANT"}
        ],
        "insight": "string"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;

    const result = JSON.parse(jsonText);
    
    // Calculate totals locally to ensure accuracy
    let needsTotal = 0;
    let wantsTotal = 0;
    const breakdownMap = new Map(result.breakdown.map((b: any) => [b.id, b.verdict]));

    expenseTransactions.forEach(t => {
      const verdict = breakdownMap.get(t.id);
      if (verdict === 'NEED') needsTotal += t.amount;
      else wantsTotal += t.amount; // Default to WANT if undefined
    });

    const total = needsTotal + wantsTotal;

    return {
      needsTotal,
      wantsTotal,
      needsPercentage: total === 0 ? 0 : Math.round((needsTotal / total) * 100),
      wantsPercentage: total === 0 ? 0 : Math.round((wantsTotal / total) * 100),
      insight: result.insight,
      breakdown: result.breakdown
    };

  } catch (error) {
    console.error("Error analyzing needs vs wants:", error);
    return null;
  }
};

/**
 * Analyzes a specific potential purchase to determine if it is a Need or Want.
 */
export const analyzePurchase = async (item: string, price: number, reason: string): Promise<PurchaseAnalysis> => {
  try {
    const prompt = `
      Analyze this potential purchase for a student:
      Item: "${item}"
      Price: Rp ${price}
      Reason: "${reason}"

      Task:
      1. Determine if this is a "NEED" (Kebutuhan) or "WANT" (Keinginan).
      2. Assign a necessity score (0-100).
      3. Provide reasoning, recommendation, and alternatives.

      Response Format (JSON):
      {
        "verdict": "NEED" | "WANT",
        "score": number,
        "reasoning": "string",
        "recommendation": "string",
        "alternatives": "string"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response");

    return JSON.parse(jsonText);
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
 * Creates a chat session for the AI Advisor using Gemini Pro.
 */
export const createChatSession = (categories: CategoryState): Chat => {
  const incomeCats = categories.INCOME.join(', ');
  const expenseCats = categories.EXPENSE.join(', ');

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
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
        
        PRINSIP CSIZ (Kejar target ini):
        - Konsumsi (C) <= 65%
        - Tabungan (S) >= 10% (Kategori: Tabungan)
        - Investasi (I) >= 20% (Kategori: Investasi)
        - ZIS (Z) >= 5% (Kategori: Zakat/Infaq/Sedekah)
        
        Gunakan emoji, jadilah ramah dan memotivasi!
      `,
    },
  });
};

/**
 * Sends a message to the chat session and handles potential tool calls.
 */
export const sendChatMessage = async (chat: Chat, message: string): Promise<ChatInteractionResult> => {
  try {
    const result: GenerateContentResponse = await chat.sendMessage({ message });
    
    // Check for tool calls
    if (result.functionCalls && result.functionCalls.length > 0) {
      const fc = result.functionCalls[0];
      return {
        text: undefined, // Model usually doesn't output text when calling a tool
        toolCall: {
          id: fc.id,
          name: fc.name,
          args: fc.args
        }
      };
    }

    return { text: result.text || "Maaf, saya tidak mengerti." };
  } catch (error) {
    console.error("Chat error:", error);
    return { text: "Waduh, koneksi ke otak AI terputus sebentar. Coba lagi ya!" };
  }
};

/**
 * Sends the result of a tool execution back to the model.
 */
export const sendToolResponse = async (chat: Chat, toolCallId: string, functionName: string, result: any): Promise<string> => {
  try {
    const response = await chat.sendMessage({
      toolResponse: {
        functionResponses: [{
          id: toolCallId,
          name: functionName,
          response: { result: result }
        }]
      }
    });
    return response.text || "Oke!";
  } catch (error) {
    console.error("Tool response error:", error);
    return "Berhasil disimpan, tapi saya lupa mau bilang apa.";
  }
};