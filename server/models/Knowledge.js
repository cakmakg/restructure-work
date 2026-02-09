import mongoose from 'mongoose';

const knowledgeSchema = new mongoose.Schema({
  title: String,
  content: String,
  embedding: [Number],
  metadata: {
    source: String,
    category: String, // <--- BURASI KRİTİK: 'proje1', 'kullanici_A' gibi değerler tutacak
    s3Key: String,
    uploadedAt: Date
  }
});

export const Knowledge = mongoose.model('Knowledge', knowledgeSchema);