import { useState } from 'react';

export default function PdfUploader() {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState(""); // Neuer State für die Kategorie
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    // Validierung: Datei und Kategorie dürfen nicht leer sein
    if (!file) return alert("Bitte wählen Sie eine PDF-Datei aus!");
    if (!category.trim()) return alert("Bitte geben Sie eine Kategorie (Tag) für dieses Dokument ein!");

    setLoading(true);

    // ACHTUNG: Bei Datei-Uploads wird FormData verwendet, nicht JSON.
    const formData = new FormData();
    formData.append('file', file);       // PDF-Datei
    formData.append('category', category); // Kategoriename (wird req.body.category sein)

    try {
  
      // API adresini dinamik al
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      // Fetch çağrısını yap (Dikkat: Parantez ve virgül kullanımına bak)
      const res = await fetch(`${API_URL}/api/upload-pdf`, {
        method: 'POST',
        body: formData, // Header eklemene gerek yok, tarayıcı FormData için otomatik ayarlar
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Erfolg: ${data.message}`);
        setFile(null);     // Ausgewählte Datei löschen
        setCategory("");   // Kategoriefeld leeren
      } else {
        alert(`Fehler: ${data.error}`);
      }
    } catch (err) {
      console.error("Upload-Fehler:", err);
      alert("Server nicht erreichbar!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-section" style={styles.container}>
      <h3 style={styles.title}>Neues Dokument zur KI hinzufügen</h3>
      
      <div style={styles.inputGroup}>
        <label>Kategoriename:</label>
        <input 
          type="text" 
          placeholder="Z. B.: Physik, Intern, Rezepte" 
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={styles.textInput}
        />
      </div>

      <div style={styles.inputGroup}>
        <label>PDF-Datei:</label>
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
        {loading ? "Wird verarbeitet (Vektoren werden erstellt...)" : "PDF analysieren und speichern"}
      </button>
    </div>
  );
}

// Einfache Inline-Styles (Später können Sie dies auf Tailwind oder CSS übertragen)
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