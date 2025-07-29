import { Router } from 'express';
import { apiCostTracker } from '../services/api-cost-tracker';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Get current month usage for authenticated user
router.get('/current-month', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id || 'admin-user';
    const usage = await apiCostTracker.getCurrentMonthUsage(userId);
    res.json(usage);
  } catch (error) {
    console.error('Failed to get current month usage:', error);
    res.status(500).json({ error: 'Failed to retrieve usage data' });
  }
});

// Get detailed usage statistics
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id || 'admin-user';
    const { year, month } = req.query;
    
    const stats = await apiCostTracker.getUserUsageStats(
      userId, 
      year ? parseInt(year as string) : undefined,
      month ? parseInt(month as string) : undefined
    );
    
    res.json(stats);
  } catch (error) {
    console.error('Failed to get usage stats:', error);
    res.status(500).json({ error: 'Failed to retrieve usage statistics' });
  }
});

// Get system-wide usage (admin only)
router.get('/system', isAuthenticated, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user?.role || !['admin', 'dev-admin', 'client-admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const systemStats = await apiCostTracker.getSystemUsageStats();
    res.json(systemStats);
  } catch (error) {
    console.error('Failed to get system usage stats:', error);
    res.status(500).json({ error: 'Failed to retrieve system statistics' });
  }
});

export default router;