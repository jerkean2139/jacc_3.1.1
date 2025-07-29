import crypto from 'crypto';

/**
 * Database Field Encryption Utility
 * Provides AES-256-GCM encryption for sensitive database fields
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is always 16 bytes
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

// Use environment variable or generate a secure key
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || generateEncryptionKey();

function generateEncryptionKey(): string {
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 CRITICAL: DB_ENCRYPTION_KEY environment variable not set in production!');
    throw new Error('Database encryption key required in production');
  }
  
  // Generate a key for development (not recommended for production)
  const key = crypto.randomBytes(32).toString('hex');
  console.warn('⚠️  Using generated encryption key for development. Set DB_ENCRYPTION_KEY in production.');
  return key;
}

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  authTag: string;
  salt: string;
}

/**
 * Encrypt sensitive text data for database storage
 */
export function encryptText(text: string): EncryptedData {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha256');
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('JACC-DB-FIELD')); // Additional authenticated data
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      salt: salt.toString('hex')
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive text data from database
 */
export function decryptText(encryptedField: EncryptedData): string {
  try {
    const { encryptedData, iv, authTag, salt } = encryptedField;
    
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, Buffer.from(salt, 'hex'), 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'), { authTagLength: TAG_LENGTH });
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    decipher.setAAD(Buffer.from('JACC-DB-FIELD'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt JSON data for database storage
 */
export function encryptJSON(data: any): EncryptedData {
  const jsonString = JSON.stringify(data);
  return encryptText(jsonString);
}

/**
 * Decrypt JSON data from database
 */
export function decryptJSON(encryptedField: EncryptedData): any {
  const decryptedString = decryptText(encryptedField);
  return JSON.parse(decryptedString);
}

/**
 * Helper function to check if data is encrypted
 */
export function isEncrypted(data: any): boolean {
  return data && 
         typeof data === 'object' && 
         data.encryptedData && 
         data.iv && 
         data.authTag && 
         data.salt;
}

/**
 * Encrypt database field if not already encrypted
 */
export function ensureEncrypted(data: string | EncryptedData): EncryptedData {
  if (typeof data === 'string') {
    return encryptText(data);
  }
  
  if (isEncrypted(data)) {
    return data as EncryptedData;
  }
  
  throw new Error('Invalid data format for encryption');
}

/**
 * Decrypt database field if encrypted, return as-is if plain text
 */
export function ensureDecrypted(data: string | EncryptedData): string {
  if (typeof data === 'string') {
    return data;
  }
  
  if (isEncrypted(data)) {
    return decryptText(data as EncryptedData);
  }
  
  throw new Error('Invalid data format for decryption');
}

// Export encryption status for monitoring
export const encryptionStatus = {
  isProduction: process.env.NODE_ENV === 'production',
  hasEncryptionKey: !!process.env.DB_ENCRYPTION_KEY,
  algorithm: ALGORITHM,
  keyDerivationIterations: 100000
};