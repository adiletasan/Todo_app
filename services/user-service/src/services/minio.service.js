const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_USER,
  secretKey: process.env.MINIO_PASS,
});

const BUCKET = process.env.MINIO_BUCKET || 'avatars';

const ensureBucket = async () => {
  const exists = await minioClient.bucketExists(BUCKET);
  if (!exists) {
    await minioClient.makeBucket(BUCKET);
    console.log(`Bucket ${BUCKET} created`);
  }
};

const uploadAvatar = async (userId, fileBuffer, mimetype) => {
  await ensureBucket();
  const fileName = `${userId}-${Date.now()}.jpg`;
  await minioClient.putObject(BUCKET, fileName, fileBuffer, {
    'Content-Type': mimetype,
  });
  return `http://localhost:9000/${BUCKET}/${fileName}`;
};

module.exports = { uploadAvatar };