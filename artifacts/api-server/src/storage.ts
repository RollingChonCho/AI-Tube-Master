import { db, usersTable, generationsTable, creditTransactionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import type { InsertGeneration } from "@workspace/db";

export class Storage {
  // ── Users ─────────────────────────────────────────────────────────────────

  async getUser(id: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return user ?? null;
  }

  async getAllUsers(limit = 100) {
    return db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit);
  }

  async updateUserStripeInfo(userId: string, info: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string | null;
    plan?: string;
    credits?: number;
  }) {
    const [user] = await db.update(usersTable).set({ ...info, updatedAt: new Date() }).where(eq(usersTable.id, userId)).returning();
    return user;
  }

  async deductCredit(userId: string): Promise<boolean> {
    // Atomic check-and-deduct
    const [user] = await db
      .update(usersTable)
      .set({ credits: sql`${usersTable.credits} - 1`, totalCreditsUsed: sql`${usersTable.totalCreditsUsed} + 1`, updatedAt: new Date() })
      .where(sql`${usersTable.id} = ${userId} AND ${usersTable.credits} > 0`)
      .returning();
    return !!user;
  }

  async addCredits(userId: string, amount: number) {
    const [user] = await db
      .update(usersTable)
      .set({ credits: sql`${usersTable.credits} + ${amount}`, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();
    return user;
  }

  // Reset free daily credits for a user if their reset window has passed
  async refreshFreeCreditsIfNeeded(userId: string) {
    const user = await this.getUser(userId);
    if (!user || user.plan !== "free") return user;

    const resetAt = new Date(user.creditsResetAt);
    const now = new Date();
    const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      const [updated] = await db
        .update(usersTable)
        .set({ credits: 3, creditsResetAt: new Date(), updatedAt: new Date() })
        .where(eq(usersTable.id, userId))
        .returning();
      return updated;
    }
    return user;
  }

  // ── Credit transactions ───────────────────────────────────────────────────

  async logCreditTransaction(data: {
    userId: string;
    amount: number;
    type: string;
    description?: string;
    stripeSessionId?: string;
  }) {
    await db.insert(creditTransactionsTable).values({
      userId: data.userId,
      amount: data.amount,
      type: data.type,
      description: data.description ?? null,
      stripeSessionId: data.stripeSessionId ?? null,
    });
  }

  // ── Generations ───────────────────────────────────────────────────────────

  async saveGeneration(data: InsertGeneration) {
    const [gen] = await db.insert(generationsTable).values(data).returning();
    return gen;
  }

  async getUserHistory(userId: string, limit = 20) {
    return db
      .select()
      .from(generationsTable)
      .where(eq(generationsTable.userId, userId))
      .orderBy(desc(generationsTable.createdAt))
      .limit(limit);
  }

  // ── Stripe (queries stripe schema managed by stripe-replit-sync) ──────────

  async getProduct(productId: string) {
    const result = await db.execute(sql`SELECT * FROM stripe.products WHERE id = ${productId}`);
    return result.rows[0] ?? null;
  }

  async listProductsWithPrices() {
    const result = await db.execute(sql`
      WITH paginated_products AS (
        SELECT id, name, description, metadata, active
        FROM stripe.products
        WHERE active = true
        ORDER BY id
      )
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.active as product_active,
        p.metadata as product_metadata,
        pr.id as price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring,
        pr.active as price_active
      FROM paginated_products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      ORDER BY p.id, pr.unit_amount
    `);
    return result.rows;
  }

  async getSubscription(subscriptionId: string) {
    const result = await db.execute(sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`);
    return result.rows[0] ?? null;
  }
}

export const storage = new Storage();
