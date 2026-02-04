import mongoose from 'mongoose';

const knowledgeSchema = new mongoose.Schema({
  title: String,
  content: String, // Okunabilir metin
  embedding: [Number], // OpenAI'dan gelecek olan vektör dizisi (1536 adet sayı)
  metadata: {
    source: String,
    category: String
  }
});

export const Knowledge = mongoose.model('Knowledge', knowledgeSchema);