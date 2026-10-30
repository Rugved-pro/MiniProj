import express from "express";
import verifyToken from "../middlewares/auth.middleware.js";
import {
    getMandiPrices,
    getAvailableCropsAndStates,
    getMandiWatchlist,
    toggleMandiWatchlist
} from "../controllers/mandi.controller.js";

const router = express.Router();

router.get("/prices", getMandiPrices);
router.get("/options", getAvailableCropsAndStates);

// Authenticated watchlist routes
router.get("/watchlist", verifyToken, getMandiWatchlist);
router.post("/watchlist/toggle", verifyToken, toggleMandiWatchlist);

export default router;
