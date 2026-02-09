import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3Client.js";

export const uploadFileToS3 = async (file) => {
    const bucketName = "ai-projem-verileri";
    
    // Dosya adını benzersiz yapalım (Çakışmaları önlemek için)
    const fileName = `${Date.now()}-${file.originalname}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: file.buffer, // Dosyanın kendisi (Ram'deki hali)
        ContentType: file.mimetype,
    });

    try {
        await s3Client.send(command);
        console.log(`🚀 Dosya S3'e yüklendi: ${fileName}`);
        return fileName; // İleride veritabanına kaydetmek için ismi dönüyoruz
    } catch (error) {
        console.error("S3 Upload Hatası:", error);
        throw error;
    }
};