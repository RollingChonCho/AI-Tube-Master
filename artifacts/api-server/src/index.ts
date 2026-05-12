import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

async function initStripe() {
  try {
    const { runMigrations } = await import("stripe-replit-sync");
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) { logger.warn("DATABASE_URL not set — skipping Stripe init"); return; }

    await runMigrations({ databaseUrl, schema: "stripe" });
    logger.info("Stripe schema ready");

    const { getStripeSync } = await import("./stripeClient");
    const stripeSync = await getStripeSync();
    const domains = process.env.REPLIT_DOMAINS?.split(",") ?? [];
    const webhookBase = domains[0] ? `https://${domains[0]}` : null;
    if (webhookBase) {
      const result = await stripeSync.findOrCreateManagedWebhook(`${webhookBase}/api/stripe/webhook`);
      logger.info({ url: result?.webhook?.url }, "Stripe webhook configured");
    }
    stripeSync.syncBackfill()
      .then(() => logger.info("Stripe data synced"))
      .catch((err: unknown) => logger.warn({ err }, "Stripe backfill error"));
  } catch (err) {
    logger.warn({ err }, "Stripe init skipped — connect integration to enable payments");
  }
}

initStripe();

app.listen(port, (err?: Error) => {
  if (err) { logger.error({ err }, "Listen error"); process.exit(1); }
  logger.info({ port }, "ThumbBoost AI server listening");
});
