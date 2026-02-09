const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3_REGION, S3_BUCKET } = process.env;

const s3 = new S3Client({ region: S3_REGION });

async function uploadBuffer(buffer, key, contentType) {
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType
  };

  await s3.send(new PutObjectCommand(params));

  // Store canonical object URL (not exposed to clients)
  const url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${encodeURIComponent(key)}`;
  return url;
}

async function generatePresignedUrl(key, expiresInSeconds = 60) {
  const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  const signedUrl = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
  return signedUrl;
}

module.exports = { uploadBuffer, generatePresignedUrl };
