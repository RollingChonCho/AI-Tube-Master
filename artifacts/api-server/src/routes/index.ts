import { Router, type IRouter } from "express";
import healthRouter from "./health";
import youtubeRouter from "./youtube";
import generateRouter from "./generate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(youtubeRouter);
router.use(generateRouter);

export default router;
