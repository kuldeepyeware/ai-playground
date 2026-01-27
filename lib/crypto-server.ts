// lib/crypto-server.ts
// Server-side encryption/decryption using Node.js crypto module
// Note: This matches the client-side format where Web Crypto API includes auth tag in ciphertext

import { pbkdf2Sync, randomBytes, createCipheriv, createDecipheriv } from "crypto";

// This is a simple salt for key derivation (must match client-side)
const SALT = Buffer.from("chat-app-salt-123");

/**
 * Derives a strong encryption key from a user's secret passphrase
 */
function getEncryptionKey(password: string): Buffer {
  return pbkdf2Sync(password, SALT, 100000, 32, "sha256");
}

export function encryptMessage(text: string, secret: string): string {
  const key = getEncryptionKey(secret);
  const iv = randomBytes(12); // Initialization Vector
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  // Get the auth tag (required for GCM)
  const authTag = cipher.getAuthTag();

  // Combine IV + ciphertext + authTag to match Web Crypto API format
  // Web Crypto API includes auth tag at the end of ciphertext
  const combined = Buffer.concat([iv, encrypted, authTag]);

  return combined.toString("base64");
}

export function decryptMessage(encodedData: string, secret: string): string {
  try {
    const key = getEncryptionKey(secret);
    const combined = Buffer.from(encodedData, "base64");

    const iv = combined.slice(0, 12);
    // Last 16 bytes are the auth tag (GCM auth tag is 16 bytes)
    const authTag = combined.slice(combined.length - 16);
    // Everything between IV and auth tag is the ciphertext
    const ciphertext = combined.slice(12, combined.length - 16);

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (e) {
    return "[Decryption Failed: Invalid Secret]";
  }
}
