import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import youtubeRouter from "./youtube";
import generateRouter from "./generate";
import creditsRouter from "./credits";
import historyRouter from "./history";
import stripeRouter from "./stripe";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(youtubeRouter);
router.use(generateRouter);
router.use(creditsRouter);
router.use(historyRouter);
router.use(stripeRouter);
router.use(adminRouter);

export default router;
