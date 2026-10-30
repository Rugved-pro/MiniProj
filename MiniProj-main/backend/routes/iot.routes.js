import express from "express";
import verifyToken from "../middlewares/auth.middleware.js";
import {
    getFieldReadings,
    submitManualReading,
    ingestHardwareWebhook
} from "../controllers/iot.controller.js";

const router = express.Router();

// Readings endpoint (handles optional token for personalization, but also works for guest/demo)
router.get("/readings", async (req, res, next) => {
    // If auth header present, verify token, otherwise proceed as guest
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.jwt;
    if (token) {
        return verifyToken(req, res, next);
    }
    next();
}, getFieldReadings);

// Submit manual reading requires authentication
router.post("/manual", verifyToken, submitManualReading);

// Ingestion webhook for hardware sensor node
router.post("/webhook", ingestHardwareWebhook);

export default router;
