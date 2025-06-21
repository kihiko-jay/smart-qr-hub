import QRCode from "qrcode";
import sharp from "sharp";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { promises as fs } from "fs";

// Configure S3 client if AWS credentials are present
const s3Client = process.env.AWS_ACCESS_KEY_ID ? new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
}) : null;

/**
 * Uploads a file buffer to S3
 * @param {Buffer} buffer - File buffer to upload
 * @param {string} fileName - Name of the file
 * @returns {Promise<string>} Public URL of the uploaded file
 */
const uploadToS3 = async (buffer, fileName) => {
  if (!s3Client) {
    throw new Error("AWS S3 client not configured");
  }

  const key = `qrcodes/${uuidv4()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
    ACL: 'public-read'
  });

  await s3Client.send(command);
  return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
};

/**
 * Saves a file buffer to local storage
 * @param {Buffer} buffer - File buffer to save
 * @param {string} fileName - Name of the file
 * @returns {Promise<string>} Public URL of the saved file
 */
const saveToLocal = async (buffer, fileName) => {
  const uploadDir = process.env.UPLOADS_DIR || './uploads';
  const filePath = path.join(uploadDir, `${uuidv4()}-${fileName}`);
  
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(filePath, buffer);
  
  return `/uploads/${path.basename(filePath)}`;
};

/**
 * Generates a QR code with optional logo overlay
 * @param {string} data - Data to encode in QR code
 * @param {string} color - Color of the QR code
 * @param {string} logoUrl - URL/path to logo image
 * @returns {Promise<string>} URL of the generated QR code
 */
const generateQRCode = async (data, color = "#000000", logoUrl = "") => {
  try {
    // Validate input
    if (!data) throw new Error("QR code data is required");

    // Generate basic QR code
    const qrBuffer = await QRCode.toBuffer(data, { 
      color: { 
        dark: color, 
        light: "#FFFFFF" 
      },
      width: 500,
      margin: 2
    });

    let finalBuffer = qrBuffer;

    // Add logo if provided
    if (logoUrl) {
      finalBuffer = await sharp(qrBuffer)
        .composite([{
          input: logoUrl,
          gravity: 'center',
          blend: 'over'
        }])
        .toBuffer();
    }

    // Determine storage method
    if (process.env.STORAGE_TYPE === 's3' && s3Client) {
      return await uploadToS3(finalBuffer, "qr-code.png");
    } else {
      return await saveToLocal(finalBuffer, "qr-code.png");
    }

  } catch (err) {
    console.error("QR Code Generation Error:", err);
    throw new Error("Failed to generate QR code: " + err.message);
  }
};

export default generateQRCode;