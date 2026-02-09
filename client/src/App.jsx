import { useState } from 'react';
import Layout from './components/Layout';
import PdfUploader from './components/PdfUploader';
import ChatComponent from './components/ChatComponent';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Dosya yüklendiğinde sohbet bileşenindeki kategori listesini yenile
  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Layout>
      <PdfUploader onUploadSuccess={handleUploadSuccess} />
      <ChatComponent refreshTrigger={refreshTrigger} />
    </Layout>
  );
}

export default App;