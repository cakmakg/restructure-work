import { useState } from 'react';

export default function PdfUploader() {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState(""); // Kategori için yeni state
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    // Validasyon: Dosya ve kategori boş olmamalı
    if (!file) return alert("Lütfen bir PDF dosyası seçin!");
    if (!category.trim()) return alert("Lütfen bu döküman için bir kategori (etiket) girin!");

    setLoading(true);

    // DİKKAT: Dosya yüklemelerinde JSON değil, FormData kullanılır.
    const formData = new FormData();
    formData.append('file', file);       // PDF dosyası
    formData.append('category', category); // Kategori ismi (req.body.category olacak)

    try {
      const res = await fetch('http://localhost:5000/api/upload-pdf', {
        method: 'POST',
        body: formData, // Header eklemene gerek yok, tarayıcı FormData için otomatik ayarlar
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Başarılı: ${data.message}`);
        setFile(null);     // Seçilen dosyayı temizle
        setCategory("");   // Kategori kutusunu temizle
      } else {
        alert(`Hata: ${data.error}`);
      }
    } catch (err) {
      console.error("Yükleme hatası:", err);
      alert("Sunucuya ulaşılamadı!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-section" style={styles.container}>
      <h3 style={styles.title}>Zekaya Yeni Döküman Ekle</h3>
      
      <div style={styles.inputGroup}>
        <label>Kategori Adı:</label>
        <input 
          type="text" 
          placeholder="Örn: Fizik, Şirket-İçi, Yemek-Tarifleri" 
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={styles.textInput}
        />
      </div>

      <div style={styles.inputGroup}>
        <label>PDF Dosyası:</label>
        <input 
          type="file" 
          accept=".pdf" 
          onChange={(e) => setFile(e.target.files[0])} 
          style={styles.fileInput}
        />
      </div>
      
      <button 
        onClick={handleUpload} 
        disabled={loading || !file || !category}
        style={{
          ...styles.button,
          backgroundColor: (loading || !file || !category) ? '#ccc' : '#28a745'
        }}
      >
        {loading ? "İşleniyor (Vektörler Oluşturuluyor...)" : "PDF'i Analiz Et ve Kaydet"}
      </button>
    </div>
  );
}

// Basit inline stiller (Daha sonra Tailwind veya CSS'e taşıyabilirsin)
const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f4f7f6',
    borderRadius: '10px',
    marginBottom: '30px',
    border: '1px solid #e0e0e0'
  },
  title: {
    marginTop: 0,
    fontSize: '18px',
    color: '#333'
  },
  inputGroup: {
    marginBottom: '15px'
  },
  textInput: {
    width: '100%',
    padding: '10px',
    marginTop: '5px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    boxSizing: 'border-box'
  },
  fileInput: {
    marginTop: '5px',
    display: 'block'
  },
  button: {
    width: '100%',
    color: 'white',
    padding: '12px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background 0.3s'
  }
};