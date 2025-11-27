/**
 * Admin API Routes
 * Endpoints for admin-only functionality
 */

import { Express, Request, Response } from 'express';
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { eq, sql } from 'drizzle-orm';
import { isAdmin } from './adminUtil.js';
import { storage } from './storage.js';
import { optionalAuth, requireAuth } from './middleware.js';

export function registerAdminRoutes(app: Express) {
  /**
   * GET /api/admin/users
   * Get all users with their credit information
   */
  app.get('/api/admin/users', requireAuth, async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user is admin
      if (!isAdmin(req.user.email)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Get all users with credit information
      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          credits: users.credits,
          adminCredits: users.adminCredits,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(sql`${users.createdAt} DESC`);

      // Calculate total credits and purchased credits for each user
      const usersWithDetails = allUsers.map(user => ({
        ...user,
        totalCredits: user.credits + user.adminCredits,
        purchasedCredits: user.credits, // credits field = purchased + promo
      }));

      return res.json({
        success: true,
        users: usersWithDetails,
        totalUsers: usersWithDetails.length,
      });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return res.status(500).json({
        error: 'Failed to fetch users',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/admin/give-credits
   * Give admin credits to a user
   */
  app.post('/api/admin/give-credits', requireAuth, async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user is admin
      if (!isAdmin(req.user.email)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { userId, credits } = req.body;

      if (!userId || typeof credits !== 'number') {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'userId and credits (number) are required',
        });
      }

      if (credits <= 0) {
        return res.status(400).json({
          error: 'Invalid credits amount',
          message: 'Credits must be greater than 0',
        });
      }

      // Get current user data
      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (userResult.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult[0];
      const newAdminCredits = user.adminCredits + credits;

      // Update user's admin credits
      await db
        .update(users)
        .set({
          adminCredits: newAdminCredits,
        })
        .where(eq(users.id, userId));

      console.log(`✅ Admin ${req.user.email} gave ${credits} credits to ${user.email}`);

      return res.json({
        success: true,
        message: `Successfully gave ${credits} credits to ${user.email}`,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          adminCredits: newAdminCredits,
          totalCredits: user.credits + newAdminCredits,
        },
      });
    } catch (error: any) {
      console.error('Error giving credits:', error);
      return res.status(500).json({
        error: 'Failed to give credits',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/admin/remove-credits
   * Remove admin credits from a user
   */
  app.post('/api/admin/remove-credits', requireAuth, async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user is admin
      if (!isAdmin(req.user.email)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { userId, credits } = req.body;

      if (!userId || typeof credits !== 'number') {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'userId and credits (number) are required',
        });
      }

      if (credits <= 0) {
        return res.status(400).json({
          error: 'Invalid credits amount',
          message: 'Credits must be greater than 0',
        });
      }

      // Get current user data
      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (userResult.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult[0];

      // Can only remove admin credits, not purchased credits
      if (user.adminCredits < credits) {
        return res.status(400).json({
          error: 'Insufficient admin credits',
          message: `User only has ${user.adminCredits} admin credits. Cannot remove ${credits} credits.`,
        });
      }

      const newAdminCredits = user.adminCredits - credits;

      // Update user's admin credits
      await db
        .update(users)
        .set({
          adminCredits: newAdminCredits,
        })
        .where(eq(users.id, userId));

      console.log(`✅ Admin ${req.user.email} removed ${credits} credits from ${user.email}`);

      return res.json({
        success: true,
        message: `Successfully removed ${credits} credits from ${user.email}`,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          adminCredits: newAdminCredits,
          totalCredits: user.credits + newAdminCredits,
        },
      });
    } catch (error: any) {
      console.error('Error removing credits:', error);
      return res.status(500).json({
        error: 'Failed to remove credits',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/admin/check
   * Check if current user is an admin
   */
  app.get('/api/admin/check', optionalAuth, async (req: Request, res: Response) => {
    try {
      // Disable caching for this endpoint
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      console.log('=== ADMIN CHECK ENDPOINT HIT ===');

      if (!req.user) {
        console.log('No user in request');
        return res.json({ isAdmin: false });
      }

      console.log('User in request:', req.user);
      console.log('Checking admin status for email:', req.user.email);
      const adminStatus = isAdmin(req.user.email);
      console.log('Admin status result:', adminStatus);

      return res.json({
        isAdmin: adminStatus,
        email: req.user.email,
      });
    } catch (error: any) {
      console.error('Error checking admin status:', error);
      return res.status(500).json({
        error: 'Failed to check admin status',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/admin/analytics
   * Get sales and revenue analytics data
   */
  app.get('/api/admin/analytics', requireAuth, async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user is admin
      if (!isAdmin(req.user.email)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Get all transactions
      const allTransactions = await storage.getAllTransactions();

      // Calculate total revenue
      const totalRevenue = allTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Calculate total sales count
      const totalSales = allTransactions.length;

      // Group by date for chart data
      const salesByDate = allTransactions.reduce((acc, t) => {
        const date = t.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, count: 0 };
        }
        acc[date].revenue += parseFloat(t.amount);
        acc[date].count += 1;
        return acc;
      }, {} as Record<string, { date: string; revenue: number; count: number }>);

      const chartData = Object.values(salesByDate).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      // Include detailed transaction list with user info
      const transactionsWithUsers = await Promise.all(
        allTransactions.map(async (t) => {
          const user = await storage.getUser(t.userId);
          return {
            id: t.id,
            amount: parseFloat(t.amount),
            currency: t.currency,
            credits: t.credits,
            productName: t.productName,
            status: t.status,
            createdAt: t.createdAt,
            user: user ? { email: user.email, name: user.name } : null,
          };
        })
      );

      return res.json({
        success: true,
        summary: {
          totalRevenue,
          totalSales,
          averageOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0,
        },
        chartData,
        transactions: transactionsWithUsers,
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      return res.status(500).json({
        error: 'Failed to fetch analytics',
        message: error.message,
      });
    }
  });
}
