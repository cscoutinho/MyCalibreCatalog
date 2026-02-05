import React, { useState, useEffect, useRef } from 'react';
import { Book } from '../types';
import { generateLibrarianResponse, ChatMessage } from '../services/geminiService';
import { Send, Sparkles, Bot, User } from 'lucide-react';

interface AILibrarianProps {
  books: Book[];
}

export const AILibrarian: React.FC<AILibrarianProps> = ({ books }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Greetings. I am your AI Librarian. I see you have ${books.length.toLocaleString()} volumes in your collection. How may I assist you today?` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await generateLibrarianResponse(input, books, messages);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Apologies, an error occurred while processing your request." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="flex-1 bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="font-bold text-gray-100">Librarian Assistant</h2>
            <p className="text-xs text-gray-400">Powered by Gemini 3</p>
          </div>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center shrink-0
                ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}
              `}>
                {msg.role === 'user' ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
              </div>
              
              <div className={`
                max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg
                ${msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-gray-700 text-gray-100 rounded-tl-none border border-gray-600'}
              `}>
                {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          
          {loading && (
             <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                    <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="bg-gray-700 text-gray-400 rounded-2xl rounded-tl-none p-4 border border-gray-600 flex items-center gap-2">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce delay-100">●</span>
                    <span className="animate-bounce delay-200">●</span>
                </div>
             </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for a recommendation or analyze your library..."
              className="w-full bg-gray-900 text-white rounded-xl border border-gray-700 p-4 pr-12 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none h-[60px] custom-scrollbar"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-3 top-3 p-2 text-purple-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            The Librarian sees a random sample of your books for context. Specific queries might need full search.
          </p>
        </div>
      </div>
    </div>
  );
};
