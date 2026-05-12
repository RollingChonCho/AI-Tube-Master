import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get("/history", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const items = await storage.getUserHistory(req.user.id, 30);

  res.json({
    items: items.map((g) => ({
      id: g.id,
      topic: g.topic,
      sourceUrl: g.sourceUrl,
      titles: g.titles,
      description: g.description,
      tags: g.tags,
      thumbnails: g.thumbnails,
      provider: g.provider,
      createdAt: g.createdAt.toISOString(),
    })),
  });
});

export default router;
