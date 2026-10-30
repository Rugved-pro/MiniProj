import express from "express";
import User from "../models/user.model.js";
import { getDistrictTelemetry, listAllDistricts } from "../services/fieldIntelligence.service.js";
import {
    getTelegramBotStatus,
    configureTelegramBotToken,
    ensureUserLinkCode,
    sendFieldReportToUserPhone,
    processTelegramUpdate
} from "../services/telegramBot.service.js";

const router = express.Router();

async function buildStatusResponse(userId) {
    const botStatus = getTelegramBotStatus();
    const botUsername = botStatus.botInfo?.username || "Kisan_Ceres_Bot";
    let user = null;
    let linkCode = "";

    if (userId) {
        user = await User.findById(userId).select("-password");
        if (user) {
            linkCode = await ensureUserLinkCode(user._id);
        }
    }

    const deepLink = linkCode
        ? `https://t.me/${botUsername}?start=link_${linkCode}`
        : `https://t.me/${botUsername}`;

    return {
        configured: botStatus.configured,
        botOnline: botStatus.isRunning && Boolean(botStatus.botInfo),
        botInfo: botStatus.botInfo || { username: botUsername, first_name: "Kisan" },
        lastError: botStatus.lastError || null,
        botUrl: `https://t.me/${botUsername}`,
        deepLink,
        linkCode,
        userLinked: Boolean(user?.telegramChatId),
        telegramChatId: user?.telegramChatId || "",
        telegramUsername: user?.telegramUsername || "",
        telegramLinkedAt: user?.telegramLinkedAt || "",
        district: user?.district || "PUNE",
        phoneno: user?.phoneno || ""
    };
}

router.get("/status", async (req, res) => {
    try {
        const userId = req.query.userId || "";
        const data = await buildStatusResponse(userId);
        return res.status(200).json(data);
    } catch (err) {
        console.error("Error in GET /telegram/status:", err.message);
        return res.status(500).json({ error: "Failed to fetch Telegram bot status" });
    }
});

router.get("/status/:userId", async (req, res) => {
    try {
        const data = await buildStatusResponse(req.params.userId);
        return res.status(200).json(data);
    } catch (err) {
        console.error("Error in GET /telegram/status/:userId:", err.message);
        return res.status(500).json({ error: "Failed to fetch Telegram bot status" });
    }
});

router.get("/districts", (req, res) => {
    return res.status(200).json({ districts: listAllDistricts() });
});

router.post("/configure", async (req, res) => {
    try {
        const { token, userId } = req.body || {};
        const result = await configureTelegramBotToken(token);
        if (!result.ok) {
            return res.status(400).json({ error: result.error || "Failed to configure Telegram bot token" });
        }
        const status = await buildStatusResponse(userId);
        return res.status(200).json({
            message: `Connected to @${result.botInfo.username} successfully!`,
            ...status
        });
    } catch (err) {
        console.error("Error in POST /telegram/configure:", err.message);
        return res.status(500).json({ error: "Failed to configure Telegram bot" });
    }
});

router.post("/district", async (req, res) => {
    try {
        const { userId, district } = req.body || {};
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }
        const telemetry = getDistrictTelemetry(district || "PUNE");
        const updated = await User.findByIdAndUpdate(userId, { district: telemetry.district });
        if (!updated) {
            return res.status(404).json({ error: "User not found" });
        }
        const status = await buildStatusResponse(userId);
        return res.status(200).json({
            message: `Field district set to ${telemetry.district}`,
            telemetry,
            ...status
        });
    } catch (err) {
        console.error("Error in POST /telegram/district:", err.message);
        return res.status(500).json({ error: "Failed to update district" });
    }
});

router.post("/unlink", async (req, res) => {
    try {
        const { userId } = req.body || {};
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }
        await User.findByIdAndUpdate(userId, {
            telegramChatId: "",
            telegramUsername: "",
            telegramLinkedAt: ""
        });
        const status = await buildStatusResponse(userId);
        return res.status(200).json({
            message: "Telegram account unlinked",
            ...status
        });
    } catch (err) {
        console.error("Error in POST /telegram/unlink:", err.message);
        return res.status(500).json({ error: "Failed to unlink Telegram account" });
    }
});

router.post("/send-report", async (req, res) => {
    try {
        const { userId, district } = req.body || {};
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }
        const result = await sendFieldReportToUserPhone(userId, district || null);
        if (!result.ok) {
            return res.status(400).json({ error: result.error });
        }
        return res.status(200).json({
            message: "Field intelligence report sent to your Telegram phone!"
        });
    } catch (err) {
        console.error("Error in POST /telegram/send-report:", err.message);
        return res.status(500).json({ error: "Failed to send field report to Telegram" });
    }
});

router.post("/webhook", async (req, res) => {
    try {
        if (req.body) {
            await processTelegramUpdate(req.body);
        }
        return res.status(200).json({ ok: true });
    } catch {
        return res.status(200).json({ ok: true });
    }
});

export default router;
