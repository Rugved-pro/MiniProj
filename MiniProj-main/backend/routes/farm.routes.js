import express from "express";
import verifyToken from "../middlewares/auth.middleware.js";
import {
    getFarmProfile,
    updateFarmProfile,
    addPlot,
    updatePlot,
    deletePlot
} from "../controllers/farm.controller.js";

const router = express.Router();

router.use(verifyToken);

router.get("/profile", getFarmProfile);
router.put("/profile", updateFarmProfile);
router.post("/plots", addPlot);
router.put("/plots/:plotId", updatePlot);
router.delete("/plots/:plotId", deletePlot);

export default router;
