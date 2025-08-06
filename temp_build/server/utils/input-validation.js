import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
// Common validation schemas
export const userInputSchema = z.object({
    message: z.string().min(1).max(10000).transform(str => sanitizeText(str)),
    chatId: z.string().uuid().optional(), // Make chatId optional for conversation starters
    isNewChat: z.boolean().optional(),
});
export const searchQuerySchema = z.object({
    query: z.string().min(1).max(500).transform(str => sanitizeSearchQuery(str)),
    limit: z.number().int().min(1).max(100).default(10),
    namespaces: z.array(z.string()).optional(),
});
export const documentUploadSchema = z.object({
    name: z.string().min(1).max(255).transform(str => sanitizeFileName(str)),
    content: z.string().max(10_000_000), // 10MB max
    mimeType: z.enum(['application/pdf', 'text/plain', 'text/csv', 'application/vnd.ms-excel']),
    folderId: z.string().uuid().optional(),
});
// Sanitization functions
export function sanitizeText(text) {
    // Remove any HTML/script tags
    const cleaned = DOMPurify.sanitize(text, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
    });
    // Remove potential SQL injection patterns
    return cleaned
        .replace(/(['";\\])/g, '') // Remove quotes and backslashes
        .replace(/(--|\*|\/\*|\*\/|xp_|sp_|exec|execute|select|insert|update|delete|drop|create|alter|truncate)/gi, '')
        .trim();
}
export function sanitizeSearchQuery(query) {
    // More lenient for search queries but still remove dangerous patterns
    const cleaned = DOMPurify.sanitize(query, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
    });
    // Remove SQL and vector search injection patterns
    return cleaned
        .replace(/[{}\[\]]/g, '') // Remove brackets that could be vector injection
        .replace(/(--|\*|\/\*|\*\/|exec|execute|drop|create|alter|truncate)/gi, '')
        .trim();
}
export function sanitizeFileName(filename) {
    // Remove path traversal and dangerous characters
    return filename
        .replace(/[\/\\:*?"<>|]/g, '_') // Replace illegal filename chars
        .replace(/\.{2,}/g, '_') // Remove multiple dots (path traversal)
        .replace(/^\./, '_') // Remove leading dot
        .trim();
}
// Simplified validation function for single use
export function validateInput(schema, data) {
    try {
        const validated = schema.parse(data);
        return { valid: true, data: validated };
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return {
                valid: false,
                error: {
                    error: 'Invalid input',
                    details: error.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                }
            };
        }
        return {
            valid: false,
            error: { error: 'Validation failed', details: [{ message: 'Unknown validation error' }] }
        };
    }
}
// Middleware for Express routes
export function validateInputMiddleware(schema) {
    return (req, res, next) => {
        try {
            const validated = schema.parse(req.body);
            req.body = validated; // Replace with sanitized data
            next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    error: 'Invalid input',
                    details: error.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                });
            }
            else {
                res.status(500).json({ error: 'Input validation error' });
            }
        }
    };
}
// Rate limiting configurations for different endpoints
export const rateLimits = {
    // General API rate limit
    general: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // Limit each IP to 100 requests per windowMs
    },
    // Strict limit for AI queries
    aiQuery: {
        windowMs: 60 * 1000, // 1 minute
        max: 10 // 10 AI queries per minute
    },
    // Document upload limit
    upload: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 50 // 50 uploads per hour
    },
    // Authentication attempts
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5 // 5 login attempts per 15 minutes
    }
};
// SQL injection prevention for database queries
export function escapeSQL(value) {
    if (typeof value !== 'string')
        return value;
    return value.replace(/['"\\\0\n\r\x1a]/g, (char) => {
        switch (char) {
            case "'": return "''";
            case '"': return '""';
            case '\\': return '\\\\';
            case '\0': return '\\0';
            case '\n': return '\\n';
            case '\r': return '\\r';
            case '\x1a': return '\\Z';
            default: return char;
        }
    });
}
