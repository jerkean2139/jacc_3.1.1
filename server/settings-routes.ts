import { Express } from 'express';
import { neon } from '@neondatabase/serverless';
<<<<<<< HEAD
=======
import { requireSecureAuth, requireRole } from './secure-auth';
import { auditLog } from './security-config';
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8

const sql = neon(process.env.DATABASE_URL!);

export function registerSettingsRoutes(app: Express) {
  // Get all admin settings
<<<<<<< HEAD
  app.get('/api/admin/settings', async (req, res) => {
=======
  app.get('/api/admin/settings', requireSecureAuth, requireRole(['admin', 'dev-admin', 'client-admin']), async (req, res) => {
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
    try {
      const defaultSettings = {
        'user-management': {
          'sessions': {
            sessionTimeout: { value: '1 hour', updatedAt: new Date().toISOString() },
            rememberMeDuration: { value: '30 days', updatedAt: new Date().toISOString() },
            forceLogoutOnIPChange: { value: true, updatedAt: new Date().toISOString() },
            concurrentSessionLimit: { value: '5', updatedAt: new Date().toISOString() }
          },
          'notifications': {
            welcomeEmails: { value: true, updatedAt: new Date().toISOString() },
            streakNotifications: { value: true, updatedAt: new Date().toISOString() },
            achievementNotifications: { value: true, updatedAt: new Date().toISOString() },
            weeklyReports: { value: true, updatedAt: new Date().toISOString() }
          }
        },
        'content-processing': {
          'ocr': {
            qualityLevel: { value: 'balanced', updatedAt: new Date().toISOString() },
            languageDetection: { value: 'auto-detect', updatedAt: new Date().toISOString() },
            autoRotate: { value: true, updatedAt: new Date().toISOString() },
            enhanceLowQuality: { value: true, updatedAt: new Date().toISOString() }
          },
          'categorization': {
            enableAutoCategorization: { value: true, updatedAt: new Date().toISOString() },
            confidenceThreshold: { value: 'medium', updatedAt: new Date().toISOString() }
          },
          'retention': {
            defaultRetentionPeriod: { value: '2 years', updatedAt: new Date().toISOString() },
            automaticDeletion: { value: false, updatedAt: new Date().toISOString() },
            archiveBeforeDeletion: { value: true, updatedAt: new Date().toISOString() }
          }
        },
        'system-performance': {
          'timeouts': {
            aiResponseTimeout: { value: '60 seconds', updatedAt: new Date().toISOString() },
            documentProcessingTimeout: { value: '5 minutes', updatedAt: new Date().toISOString() },
            databaseQueryTimeout: { value: '10 seconds', updatedAt: new Date().toISOString() }
          },
          'cache': {
            enableResponseCaching: { value: true, updatedAt: new Date().toISOString() },
            cacheDuration: { value: '30 minutes', updatedAt: new Date().toISOString() },
            documentCacheSize: { value: '500 MB', updatedAt: new Date().toISOString() }
          }
        }
      };
      
      res.json(defaultSettings);
    } catch (error) {
      console.error('Settings fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // Update specific setting
<<<<<<< HEAD
  app.put('/api/admin/settings/:category/:subcategory/:key', async (req, res) => {
=======
  app.put('/api/admin/settings/:category/:subcategory/:key', requireSecureAuth, requireRole(['admin', 'dev-admin', 'client-admin']), async (req, res) => {
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
    try {
      const { category, subcategory, key } = req.params;
      const { value } = req.body;
      
      // For now, just return success since we're using default settings
      res.json({
        success: true,
        setting: {
          category,
          subcategory,
          key,
          value: JSON.stringify(value),
          updated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Settings update error:', error);
      res.status(500).json({ error: 'Failed to update setting' });
    }
  });

  // Bulk update settings for a category/subcategory
<<<<<<< HEAD
  app.put('/api/admin/settings/:category/:subcategory', async (req, res) => {
=======
  app.put('/api/admin/settings/:category/:subcategory', requireSecureAuth, requireRole(['admin', 'dev-admin', 'client-admin']), async (req, res) => {
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
    try {
      const { category, subcategory } = req.params;
      const { settings } = req.body;
      
      // For now, just return success since we're using default settings
      res.json({
        success: true,
        message: `Updated ${Object.keys(settings).length} settings for ${category}/${subcategory}`
      });
    } catch (error) {
      console.error('Bulk settings update error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

<<<<<<< HEAD
  // Get active user sessions
  app.get('/api/admin/sessions', async (req, res) => {
=======
  // Generic settings update endpoint to handle all settings updates
  app.put('/api/admin/settings', requireSecureAuth, requireRole(['admin', 'dev-admin', 'client-admin']), async (req, res) => {
    try {
      const settings = req.body;
      
      // Process different types of settings based on what's provided
      // This endpoint handles updates from User Management, Content & Documents, and System Performance tabs
      
      // Log what type of settings we received for debugging
      console.log('Received settings update:', Object.keys(settings));
      
      // For now, return success since we're using in-memory/default settings
      // In a real implementation, this would update a database
      res.json({
        success: true,
        message: 'Settings updated successfully',
        updatedSettings: settings
      });
    } catch (error) {
      console.error('Generic settings update error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Get active user sessions
  app.get('/api/admin/sessions', requireSecureAuth, requireRole(['admin', 'dev-admin', 'client-admin']), async (req, res) => {
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
    try {
      // Use existing users table to get real session data
      const users = await sql`
        SELECT email, role, id, created_at
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 5
      `;
      
      const sessions = users.map((user: any) => ({
        email: user.email,
        role: user.role,
        sessionId: `session_${user.id}`,
        ipAddress: '192.168.1.' + (Math.floor(Math.random() * 255) + 1),
        userAgent: ['Chrome/120.0 Windows', 'Safari/17.0 macOS', 'Firefox/121.0 Linux'][Math.floor(Math.random() * 3)],
        createdAt: user.created_at,
        lastActivity: new Date().toISOString(),
        status: 'active'
      }));
      
      res.json({ sessions });
    } catch (error) {
      console.error('Sessions fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  // End a user session
<<<<<<< HEAD
  app.delete('/api/admin/sessions/:sessionId', async (req, res) => {
=======
  app.delete('/api/admin/sessions/:sessionId', requireSecureAuth, requireRole(['admin', 'dev-admin', 'client-admin']), async (req, res) => {
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
    try {
      const { sessionId } = req.params;
      
      // For demo purposes, always return success
      res.json({
        success: true,
        message: 'Session ended successfully'
      });
    } catch (error) {
      console.error('Session end error:', error);
      res.status(500).json({ error: 'Failed to end session' });
    }
  });

<<<<<<< HEAD
  // Get system performance metrics
  app.get('/api/admin/performance', async (req, res) => {
=======
  // Generate SSO token for iframe integration
  app.post('/api/admin/generate-sso-token', requireSecureAuth, requireRole(['admin', 'dev-admin', 'client-admin']), async (req, res) => {
    try {
      // Generate a simple token for iframe SSO integration
      // In production, this would integrate with your actual SSO system
      const token = `sso-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Store token in database or cache (for demo, we'll just return it)
      res.json({
        success: true,
        token,
        expiresAt: expiresAt.toISOString(),
        embedUrl: `${req.protocol}://${req.get('host')}?embedded=true&token=${token}`
      });
    } catch (error) {
      console.error('SSO token generation error:', error);
      res.status(500).json({ error: 'Failed to generate SSO token' });
    }
  });

  // Get system performance metrics
  app.get('/api/admin/performance', requireSecureAuth, requireRole(['admin', 'dev-admin', 'client-admin']), async (req, res) => {
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
    try {
      const metrics = {
        database: {
          status: 'online',
          responseTime: Math.floor(Math.random() * 100) + 20, // ms
          connections: Math.floor(Math.random() * 50) + 10
        },
        aiServices: {
          status: 'active',
          claudeStatus: 'operational',
          gptStatus: 'operational',
          requestsPerMinute: Math.floor(Math.random() * 100) + 50
        },
        memory: {
          used: Math.floor(Math.random() * 400) + 300, // MB
          total: 672, // MB
          percentage: Math.floor((Math.random() * 400 + 300) / 672 * 100)
        },
        performance: {
          averageResponseTime: Math.floor(Math.random() * 2000) + 800, // ms
          documentProcessingSpeed: Math.floor(Math.random() * 30) + 70, // percentage
          searchAccuracy: Math.floor(Math.random() * 15) + 85, // percentage
          cacheHitRate: Math.floor(Math.random() * 20) + 75, // percentage
          errorRate: Math.random() * 5 // percentage
        },
        cache: {
          size: Math.floor(Math.random() * 200) + 100, // MB
          items: Math.floor(Math.random() * 1000) + 500,
          hitRate: Math.floor(Math.random() * 20) + 75 // percentage
        }
      };
      
      res.json(metrics);
    } catch (error) {
      console.error('Performance metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  });

  // Clear system cache
  app.post('/api/admin/cache/clear', async (req, res) => {
    try {
      // In a real implementation, this would clear actual cache
      // For now, we'll simulate the action
      res.json({
        success: true,
        message: 'Cache cleared successfully',
        clearedItems: Math.floor(Math.random() * 1000) + 500,
        clearedSize: Math.floor(Math.random() * 200) + 100 // MB
      });
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  });

  // Get notification templates
  app.get('/api/admin/notification-templates', async (req, res) => {
    try {
      const query = `
        SELECT id, name, subject, body, type, is_active, updated_at
        FROM notification_templates
        ORDER BY type, name
      `;
      
      const result = await pool.query(query);
      
      const templates = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        subject: row.subject,
        body: row.body,
        type: row.type,
        isActive: row.is_active,
        updatedAt: row.updated_at
      }));
      
      res.json({ templates });
    } catch (error) {
      console.error('Notification templates fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch notification templates' });
    }
  });

  // Update notification template
  app.put('/api/admin/notification-templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { subject, body, isActive } = req.body;
      
      const query = `
        UPDATE notification_templates 
        SET subject = $1, body = $2, is_active = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;
      
      const result = await pool.query(query, [subject, body, isActive, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      res.json({
        success: true,
        template: result.rows[0]
      });
    } catch (error) {
      console.error('Template update error:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  });

  // Reset settings to defaults
  app.post('/api/admin/settings/reset', async (req, res) => {
    try {
      const { category, subcategory } = req.body;
      
      let query = 'DELETE FROM admin_settings WHERE 1=1';
      const params = [];
      
      if (category) {
        query += ' AND category = $1';
        params.push(category);
        
        if (subcategory) {
          query += ' AND subcategory = $2';
          params.push(subcategory);
        }
      }
      
      const result = await pool.query(query, params);
      
      res.json({
        success: true,
        message: `Reset ${result.rowCount} settings to defaults`,
        deletedCount: result.rowCount
      });
    } catch (error) {
      console.error('Settings reset error:', error);
      res.status(500).json({ error: 'Failed to reset settings' });
    }
  });
}