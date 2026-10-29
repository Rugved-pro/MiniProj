import "./sentry/instrument.js";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import * as Sentry from "@sentry/node";

import { client } from "./redis/client.js";
import connectToMongoDB from "./db/connectToMongoDB.js";
import stripe from "./stripe/stripeInit.js";

import authRoutes from "./routes/auth.routes.js";
import predictionRoutes from "./routes/predictions.routes.js";
import elevatedUserRoutes from "./routes/elevatedUser.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";
import marketplaceRoutes from "./routes/marketplace.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const PORT = process.env.PORT || 5000;

const app = express();
const corOpts = {
    origin: '*',
    methods: [
        'GET',
        'POST',
        'PATCH',
        'DELETE'
    ],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'baggage',
        'sentry-trace'
    ],
    credentials: true
};

app.use(cors(corOpts));
app.use(bodyParser.json({ limit: '1000mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '1000mb', extended: true }));
app.use(express.json({ limit: '1000mb' }));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(cookieParser());
app.use("/uploads", express.static(UPLOADS_DIR));

// Local image upload endpoint
app.post("/api/v1/upload-image", (req, res) => {
    try {
        const { image } = req.body;
        if (!image || typeof image !== "string") {
            return res.status(400).json({ error: "No image provided" });
        }
        const match = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        const ext = match ? (match[1] === "jpeg" ? "jpg" : match[1]) : "jpg";
        const base64Data = match ? match[2] : image;
        const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
        const host = req.get("host") || `localhost:${PORT}`;
        const protocol = req.protocol || "http";
        const secure_url = `${protocol}://${host}/uploads/${filename}`;
        return res.status(200).json({ secure_url });
    } catch (err) {
        console.error("Error saving local image:", err);
        return res.status(500).json({ error: "Failed to save image locally" });
    }
});

// Sentry setup
app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
});

Sentry.setupExpressErrorHandler(app);

app.get("/api/v1", (req, res) => {
    res.send("<h1>Server Up & Running</h1>");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/predictions", predictionRoutes);
app.use("/api/v1/elevatedUser", elevatedUserRoutes);
app.use("/api/v1/dashboard", analysisRoutes);
app.use("/api/v1/marketplace", marketplaceRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/admin", adminRoutes);

async function ensureMLServerRunning() {
    const mlUrl = process.env.ML_URL || "http://127.0.0.1:8000";
    try {
        const res = await fetch(`${mlUrl}/`);
        if (res.ok) {
            console.log(`ML Server already running at ${mlUrl}`);
            return;
        }
    } catch {
        // Not running yet, spawn it automatically
    }

    const mlDir = path.join(__dirname, "../ML");
    if (fs.existsSync(path.join(mlDir, "app.py"))) {
        console.log("Starting local Python ML Server on port 8000...");
        const mlProc = spawn("python", ["-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", "8000"], {
            cwd: mlDir,
            stdio: "inherit",
            shell: true
        });
        mlProc.on("error", (err) => {
            console.warn("Could not auto-start ML server:", err.message);
        });
    }
}

app.listen(PORT, () => {
    console.log(`Server listening on PORT: ${PORT}`);

    connectToMongoDB();

    if (client) {
        console.log("Initialized Local Cache");
    }

    if (stripe) {
        console.log("Stripe Initialized");
    } else {
        console.log("Using Local Checkout Mode (Stripe not configured)");
    }

    ensureMLServerRunning();
});