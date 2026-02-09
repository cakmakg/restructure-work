import mongoose from 'mongoose';
import { pipeline } from '@xenova/transformers';
import dotenv from 'dotenv';
import { Knowledge } from '../models/Knowledge.js';

dotenv.config();
mongoose.connect(process.env.MONGODB_URI);

const dataToIngest = [
  { title: "İade", content: "14 gün iade süresi vardır." },
  { title: "Destek", content: "Bize her zaman ulaşabilirsiniz." }
];

async function ingest() {
  // Yerel embedding modelini yükle (İnternet harcamaz, bedavadır)
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  for (const item of dataToIngest) {
    console.log(`${item.title} işleniyor...`);
    
    const output = await extractor(item.content, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data); // 384 boyutlu vektör

    await Knowledge.create({ ...item, embedding: embedding });
  }
  console.log("Bedava Ingest Başarılı!");
  process.exit();
}
ingest();