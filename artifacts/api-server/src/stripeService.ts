import { getUncachableStripeClient } from "./stripeClient";
import { storage } from "./storage";
import { logger } from "./lib/logger";

// Plan → credits mapping
export const PLAN_CREDITS: Record<string, number> = {
  starter: 100,
  pro: 500,
};

// Product metadata key that declares which plan it grants
export const PLAN_META_KEY = "plan";
export const CREDITS_META_KEY = "credits";

export class StripeService {
  async createCustomer(email: string | null, userId: string) {
    const stripe = await getUncachableStripeClient();
    return stripe.customers.create({ email: email ?? undefined, metadata: { userId } });
  }

  async createCheckoutSession(customerId: string, priceId: string, baseUrl: string, metadata: Record<string, string> = {}) {
    const stripe = await getUncachableStripeClient();
    return stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/pricing`,
      metadata,
    });
  }

  async createOneTimeCheckoutSession(customerId: string, priceId: string, baseUrl: string, metadata: Record<string, string> = {}) {
    const stripe = await getUncachableStripeClient();
    return stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/pricing`,
      metadata,
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
  }

  // Called after successful subscription checkout — update user plan + credits
  async handleSubscriptionActivated(stripeCustomerId: string, subscriptionId: string, plan: string) {
    const credits = PLAN_CREDITS[plan] ?? 0;
    // Find user by stripeCustomerId
    const result = await storage.getAllUsers(1000);
    const user = result.find((u) => u.stripeCustomerId === stripeCustomerId);
    if (!user) {
      logger.warn({ stripeCustomerId }, "No user found for stripe customer");
      return;
    }

    await storage.updateUserStripeInfo(user.id, {
      stripeSubscriptionId: subscriptionId,
      plan,
      credits,
    });

    await storage.logCreditTransaction({
      userId: user.id,
      amount: credits,
      type: "subscription_renewal",
      description: `${plan} plan activated — ${credits} credits granted`,
    });

    logger.info({ userId: user.id, plan, credits }, "Subscription activated");
  }

  // Called after successful one-time credit pack purchase
  async handleCreditPackPurchased(stripeCustomerId: string, credits: number, sessionId: string) {
    const result = await storage.getAllUsers(1000);
    const user = result.find((u) => u.stripeCustomerId === stripeCustomerId);
    if (!user) return;

    await storage.addCredits(user.id, credits);
    await storage.logCreditTransaction({
      userId: user.id,
      amount: credits,
      type: "purchase",
      description: `Credit pack — ${credits} credits purchased`,
      stripeSessionId: sessionId,
    });

    logger.info({ userId: user.id, credits }, "Credit pack purchased");
  }
}

export const stripeService = new StripeService();
