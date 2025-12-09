/**
 * Input Validation Utilities
 * Centralized validation functions using zod for type-safe validation
 */

import { z } from 'zod';

/**
 * Auth Schema Validations
 */
export const authSchemas = {
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^[^\s]+$/, 'Password cannot contain spaces'),
  
  displayName: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s'-]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and apostrophes'),
  
  signUp: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    displayName: z.string().max(50).optional()
  }),
  
  signIn: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
};

/**
 * Child Profile Schema Validations
 */
export const childProfileSchemas = {
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(30, 'Name must be less than 30 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  age: z
    .number()
    .int('Age must be a whole number')
    .min(2, 'Age must be at least 2')
    .max(10, 'Age must be 10 or less'),
  
  profile: z.object({
    name: z.string().min(1).max(30),
    age: z.number().int().min(2).max(10),
    avatar: z.string().optional(),
    dailyTimeLimit: z.number().int().min(0).max(300).optional()
  })
};

/**
 * Parental Control Schema Validations
 */
export const parentalControlSchemas = {
  pin: z
    .string()
    .regex(/^\d{4}$/, 'PIN must be exactly 4 digits')
    .refine(val => val !== '0000' && val !== '1234', 'PIN cannot be 0000 or 1234 for security'),
  
  timeLimit: z
    .number()
    .int('Time limit must be a whole number')
    .min(5, 'Time limit must be at least 5 minutes')
    .max(300, 'Time limit cannot exceed 300 minutes')
};

/**
 * Content Schema Validations
 */
export const contentSchemas = {
  drawingTitle: z
    .string()
    .trim()
    .max(100, 'Title must be less than 100 characters')
    .optional(),
  
  storyText: z
    .string()
    .trim()
    .max(5000, 'Story must be less than 5000 characters'),
  
  voiceInput: z
    .string()
    .trim()
    .max(1000, 'Input must be less than 1000 characters')
    .refine(
      val => !/<script|javascript:|on\w+=/i.test(val),
      'Input contains invalid characters'
    )
};

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Validate and sanitize email
 */
export function validateEmail(email: string): { valid: boolean; sanitized: string; error?: string } {
  try {
    const sanitized = sanitizeString(email.toLowerCase());
    authSchemas.email.parse(sanitized);
    return { valid: true, sanitized };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, sanitized: email, error: error.errors[0].message };
    }
    return { valid: false, sanitized: email, error: 'Invalid email' };
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { 
  valid: boolean; 
  strength: 'weak' | 'medium' | 'strong';
  error?: string;
} {
  try {
    authSchemas.password.parse(password);
    
    // Calculate strength
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    
    const criteriaCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (password.length >= 12 && criteriaCount >= 3) {
      strength = 'strong';
    } else if (password.length >= 8 && criteriaCount >= 2) {
      strength = 'medium';
    }
    
    return { valid: true, strength };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, strength: 'weak', error: error.errors[0].message };
    }
    return { valid: false, strength: 'weak', error: 'Invalid password' };
  }
}

/**
 * Validate child name
 */
export function validateChildName(name: string): { valid: boolean; sanitized: string; error?: string } {
  try {
    const sanitized = sanitizeString(name);
    childProfileSchemas.name.parse(sanitized);
    return { valid: true, sanitized };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, sanitized: name, error: error.errors[0].message };
    }
    return { valid: false, sanitized: name, error: 'Invalid name' };
  }
}

/**
 * Validate parental PIN
 */
export function validatePIN(pin: string): { valid: boolean; error?: string } {
  try {
    parentalControlSchemas.pin.parse(pin);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Invalid PIN' };
  }
}

/**
 * Prevent XSS by escaping HTML
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate URL for safety
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
