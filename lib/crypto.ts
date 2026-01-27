// lib/crypto.ts

// This is a simple salt for key derivation
const SALT = new TextEncoder().encode("chat-app-salt-123");

/**
 * Derives a strong encryption key from a user's secret passphrase
 */
async function getEncryptionKey(password: string) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: SALT,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(text: string, secret: string) {
  const key = await getEncryptionKey(secret);
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector
  const encodedText = new TextEncoder().encode(text);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedText
  );

  // Combine IV and Ciphertext so we can decrypt it later
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined)); // Return as Base64 string
}

export async function decryptMessage(encodedData: string, secret: string) {
  try {
    const key = await getEncryptionKey(secret);
    
    // Decode base64
    let combined: Uint8Array;
    try {
      combined = new Uint8Array(
        atob(encodedData)
          .split("")
          .map((char) => char.charCodeAt(0))
      );
    } catch (base64Error) {
      console.error("Failed to decode base64:", base64Error);
      return "[Decryption Failed: Invalid Secret]";
    }

    // Check if we have enough data (at least IV + some ciphertext)
    // Minimum: 12 (IV) + 16 (auth tag) + some data = 28+
    if (combined.length < 28) {
      console.error("Decryption failed: Data too short", {
        length: combined.length,
        encodedLength: encodedData.length,
        minRequired: 28,
      });
      return "[Decryption Failed: Invalid Secret]";
    }

    const iv = combined.slice(0, 12);
    // For Web Crypto API, the auth tag is included at the end of the ciphertext
    // Format: IV (12) + ciphertext (which includes auth tag at the end)
    const ciphertext = combined.slice(12);

    // Check if we have ciphertext (should be at least auth tag size = 16)
    if (ciphertext.length < 16) {
      console.error("Decryption failed: Ciphertext too short (need at least auth tag)", {
        ivLength: iv.length,
        ciphertextLength: ciphertext.length,
        totalLength: combined.length,
      });
      return "[Decryption Failed: Invalid Secret]";
    }

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    // Log the actual error for debugging
    const errorDetails = {
      error: e instanceof Error ? e.message : String(e),
      errorName: e instanceof Error ? e.name : typeof e,
      encodedDataLength: encodedData.length,
      encodedDataPreview: encodedData.substring(0, 50),
      secretLength: secret?.length,
      secretPreview: secret ? secret.substring(0, 10) + "..." : "none",
    };
    console.error("Decryption error details:", errorDetails);
    return "[Decryption Failed: Invalid Secret]";
  }
}
