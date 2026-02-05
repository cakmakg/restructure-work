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

// --- MODELLERİN HAZIRLANMASI ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

const upload = multer({ storage: multer.memoryStorage() });

// --- ENDPOINT: PDF YÜKLEME (Kategorili) ---
app.post('/api/upload-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("Dosya yüklenmedi.");
    const { category } = req.body;

    const data = await pdf(req.file.buffer); 
    
    const fullText = data.text;
    if (!fullText || fullText.trim().length === 0) {
      return res.status(400).json({ error: "PDF içeriği boş." });
    }

    const cleanText = fullText.replace(/\s+/g, ' ').trim();

    // Chunking
    const chunks = [];
    let currentPos = 0;
    while (currentPos < cleanText.length) {
      chunks.push(cleanText.slice(currentPos, currentPos + 500));
      currentPos += 450; 
    }

    const generateEmbedding = await getExtractor();
    console.log(`⏳ ${chunks.length} parça "${category}" kategorisi için işleniyor...`);

    const docsToSave = [];
    for (const chunk of chunks) {
      const output = await generateEmbedding(chunk, { pooling: 'mean', normalize: true });
      
      docsToSave.push({
        title: req.file.originalname,
        content: chunk,
        embedding: Array.from(output.data),
        metadata: { 
          source: 'user-upload', 
          category: category || 'genel',
          uploadedAt: new Date() 
        }
      });
    }

    await Knowledge.insertMany(docsToSave);
    res.json({ message: `Döküman ${category} kategorisine eklendi!` });

  } catch (error) {
    console.error("Yükleme Hatası:", error);
    res.status(500).json({ error: "PDF işlenirken bir hata oluştu." });
  }
});

// --- ENDPOINT: RAG CHAT (useChat v5 uyumlu) ---
app.post('/api/rag-chat', async (req, res) => {
  console.log("📨 /api/rag-chat endpoint'e istek geldi");
  console.log("📦 Request body:", JSON.stringify(req.body, null, 2));

  try {
    // useChat v5, mesajları 'messages' array'i içinde gönderir
    const { messages, category } = req.body;
    
    console.log("📋 Messages:", messages);
    console.log("📂 Category:", category);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error("❌ Geçersiz mesaj formatı");
      return res.status(400).json({ error: "Mesaj bulunamadı" });
    }

    // Son mesajı al (kullanıcının sorusu)
    const lastMessage = messages[messages.length - 1];
    const question = lastMessage.content;
    
    console.log("❓ Soru:", question);

    if (!question) {
      return res.status(400).json({ error: "Soru bulunamadı." });
    }

    // 2. Soruyu Vektöre Çevir
    console.log("🔄 Embedding oluşturuluyor...");
    const generateEmbedding = await getExtractor();
    const output = await generateEmbedding(question, { pooling: 'mean', normalize: true });
    const questionVector = Array.from(output.data);
    console.log("✅ Embedding oluşturuldu");

    // 3. MongoDB Vektör Araması
    const searchPipeline = {
      index: "default",
      path: "embedding",
      queryVector: questionVector,
      numCandidates: 100,
      limit: 3,
    };

    if (category && category !== "Genel" && category !== "Tümü") {
      searchPipeline.filter = {
        "metadata.category": { $eq: category }
      };
      console.log("🔍 Filtreleme aktif:", category);
    }
    console.log(`🕵️‍♂️ DEDEKTİF MODU: "${category}" kategorisi kontrol ediliyor...`);
    
    // 1. Standart MongoDB Araması (Vektörsüz)
    const count = await Knowledge.countDocuments({ "metadata.category": category });
    console.log(`📊 Veritabanında "${category}" etiketli kaç belge var?: ${count}`);
    
    // 2. Örnek bir veri görelim (Varsa)
    if (count > 0) {
      const sample = await Knowledge.findOne({ "metadata.category": category }).select('metadata');
      console.log("🧬 Örnek Veri Metadata:", JSON.stringify(sample.metadata, null, 2));
    } else {
      console.log("⚠️ UYARI: Bu kategoride hiç veri yok! Filtreleme bu yüzden 0 dönüyor.");
    }

    console.log("🔎 Vektör araması yapılıyor...");
    const documents = await Knowledge.aggregate([
      { $vectorSearch: searchPipeline }
    ]);

    const context = documents.length > 0 
      ? documents.map(doc => doc.content).join("\n---\n")
      : "Bu konuyla ilgili veritabanında bilgi bulunamadı.";

    console.log(`📚 Kategori: ${category || 'Genel'} | Bulunan Parça: ${documents.length}`);

    // 4. Groq'a Gönder (Streaming)
    console.log("🤖 Groq'a istek gönderiliyor...");
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `Sen yardımsever bir asistansın. Aşağıdaki bilgilere dayanarak cevap ver:\n\nBİLGİLER:\n${context}` 
        },
        { role: "user", content: question }
      ],
      model: "llama-3.3-70b-versatile",
      stream: true,
    });

    // text/plain stream olarak gönder
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
        console.log(`📤 Chunk ${chunkCount} gönderildi`);
      }
    }

    console.log(`✅ Stream tamamlandı. Toplam ${chunkCount} chunk gönderildi`);

    // Veritabanına kaydet
    await Chat.create([
      { role: 'user', content: question },
      { role: 'assistant', content: fullResponse }
    ]);
    console.log("💾 Mesajlar veritabanına kaydedildi");

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
app.listen(PORT, () => console.log(`🎧 Server ${PORT} portunda yayında...`));