import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import Groq from "groq-sdk";
import { pipeline } from '@xenova/transformers';
import { Knowledge } from './models/Knowledge.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- MODELLERİN HAZIRLANMASI ---
// Groq istemcisi
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Yerel Embedding Extractor (Uygulama başladığında bir kez yüklenir)
let extractor;
const getExtractor = async () => {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
};

// --- MONGODB BAĞLANTISI ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("🚀 MongoDB & Vector Search Hazır!"))
  .catch(err => console.error("❌ Bağlantı Hatası:", err));

// --- CHAT ŞEMASI ---
const chatSchema = new mongoose.Schema({
  role: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
});
const Chat = mongoose.model('Chat', chatSchema);

// --- ENDPOINT: Geçmişi Getir ---
app.get('/api/history', async (req, res) => {
  try {
    const history = await Chat.find().sort({ createdAt: 1 }).limit(50);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Geçmiş yüklenemedi" });
  }
});

// --- ENDPOINT: RAG Chat (Groq & Local Embedding) ---
app.post('/api/rag-chat', async (req, res) => {
  const { question } = req.body;

  try {
    // 1. Soruyu Yerel Olarak Vektöre Çevir (Bedava)
    const generateEmbedding = await getExtractor();
    const output = await generateEmbedding(question, { pooling: 'mean', normalize: true });
    const questionVector = Array.from(output.data);

    // 2. MongoDB'de Vektör Arama Yap
    // ÖNEMLİ: Atlas panelinde numDimensions: 384 olmalı!
    const documents = await Knowledge.aggregate([
      {
        $vectorSearch: {
          index: "vector_index", 
          path: "embedding",
          queryVector: questionVector,
          numCandidates: 100,
          limit: 3
        }
      }
    ]);

    const context = documents.length > 0 
      ? documents.map(doc => doc.content).join("\n---\n")
      : "İlgili bilgi bulunamadı.";

    // 3. Groq ile Hızlı Cevap Üret (Stream)
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `Sen bilgili bir asistansın. Sadece şu döküman içeriğine göre cevap ver: \n${context}` 
        },
        { role: "user", content: question }
      ],
      model: "llama-3.3-70b-versatile", // Groq üzerindeki en güçlü modellerden biri
      stream: true,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    let fullResponse = "";

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content;
      res.write(content);
    }

    // 4. Konuşmayı Geçmişe Kaydet
    await Chat.create([
      { role: 'user', content: question },
      { role: 'assistant', content: fullResponse }
    ]);

    res.end();
  } catch (error) {
    console.error("RAG Error:", error);
    res.status(500).write("Cevap oluşturulurken bir hata oluştu.");
    res.end();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🎧 Server ${PORT} portunda yayında...`));