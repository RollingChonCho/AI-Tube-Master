import { Router } from "express";
import { GetCreditsStatusResponse } from "@workspace/api-zod";
import { storage } from "../storage";

const router = Router();

router.get("/credits/status", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await storage.refreshFreeCreditsIfNeeded(req.user.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(
    GetCreditsStatusResponse.parse({
      credits: user.credits,
      plan: user.plan,
      totalUsed: user.totalCreditsUsed,
      resetAt: user.plan === "free" ? user.creditsResetAt.toISOString() : null,
    }),
  );
});

export default router;
