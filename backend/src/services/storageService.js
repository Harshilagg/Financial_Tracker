const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { S3_REGION, S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

const s3 = new S3Client({ region: S3_REGION });

async function uploadBuffer(buffer, key, contentType) {
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType
  };

  await s3.send(new PutObjectCommand(params));

  // Return public URL (assuming bucket is public or proper presigned usage)
  const url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${encodeURIComponent(key)}`;
  return url;
}

module.exports = { uploadBuffer };
