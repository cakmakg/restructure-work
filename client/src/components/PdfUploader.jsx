import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function PdfUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }

  const handleUpload = async () => {
    if (!file || !category.trim()) return;

    setLoading(true);
    setStatus(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/upload-pdf`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: 'Datei erfolgreich verarbeitet!' }); // TR: Dosya başarıyla işlendi!
        setFile(null);
        setCategory("");
        if (onUploadSuccess) onUploadSuccess(); // Kategori listesini yenilemek için
      } else {
        throw new Error(data.error || 'Upload fehlgeschlagen'); // TR: Yükleme başarısız
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-1 h-fit">
      <div className="flex items-center space-x-2 mb-6">
        <UploadCloud className="text-primary h-6 w-6" />
        <h3 className="text-lg font-semibold text-gray-800">Neues Wissen hinzufügen</h3> {/* TR: Yeni Bilgi Ekle */}
      </div>

      <div className="space-y-4">
        {/* Kategori Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie / Tag</label> {/* TR: Kategori / Etiket */}
          <input
            type="text"
            placeholder="z. B. Recht, Physik..." // TR: Örn: Hukuk, Fizik...
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
          />
        </div>

        {/* Dosya Input (Görselleştirilmiş) */}
        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center pointer-events-none">
            {file ? (
              <>
                <FileText className="h-8 w-8 text-secondary mb-2" />
                <span className="text-sm font-medium text-gray-900 truncate max-w-full">{file.name}</span>
                <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Hier klicken oder PDF hineinziehen</span> {/* TR: PDF seçmek için tıklayın veya sürükleyin */}
              </>
            )}
          </div>
        </div>

        {/* Durum Mesajları */}
        {status && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {status.message}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading || !file || !category}
          className={`w-full py-2.5 rounded-lg text-white font-medium flex justify-center items-center gap-2 transition-all shadow-md
            ${loading || !file || !category 
              ? 'bg-gray-300 cursor-not-allowed shadow-none' 
              : 'bg-primary hover:bg-indigo-700 active:scale-95'}`}
        >
          {loading ? (
            <><Loader2 className="animate-spin h-5 w-5" /> Wird verarbeitet...</> // TR: İşleniyor...
          ) : (
            'Hochladen & Analysieren' // TR: Buluta Yükle & Analiz Et
          )}
        </button>
      </div>
    </div>
  );
}