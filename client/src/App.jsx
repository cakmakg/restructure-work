import ChatComponents from './components/ChatComponents';
import './App.css'; // Stil dosyanı buraya ekleyebilirsin

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>MERN AI Assistant</h1>
        <p>GPT-4o & Node.js ile güçlendirildi</p>
      </header>
      
      <main>
        <ChatComponents />
      </main>
    </div>
  );
}

export default App;