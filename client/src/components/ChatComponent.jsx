import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, RefreshCw, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Opsiyonel: Markdown desteği için

export default function ChatComponent({ refreshTrigger }) {
  const [activeCategory, setActiveCategory] = useState("Allgemein");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hallo! Wie kann ich Ihnen helfen?' } // TR: Merhaba! Hangi konuda yardımcı olabilirim?
  ]);
  const messagesEndRef = useRef(null);

  // Kategori Listesini Çekme
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/categories`);
        if (res.ok) {
          const data = await res.json();
          const unique = Array.from(new Set(["Allgemein", ...data]));
          setCategories(unique);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Kategorien:", err); // TR: Kategoriler yüklenirken hata
      }
    };
    fetchCategories();
  }, [refreshTrigger]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    const currentCategory = activeCategory;
    setInput("");
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/rag-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentInput,
          category: currentCategory,
          messages: [...messages, userMessage]
        })
      });

      if (!response.ok) throw new Error("API-Fehler"); // TR: API Hatası

      // Stream Başlat
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiResponseText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        
        if (chunkValue) {
          aiResponseText += chunkValue;
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === 'assistant') {
              lastMsg.content = aiResponseText;
            }
            return newMessages;
          });
        }
      }

    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Entschuldigung, ein Verbindungsfehler ist aufgetreten." }]); // TR: Bağlantı hatası mesajı
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 lg:col-span-2 flex flex-col h-[600px] overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-2 text-primary font-semibold">
           <MessageSquare size={20} />
           <span>Assistent</span> {/* TR: Asistan */}
        </div>
        
        {/* Kategori Seçimi */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Thema:</span> {/* TR: Konu */}
            <select 
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="text-sm text-gray-700 bg-transparent font-medium focus:outline-none cursor-pointer"
            >
                {categories.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((m, index) => (
          <div key={index} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] md:max-w-[75%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 
                    ${m.role === 'user' ? 'bg-primary text-white' : 'bg-secondary text-white'}`}>
                    {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${m.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'}`}>
                     {m.content || (
                        // Boş içerik varsa loading göster
                        <div className="loader-dots block relative w-20 h-5 mt-2">
                            <div className="absolute top-0 w-3 h-3 rounded-full bg-current opacity-75"></div>
                            <div className="absolute top-0 w-3 h-3 rounded-full bg-current opacity-75"></div>
                            <div className="absolute top-0 w-3 h-3 rounded-full bg-current opacity-75"></div>
                            <div className="absolute top-0 w-3 h-3 rounded-full bg-current opacity-75"></div>
                        </div>
                     )}
                </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSendMessage} className="flex gap-3 items-center bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-inner">
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Stellen Sie eine Frage..." 
                className="flex-1 bg-transparent px-4 py-2 outline-none text-gray-700 placeholder-gray-400"
                disabled={isLoading}
            />
            <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="p-3 rounded-lg bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors shadow-sm"
            >
                {isLoading ? <RefreshCw className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
            </button>
        </form>
      </div>
    </div>
  );
}