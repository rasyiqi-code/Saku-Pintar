import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Lightbulb, Loader2, X } from 'lucide-react';
import { ChatMessage, CategoryState, Transaction } from '../types';
import { createChatSession, sendChatMessage, sendToolResponse } from '../services/geminiService';
import { Chat } from '@google/genai';

interface ChatbotProps {
  onAddTransaction: (t: Transaction) => void;
  categories: CategoryState;
  onClose: () => void;
}

const EXAMPLE_PROMPTS = [
  "Catat pengeluaran 15rb beli bakso",
  "Dikasih uang saku 50rb hari ini",
  "Tips nabung 20rb/hari",
  "Beda butuh vs ingin?"
];

const Chatbot: React.FC<ChatbotProps> = ({ onAddTransaction, categories, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Halo! Aku SakuBot 🤖. Mau curhat keuangan atau catat transaksi? Bilang aja!',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingTool, setIsProcessingTool] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session once with categories
    if (!chatSessionRef.current) {
      chatSessionRef.current = createChatSession(categories);
    }
  }, [categories]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !chatSessionRef.current || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await sendChatMessage(chatSessionRef.current, userMsg.text);

      // Handle Function Call (Tool)
      if (result.toolCall && result.toolCall.name === 'addTransaction') {
        setIsProcessingTool(true);
        const args = result.toolCall.args;
        
        // Execute Action
        const newTransaction: Transaction = {
          id: crypto.randomUUID(),
          type: args.type as 'INCOME' | 'EXPENSE',
          amount: Number(args.amount),
          category: args.category as string,
          description: args.description as string || '',
          date: args.date ? new Date(args.date).toISOString() : new Date().toISOString()
        };

        // Save to DB via App handler
        onAddTransaction(newTransaction);

        // Send confirmation back to AI
        const finalResponseText = await sendToolResponse(
          chatSessionRef.current, 
          result.toolCall.id, 
          'addTransaction', 
          { status: "Success", message: "Transaction saved successfully." }
        );

        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'model',
          text: finalResponseText,
          timestamp: Date.now()
        }]);

        setIsProcessingTool(false);
      } else {
        // Standard Text Response
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'model',
          text: result.text || "Maaf, ada kesalahan.",
          timestamp: Date.now()
        }]);
      }

    } catch (error) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        text: "Maaf, aku lagi pusing. Coba lagi nanti ya.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full bg-white sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
      <div className="p-4 bg-indigo-600 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-2 rounded-full">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">SakuBot AI</h3>
            <p className="text-xs text-indigo-200 flex items-center gap-1">
              <Sparkles size={10} /> Powered by Gemini Pro
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-indigo-100 text-indigo-600'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-slate-800 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <Bot size={16} className="text-indigo-600" />
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex items-center gap-2">
              {isProcessingTool ? (
                <>
                  <Loader2 size={14} className="animate-spin text-emerald-500" />
                  <span className="text-xs text-slate-500">Mencatat transaksi...</span>
                </>
              ) : (
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Onboarding Suggestions */}
        {messages.length === 1 && (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 animate-fade-in">
             <div className="col-span-full flex items-center gap-2 text-slate-400 text-xs font-medium mb-1 pl-1">
               <Lightbulb size={12} /> Coba tanya ini:
             </div>
             {EXAMPLE_PROMPTS.map((prompt, idx) => (
               <button
                 key={idx}
                 onClick={() => sendMessage(prompt)}
                 className="text-left p-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
               >
                 {prompt}
               </button>
             ))}
           </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 bg-slate-100 text-slate-800 placeholder-slate-400 border-none rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;