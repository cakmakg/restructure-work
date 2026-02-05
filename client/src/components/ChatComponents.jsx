import { useState, useRef } from 'react';
import { Send, User, Bot, Settings, RefreshCw } from 'lucide-react';

const ChatComponent = () => {
  // --- STATE-MANAGEMENT ---
  // Varsayılan kategoriyi 'Allgemein' (Genel) yaptık.
  const [activeCategory, setActiveCategory] = useState("Allgemein"); 
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Wir speichern die Nachrichten selbst
  const [messages, setMessages] = useState([]);

  // Referenz für das automatische Scrollen
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- NACHRICHTEN-SENDE-FUNKTION ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // 1. Benutzernachricht auf dem Bildschirm anzeigen
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input; // Eingabe speichern
    const currentCategory = activeCategory;
    setInput(""); // Eingabefeld leeren
    setIsLoading(true);

    try {
      // API adresini ortam değişkeninden al, yoksa localhost kullan
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      // 2. Anfrage an das Backend senden (manueller Fetch)
      const response = await fetch(`${API_URL}/api/rag-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentInput,
          category: currentCategory,
          messages: [...messages, userMessage] // Verlauf ebenfalls senden
        })
      });

      if (!response.ok) throw new Error("Serverfehler");

      // 3. Vorbereitung zum Lesen des Streams
      // Leere KI-Nachricht hinzufügen, wenn die Antwort beginnt
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
          
          // Die zuletzt hinzugefügte KI-Nachricht aktualisieren
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === 'assistant') {
              lastMsg.content = aiResponseText;
            }
            return newMessages;
          });
          scrollToBottom();
        }
      }

    } catch (err) {
      console.error("Fehler:", err);
      alert("Ein Fehler ist aufgetreten: " + err.message);
      // Im Fehlerfall können wir einen Fehlerhinweis zur KI-Nachricht hinzufügen
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Ein Fehler ist aufgetreten, bitte versuchen Sie es erneut." }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  return (
    <div className="chat-container" style={styles.container}>
      
      {/* --- HEADER --- */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={18} color="#666" />
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
            Kategorie:
          </span>
        </div>
        <input 
          type="text" 
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          placeholder="Z. B.: Test-1"
          style={styles.categoryInput}
        />
      </div>

      {/* --- NACHRICHTENLISTE --- */}
      <div className="messages-list" style={styles.messageList}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
            <p>Stellen Sie Fragen zu Dokumenten in der Kategorie "{activeCategory}".</p>
          </div>
        )}

        {messages.map((m, index) => (
          <div key={index} className={`message-wrapper ${m.role}`} style={m.role === 'user' ? styles.userMsg : styles.aiMsg}>
            <div className="avatar" style={{ marginTop: '4px' }}>
              {m.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div style={{ lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {m.content}
            </div>
          </div>
        ))}
        
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div style={{ padding: 10, fontStyle: 'italic', color: '#666', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <RefreshCw size={14} className="spin" /> KI denkt nach...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* --- EINGABEFORMULAR --- */}
      <form onSubmit={handleSendMessage} style={styles.form}>
        <input
          value={input}
          placeholder="Stellen Sie eine Frage..."
          onChange={(e) => setInput(e.target.value)} 
          className="chat-input"
          style={styles.input}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={!input || isLoading} 
          style={{
            ...styles.button,
            opacity: (!input || isLoading) ? 0.6 : 1,
            cursor: (!input || isLoading) ? 'not-allowed' : 'pointer'
          }}
        >
          <Send size={20} />
        </button>
      </form>
      
      {/* Einfache CSS-Animation (Optional) */}
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// --- STYLES ---
const styles = {
  container: { 
    display: 'flex', 
    flexDirection: 'column', 
    height: '600px', 
    border: '1px solid #e0e0e0', 
    borderRadius: '12px', 
    marginTop: 20, 
    backgroundColor: '#fff', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
  },
  header: { 
    padding: '15px', 
    borderBottom: '1px solid #eee', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    background: '#f8f9fa', 
    borderRadius: '12px 12px 0 0' 
  },
  categoryInput: { 
    padding: '6px 12px', 
    width: '140px', 
    borderRadius: '6px', 
    border: '1px solid #ccc',
    fontSize: '14px'
  },
  messageList: { 
    flex: 1, 
    overflowY: 'auto', 
    padding: '20px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '15px' 
  },
  userMsg: { 
    alignSelf: 'flex-end', 
    background: '#007bff', 
    color: 'white', 
    padding: '12px 16px', 
    borderRadius: '18px 18px 4px 18px', 
    maxWidth: '80%', 
    display: 'flex', 
    gap: '10px' 
  },
  aiMsg: { 
    alignSelf: 'flex-start', 
    background: '#f1f1f1', 
    color: '#333', 
    padding: '12px 16px', 
    borderRadius: '18px 18px 18px 4px', 
    maxWidth: '80%', 
    display: 'flex', 
    gap: '10px' 
  },
  form: { 
    display: 'flex', 
    padding: '15px', 
    borderTop: '1px solid #eee', 
    background: '#fff', 
    borderRadius: '0 0 12px 12px' 
  },
  input: { 
    flex: 1, 
    padding: '12px 16px', 
    borderRadius: '24px', 
    border: '1px solid #ddd', 
    marginRight: '12px', 
    outline: 'none', 
    fontSize: '15px' 
  },
  button: { 
    background: '#28a745', 
    color: 'white', 
    border: 'none', 
    borderRadius: '50%', 
    width: '48px', 
    height: '48px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    transition: 'all 0.2s'
  }
};

export default ChatComponent;