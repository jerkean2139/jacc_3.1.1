import crypto from 'crypto';
const ENCRYPTION_KEY = process.env.DOCUMENT_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';
export class DocumentEncryption {
    key;
    constructor() {
        // Ensure key is 32 bytes for AES-256
        this.key = Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32);
        if (this.key.length < 32) {
            // Pad with zeros if key is too short
            const paddedKey = Buffer.alloc(32);
            this.key.copy(paddedKey);
            this.key = paddedKey;
        }
    }
    encrypt(text) {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return {
            encrypted,
            iv: iv.toString('hex')
        };
    }
    decrypt(encrypted, ivHex) {
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    // Encrypt sensitive document metadata
    encryptMetadata(metadata) {
        const jsonStr = JSON.stringify(metadata);
        const { encrypted, iv } = this.encrypt(jsonStr);
        return `${iv}:${encrypted}`;
    }
    // Decrypt sensitive document metadata
    decryptMetadata(encryptedData) {
        const [iv, encrypted] = encryptedData.split(':');
        const decrypted = this.decrypt(encrypted, iv);
        return JSON.parse(decrypted);
    }
}
export const documentEncryption = new DocumentEncryption();
