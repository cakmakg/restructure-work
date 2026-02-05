import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import Groq from "groq-sdk";
import { pipeline } from '@xenova/transformers';
import multer from 'multer';
import pdf from 'pdf-parse-fork';
import { Knowledge } from './models/Knowledge.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- VORBEREITUNG DER MODELLE ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let extractor;
const getExtractor = async () => {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
};

// --- MONGODB VERBINDUNG ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("🚀 MongoDB & Vektorsuche bereit!"))
  .catch(err => console.error("❌ Verbindungsfehler:", err));

// --- CHAT SCHEMA ---
const chatSchema = new mongoose.Schema({
  role: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
});
const Chat = mongoose.model('Chat', chatSchema);

// --- ENDPOINT: Verlauf abrufen ---
app.get('/api/history', async (req, res) => {
  try {
    const history = await Chat.find().sort({ createdAt: 1 }).limit(50);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Verlauf konnte nicht geladen werden" });
  }
});

const upload = multer({ storage: multer.memoryStorage() });

// --- ENDPOINT: PDF UPLOAD (Mit Kategorie) ---
app.post('/api/upload-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("Keine Datei hochgeladen.");
    const { category } = req.body;

    const data = await pdf(req.file.buffer); 
    
    const fullText = data.text;
    if (!fullText || fullText.trim().length === 0) {
      return res.status(400).json({ error: "PDF-Inhalt ist leer." });
    }

    const cleanText = fullText.replace(/\s+/g, ' ').trim();

    // Chunking (Aufteilung in Abschnitte)
    const chunks = [];
    let currentPos = 0;
    while (currentPos < cleanText.length) {
      chunks.push(cleanText.slice(currentPos, currentPos + 500));
      currentPos += 450; 
    }

    const generateEmbedding = await getExtractor();
    console.log(`⏳ ${chunks.length} Abschnitte werden für Kategorie "${category}" verarbeitet...`);

    const docsToSave = [];
    for (const chunk of chunks) {
      const output = await generateEmbedding(chunk, { pooling: 'mean', normalize: true });
      
      docsToSave.push({
        title: req.file.originalname,
        content: chunk,
        embedding: Array.from(output.data),
        metadata: { 
          source: 'user-upload', 
          // Hier ändern wir 'genel' zu 'allgemein', passend zum Frontend
          category: category || 'allgemein', 
          uploadedAt: new Date() 
        }
      });
    }

    await Knowledge.insertMany(docsToSave);
    res.json({ message: `Dokument zur Kategorie ${category} hinzugefügt!` });

  } catch (error) {
    console.error("Upload-Fehler:", error);
    res.status(500).json({ error: "Fehler bei der PDF-Verarbeitung." });
  }
});

// --- ENDPOINT: RAG CHAT (useChat v5 kompatibel) ---
app.post('/api/rag-chat', async (req, res) => {
  console.log("📨 Anfrage an /api/rag-chat Endpoint erhalten");
  // console.log("📦 Request body:", JSON.stringify(req.body, null, 2));

  try {
    // useChat v5 sendet Nachrichten im 'messages'-Array
    const { messages, category } = req.body;
    
    // console.log("📋 Messages:", messages);
    console.log("📂 Kategorie:", category);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error("❌ Ungültiges Nachrichtenformat");
      return res.status(400).json({ error: "Keine Nachricht gefunden" });
    }

    // Letzte Nachricht abrufen (Frage des Benutzers)
    const lastMessage = messages[messages.length - 1];
    const question = lastMessage.content;
    
    console.log("❓ Frage:", question);

    if (!question) {
      return res.status(400).json({ error: "Frage nicht gefunden." });
    }

    // 2. Frage in Vektor umwandeln
    console.log("🔄 Embedding wird erstellt...");
    const generateEmbedding = await getExtractor();
    const output = await generateEmbedding(question, { pooling: 'mean', normalize: true });
    const questionVector = Array.from(output.data);
    console.log("✅ Embedding erstellt");

    // 3. MongoDB Vektorsuche
    const searchPipeline = {
      index: "default",
      path: "embedding",
      queryVector: questionVector,
      numCandidates: 100,
      limit: 3,
    };

    // Filter-Logik anpassen ("Genel" -> "Allgemein")
    if (category && category !== "Allgemein" && category !== "Alle") {
      searchPipeline.filter = {
        "metadata.category": { $eq: category }
      };
      console.log("🔍 Filterung aktiv:", category);
    }
    console.log(`🕵️‍♂️ DETEKTIV-MODUS: Kategorie "${category}" wird überprüft...`);
    
    // 1. Standard MongoDB Suche (ohne Vektoren)
    const count = await Knowledge.countDocuments({ "metadata.category": category });
    console.log(`📊 Wie viele Dokumente gibt es mit dem Tag "${category}"?: ${count}`);
    
    // 2. Beispieldaten anzeigen (falls vorhanden)
    if (count > 0) {
      const sample = await Knowledge.findOne({ "metadata.category": category }).select('metadata');
      console.log("🧬 Beispiel-Metadaten:", JSON.stringify(sample.metadata, null, 2));
    } else {
      console.log("⚠️ WARNUNG: Keine Daten in dieser Kategorie! Filterung gibt daher 0 zurück.");
    }

    console.log("🔎 Vektorsuche wird durchgeführt...");
    const documents = await Knowledge.aggregate([
      { $vectorSearch: searchPipeline }
    ]);

    const context = documents.length > 0 
      ? documents.map(doc => doc.content).join("\n---\n")
      : "Zu diesem Thema wurden keine Informationen in der Datenbank gefunden.";

    console.log(`📚 Kategorie: ${category || 'Allgemein'} | Gefundene Teile: ${documents.length}`);

    // 4. An Groq senden (Streaming)
    console.log("🤖 Anfrage an Groq wird gesendet...");
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          // System Prompt auf Deutsch übersetzt
          content: `Du bist ein hilfreicher Assistent. Antworte basierend auf den folgenden Informationen:\n\nINFORMATIONEN:\n${context}` 
        },
        { role: "user", content: question }
      ],
      model: "llama-3.3-70b-versatile",
      stream: true,
    });

    // text/plain Stream senden
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = "";
    let chunkCount = 0;

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        chunkCount++;
        res.write(content);
        console.log(`📤 Chunk ${chunkCount} gesendet`);
      }
    }

    console.log(`✅ Stream beendet. Insgesamt ${chunkCount} Chunks gesendet`);

    // In Datenbank speichern
    await Chat.create([
      { role: 'user', content: question },
      { role: 'assistant', content: fullResponse }
    ]);
    console.log("💾 Nachrichten in Datenbank gespeichert");

    res.end();
    
  } catch (error) {
    console.error("❌ RAG Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else if (!res.writableEnded) {
      res.end();
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🎧 Server läuft auf Port ${PORT}...`));