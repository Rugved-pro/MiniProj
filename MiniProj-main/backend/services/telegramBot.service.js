import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import User from "../models/user.model.js";
import Prediction from "../models/predictions.model.js";
import { client } from "../redis/client.js";
import {
    getDistrictTelemetry,
    getLiveWeatherAndRisk,
    evaluateSoilIrrigation,
    getRegionalForecast,
    getFarmerFieldContext,
    getMarketplaceItems,
    generateGroundedChatReply,
    updateEnvFile
} from "./fieldIntelligence.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

// Per-chat state in memory (conversation history & unlinked district preference)
const chatSessions = new Map();

let botState = {
    token: "",
    isRunning: false,
    botInfo: null,
    lastError: null,
    offset: 0,
    pollAbortController: null,
    pollTimer: null
};

function getSession(chatId) {
    const key = String(chatId);
    if (!chatSessions.has(key)) {
        chatSessions.set(key, {
            district: "PUNE",
            messages: []
        });
    }
    return chatSessions.get(key);
}

function escapeHtml(str = "") {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function formatForTelegramHtml(markdownText = "") {
    let escaped = escapeHtml(markdownText);
    // Convert **bold** to <b>bold</b>
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    // Convert `code` to <code>code</code>
    escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
    return escaped;
}

const MAIN_INLINE_KEYBOARD = {
    inline_keyboard: [
        [
            { text: "🌾 My Field Report", callback_data: "cmd:myfield" },
            { text: "🌦️ Weather & Risk", callback_data: "cmd:weather" }
        ],
        [
            { text: "📋 Recent Scans", callback_data: "cmd:history" },
            { text: "💧 Soil & FAO-56", callback_data: "cmd:soil" }
        ],
        [
            { text: "🌱 Crop Forecast", callback_data: "cmd:recommend" },
            { text: "🛒 Marketplace", callback_data: "cmd:market" }
        ]
    ]
};

async function telegramApi(method, body = null, timeoutMs = 30000) {
    if (!botState.token) {
        throw new Error("TELEGRAM_BOT_TOKEN is not configured");
    }
    const url = `https://api.telegram.org/bot${botState.token}/${method}`;
    const options = {
        method: body ? "POST" : "GET",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs)
    };
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }));
    if (!data.ok) {
        throw new Error(data.description || `Telegram API ${method} failed`);
    }
    return data.result;
}

export async function sendTelegramMessage(chatId, htmlText, extra = {}) {
    try {
        return await telegramApi("sendMessage", {
            chat_id: chatId,
            text: htmlText,
            parse_mode: "HTML",
            disable_web_page_preview: true,
            ...extra
        });
    } catch {
        // Fallback to plain text if HTML tags had an issue
        const plain = String(htmlText).replace(/<[^>]+>/g, "");
        return await telegramApi("sendMessage", {
            chat_id: chatId,
            text: plain,
            disable_web_page_preview: true,
            ...extra
        });
    }
}

async function findLinkedUser(chatId) {
    return await User.findOne({ telegramChatId: String(chatId) }).select("-password");
}

export async function ensureUserLinkCode(userId) {
    const user = await User.findById(userId);
    if (!user) return null;
    if (!user.telegramLinkCode || user.telegramLinkCode.length < 6) {
        const code = crypto.randomBytes(3).toString("hex").toUpperCase();
        await User.findByIdAndUpdate(user._id, { telegramLinkCode: code });
        return code;
    }
    return user.telegramLinkCode;
}

async function linkChatToUser(user, chat) {
    const chatIdStr = String(chat.id);
    const username = chat.username || chat.first_name || "Farmer";
    const now = new Date().toISOString();

    // Clear any previous user linked to this same chatId
    const existing = await User.find({ telegramChatId: chatIdStr });
    for (const prev of existing) {
        if (String(prev._id) !== String(user._id)) {
            await User.findByIdAndUpdate(prev._id, {
                telegramChatId: "",
                telegramUsername: ""
            });
        }
    }

    const updated = await User.findByIdAndUpdate(user._id, {
        telegramChatId: chatIdStr,
        telegramUsername: username,
        telegramLinkedAt: now
    });

    const session = getSession(chatIdStr);
    if (updated?.district) {
        session.district = updated.district;
    }

    return updated;
}

export async function buildFieldSummaryHtml(user, sessionDistrict = "PUNE") {
    const ctx = await getFarmerFieldContext(user, user?.district || sessionDistrict);
    const { telemetry, weather, recentScans } = ctx;
    const latestScan = recentScans[0] || null;

    const riskEmoji = weather.riskLevel === "Elevated" ? "⚠️" : "✅";
    const lines = [
        `🌾 <b>Ceres Field Intelligence Report</b>`,
        `━━━━━━━━━━━━━━━━━━━━`,
        user
            ? `👤 <b>Farmer:</b> ${escapeHtml(user.name)} (${escapeHtml(user.phoneno)})\n🌱 <b>Registered Crops:</b> ${escapeHtml((user.crops || []).join(", ") || "None")}`
            : `👤 <b>Mode:</b> Guest Field View <i>(Use /link &lt;phone&gt; to link account)</i>`,
        `📍 <b>Field District:</b> ${escapeHtml(telemetry.district)}`,
        ``,
        `🌦️ <b>Live Microclimate (${escapeHtml(weather.source)}):</b>`,
        `• <b>Temperature:</b> ${weather.temperatureC}°C`,
        `• <b>Relative Humidity:</b> ${weather.humidity}%`,
        `• <b>Wind Speed:</b> ${weather.windSpeed} km/h`,
        ``,
        `${riskEmoji} <b>${escapeHtml(weather.riskTitle)}:</b>`,
        `<i>${escapeHtml(weather.riskAdvice)}</i>`,
        ``,
        `🧪 <b>District Soil &amp; Rainfall Benchmark:</b>`,
        `• <b>Soil pH:</b> ${telemetry.soil_pH} — ${escapeHtml(telemetry.phStatus)}`,
        `• <b>Nutrients (Index):</b> N: ${telemetry.soil_N} | P: ${telemetry.soil_P} | K: ${telemetry.soil_K}`,
        `• <b>Rainfall:</b> ${telemetry.rainActual} mm (Normal: ${telemetry.rainNormal} mm, ${escapeHtml(telemetry.rainStatus)})`
    ];

    if (latestScan) {
        const isHealthy = !latestScan.disease || latestScan.disease.toLowerCase() === "healthy";
        lines.push(
            ``,
            `🔬 <b>Latest Crop Leaf Assessment:</b>`,
            `• <b>Crop:</b> ${escapeHtml(latestScan.crop)}`,
            `• <b>Diagnosis:</b> ${isHealthy ? "✅ Healthy" : `🔴 ${escapeHtml(latestScan.disease.replace(/_/g, " "))}`}`,
            latestScan.pesticides?.length
                ? `• <b>Treatments:</b> ${escapeHtml(latestScan.pesticides.join(", "))}`
                : `• <b>Status:</b> No fungicide treatment required`
        );
    } else {
        lines.push(
            ``,
            `📷 <b>Tip:</b> Send a <b>photo of a crop leaf</b> directly here in Telegram for an instant Vision Transformer disease diagnosis!`
        );
    }

    return lines.join("\n");
}

async function handleStartCommand(chat, argsText) {
    const chatId = chat.id;
    const session = getSession(chatId);
    const arg = String(argsText || "").trim();

    if (arg) {
        let matchedUser = null;
        if (arg.startsWith("link_")) {
            const code = arg.replace(/^link_/i, "").trim().toUpperCase();
            matchedUser = await User.findOne({ telegramLinkCode: code });
        } else if (arg.startsWith("phone_")) {
            const phone = arg.replace(/^phone_/i, "").replace(/\D/g, "").slice(-10);
            matchedUser = await User.findOne({ phoneno: phone });
        } else if (/^\d{10}$/.test(arg)) {
            matchedUser = await User.findOne({ phoneno: arg });
        } else {
            matchedUser = await User.findOne({ telegramLinkCode: arg.toUpperCase() });
        }

        if (matchedUser) {
            const linked = await linkChatToUser(matchedUser, chat);
            const reportHtml = await buildFieldSummaryHtml(linked, session.district);
            await sendTelegramMessage(
                chatId,
                `✅ <b>Account Linked Successfully!</b>\nWelcome back, <b>${escapeHtml(linked.name)}</b>! Your KisanSahayak (Ceres) profile is now connected to your phone.\n\n${reportHtml}`,
                { reply_markup: MAIN_INLINE_KEYBOARD }
            );
            return;
        }
    }

    const existingUser = await findLinkedUser(chatId);
    if (existingUser) {
        const reportHtml = await buildFieldSummaryHtml(existingUser, session.district);
        await sendTelegramMessage(
            chatId,
            `🙏 <b>Namaste ${escapeHtml(existingUser.name)}!</b>\nWelcome back to <b>Ceres (KisanSahayak) Field Intelligence Bot</b>.\n\n${reportHtml}`,
            { reply_markup: MAIN_INLINE_KEYBOARD }
        );
        return;
    }

    const welcomeHtml = [
        `🌾 <b>Namaste! Welcome to Ceres (KisanSahayak) Field Bot</b>`,
        `<i>Your direct phone companion for field telemetry, crop disease diagnosis, FAO-56 irrigation rules, and AI agricultural advice.</i>`,
        ``,
        `🔗 <b>Link Your KisanSahayak Account:</b>`,
        `Send your registered 10-digit mobile number:`,
        `<code>/link 9004699510</code>`,
        `<i>(or tap the "Share My Phone Number" button below, or link with 1-click from your Web Profile)</i>`,
        ``,
        `⚡ <b>Available Features on Your Phone:</b>`,
        `• /myfield — Full field telemetry, soil NPK/pH &amp; crop status`,
        `• /weather — Live temperature, humidity &amp; fungal spore risk`,
        `• /history — Your saved leaf disease diagnoses &amp; treatments`,
        `• /soil — FAO-56 soil moisture &amp; irrigation calculator`,
        `• /recommend — Regional crop &amp; disease ML forecast`,
        `• /district <code>PUNE</code> — Switch active field district`,
        `• /market — Browse seeds &amp; fungicides`,
        `• 📷 <b>Send a Leaf Photo</b> — Instant crop disease scan`,
        `• 💬 <b>Ask Anything</b> — Chat in English, Hindi, or Marathi!`
    ].join("\n");

    await sendTelegramMessage(chatId, welcomeHtml, {
        reply_markup: MAIN_INLINE_KEYBOARD
    });
}

async function handleLinkCommand(chat, argsText) {
    const chatId = chat.id;
    const raw = String(argsText || "").trim();
    if (!raw) {
        await sendTelegramMessage(
            chatId,
            `🔗 <b>Link Your Farmer Account</b>\n\nPlease send your 10-digit registered mobile number or link code:\n• Example: <code>/link 9004699510</code>\n• Or tap the button below to share your Telegram phone number automatically:`,
            {
                reply_markup: {
                    keyboard: [
                        [{ text: "📱 Share My Phone Number to Link", request_contact: true }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            }
        );
        return;
    }

    const digits = raw.replace(/\D/g, "");
    let matchedUser = null;

    if (digits.length >= 10) {
        const last10 = digits.slice(-10);
        matchedUser = await User.findOne({ phoneno: last10 });
    }
    if (!matchedUser) {
        const cleanCode = raw.replace(/^link_/i, "").trim().toUpperCase();
        matchedUser = await User.findOne({ telegramLinkCode: cleanCode });
    }

    if (!matchedUser) {
        await sendTelegramMessage(
            chatId,
            `❌ Could not find a KisanSahayak account matching <code>${escapeHtml(raw)}</code>.\n\n• Make sure you entered the 10-digit phone number registered on KisanSahayak.\n• Or open your <b>Profile</b> on the web app and click <b>Connect Telegram</b>.`,
            { reply_markup: MAIN_INLINE_KEYBOARD }
        );
        return;
    }

    const linked = await linkChatToUser(matchedUser, chat);
    const session = getSession(chatId);
    const reportHtml = await buildFieldSummaryHtml(linked, session.district);

    await sendTelegramMessage(
        chatId,
        `✅ <b>Linked to ${escapeHtml(linked.name)}'s Field Account!</b>\nRegistered Crops: <b>${escapeHtml((linked.crops || []).join(", "))}</b>\n\n${reportHtml}`,
        {
            reply_markup: MAIN_INLINE_KEYBOARD
        }
    );
}

async function handleUnlinkCommand(chatId) {
    const user = await findLinkedUser(chatId);
    if (!user) {
        await sendTelegramMessage(chatId, `ℹ️ Your Telegram chat is not currently linked to any account.`);
        return;
    }
    await User.findByIdAndUpdate(user._id, {
        telegramChatId: "",
        telegramUsername: ""
    });
    await sendTelegramMessage(
        chatId,
        `🔓 Unlinked from <b>${escapeHtml(user.name)}</b>'s account. You can re-link anytime using <code>/link &lt;phone_number&gt;</code>.`
    );
}

async function handleWeatherCommand(chatId, argsText) {
    const user = await findLinkedUser(chatId);
    const session = getSession(chatId);
    const requestedDistrict = String(argsText || "").trim() || user?.district || session.district || "PUNE";
    const telemetry = getDistrictTelemetry(requestedDistrict);
    const weather = await getLiveWeatherAndRisk(telemetry.district);

    session.district = telemetry.district;

    const riskBadge = weather.riskLevel === "Elevated" ? "🟠 ELEVATED RISK" : "🟢 LOW RISK";
    const html = [
        `🌦️ <b>Live Field Microclimate &amp; Risk — ${escapeHtml(telemetry.district)}</b>`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `🌡️ <b>Temperature:</b> ${weather.temperatureC}°C`,
        `💧 <b>Relative Humidity:</b> ${weather.humidity}%`,
        `🌬️ <b>Wind Speed:</b> ${weather.windSpeed} km/h`,
        `🕒 <b>Source:</b> ${escapeHtml(weather.source)} (${escapeHtml(weather.updatedAt)})`,
        ``,
        `🛡️ <b>Fungal Spore Assessment:</b> ${riskBadge}`,
        `<b>${escapeHtml(weather.riskTitle)}</b>`,
        `<i>${escapeHtml(weather.riskAdvice)}</i>`,
        ``,
        `🌧️ <b>District Rainfall Benchmark:</b>`,
        `• <b>Actual:</b> ${telemetry.rainActual} mm | <b>Normal:</b> ${telemetry.rainNormal} mm`,
        `• <b>Departure:</b> ${telemetry.rainDep}% (${escapeHtml(telemetry.rainStatus)})`,
        ``,
        `💡 <i>Tip: Check another district with <code>/weather NASHIK</code> or <code>/weather BANKURA</code></i>`
    ].join("\n");

    await sendTelegramMessage(chatId, html, { reply_markup: MAIN_INLINE_KEYBOARD });
}

async function handleHistoryCommand(chatId) {
    const user = await findLinkedUser(chatId);
    if (!user) {
        await sendTelegramMessage(
            chatId,
            `🔒 <b>Link Your Account to View Scan History</b>\n\nSend <code>/link &lt;your-10-digit-phone&gt;</code> (for example: <code>/link 9004699510</code>) to access your saved crop health assessments, or send a <b>crop leaf photo</b> right now to run a new diagnosis!`,
            { reply_markup: MAIN_INLINE_KEYBOARD }
        );
        return;
    }

    const predictions = await Prediction.find({ userId: String(user._id) });
    predictions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (predictions.length === 0) {
        await sendTelegramMessage(
            chatId,
            `📋 <b>Crop Scan History (${escapeHtml(user.name)})</b>\n\nNo crop leaf assessments recorded yet on your account.\n📷 <b>Send a photo of a crop leaf</b> right here in Telegram or upload on the Web App to run your first Vision Transformer diagnosis!`,
            { reply_markup: MAIN_INLINE_KEYBOARD }
        );
        return;
    }

    const recent = predictions.slice(0, 5);
    const lines = [
        `📋 <b>Recent Crop Health Assessments (${escapeHtml(user.name)})</b>`,
        `<i>Total saved scans: ${predictions.length}</i>`,
        `━━━━━━━━━━━━━━━━━━━━`
    ];

    recent.forEach((scan, index) => {
        const isHealthy = !scan.disease || scan.disease.toLowerCase() === "healthy";
        const dateStr = scan.createdAt ? new Date(scan.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recent";
        const diseaseName = (scan.disease || "Healthy").replace(/_/g, " ");
        lines.push(
            `\n<b>${index + 1}. ${escapeHtml(scan.crop || "Crop")} — ${isHealthy ? "✅ Healthy" : `🔴 ${escapeHtml(diseaseName)}`}</b>`,
            `   📍 District: ${escapeHtml(scan.location || "PUNE")} | 📅 ${escapeHtml(dateStr)}`
        );
        if (!isHealthy && scan.recomm?.length) {
            lines.push(`   💡 Advice: <i>${escapeHtml(scan.recomm[0])}</i>`);
        }
        if (!isHealthy && scan.pesticides?.length) {
            lines.push(`   🧪 Fungicides: <code>${escapeHtml(scan.pesticides.join(", "))}</code>`);
        }
    });

    await sendTelegramMessage(chatId, lines.join("\n"), { reply_markup: MAIN_INLINE_KEYBOARD });
}

async function handleSoilCommand(chatId, argsText) {
    const user = await findLinkedUser(chatId);
    const session = getSession(chatId);
    const district = user?.district || session.district || "PUNE";
    const telemetry = getDistrictTelemetry(district);

    // Parse optional "/soil Wheat 21" or "/soil 21"
    const parts = String(argsText || "").trim().split(/\s+/).filter(Boolean);
    let crop = user?.crops?.[0] || "Wheat";
    let moisture = null;

    for (const p of parts) {
        if (!Number.isNaN(Number(p))) {
            moisture = Number(p);
        } else {
            crop = p;
        }
    }

    const assessment = evaluateSoilIrrigation({ crop, moisturePercent: moisture });

    const lines = [
        `💧 <b>Soil &amp; Smart Irrigation Rules (FAO-56)</b>`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `📍 <b>District Benchmark (${escapeHtml(telemetry.district)}):</b>`,
        `• <b>Soil pH:</b> ${telemetry.soil_pH} (${escapeHtml(telemetry.phStatus)})`,
        `• <b>Nitrogen (N):</b> ${telemetry.soil_N} | <b>Phosphorus (P):</b> ${telemetry.soil_P} | <b>Potassium (K):</b> ${telemetry.soil_K}`,
        ``,
        `🌱 <b>FAO-56 Rule for ${escapeHtml(assessment.crop)} (${escapeHtml(assessment.rule.sourceCrop)}):</b>`,
        `• <b>Allowed Depletion Fraction (p):</b> ${(assessment.rule.depletionFraction * 100).toFixed(0)}%`,
        `• <b>Effective Root Depth:</b> ${assessment.rootDepth} m`,
        `• <b>Total Available Water (TAW):</b> ${assessment.totalAvailableWaterMm} mm`,
        `• <b>Readily Available Water (Threshold):</b> ${assessment.thresholdMm} mm`,
        `• <b>Irrigation Trigger Moisture:</b> &lt; <b>${assessment.triggerMoisturePct}%</b> volumetric moisture`,
        `• <i>${escapeHtml(assessment.rule.note)}</i>`
    ];

    if (assessment.hasReading) {
        const badge = assessment.status === "IRRIGATE NOW" ? "🚨 <b>ACTION: IRRIGATE NOW</b>" : "✅ <b>ACTION: POSTPONE IRRIGATION</b>";
        lines.push(
            ``,
            `${badge}`,
            `• <b>Current Soil Moisture:</b> ${assessment.currentMoisture}%`,
            `• <b>Root-Zone Depletion:</b> ${assessment.depletionMm} mm (${assessment.depletionPct}% vs ${assessment.allowedDepletionPct}% limit)`,
            `• <i>${escapeHtml(assessment.recommendation)}</i>`
        );
    } else {
        lines.push(
            ``,
            `🧮 <b>Calculate Live Irrigation Decision:</b>`,
            `Send your crop &amp; soil sensor moisture %, for example:`,
            `• <code>/soil Wheat 19</code>`,
            `• <code>/soil Potato 25</code>`,
            `• <code>/soil Corn 22</code>`
        );
    }

    await sendTelegramMessage(chatId, lines.join("\n"), { reply_markup: MAIN_INLINE_KEYBOARD });
}

async function handleRecommendCommand(chatId, argsText) {
    const user = await findLinkedUser(chatId);
    const session = getSession(chatId);
    const requestedDistrict = String(argsText || "").trim() || user?.district || session.district || "PUNE";

    const forecast = await getRegionalForecast(requestedDistrict);
    const { telemetry, weather, recommendedCrops, proneDiseases } = forecast;

    const lines = [
        `🌱 <b>Regional Crop &amp; Disease Forecast — ${escapeHtml(telemetry.district)}</b>`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `📊 <b>Environmental Inputs Used:</b>`,
        `• Rainfall: ${telemetry.rainActual} mm | Temp: ${weather.temperatureC}°C | Humidity: ${weather.humidity}%`,
        `• Soil N: ${telemetry.soil_N}, P: ${telemetry.soil_P}, K: ${telemetry.soil_K}, pH: ${telemetry.soil_pH}`,
        ``,
        `🌾 <b>Most Suitable Crops to Grow:</b>`,
        ...recommendedCrops.map((c) => `  ✅ <b>${escapeHtml(c)}</b>`),
        ``,
        `⚠️ <b>Diseases Crops Are Prone To in Current Conditions:</b>`,
        ...proneDiseases.map((d) => `  🔸 <b>${escapeHtml(String(d).replace(/_/g, " "))}</b>`),
        ``,
        `💡 <i>Tip: Check any district with <code>/recommend BANKURA</code> or <code>/recommend HOOGHLY</code></i>`
    ];

    await sendTelegramMessage(chatId, lines.join("\n"), { reply_markup: MAIN_INLINE_KEYBOARD });
}

async function handleDistrictCommand(chatId, argsText) {
    const user = await findLinkedUser(chatId);
    const session = getSession(chatId);
    const input = String(argsText || "").trim();

    if (!input) {
        const curr = user?.district || session.district || "PUNE";
        await sendTelegramMessage(
            chatId,
            `📍 <b>Current Active Field District:</b> <code>${escapeHtml(curr)}</code>\n\nTo switch your field district, send:\n<code>/district PUNE</code>\n<code>/district BANKURA</code>\n<code>/district NASHIK</code>\n<code>/district NAGPUR</code>`,
            { reply_markup: MAIN_INLINE_KEYBOARD }
        );
        return;
    }

    const telemetry = getDistrictTelemetry(input);
    session.district = telemetry.district;
    if (user) {
        await User.findByIdAndUpdate(user._id, { district: telemetry.district });
    }

    await sendTelegramMessage(
        chatId,
        `✅ Active field district updated to <b>${escapeHtml(telemetry.district)}</b>!\n\n• Soil pH: <b>${telemetry.soil_pH}</b> | N: ${telemetry.soil_N}, P: ${telemetry.soil_P}, K: ${telemetry.soil_K}\n• Normal Rainfall: <b>${telemetry.rainNormal} mm</b>`,
        { reply_markup: MAIN_INLINE_KEYBOARD }
    );
}

async function handleMarketCommand(chatId) {
    const products = await getMarketplaceItems(6);
    if (products.length === 0) {
        await sendTelegramMessage(chatId, `🛒 No marketplace items found currently.`);
        return;
    }

    const lines = [
        `🛒 <b>KisanSahayak Agricultural Marketplace</b>`,
        `<i>Verified seeds, fungicides &amp; crop protection supplies:</i>`,
        `━━━━━━━━━━━━━━━━━━━━`
    ];

    products.forEach((p, idx) => {
        lines.push(
            `\n<b>${idx + 1}. ${escapeHtml(p.product_name)}</b>`,
            `   💰 Price: <b>₹${p.price}</b> | 🏪 Seller: ${escapeHtml(p.seller_name)} (${escapeHtml(p.seller_type)})`
        );
    });

    lines.push(`\n🌐 <i>Order directly from the Marketplace tab on the KisanSahayak Web or Mobile App.</i>`);
    await sendTelegramMessage(chatId, lines.join("\n"), { reply_markup: MAIN_INLINE_KEYBOARD });
}

async function handlePhotoMessage(message) {
    const chatId = message.chat.id;
    const photos = message.photo;
    if (!Array.isArray(photos) || photos.length === 0) return;

    const bestPhoto = photos[photos.length - 1];
    const user = await findLinkedUser(chatId);
    const session = getSession(chatId);
    const district = user?.district || session.district || "PUNE";
    const telemetry = getDistrictTelemetry(district);
    const weather = await getLiveWeatherAndRisk(telemetry.district);

    await sendTelegramMessage(
        chatId,
        `🔍 <b>Analyzing your crop leaf photo...</b>\nRunning Ceres Vision Transformer (ViT) classifier &amp; checking regional telemetry for <b>${escapeHtml(telemetry.district)}</b>...`
    );

    try {
        const fileInfo = await telegramApi("getFile", { file_id: bestPhoto.file_id });
        const fileUrl = `https://api.telegram.org/file/bot${botState.token}/${fileInfo.file_path}`;
        const imgRes = await fetch(fileUrl, { signal: AbortSignal.timeout(20000) });
        if (!imgRes.ok) {
            throw new Error("Could not download photo from Telegram");
        }
        const arrayBuf = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);

        if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }
        const filename = `tg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
        const localFilePath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(localFilePath, buffer);

        const port = process.env.PORT || 5000;
        const localImageUrl = `http://localhost:${port}/uploads/${filename}`;
        const mlUrl = process.env.ML_URL || "http://127.0.0.1:8000";

        const mlResponse = await fetch(`${mlUrl}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: user ? String(user._id) : `tg_${chatId}`,
                url: [localImageUrl],
                location: telemetry.district,
                rainAct: telemetry.rainActual,
                rainNorm: telemetry.rainNormal,
                rainDep: telemetry.rainDep,
                soil_N: telemetry.soil_N,
                soil_P: telemetry.soil_P,
                soil_K: telemetry.soil_K,
                soil_pH: telemetry.soil_pH,
                temp: weather.tempKelvin,
                hum: weather.humidity
            }),
            signal: AbortSignal.timeout(30000)
        });

        if (!mlResponse.ok) {
            const errData = await mlResponse.json().catch(() => ({}));
            throw new Error(errData.detail || errData.error || "ML service could not classify this image");
        }

        const predData = await mlResponse.json();
        if (user?._id) {
            const saved = new Prediction({
                userId: String(user._id),
                url: localImageUrl,
                location: telemetry.district,
                crop: predData.crop,
                rainAct: telemetry.rainActual,
                rainNorm: telemetry.rainNormal,
                rainDep: telemetry.rainDep,
                soil_N: telemetry.soil_N,
                soil_P: telemetry.soil_P,
                soil_K: telemetry.soil_K,
                soil_pH: telemetry.soil_pH,
                temp: weather.tempKelvin,
                hum: weather.humidity,
                disease: predData.disease,
                disease_details: predData.disease_details || [],
                recomm: predData.recomm || [],
                pesticides: predData.pesticides || []
            });
            await saved.save();
            await client.del(`userHistory:${user._id}`);
        }

        const isHealthy = !predData.disease || predData.disease.toLowerCase() === "healthy";
        const readableDisease = (predData.disease || "Healthy").replace(/_/g, " ");

        const lines = [
            `🌿 <b>Ceres Crop Leaf Diagnosis Complete</b>`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `🌱 <b>Detected Crop:</b> ${escapeHtml(predData.crop)}`,
            `🔬 <b>Condition:</b> ${isHealthy ? "✅ <b>Healthy Leaf</b>" : `🔴 <b>${escapeHtml(readableDisease)}</b>`}`,
            `📍 <b>Field Location:</b> ${escapeHtml(telemetry.district)} (${weather.temperatureC}°C, ${weather.humidity}% RH)`
        ];

        if (!isHealthy) {
            if (predData.disease_details?.length) {
                lines.push(``, `📖 <b>About This Disease:</b>`);
                predData.disease_details.forEach((d) => lines.push(`• ${escapeHtml(d)}`));
            }
            if (predData.recomm?.length) {
                lines.push(``, `🛡️ <b>Recommended Field Management:</b>`);
                predData.recomm.forEach((r) => lines.push(`• ${escapeHtml(r)}`));
            }
            if (predData.pesticides?.length) {
                lines.push(
                    ``,
                    `🧪 <b>Suggested Fungicides / Treatments:</b>`,
                    `<code>${escapeHtml(predData.pesticides.join(", "))}</code>`,
                    `<i>(Verify dosage on product label &amp; consult local KVK)</i>`
                );
            }
        } else {
            lines.push(``, `✨ Your ${escapeHtml(predData.crop)} leaf shows no visible disease lesions. Continue monitoring soil moisture under FAO-56 guidelines.`);
        }

        if (user) {
            lines.push(``, `💾 <i>Saved to ${escapeHtml(user.name)}'s KisanSahayak scan history!</i>`);
        }

        await sendTelegramMessage(chatId, lines.join("\n"), { reply_markup: MAIN_INLINE_KEYBOARD });
    } catch (err) {
        await sendTelegramMessage(
            chatId,
            `⚠️ <b>Could not complete image classification:</b> ${escapeHtml(err.message)}.\n\nMake sure the photo clearly shows a crop leaf (Wheat, Rice, Corn, or Potato) and that the local Python ML server on port 8000 is running. Meanwhile, you can describe the leaf symptoms in text and I will help you diagnose it!`,
            { reply_markup: MAIN_INLINE_KEYBOARD }
        );
    }
}

async function handleFreeTextChat(chat, text) {
    const chatId = chat.id;
    const trimmed = String(text || "").trim();

    // Check if the user just typed a 10-digit phone number to link
    if (/^\d{10}$/.test(trimmed)) {
        await handleLinkCommand(chat, trimmed);
        return;
    }

    try {
        await telegramApi("sendChatAction", { chat_id: chatId, action: "typing" }, 5000);
    } catch {
        // Ignore chat action failure
    }

    const user = await findLinkedUser(chatId);
    const session = getSession(chatId);
    const fieldContext = await getFarmerFieldContext(user, user?.district || session.district);

    session.messages.push({ role: "user", content: trimmed });
    if (session.messages.length > 10) {
        session.messages = session.messages.slice(-10);
    }

    const { reply } = await generateGroundedChatReply({
        messages: session.messages,
        fieldContext
    });

    session.messages.push({ role: "assistant", content: reply });
    if (session.messages.length > 10) {
        session.messages = session.messages.slice(-10);
    }

    const htmlReply = formatForTelegramHtml(reply);
    await sendTelegramMessage(chatId, htmlReply, { reply_markup: MAIN_INLINE_KEYBOARD });
}

export async function processTelegramUpdate(update) {
    try {
        if (update.callback_query) {
            const cb = update.callback_query;
            const chatId = cb.message?.chat?.id;
            const data = cb.data || "";

            try {
                await telegramApi("answerCallbackQuery", { callback_query_id: cb.id });
            } catch {
                // Ignore
            }

            if (!chatId) return;
            const user = await findLinkedUser(chatId);
            const session = getSession(chatId);

            if (data === "cmd:myfield") {
                const html = await buildFieldSummaryHtml(user, session.district);
                await sendTelegramMessage(chatId, html, { reply_markup: MAIN_INLINE_KEYBOARD });
            } else if (data === "cmd:weather") {
                await handleWeatherCommand(chatId, "");
            } else if (data === "cmd:history") {
                await handleHistoryCommand(chatId);
            } else if (data === "cmd:soil") {
                await handleSoilCommand(chatId, "");
            } else if (data === "cmd:recommend") {
                await handleRecommendCommand(chatId, "");
            } else if (data === "cmd:market") {
                await handleMarketCommand(chatId);
            }
            return;
        }

        const message = update.message;
        if (!message || !message.chat) return;
        const chat = message.chat;
        const chatId = chat.id;

        if (message.contact && message.contact.phone_number) {
            await handleLinkCommand(chat, message.contact.phone_number);
            return;
        }

        if (message.photo && message.photo.length > 0) {
            await handlePhotoMessage(message);
            return;
        }

        const text = String(message.text || "").trim();
        if (!text) return;

        if (text.startsWith("/")) {
            const spaceIdx = text.indexOf(" ");
            const rawCmd = (spaceIdx === -1 ? text : text.slice(0, spaceIdx)).toLowerCase().split("@")[0];
            const args = spaceIdx === -1 ? "" : text.slice(spaceIdx + 1).trim();

            switch (rawCmd) {
                case "/start":
                    await handleStartCommand(chat, args);
                    break;
                case "/link":
                    await handleLinkCommand(chat, args);
                    break;
                case "/unlink":
                    await handleUnlinkCommand(chatId);
                    break;
                case "/myfield":
                case "/field":
                case "/status": {
                    const user = await findLinkedUser(chatId);
                    const session = getSession(chatId);
                    const html = await buildFieldSummaryHtml(user, session.district);
                    await sendTelegramMessage(chatId, html, { reply_markup: MAIN_INLINE_KEYBOARD });
                    break;
                }
                case "/weather":
                    await handleWeatherCommand(chatId, args);
                    break;
                case "/history":
                case "/scans":
                    await handleHistoryCommand(chatId);
                    break;
                case "/soil":
                case "/irrigation":
                    await handleSoilCommand(chatId, args);
                    break;
                case "/recommend":
                case "/forecast":
                    await handleRecommendCommand(chatId, args);
                    break;
                case "/district":
                case "/location":
                    await handleDistrictCommand(chatId, args);
                    break;
                case "/market":
                case "/marketplace":
                    await handleMarketCommand(chatId);
                    break;
                case "/help":
                    await handleStartCommand(chat, "");
                    break;
                default:
                    await handleFreeTextChat(chat, text);
                    break;
            }
        } else {
            await handleFreeTextChat(chat, text);
        }
    } catch (err) {
        console.error("Error processing Telegram update:", err.message);
    }
}

async function pollLoop() {
    while (botState.isRunning && botState.token) {
        try {
            const updates = await telegramApi(
                "getUpdates",
                {
                    offset: botState.offset,
                    timeout: 20,
                    allowed_updates: ["message", "callback_query"]
                },
                30000
            );

            if (Array.isArray(updates) && updates.length > 0) {
                for (const update of updates) {
                    botState.offset = Math.max(botState.offset, update.update_id + 1);
                    await processTelegramUpdate(update);
                }
            }
        } catch (err) {
            if (!botState.isRunning) break;
            // Avoid spamming logs on normal long-poll timeout
            if (!String(err.message).includes("aborted") && !String(err.message).includes("timeout")) {
                botState.lastError = err.message;
            }
            await new Promise((r) => setTimeout(r, 3000));
        }
    }
}

export async function startTelegramBot(customToken = null) {
    const rawToken = (customToken ?? process.env.TELEGRAM_BOT_TOKEN ?? "").trim().replace(/^["']|["']$/g, "");
    if (!rawToken) {
        console.log("Telegram Bot: No TELEGRAM_BOT_TOKEN set in .env yet (ready to configure via UI or .env)");
        botState.isRunning = false;
        botState.botInfo = null;
        return { ok: false, error: "No token configured" };
    }

    // Stop previous polling loop if running
    stopTelegramBot();
    botState.token = rawToken;

    try {
        const me = await telegramApi("getMe", null, 10000);
        botState.botInfo = me;
        botState.lastError = null;

        // Clear any webhook so getUpdates long-polling works cleanly
        await telegramApi("deleteWebhook", { drop_pending_updates: false }, 10000).catch(() => {});

        // Set BotFather commands menu
        await telegramApi("setMyCommands", {
            commands: [
                { command: "start", description: "Start Kisan Ceres Bot & link account" },
                { command: "myfield", description: "Full field telemetry, soil & crop report" },
                { command: "weather", description: "Live temperature, humidity & fungal risk" },
                { command: "history", description: "Recent crop leaf disease scans & treatments" },
                { command: "soil", description: "FAO-56 soil moisture & irrigation rules" },
                { command: "recommend", description: "Regional crop & disease ML forecast" },
                { command: "district", description: "Change active field district (e.g. /district PUNE)" },
                { command: "market", description: "Browse seeds & fungicides marketplace" },
                { command: "link", description: "Link account with phone (e.g. /link 9004699510)" },
                { command: "unlink", description: "Unlink Telegram from farmer account" },
                { command: "help", description: "Show all bot commands & features" }
            ]
        }, 10000).catch(() => {});

        botState.isRunning = true;
        console.log(`Telegram Bot Polling Active: @${me.username} (${me.first_name})`);

        // Run polling asynchronously in background
        pollLoop();

        return { ok: true, botInfo: me };
    } catch (err) {
        botState.isRunning = false;
        botState.botInfo = null;
        botState.lastError = err.message;
        console.warn("Telegram Bot failed to initialize:", err.message);
        return { ok: false, error: err.message };
    }
}

export function stopTelegramBot() {
    botState.isRunning = false;
}

export function getTelegramBotStatus() {
    return {
        configured: Boolean(botState.token),
        isRunning: botState.isRunning,
        botInfo: botState.botInfo,
        lastError: botState.lastError
    };
}

export async function configureTelegramBotToken(newToken) {
    const cleaned = String(newToken || "").trim().replace(/^["']|["']$/g, "");
    if (!cleaned || !cleaned.includes(":")) {
        return { ok: false, error: "Invalid BotFather token format. Expected format: 123456789:ABCdef..." };
    }

    const result = await startTelegramBot(cleaned);
    if (result.ok) {
        updateEnvFile("TELEGRAM_BOT_TOKEN", cleaned);
    }
    return result;
}

export async function sendFieldReportToUserPhone(userId, overrideDistrict = null) {
    const user = await User.findById(userId).select("-password");
    if (!user) {
        return { ok: false, error: "User not found" };
    }
    if (!user.telegramChatId) {
        return { ok: false, error: "Your account is not linked to Telegram yet. Scan the QR code or click 'Open in Telegram' first." };
    }
    if (!botState.isRunning || !botState.token) {
        return { ok: false, error: "Telegram Bot is not active on the server." };
    }

    const html = await buildFieldSummaryHtml(user, overrideDistrict || user.district || "PUNE");
    await sendTelegramMessage(user.telegramChatId, html, { reply_markup: MAIN_INLINE_KEYBOARD });
    return { ok: true };
}
