import express from "express";
import verifyToken from "../middlewares/auth.middleware.js";
import {
    predictCropYield,
    simulateHarvestImpact,
    getFertilizerRecommendation,
    getCropCalendar,
    getDailyTasks,
    toggleTask,
    addTask
} from "../controllers/intelligence.controller.js";

const router = express.Router();

// Public / reference endpoints
router.post("/yield-prediction", predictCropYield);
router.post("/harvest-simulator", simulateHarvestImpact);
router.get("/fertilizer", getFertilizerRecommendation);
router.get("/crop-calendar", getCropCalendar);

// Authenticated farmer task endpoints
router.get("/tasks", verifyToken, getDailyTasks);
router.patch("/tasks/:taskId/toggle", verifyToken, toggleTask);
router.post("/tasks", verifyToken, addTask);

export default router;
