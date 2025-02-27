import { Router } from 'express';
import { db } from '../db';
import { subscriptions, subscriptionSchema, users, creatorProfiles, contentPurchases } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import { requireAuth } from '../auth';

const router = Router();

// Get user's active subscriptions
router.get('/my', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    const activeSubscriptions = await db.query.subscriptions.findMany({
      where: (subscriptions, { and, eq, or, gt }) => and(
        eq(subscriptions.followerId, userId),
        eq(subscriptions.status, 'active'),
        or(
          eq(subscriptions.endDate, null),
          gt(subscriptions.endDate, new Date().toISOString())
        )
      ),
      with: {
        creator: {
          columns: {
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });

    res.json(activeSubscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions' });
  }
});

// Subscribe to a creator
router.post('/subscribe/:creatorId', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { creatorId } = req.params;

    // Validate subscription data
    const subscriptionData = subscriptionSchema.parse(req.body);

    // Check if creator exists and is approved
    const creator = await db.query.creatorProfiles.findFirst({
      where: (profiles, { and, eq }) => and(
        eq(profiles.userId, parseInt(creatorId)),
        eq(profiles.approvalStatus, 'approved')
      )
    });

    if (!creator) {
      return res.status(404).json({ message: 'Creator not found or not approved' });
    }

    // Check if user already has an active subscription
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: (subscriptions, { and, eq }) => and(
        eq(subscriptions.followerId, userId),
        eq(subscriptions.creatorId, parseInt(creatorId)),
        eq(subscriptions.status, 'active')
      )
    });

    if (existingSubscription) {
      return res.status(400).json({ message: 'Already subscribed to this creator' });
    }

    // Create subscription
    const [subscription] = await db.insert(subscriptions).values({
      followerId: userId,
      creatorId: parseInt(creatorId),
      type: subscriptionData.type,
      amount: subscriptionData.type === 'monthly' ? creator.monthlySubscriptionPrice : creator.perPostPrice,
      startDate: new Date().toISOString(),
      endDate: subscriptionData.type === 'monthly' ? 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : // 30 days for monthly
        null // null for per-post
    }).returning();

    res.status(201).json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Error creating subscription' });
  }
});

// Purchase individual content
router.post('/purchase/:contentId', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { contentId } = req.params;

    // Check if content exists and is premium
    const contentItem = await db.query.content.findFirst({
      where: (content, { and, eq }) => and(
        eq(content.id, parseInt(contentId)),
        eq(content.isPremium, true)
      )
    });

    if (!contentItem) {
      return res.status(404).json({ message: 'Premium content not found' });
    }

    // Check if user already purchased this content
    const existingPurchase = await db.query.contentPurchases.findFirst({
      where: (purchases, { and, eq }) => and(
        eq(purchases.contentId, parseInt(contentId)),
        eq(purchases.followerId, userId)
      )
    });

    if (existingPurchase) {
      return res.status(400).json({ message: 'Content already purchased' });
    }

    // Create purchase record
    const [purchase] = await db.insert(contentPurchases).values({
      contentId: parseInt(contentId),
      followerId: userId,
      amount: contentItem.price || 0,
      purchaseDate: new Date().toISOString()
    }).returning();

    res.status(201).json(purchase);
  } catch (error) {
    console.error('Error purchasing content:', error);
    res.status(500).json({ message: 'Error purchasing content' });
  }
});

// Cancel subscription
router.post('/cancel/:subscriptionId', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { subscriptionId } = req.params;

    // Check if subscription exists and belongs to user
    const subscription = await db.query.subscriptions.findFirst({
      where: (subscriptions, { and, eq }) => and(
        eq(subscriptions.id, parseInt(subscriptionId)),
        eq(subscriptions.followerId, userId)
      )
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Update subscription status
    await db.update(subscriptions)
      .set({ 
        status: 'cancelled',
        endDate: new Date().toISOString()
      })
      .where(eq(subscriptions.id, parseInt(subscriptionId)));

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: 'Error cancelling subscription' });
  }
});

export default router;
