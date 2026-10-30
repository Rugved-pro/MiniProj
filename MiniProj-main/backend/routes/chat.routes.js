import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { verifyJwt } from "../utils/jwt.js";
import User from "../models/user.model.js";
import { getFarmerFieldContext, generateGroundedChatReply } from "../services/fieldIntelligence.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

const router = express.Router();

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_CONVERSATION_LENGTH = 12000;

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

    const { messages, district } = req.body || {};
    const trimmedMessages = Array.isArray(messages) && messages.length > MAX_MESSAGES
        ? messages.slice(-MAX_MESSAGES)
        : messages;

    const validationError = validateMessages(trimmedMessages);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        let user = null;
        const token = req.headers.authorization?.split(" ")[1] || req.cookies?.jwt;
        if (token) {
            try {
                const decoded = await verifyJwt(token, process.env.JWT_SECRET || "kisansahayak_local_jwt_secret_2026");
                if (decoded?.userId) {
                    user = await User.findById(decoded.userId).select("-password");
                }
            } catch (contextError) {
                console.warn("Could not extract farmer context for assistant:", contextError.message);
            }
        }

        const fieldContext = await getFarmerFieldContext(user, district || null);
        const { reply, source } = await generateGroundedChatReply({
            messages: trimmedMessages,
            fieldContext
        });

        return res.status(200).json({ reply, source });
    } catch (error) {
        console.error("Chat request failed:", error.message);
        return res.status(502).json({
            error: "The assistant is temporarily unavailable. Please try again later."
        });
    }
});

export default router;
