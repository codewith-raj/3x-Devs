import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Cpu, Bot } from 'lucide-react';

const INITIAL_MESSAGE = "I am Ira, the KAVACH System Assistant. How can I assist with your simulation parameters or provide details about Indian disaster management today?";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: INITIAL_MESSAGE, sender: 'bot' }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setInput('');
    setIsTyping(true);

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { text: "System Alert: To enable full AI responses, please configure your VITE_GROQ_API_KEY in the frontend .env file.", sender: 'bot' }]);
      }, 1000);
      return;
    }

    try {
      const historyContents = messages.slice(1).map(m => ({
        role: m.sender === 'bot' ? 'assistant' : 'user',
        content: m.text
      }));

      const payload = {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are Ira, the AI assistant for KAVACH (a Crisis Swarm Platform for disaster simulation in India). Your sole purpose is to provide information about KAVACH and Indian disaster management. If the user asks about anything unrelated to KAVACH or Indian disasters, politely refuse and state your specific purpose. Keep responses concise, professional, and directly relevant." },
          { role: "assistant", content: "Understood. I am Ira, the KAVACH System Assistant. I will only answer questions related to KAVACH and Indian disaster management." },
          ...historyContents,
          { role: "user", content: userMsg }
        ]
      };

      const response = await fetch('/api/groq/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error.message);
      
      const botResponse = data.choices?.[0]?.message?.content || "No response generated. Please try again.";
      
      setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: `Error: ${err.message}`, sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 right-4 sm:right-8 z-50 w-[calc(100vw-32px)] sm:w-[350px] transition-all duration-300 transform origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 pointer-events-none translate-y-8'
        }`}
      >
        <div className="bg-[#0a0f1e]/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.15)] overflow-hidden flex flex-col h-[450px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-b border-orange-500/20 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-orange-500/40 relative shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                <Cpu size={18} className="text-orange-400" />
                <div className="absolute top-0 left-0 w-full h-full rounded-full border border-orange-400/30 animate-ping opacity-20" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  Ira
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse box-content border border-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                </h3>
                <p className="text-[10px] text-orange-400/80 uppercase tracking-widest">KAVACH Assistant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/50 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-orange-500/20 scrollbar-track-transparent">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <span className="text-[9px] text-white/30 uppercase tracking-widest mb-1 px-1">
                  {msg.sender === 'user' ? 'You' : 'Agent'}
                </span>
                <div 
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-br from-red-600 to-orange-500 text-white rounded-tr-sm' 
                      : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="self-start flex flex-col max-w-[85%]">
                <span className="text-[9px] text-white/30 uppercase tracking-widest mb-1 px-1">Agent</span>
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-3 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-orange-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-orange-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-orange-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10 bg-black/20">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Initialize interaction..."
                className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 transition-colors"
                autoComplete="off"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className="absolute right-2 p-1.5 text-orange-500 hover:text-orange-400 disabled:text-white/20 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-4 sm:right-8 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen 
            ? 'bg-zinc-800 border border-white/10 shadow-lg rotate-90' 
            : 'bg-gradient-to-br from-red-600 to-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] border border-orange-400/30'
        }`}
      >
        {isOpen ? <X size={24} className="text-white" /> : <Bot size={26} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />}
        {!isOpen && (
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#05080f] rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
        )}
      </button>
    </>
  );
}
