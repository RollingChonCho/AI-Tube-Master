import { Router } from "express";
import { storage } from "../storage";

const router = Router();

function isAdmin(req: any): boolean {
  return req.isAuthenticated() && (req.user.isAdmin === 1 || process.env.ADMIN_USER_ID === req.user.id);
}

router.get("/admin/users", async (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const users = await storage.getAllUsers(200);
  res.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      profileImageUrl: u.profileImageUrl,
      plan: u.plan,
      credits: u.credits,
      isAdmin: u.isAdmin,
    })),
    total: users.length,
  });
});

export default router;
