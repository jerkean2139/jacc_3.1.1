import bcrypt from 'bcrypt';

/**
 * Secure Password Management Utilities
 * Provides bcrypt-based password hashing and validation
 */

const SALT_ROUNDS = 12; // Industry standard for 2025

/**
 * Hash a password using bcrypt with salt
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  try {
    const saltRounds = SALT_ROUNDS;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false;
  }
  
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Password comparison failed:', error);
    return false;
  }
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill remaining length with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  requirements: string[];
  recommendations: string[];
} {
  const requirements: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length >= 8) {
    score += 20;
  } else {
    requirements.push('At least 8 characters');
  }
  
  if (password.length >= 12) {
    score += 10;
  }
  
  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    requirements.push('At least one lowercase letter');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    requirements.push('At least one uppercase letter');
  }
  
  if (/\d/.test(password)) {
    score += 15;
  } else {
    requirements.push('At least one number');
  }
  
  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    score += 15;
  } else {
    requirements.push('At least one special character');
  }
  
  // Pattern checks
  if (!/(.)\1{2,}/.test(password)) {
    score += 10; // No repeated characters
  } else {
    recommendations.push('Avoid repeated characters');
  }
  
  // Common patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /admin/i,
    /qwerty/i,
    /abc/i
  ];
  
  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (!hasCommonPattern) {
    score += 10;
  } else {
    recommendations.push('Avoid common patterns like "123456", "password", etc.');
  }
  
  const isValid = requirements.length === 0 && score >= 80;
  
  return {
    isValid,
    score,
    requirements,
    recommendations
  };
}

/**
 * Check if password needs to be rehashed (if salt rounds changed)
 */
export function needsRehash(hashedPassword: string): boolean {
  try {
    const saltRounds = bcrypt.getRounds(hashedPassword);
    return saltRounds < SALT_ROUNDS;
  } catch (error) {
    // If we can't determine rounds, assume it needs rehashing
    return true;
  }
}