import { Router } from "express";
import { storage } from "../storage";
import { stripeService } from "../stripeService";
import { logger } from "../lib/logger";

const router = Router();

function getBaseUrl(req: any): string {
  const domains = process.env.REPLIT_DOMAINS?.split(",") ?? [];
  if (domains.length > 0) return `https://${domains[0]}`;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

// GET /api/stripe/products-with-prices
router.get("/stripe/products-with-prices", async (_req, res) => {
  try {
    const rows = await storage.listProductsWithPrices();
    const map = new Map<string, any>();
    for (const row of rows as any[]) {
      if (!map.has(row.product_id)) {
        map.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          active: row.product_active,
          prices: [],
        });
      }
      if (row.price_id) {
        map.get(row.product_id).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
          active: row.price_active,
        });
      }
    }
    res.json({ data: Array.from(map.values()) });
  } catch (err) {
    logger.error({ err }, "Failed to list products");
    res.json({ data: [] });
  }
});

// POST /api/stripe/checkout
router.post("/stripe/checkout", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { priceId } = req.body as { priceId?: string };
  if (!priceId) {
    res.status(400).json({ error: "priceId is required" });
    return;
  }

  try {
    let user = await storage.getUser(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!user.stripeCustomerId) {
      const customer = await stripeService.createCustomer(user.email, user.id);
      await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
      user = { ...user, stripeCustomerId: customer.id };
    }

    const baseUrl = getBaseUrl(req);

    let session: any;
    try {
      const { getUncachableStripeClient } = await import("../stripeClient");
      const stripe = await getUncachableStripeClient();
      const price = await stripe.prices.retrieve(priceId);
      if (price.recurring) {
        session = await stripeService.createCheckoutSession(user.stripeCustomerId!, priceId, baseUrl, { userId: user.id });
      } else {
        session = await stripeService.createOneTimeCheckoutSession(user.stripeCustomerId!, priceId, baseUrl, { userId: user.id });
      }
    } catch {
      session = await stripeService.createCheckoutSession(user.stripeCustomerId!, priceId, baseUrl, { userId: user.id });
    }

    res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Failed to create checkout session");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// POST /api/stripe/portal
router.post("/stripe/portal", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await storage.getUser(req.user.id);
  if (!user?.stripeCustomerId) {
    res.status(400).json({ error: "No billing account found" });
    return;
  }

  try {
    const session = await stripeService.createCustomerPortalSession(user.stripeCustomerId, `${getBaseUrl(req)}/dashboard`);
    res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Failed to create portal session");
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

// GET /api/stripe/subscription
router.get("/stripe/subscription", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await storage.getUser(req.user.id);
  if (!user?.stripeSubscriptionId) {
    res.json({ subscription: null });
    return;
  }

  try {
    const sub = await storage.getSubscription(user.stripeSubscriptionId);
    res.json({ subscription: sub });
  } catch {
    res.json({ subscription: null });
  }
});

export default router;
