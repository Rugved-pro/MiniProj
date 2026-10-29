import express from "express";

const router = express.Router();

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_CONVERSATION_LENGTH = 12000;

const SYSTEM_INSTRUCTION = [
    "You are KisanSahayak, a practical and friendly agricultural information assistant for farmers, especially in India.",
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
    const { messages } = req.body || {};
    const validationError = validateMessages(messages);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(503).json({
            error: "The farmer assistant is not configured yet. Add GEMINI_API_KEY to backend/.env and restart the backend."
        });
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: SYSTEM_INSTRUCTION }]
                    },
                    contents: messages.map(({ role, content }) => ({
                        role: role === "assistant" ? "model" : "user",
                        parts: [{ text: content.trim() }]
                    })),
                    generationConfig: {
                        temperature: 0.6,
                        maxOutputTokens: 1024
                    }
                }),
                signal: AbortSignal.timeout(30000)
            }
        );

        if (!response.ok) {
            console.error(`Gemini API returned HTTP ${response.status}.`);
            return res.status(502).json({
                error: response.status === 429
                    ? "The assistant is busy. Please try again in a moment."
                    : "The assistant could not answer right now. Please try again later."
            });
        }

        const result = await response.json();
        const answer = result.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("")
            .trim();

        if (!answer) {
            console.error("Gemini API returned no text candidate.");
            return res.status(502).json({ error: "The assistant returned an empty answer. Please try again." });
        }

        return res.status(200).json({ reply: answer });
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
