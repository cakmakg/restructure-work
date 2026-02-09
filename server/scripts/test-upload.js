import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3Client.js";

async function uploadToS3() {
    const bucketName = "ai-projem-verileri"; // Az önce terminalden oluşturduğumuz bucket adı
    const key = "merhaba-ai.txt"; // S3 içindeki dosya adı
    const body = "Selam AWS! Bu dosya benim ilk AI projemin verisi olacak."; // Dosya içeriği

    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: body,
            ContentType: "text/plain",
        });

        const response = await s3Client.send(command);
        console.log("✅ Başarılı! Dosya buluta (LocalStack) uçtu.");
        console.log("Response:", response);
    } catch (err) {
        console.error("❌ Eyvah, bir hata oluştu:", err);
    }
}

uploadToS3();