import { GetObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3Client.js";

// S3'ten gelen veri akışını (stream) metne dönüştüren yardımcı fonksiyon
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });

async function readFromS3() {
  const bucketName = "ai-projem-verileri";
  const key = "merhaba-ai.txt"; // Az önce yüklediğimiz dosyanın adı

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    // Response.Body bir stream'dir, onu metne çeviriyoruz
    const data = await streamToString(response.Body);

    console.log("📂 Buluttan Okunan Veri:");
    console.log("-----------------------");
    console.log(data);
    console.log("-----------------------");
    console.log("✅ Okuma işlemi başarılı!");
  } catch (err) {
    console.error("❌ Dosya okunurken hata oluştu:", err);
  }
}

readFromS3();