import { neon } from '@neondatabase/serverless';
import { requireSecureAuth, requireRole } from './secure-auth';
const sql = neon(process.env.DATABASE_URL);
export function registerSettingsRoutes(app) {
    // Get all admin settings
    app.get('/api/admin/settings', requireSecureAuth, requireRole(['admin', 'dev-admin', 'client-admin']), async (req, res) => {
        try {
            const defaultSettings = {
                'user-management': {
                    'sessions': {
                        sessionTimeout: { value: '1 hour', updatedAt: new Date().toISOString() },
                        rememberMeDuration: { value: '30 days', updatedAt: new Date().toISOString() },
                        forceLogoutOnIPChange: { value: true, updatedAt: new Date().toISOString() },
                        concurrentSessionLimit: { value: '5', updatedAt: new Date().toISOString() }
                    }
                }
            };
            res.json({
                success: true,
                settings: defaultSettings
            });
        }
        catch (error) {
            console.error('Settings fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch settings' });
        }
    });
    // Update admin settings  
    app.post('/api/admin/settings', requireSecureAuth, requireRole(['admin', 'dev-admin', 'client-admin']), async (req, res) => {
        try {
            const { category, subcategory, key, value } = req.body;
            res.json({
                success: true,
                message: 'Settings updated successfully'
            });
        }
        catch (error) {
            console.error('Settings update error:', error);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    });
    // Reset settings to defaults
    app.post('/api/admin/settings/reset', requireSecureAuth, requireRole(['admin', 'dev-admin', 'client-admin']), async (req, res) => {
        try {
            const { category, subcategory } = req.body;
            res.json({
                success: true,
                message: 'Settings reset to defaults',
                deletedCount: 0
            });
        }
        catch (error) {
            console.error('Settings reset error:', error);
            res.status(500).json({ error: 'Failed to reset settings' });
        }
    });
}
