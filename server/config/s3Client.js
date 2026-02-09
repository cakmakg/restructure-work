import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: "us-east-1",
    endpoint: "http://localhost:4566",
    credentials: {
        accessKeyId: "test",      // Doğrusu bu: accessKeyId
        secretAccessKey: "test",  // Doğrusu bu: secretAccessKey
    },
    forcePathStyle: true,
});

export default s3Client;