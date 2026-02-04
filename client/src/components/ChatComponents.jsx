import { useChat } from 'ai/react';
import { Send, User, Bot } from 'lucide-react';

const ChatComponent = () => {
  // useChat hook'u backend'deki /api/chat endpoint'i ile otomatik konuşur
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: 'http://localhost:5000/api/chat',
  // Sayfa yüklendiğinde veritabanındaki mesajları 'initialMessages' olarak veriyoruz
  initialMessages: [], 
  onResponse: () => {
    // Yanıt başladığında yapılacaklar
  }
});

// Veritabanından geçmişi çekmek için useEffect kullanabiliriz
useEffect(() => {
  fetch('http://localhost:5000/api/history')
    .then(res => res.json())
    .then(data => {
      // Bu kısım useChat'in içindeki mesajları manuel beslemek içindir
      // Not: Vercel AI SDK'da 'initialMessages' prop'u ile başlangıçta verilebilir.
    });
}, []);

  return (
    <div className="chat-container">
      {/* Mesaj Listesi */}
      <div className="messages-list">
        {messages.map((m) => (
          <div key={m.id} className={`message-wrapper ${m.role}`}>
            <div className="avatar">
              {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className="message-content">
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && <div className="loading">AI yazıyor...</div>}
      </div>

      {/* Giriş Alanı */}
      <form onSubmit={handleSubmit} className="input-form">
        <input
          value={input}
          placeholder="Bir şeyler yazın..."
          onChange={handleInputChange}
          className="chat-input"
        />
        <button type="submit" className="send-button" disabled={!input}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatComponent;