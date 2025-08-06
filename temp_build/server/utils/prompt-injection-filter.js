/**
 * Prompt Injection Protection System
 * Detects and filters malicious prompt injection attempts in AI inputs
 */
// Common prompt injection patterns
const INJECTION_PATTERNS = [
    // Direct prompt manipulation
    /ignore\s+(previous|all|above|prior)\s+(instructions?|prompts?|context)/gi,
    /forget\s+(everything|all|previous|prior)/gi,
    /(override|bypass|disable)\s+(safety|security|protection)/gi,
    // Role manipulation
    /act\s+as\s+(developer|admin|system|root|god|jailbreak)/gi,
    /you\s+are\s+(now\s+)?(a\s+)?(different|new|evil|malicious)/gi,
    /pretend\s+(to\s+be|you\s+are)/gi,
    // System command injection
    /execute\s+(command|code|script|function)/gi,
    /run\s+(command|code|script)/gi,
    /eval\s*\(/gi,
    /system\s*\(/gi,
    // Prompt boundary manipulation
    /```\s*(python|javascript|sql|bash|shell)/gi,
    /\[SYSTEM\]|\[ADMIN\]|\[ROOT\]/gi,
    /###\s*(instruction|system|admin)/gi,
    // Data exfiltration attempts
    /show\s+(me\s+)?(your\s+)?(internal|hidden|secret|private)/gi,
    /reveal\s+(your\s+)?(source|code|training|data)/gi,
    /what\s+(is\s+)?your\s+(real\s+)?(purpose|function|role)/gi,
    // Jailbreak attempts
    /jailbreak|DAN|do\s+anything\s+now/gi,
    /evil\s+(assistant|bot|ai)/gi,
    /without\s+(any\s+)?(restrictions?|limitations?|safety)/gi,
    // SQL injection patterns
    /('|(\\x27)|(\\x2D\\x2D)|(%27)|(%2D%2D))/gi,
    /(union|select|insert|update|delete|drop|create|alter)\s+/gi,
    /or\s+1\s*=\s*1/gi,
    // XSS patterns
    /<script[^>]*>.*?<\/script>/gi,
    /javascript\s*:/gi,
    /on(load|error|click|mouseover)\s*=/gi,
    // NoSQL injection
    /\$\w+\s*:\s*\{/gi,
    /\{\s*\$\w+:/gi,
];
// Suspicious keywords that increase injection score
const SUSPICIOUS_KEYWORDS = [
    'ignore', 'forget', 'override', 'bypass', 'jailbreak', 'evil', 'malicious',
    'system', 'admin', 'root', 'execute', 'eval', 'reveal', 'show me',
    'internal', 'hidden', 'secret', 'private', 'source code', 'training data'
];
// Safe patterns that reduce false positives
const SAFE_PATTERNS = [
    /how\s+(do\s+)?i\s+(ignore|forget|override)/gi,
    /can\s+you\s+help\s+me\s+(ignore|forget)/gi,
    /tutorial\s+(on|about|for)\s+(sql|javascript|python)/gi,
    /(learn|learning|teach|teaching)\s+(about|how)/gi,
];
/**
 * Analyze input for prompt injection attempts
 */
export function analyzePromptInjection(input) {
    if (!input || typeof input !== 'string') {
        return {
            isInjection: false,
            confidence: 0,
            riskLevel: 'low',
            detectedPatterns: [],
            sanitizedInput: input || '',
            recommendations: []
        };
    }
    const detectedPatterns = [];
    let injectionScore = 0;
    // Check for injection patterns
    INJECTION_PATTERNS.forEach((pattern, index) => {
        const matches = input.match(pattern);
        if (matches) {
            detectedPatterns.push(`Pattern ${index + 1}: ${pattern.source}`);
            injectionScore += matches.length * 10; // Weight by frequency
        }
    });
    // Check for suspicious keywords
    const suspiciousCount = SUSPICIOUS_KEYWORDS.filter(keyword => input.toLowerCase().includes(keyword.toLowerCase())).length;
    injectionScore += suspiciousCount * 5;
    // Reduce score for safe patterns
    SAFE_PATTERNS.forEach(pattern => {
        if (pattern.test(input)) {
            injectionScore -= 15;
        }
    });
    // Calculate confidence and risk level
    const confidence = Math.min(Math.max(injectionScore / 100, 0), 1);
    let riskLevel = 'low';
    if (confidence >= 0.8)
        riskLevel = 'critical';
    else if (confidence >= 0.6)
        riskLevel = 'high';
    else if (confidence >= 0.3)
        riskLevel = 'medium';
    const isInjection = confidence >= 0.3; // Threshold for blocking
    return {
        isInjection,
        confidence,
        riskLevel,
        detectedPatterns,
        sanitizedInput: sanitizeInput(input, isInjection),
        recommendations: generateRecommendations(riskLevel, detectedPatterns)
    };
}
/**
 * Sanitize input by removing/replacing dangerous content
 */
function sanitizeInput(input, isHighRisk) {
    if (!isHighRisk) {
        return input; // Return original if low risk
    }
    let sanitized = input;
    // Remove dangerous patterns
    INJECTION_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REMOVED]');
    });
    // Clean up excessive whitespace and special characters
    sanitized = sanitized
        .replace(/\s{3,}/g, ' ') // Reduce multiple spaces
        .replace(/[^\w\s\.,!?;:()\-]/g, '') // Remove unusual special chars
        .trim();
    return sanitized;
}
/**
 * Generate security recommendations based on analysis
 */
function generateRecommendations(riskLevel, patterns) {
    const recommendations = [];
    if (riskLevel === 'critical') {
        recommendations.push('BLOCK: Input contains critical injection patterns');
        recommendations.push('Log incident for security review');
        recommendations.push('Consider rate limiting user');
    }
    else if (riskLevel === 'high') {
        recommendations.push('Sanitize input before processing');
        recommendations.push('Monitor user for suspicious activity');
    }
    else if (riskLevel === 'medium') {
        recommendations.push('Apply additional filtering');
        recommendations.push('Log for pattern analysis');
    }
    return recommendations;
}
/**
 * Express middleware for prompt injection protection
 */
export function promptInjectionMiddleware(options = {}) {
    const { blockThreshold = 0.6, logAll = false, auditHighRisk = true } = options;
    return (req, res, next) => {
        const checkField = (value, fieldName) => {
            if (typeof value === 'string') {
                const analysis = analyzePromptInjection(value);
                if (logAll || analysis.riskLevel !== 'low') {
                    console.log(`🛡️  Injection analysis for ${fieldName}:`, {
                        riskLevel: analysis.riskLevel,
                        confidence: analysis.confidence,
                        patterns: analysis.detectedPatterns.length
                    });
                }
                if (analysis.confidence >= blockThreshold) {
                    console.warn(`🚨 BLOCKED prompt injection attempt in ${fieldName}:`, {
                        riskLevel: analysis.riskLevel,
                        confidence: analysis.confidence,
                        patterns: analysis.detectedPatterns,
                        ip: req.ip
                    });
                    return res.status(400).json({
                        error: 'Input validation failed',
                        message: 'Content contains potentially malicious patterns',
                        code: 'PROMPT_INJECTION_DETECTED'
                    });
                }
                // Replace original value with sanitized version
                return analysis.sanitizedInput;
            }
            return value;
        };
        // Check body fields
        if (req.body) {
            try {
                const sanitizedBody = {};
                Object.keys(req.body).forEach(key => {
                    const sanitized = checkField(req.body[key], `body.${key}`);
                    if (sanitized !== undefined) {
                        sanitizedBody[key] = sanitized;
                    }
                    else {
                        sanitizedBody[key] = req.body[key];
                    }
                });
                req.body = sanitizedBody;
            }
            catch (error) {
                return res.status(400).json({
                    error: 'Input validation failed',
                    message: 'Invalid request format'
                });
            }
        }
        // Check query parameters
        if (req.query) {
            const sanitizedQuery = {};
            Object.keys(req.query).forEach(key => {
                const sanitized = checkField(req.query[key], `query.${key}`);
                if (sanitized !== undefined) {
                    sanitizedQuery[key] = sanitized;
                }
                else {
                    sanitizedQuery[key] = req.query[key];
                }
            });
            req.query = sanitizedQuery;
        }
        next();
    };
}
/**
 * Validate and sanitize AI prompt before sending to language model
 */
export function validateAIPrompt(prompt) {
    const analysis = analyzePromptInjection(prompt);
    return {
        isValid: !analysis.isInjection,
        sanitizedPrompt: analysis.sanitizedInput,
        warnings: analysis.recommendations
    };
}
// Export configuration for monitoring
export const injectionFilterConfig = {
    totalPatterns: INJECTION_PATTERNS.length,
    suspiciousKeywords: SUSPICIOUS_KEYWORDS.length,
    safePatterns: SAFE_PATTERNS.length,
    defaultThreshold: 0.3
};
