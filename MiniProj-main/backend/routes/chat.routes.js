import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { verifyJwt } from "../utils/jwt.js";
import Farm from "../models/farm.model.js";
import Prediction from "../models/prediction.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

const router = express.Router();

const DEFAULT_MODEL = "gemini-3.5-flash";
const FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_CONVERSATION_LENGTH = 12000;

const SYSTEM_INSTRUCTION = [
    "You are Ceres, an evidence-based agricultural intelligence assistant, a practical and friendly agricultural information assistant for farmers, especially in India.",
    "Answer clearly and in the language the user uses. Prefer concise, step-by-step guidance.",
    "For crop advice, ask for the crop, growth stage, location, and symptoms when these details materially affect the answer.",
    "Do not claim to diagnose a crop with certainty from a text description. Explain uncertainty and suggest a local agricultural extension officer or KVK for serious outbreaks.",
    "For pesticides and other chemicals, do not invent product approvals or give unsafe mixing instructions. Recommend following the product label and local agricultural authority guidance.",
    "For urgent human or animal health, poisoning, or immediate physical danger, direct the user to local emergency services or a qualified professional.",
    "Do not claim to have live weather, market prices, or access to the user's farm data unless the user provides it."
].join(" ");

function validateMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
        return "Send between 1 and 12 messages.";
    }

    let totalLength = 0;
    for (const message of messages) {
        if (
            !message ||
            typeof message !== "object" ||
            !["user", "assistant"].includes(message.role) ||
            typeof message.content !== "string" ||
            message.content.trim().length === 0 ||
            message.content.length > MAX_MESSAGE_LENGTH
        ) {
            return "Each message must contain a supported role and text of up to 4,000 characters.";
        }
        totalLength += message.content.length;
    }

    if (messages[messages.length - 1].role !== "user") {
        return "The conversation must end with a user message.";
    }
    if (totalLength > MAX_CONVERSATION_LENGTH) {
        return "The conversation is too long. Start a new chat.";
    }

    return null;
}

router.post("/", async (req, res) => {
    dotenv.config({ path: envPath, override: true });

    const { messages } = req.body || {};
    const trimmedMessages = Array.isArray(messages) && messages.length > MAX_MESSAGES
        ? messages.slice(-MAX_MESSAGES)
        : messages;

    const validationError = validateMessages(trimmedMessages);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const rawApiKey = process.env.GEMINI_API_KEY || "";
    const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, "");
    if (!apiKey) {
        return res.status(503).json({
            error: "The farmer assistant is not configured yet. Add GEMINI_API_KEY to backend/.env and restart the backend."
        });
    }

    const configuredModel = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();
    const modelsToTry = [
        configuredModel,
        ...FALLBACK_MODELS.filter((m) => m !== configuredModel)
    ];

    let contextualInstruction = SYSTEM_INSTRUCTION;
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.jwt;
    if (token) {
        try {
            const decoded = await verifyJwt(token, process.env.JWT_SECRET || "kisansahayak_local_jwt_secret_2026");
            if (decoded?.userId) {
                const farm = await Farm.findOne({ userId: decoded.userId });
                const recentScan = await Prediction.findOne({ userId: decoded.userId });
                if (farm) {
                    const activePlot = farm.plots?.find(p => p._id === farm.activePlotId) || farm.plots?.[0];
                    contextualInstruction += `\n\nCURRENT AUTHENTICATED FARMER CONTEXT:\n- Farmer Name: ${farm.farmerName}\n- Location: ${farm.district}, ${farm.state}\n- Active Field: ${activePlot?.name || "Main Field"} (${activePlot?.area || ""} ${activePlot?.areaUnit || ""})\n- Current Crop: ${activePlot?.crop || "Not specified"}\n- Growth Stage: ${activePlot?.growthStage || "Vegetative"}\n- Soil Type: ${activePlot?.soilType || "Loamy"}\n- Irrigation: ${activePlot?.irrigationMethod || "Drip"}\n- Preferred Language: ${farm.preferredLanguage || "en"}`;
                }
                if (recentScan) {
                    contextualInstruction += `\n- Recent Plant Health Observation: ${recentScan.crop} diagnosed as ${recentScan.disease} in ${recentScan.location}`;
                }
            }
        } catch (ctxErr) {
            console.warn("Could not extract farm context for assistant:", ctxErr.message);
        }
    }
    if (req.body?.clientContext && typeof req.body.clientContext === "string") {
        contextualInstruction += `\n- Current Session Context: ${req.body.clientContext.slice(0, 500)}`;
    }

    const requestBody = JSON.stringify({
        systemInstruction: {
            parts: [{ text: contextualInstruction }]
        },
        contents: trimmedMessages.map(({ role, content }) => ({
            role: role === "assistant" ? "model" : "user",
            parts: [{ text: content.trim() }]
        })),
        generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 2048
        }
    });

    try {
        let lastResponse = null;
        let lastErrorBody = null;

        for (const model of modelsToTry) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key": apiKey
                        },
                        body: requestBody,
                        signal: AbortSignal.timeout(20000)
                    }
                );

                if (response.ok) {
                    const result = await response.json();
                    const answer = result.candidates?.[0]?.content?.parts
                        ?.filter((part) => !part.thought)
                        .map((part) => part.text || "")
                        .join("")
                        .trim();

                    if (answer) {
                        return res.status(200).json({ reply: answer });
                    }
                } else {
                    lastResponse = response;
                    lastErrorBody = await response.json().catch(() => null);
                    if (response.status === 401 || response.status === 403 || response.status === 429) {
                        break;
                    }
                }
            } catch (modelError) {
                console.warn(`Gemini model ${model} failed:`, modelError.message);
                if (model === modelsToTry[modelsToTry.length - 1]) {
                    throw modelError;
                }
            }
        }

        const status = lastResponse?.status || 502;
        const apiErrorMessage = lastErrorBody?.error?.message || "";
        console.error(`Gemini API returned HTTP ${status}:`, apiErrorMessage || lastErrorBody);

        return res.status(502).json({
            error: status === 429
                ? "The assistant is busy. Please try again in a moment."
                : apiErrorMessage
                    ? `Assistant error: ${apiErrorMessage}`
                    : "The assistant could not answer right now. Please try again later."
        });
    } catch (error) {
        console.error("Gemini chat request failed:", error.message);
        const timedOut = error.name === "TimeoutError" || error.name === "AbortError";
        return res.status(timedOut ? 504 : 502).json({
            error: timedOut
                ? "The assistant took too long to respond. Please try again."
                : "The assistant is temporarily unavailable. Please try again later."
        });
    }
});

export default router;
