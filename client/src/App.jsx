import ChatComponent from './components/ChatComponents';
import PdfUploader from './components/PdfUploader'; // Yeni ekledik
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>MERN AI Knowledge Base</h1>
        <p>PDF Yükle ve Özel Asistanınla Sohbet Et</p>
      </header>
      
      <main>
        {/* PDF Yükleme Alanı */}
        <PdfUploader /> 
        
        {/* Sohbet Alanı */}
        <ChatComponent />
      </main>
    </div>
  );
}

export default App;