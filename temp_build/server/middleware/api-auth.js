import crypto from 'crypto';
import { storage } from './storage';
// Generate API key
export function generateApiKey() {
    return 'jacc_' + crypto.randomBytes(32).toString('hex');
}
// Hash API key for storage
export function hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
}
// API Key authentication middleware
export const authenticateApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({
            error: 'API key required',
            message: 'Please provide an API key in the X-API-Key header'
        });
    }
    try {
        const keyHash = hashApiKey(apiKey);
        const apiKeyRecord = await storage.getApiKeyByHash(keyHash);
        if (!apiKeyRecord || !apiKeyRecord.isActive) {
            return res.status(401).json({
                error: 'Invalid API key',
                message: 'The provided API key is invalid or inactive'
            });
        }
        // Check expiration
        if (apiKeyRecord.expiresAt && new Date() > apiKeyRecord.expiresAt) {
            return res.status(401).json({
                error: 'API key expired',
                message: 'The provided API key has expired'
            });
        }
        // Get user associated with the API key
        const user = await storage.getUser(apiKeyRecord.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                error: 'User account inactive',
                message: 'The user account associated with this API key is inactive'
            });
        }
        // Update last used timestamp
        await storage.updateApiKeyUsage(apiKeyRecord.id);
        // Add user and permissions to request
        req.apiUser = user;
        req.apiKey = apiKeyRecord;
        next();
    }
    catch (error) {
        console.error('API authentication error:', error);
        return res.status(500).json({
            error: 'Authentication failed',
            message: 'Internal server error during authentication'
        });
    }
};
// Check API permissions
export const requireApiPermission = (permission) => {
    return (req, res, next) => {
        const apiKey = req.apiKey;
        if (!apiKey || !apiKey.permissions.includes(permission)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: `This API key does not have '${permission}' permission`
            });
        }
        next();
    };
};
